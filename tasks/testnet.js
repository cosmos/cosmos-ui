"use strict"

const fs = require(`fs-extra`)
const { join, resolve } = require(`path`)
const { startNodes, buildNodes } = require(`./build/local/helper`)
const { getNodeId, startLocalNode } = require(`./gaia`)
const appDir = resolve(`${__dirname}/../`)
const buildTestnetPath = join(appDir, `builds`, `testnets`)

async function main() {
  const network = `local-testnet`
  const numberNodes = parseInt(process.argv[2], 10) || 1
  const skipRebuild = process.argv[3] === `skip-rebuild`
  const targetDir = join(buildTestnetPath, network)

  if (skipRebuild) {
    const nodeHomePrefix = join(targetDir, `node_home`)

    let nodeOneId = await getNodeId(nodeHomePrefix + `_1`)
    for (let i = 1; i < numberNodes + 1; i++) {
      const home = `${nodeHomePrefix}_${i}`
      startLocalNode(home, i, nodeOneId)
    }
  } else {
    const { cliHomePrefix, nodes, mainAccountSignInfo } = await buildNodes(
      targetDir,
      {
        chainId: network,
        password: `1234567890`,
        overwrite: false,
        moniker: `local`,
        keyName: `main-account`
      },
      numberNodes
    )
    await startNodes(nodes, mainAccountSignInfo, network)
    fs.copySync(join(nodes[1].home, `config`), cliHomePrefix)
    let { version } = require(`../package.json`)
    fs.writeFileSync(`${cliHomePrefix}/app_version`, version)
  }
}

main().catch(function(error) {
  console.error(`Starting the application failed`, error)
})
