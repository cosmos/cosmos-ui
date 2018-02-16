![the cosmos network](cosmos-github.jpg)

# Cosmos Voyager

👋 Welcome to Voyager, the official user interface for the [Cosmos Network](https://cosmos.network/).

💻 Voyager is a desktop application built with [Electron](https://github.com/electron/electron). Voyager runs on macOS 10.9+, Windows 7+, and Debian-based Linux distros.

⚠️ This is still alpha-level software. __DO NOT__ enter your Cosmos fundraiser seed into Voyager.

🎉 Binary releases are [available here](https://github.com/cosmos/voyager/releases).

---

### Prerequisites

`gaia` is a prepackaged version of Cosmos SDK and Tendermint. You will need `gaia` installed.

```bash
# install go, set $GOPATH
brew install go

# install glide
brew install glide

# install gaia
go get github.com/cosmos/gaia
cd $GOPATH/src/github.com/cosmos/gaia
git checkout v0.5.0
glide install
make install
```

You will also need `yarn` to install node modules:

```bash
brew install yarn

# in the project folder, run
yarn
```

---

### Develop

To run on the UI on the default testnet (`gaia-2`):
```bash
$ yarn run testnet
```

To run the UI on a specific a testnet from the [testnets](https://github.com/tendermint/testnets) repo:
```bash
$ yarn run testnet <networkName>
```

To run the UI on a local node with `chain_id=local`:
```bash
$ yarn run testnet local
```

---

### Production
Get the Gaia binary from [GitHub](`https://github.com/cosmos/gaia/releases`).

Build and run the app.
```bash
yarn run build:{darwin|win32|linux} -- --binary={path to the gaia binary}
open builds/Cosmos-{platform}-x64/Cosmos.app
```

When you are testing the build system you can skip the repackaging of the JS files.
```bash
$ yarn run build:darwin -- --skip-pack --binary=...
```

To test if your build worked run:
```bash
$ yarn run test:exe {path to the build executable}
```

---

### Testing

The UI is using [Jest](https://facebook.github.io/jest) to run unit tests.

```bash
$ yarn run test
```

To check test coverage, run the command above and then open an http-server at `test/unit/coverage/lcov-report` to see details for the coverage.
i.e.:

```bash
$ npm i -g http-server
$ http-server test/unit/coverage/lcov-report
```

---

### Debug

To debug the electron application, build it and run the node inspector for the built files:

```bash
$ electron --inspect-brk builds/{{your build}}/resources/app/dist/main.js
```

Then attach to the debugger via the posted url in Chrome.

To debug the electron view, set the environment variable `COSMOS_DEVTOOLS` to something truthy like `"true"`.

To see the console output of the view in your terminal, set the environment variable `ELECTRON_ENABLE_LOGGING` to something truthy like `1`.

### Flags

A list of all environment variables and their purpose:

|Variable|Values|default|Purpose|
|--|--|--|--|
|NODE_ENV|'production', 'development'|||
|LOGGING|'true', 'false'|'true'|Disable logging|
|MOCK|'true', 'false'|'true' in development|Mock data to receive from the chain|
|COSMOS_TEST|'true', 'false'|'false'|Disable code that influences unit tests, like logging to files|
|COSMOS_NETWORK|{path to network configuration folder}|'../networks/gaia-1'|Network to connect to|
|COSMOS_HOME|{path to config persistence folder}|'$HOME/voyager[-dev]'||
|COSMOS_NODE|{ip of a certain node}||Node to connect to|
|PLATFORM_TARGET|'all', 'win32', 'darwin', 'linux', 'mas'|'all'|Which platform to build for|
|COSMOS_DEVTOOLS|'true', 'false'|'false'|Open the debug panel in the electron view|
|ELECTRON_ENABLE_LOGGING|'true', 'false'|'false'|Redirect the browser view console output to the console|
|PREVIEW|'true', 'false'|'true' if NODE_ENV 'development'|Show/Hide features that are in development|


### FAQ

- If tendermint crashes and the log shows `Tendermint state.AppHash does not match AppHash after replay.` delete the config folders at `$HOME/.voyager[-dev]`.

- If you use yarn, the post-install hook may not execute. If this happens you'll have to execute the script manually:
```bash
$ cd app
$ yarn
$ cd ..
$ npm run rebuild
```

- If electron shows the error: `A DLL initialization routine has failed.` rebuild the electron dependencies:
```bash
$ npm run rebuild
```

- If you have trouble installing dependencies, remove all the lockfiles and try installing again.
```bash
$ rm -rf app/yarn.lock
$ rm -rf app/package-lock.json
$ rm -rf yarn.lock
$ rm -rf package-lock.json
```

- If your components are not found using a short path, check if the path resolution is applied for Webpack (`webpack.renderer.js > rendererConfig.resolve.alias`) and Jest (`package.json > jest.moduleNameMapper`).

- If starting the development server fails with the error: `Error: listen EADDRINUSE 127.0.0.1:9080`, you have still a development server process running. Kill it with `kill $(lsof -t -i:9080)` on Unix systems.

---

### ✌️
