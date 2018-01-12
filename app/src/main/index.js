'use strict'

let { app, BrowserWindow, Menu } = require('electron')
let fs = require('fs-extra')
let { join } = require('path')
let { spawn } = require('child_process')
let home = require('user-home')
let semver = require('semver')
// this dependency is wrapped in a file as it was not possible to mock the import with jest any other way
let event = require('event-to-promise')
let toml = require('toml')
let axios = require('axios')
let pkg = require('../../../package.json')
let relayServer = require('./relayServer.js')

let started = false
let shuttingDown = false
let mainWindow
let baseserverProcess
let streams = []
let nodeIP
let connecting = false

const root = require('../root.js')
const baseserverHome = join(root, 'baseserver')
const WIN = /^win/.test(process.platform)
const DEV = process.env.NODE_ENV === 'development'
const TEST = JSON.parse(process.env.COSMOS_TEST || 'false') !== false
// TODO default logging or default disable logging?
const LOGGING = JSON.parse(process.env.LOGGING || 'true') !== false
const MOCK = JSON.parse(process.env.MOCK || !TEST && DEV) !== false
const winURL = DEV
  ? `http://localhost:${require('../../../config').port}`
  : `file://${__dirname}/index.html`
const NODE = process.env.COSMOS_NODE

// this network gets used if none is specified via the
// COSMOS_NETWORK env var
let DEFAULT_NETWORK = join(__dirname, DEV ? '../networks/gaia-2-dev' : '../../networks/gaia-2-dev')
let networkPath = process.env.COSMOS_NETWORK || DEFAULT_NETWORK

let SERVER_BINARY = 'gaia' + (WIN ? '.exe' : '')

function log (...args) {
  if (LOGGING) {
    console.log(...args)
  }
}
function logError (...args) {
  if (LOGGING) {
    console.log(...args)
  }
}

function logProcess (process, logPath) {
  fs.ensureFileSync(logPath)
  // Writestreams are blocking fs cleanup in tests, if you get errors, disable logging
  if (LOGGING && !TEST) {
    let logStream = fs.createWriteStream(logPath, {
      flags: 'a' // 'a' means appending (old data will be preserved)
    })
    streams.push(logStream)
    process.stdout.pipe(logStream)
    process.stderr.pipe(logStream)
  }
}

function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function expectCleanExit (process, errorMessage = 'Process exited unplanned') {
  return new Promise((resolve, reject) => {
    process.on('exit', code => {
      if (code !== 0 && !shuttingDown) {
        throw new Error(errorMessage)
      }
      resolve()
    })
  })
}

function shutdown () {
  if (shuttingDown) return

  mainWindow = null
  shuttingDown = true

  if (baseserverProcess) {
    log('killing baseserver')
    baseserverProcess.kill('SIGKILL')
    baseserverProcess = null
  }

  return Promise.all(
    streams.map(stream => new Promise((resolve) => stream.close(resolve)))
  )
}

function createWindow () {
  mainWindow = new BrowserWindow({
    minWidth: 320,
    minHeight: 480,
    width: 1024,
    height: 768,
    center: true,
    title: 'Cosmos',
    darkTheme: true,
    titleBarStyle: 'hidden',
    webPreferences: { webSecurity: false }
  })

  if (!started) {
    mainWindow.loadURL(winURL)
  } else {
    mainWindow.loadURL(winURL + '?node=' + nodeIP)
  }
  if (DEV || process.env.COSMOS_DEVTOOLS) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', shutdown)

  // eslint-disable-next-line no-console
  log('mainWindow opened')

  // handle opening external links in OS's browser
  let webContents = mainWindow.webContents
  let handleRedirect = (e, url) => {
    if (url !== webContents.getURL()) {
      e.preventDefault()
      require('electron').shell.openExternal(url)
    }
  }
  webContents.on('will-navigate', handleRedirect)
  webContents.on('new-window', handleRedirect)

  Menu.setApplicationMenu(null)
}

function startProcess (name, args, env) {
  let binPath
  if (DEV || TEST) {
    // in dev mode or tests, use binaries installed in GOPATH
    let GOPATH = process.env.GOPATH
    if (!GOPATH) GOPATH = join(home, 'go')
    binPath = join(GOPATH, 'bin', name)
  } else {
    // in production mode, use binaries packaged with app
    binPath = join(__dirname, '../..', 'bin', name)
  }

  let argString = args.map((arg) => JSON.stringify(arg)).join(' ')
  log(`spawning ${binPath} with args "${argString}"`)
  let child
  try {
    child = spawn(binPath, args, env)
  } catch (err) {
    log(`Err: Spawning ${name} failed`, err)
    throw err
  }
  child.stdout.on('data', (data) => !shuttingDown && log(`${name}: ${data}`))
  child.stderr.on('data', (data) => !shuttingDown && log(`${name}: ${data}`))
  child.on('exit', (code) => !shuttingDown && log(`${name} exited with code ${code}`))
  child.on('error', function (err) {
    if (!(shuttingDown && err.code === 'ECONNRESET')) {
      // Ignore ECONNRESET and re throw anything else
      throw err
    }
  })
  return child
}

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('ready', () => createWindow())

// start baseserver REST API
async function startBaseserver (home, nodeIP) {
  log('startBaseserver', home)
  let child = startProcess(SERVER_BINARY, [
    'rest-server',
    '--home', home,
    '--node', nodeIP
    // '--trust-node'
  ])
  logProcess(child, join(home, 'baseserver.log'))

  while (true) {
    if (shuttingDown) break

    let data = await event(child.stderr, 'data')
    if (data.toString().includes('Serving on')) break
  }

  return child
}

function exists (path) {
  try {
    fs.accessSync(path)
    return true
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
    return false
  }
}

async function initBaseserver (chainId, home, node) {
  // fs.ensureDirSync(home)
  // `baseserver init` to generate config, trust seed
  let child = startProcess(SERVER_BINARY, [
    'client',
    'init',
    '--home', home,
    '--chain-id', chainId,
    '--node', node
    // '--trust-node'
  ])
  child.stdout.on('data', (data) => {
    let hashMatch = /\w{40}/g.exec(data)
    if (hashMatch) {
      log('approving hash', hashMatch[0])
      if (shuttingDown) return
      // answer 'y' to the prompt about trust seed. we can trust this is correct
      // since the baseserver is talking to our own full node
      child.stdin.write('y\n')
    }
  })
  await expectCleanExit(child, 'gaia init exited unplanned')
}

async function backupData (root) {
  let i = 1
  let path
  do {
    path = `${root}_backup_${i}`
    i++
  } while (exists(path))

  log(`backing up data to "${path}"`)
  fs.copySync(root, path, {
    overwrite: false,
    errorOnExist: true
  })
  await fs.remove(root)
}

/*
* log to file
*/
function setupLogging (root) {
  if (TEST) return

  // initialize log file
  let logFilePath = join(root, 'main.log')
  fs.ensureFileSync(logFilePath)
  let mainLog = fs.createWriteStream(logFilePath, {
    flags: 'a' // 'a' means appending (old data will be preserved)
  })
  mainLog.write(`${new Date()} Running Cosmos-UI\r\n`)
  // mainLog.write(`${new Date()} Environment: ${JSON.stringify(process.env)}\r\n`) // TODO should be filtered before adding it to the log
  streams.push(mainLog)

  log('Redirecting console output to logfile', logFilePath)
  // redirect stdout/err to logfile
  // TODO overwriting console.log sounds like a bad idea, can we find an alternative?
  // eslint-disable-next-line no-func-assign
  log = function (...args) {
    if (LOGGING) {
      if (DEV) {
        console.log(...args)
      }
      mainLog.write(`main-process: ${args.join(' ')}\r\n`)
    }
  }
  // eslint-disable-next-line no-func-assign
  logError = function (...args) {
    if (LOGGING) {
      if (DEV) {
        console.error(...args)
      }
      mainLog.write(`main-process: ${args.join(' ')}\r\n`)
    }
  }
}

if (!TEST) {
  process.on('exit', shutdown)
  process.on('uncaughtException', function (err) {
    logError('[Uncaught Exception]', err)
    setTimeout(async () => {
      await shutdown()
      process.exit(1)
    }, 200)
    setTimeout(shutdown, 200)
  })
}

function consistentConfigDir (versionPath, genesisPath, configPath) {
  return exists(genesisPath) && exists(versionPath) && exists(configPath)
}

function pickNode (seeds) {
  let nodeIP = NODE || seeds[Math.floor(Math.random() * seeds.length)]
  // let nodeRegex = /([http[s]:\/\/]())/g
  log('Picked seed:', nodeIP, 'of', seeds)
  // replace port with default RPC port
  nodeIP = `${nodeIP.split(':')[0]}:46657`

  return nodeIP
}

async function connect (seeds, nodeIP) {
  log(`starting gaia server with nodeIP ${nodeIP}`)
  baseserverProcess = await startBaseserver(baseserverHome, nodeIP)
  log('gaia server ready')

  return nodeIP
}

async function reconnect (seeds) {
  if (connecting) return
  connecting = true

  let nodeAlive = false
  while (!nodeAlive) {
    let nodeIP = pickNode(seeds)
    nodeAlive = await axios('http://' + nodeIP)
      .then(() => true, () => false)
    log(`${new Date().toLocaleTimeString()} ${nodeIP} is ${nodeAlive ? 'alive' : 'down'}`)

    if (!nodeAlive) await sleep(2000)
  }

  log('quitting running baseserver')
  baseserverProcess.kill('SIGKILL')

  await connect(seeds, nodeIP)

  connecting = false

  return nodeIP
}

async function main () {
  if (JSON.parse(process.env.COSMOS_UI_ONLY || 'false')) {
    return
  }

  let versionPath = join(root, 'app_version')
  let genesisPath = join(root, 'genesis.json')
  let configPath = join(root, 'config.toml')

  let rootExists = exists(root)
  await fs.ensureDir(root)

  setupLogging(root)

  let init = true
  if (rootExists) {
    log(`root exists (${root})`)

    // check if the existing data came from a compatible app version
    // if not, backup the data and re-initialize
    if (consistentConfigDir(versionPath, genesisPath, configPath)) {
      let existingVersion = fs.readFileSync(versionPath, 'utf8')
      let compatible = semver.diff(existingVersion, pkg.version) !== 'major'
      if (compatible) {
        log('configs are compatible with current app version')
        init = false
      } else {
        await backupData(root)
      }
    } else {
      await backupData(root)
    }

    // check to make sure the genesis.json we want to use matches the one
    // we already have. if it has changed, back up the old data
    if (!init) {
      let existingGenesis = fs.readFileSync(genesisPath, 'utf8')
      let genesisJSON = JSON.parse(existingGenesis)
      // skip this check for local testnet
      if (genesisJSON.chain_id !== 'local') {
        let specifiedGenesis = fs.readFileSync(join(networkPath, 'genesis.json'), 'utf8')
        if (existingGenesis.trim() !== specifiedGenesis.trim()) {
          log('genesis has changed')
          await backupData(root)
          init = true
        }
      }
    }
  }

  if (init) {
    log(`initializing data directory (${root})`)
    await fs.ensureDir(root)

    // copy predefined genesis.json and config.toml into root
    fs.accessSync(networkPath) // crash if invalid path
    fs.copySync(networkPath, root)

    fs.writeFileSync(versionPath, pkg.version)
  }

  log('starting app')
  log(`dev mode: ${DEV}`)
  log(`winURL: ${winURL}`)

  // read chainId from genesis.json
  let genesisText = fs.readFileSync(genesisPath, 'utf8')
  let genesis = JSON.parse(genesisText)
  let chainId = genesis.chain_id

  // pick a random seed node from config.toml
  // TODO: user-specified nodes, support switching?
  let configText
  try {
    configText = fs.readFileSync(configPath, 'utf8')
  } catch (e) {
    throw new Error(`Can't open config.toml: ${e.message}`)
  }
  let config = toml.parse(configText)
  let seeds = config.p2p.seeds.split(',').filter(x => x !== '')
  if (seeds.length === 0) {
    throw new Error('No seeds specified in config.toml')
  }
  nodeIP = pickNode(seeds)

  if (init) {
    log(`Initializing baseserver with remote node ${nodeIP}`)
    await initBaseserver(chainId, baseserverHome, nodeIP)
  }

  await connect(seeds, nodeIP)

  // the view can communicate with the main process by sending requests to the relay server
  // the relay server also proxies to the LCD
  relayServer({
    mock: MOCK,
    onReconnectReq: reconnect.bind(this, seeds)
  })

  started = true
  if (mainWindow) {
    mainWindow.loadURL(winURL + '?node=' + nodeIP)
  }
}
module.exports = Object.assign(
  main()
  .catch(err => {
    logError(err)
    throw err
  })
  .then(() => ({
    shutdown,
    processes: {baseserverProcess}
  }))
)
