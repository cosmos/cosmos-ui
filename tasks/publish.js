"use strict"

const { cli, shell } = require(`@nodeguy/cli`)
const fs = require(`fs`)
const path = require(`path`)
const release = require(`publish-release`)
const util = require(`util`)

const assetsDir = path.join(__dirname, `../builds/Voyager`)

const getTag = packageJson => `v` + packageJson.version

const recentChanges = changeLog =>
  changeLog.match(/.+?## .+?\n## .+?\n\n(.+?)\n## /s)[1]

const createNotes = changeLog => `NOTE: DO NOT ENTER YOUR FUNDRAISER SEED. THIS SOFTWARE HAS NOT BEEN AUDITED.
NEVER ENTER YOUR FUNDRAISER SEED 12 WORDS ONTO AN ONLINE COMPUTER.

Even when we do start supporting fundraiser seeds, don't use it except for
testing or with small amounts. We will release a CLI to use for offline signing
of transactions, and we will also add hardware support for this UI.

${recentChanges(changeLog)}`

const publishRelease = ({ notes, tag, token }) =>
  util.promisify(release)({
    token,
    owner: `cosmos`,
    repo: `voyager`,
    tag,
    name: `Cosmos Voyager Alpha ${tag} (UNSAFE)`,
    notes,
    prerelease: true,
    assets: fs.readdirSync(assetsDir).map(file => path.join(assetsDir, file))
  })

if (require.main === module) {
  cli({}, async () => {
    console.log(`--- Publishing release ---`)

    const notes = createNotes(
      fs.readFileSync(path.join(__dirname, `../CHANGELOG.md`), `utf8`)
    )

    const tag = getTag(
      JSON.parse(
        fs.readFileSync(path.join(__dirname, `../package.json`), `utf8`)
      )
    )

    console.log(`--- Releasing tag`, tag, `---`)
    const token = process.env.GIT_BOT_TOKEN
    await publishRelease({ notes, token, tag })

    // after we created the release we push the released tag to master
    shell(`
set -o verbose
git remote add bot https://${token}@github.com/cosmos/voyager.git
git tag --delete release-candidate
git tag --annotate ${tag}
git push --tags bot HEAD:master

# Delete release candidate branch.
git push bot release-candidate/${tag}:
`)

    console.log(`--- Done releasing ---`)
  })
} else {
  module.exports = {
    createNotes
  }
}
