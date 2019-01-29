"use strict"

const spawn = require(`child_process`).spawn
const { cleanExitChild } = require(`./common.js`)

function test(executablePath) {
  return new Promise(async (resolve, reject) => {
    let child
    try {
      child = spawn(executablePath, {
        env: {
          ELECTRON_ENABLE_LOGGING: `true`
        }
      })

      child.stdout.pipe(process.stdout)

      child.stdout.on(`data`, async data => {
        const msg = Buffer.from(data, `utf-8`).toString()
        if (msg.indexOf(`[START SUCCESS]`) !== -1) {
          clearTimeout(wait)
          await cleanExitChild(child)
          resolve()
        }
      })

      const wait = setTimeout(async () => {
        await cleanExitChild(child)
        reject()
      }, 5000)
    } catch (error) {
      if (child) await cleanExitChild(child)
      console.error(`Unexpected error`, error)
      reject(error)
    }
  })
}

async function main() {
  const executablePath = process.argv[2]

  if (!executablePath) {
    console.error(
      `\nPlease define the executable you want to test like "yarn run test:exe ./Cosmos Voyager.exe"\n`
    )
    process.exit(-1)
  }
  await test(executablePath)
    .then(() => console.log(executablePath, `starts as expected`))
    .catch(() => console.error(executablePath, `did not start as expected`))
}

main()
