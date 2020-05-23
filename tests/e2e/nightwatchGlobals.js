const axios = require("axios")
const chai = require("chai")
chai.use(require("chai-string"))
const networks = require("./networks.json")
const {
  actionModalCheckout,
  waitForText,
  getLastActivityItemHash,
  checkBrowserLogs,
  getAccountBalance,
  fundMasterAccount,
} = require("./helpers.js")

let initializedAccount = false

module.exports = {
  // controls the timeout time for async hooks. Expects the done() callback to be invoked within this time
  // or an error is thrown
  asyncHookTimeout: 200000,

  async beforeEach(browser, done) {
    // standardize window format
    browser.resizeWindow(1350, 1080)

    // browser.launch_url = browser.globals.feURI
    // default settings
    let networkData = await initialiseDefaults(browser)
    networkData.password = process.env.PASSWORD
    browser.globals.password = networkData.password

    if (!initializedAccount) {
      // creating testing account and funding it with the master account
      await createAccountAndFundIt(browser, done, networkData)
      initializedAccount = true
    }

    checkBrowserLogs(browser)
    done()
  },

  async afterEach(browser, done) {
    checkBrowserLogs(browser)
    done()
  },

  /**
   * After all the tests are run, evaluate if there were errors and exit appropriately.
   *
   * If there were failures or errors, exit 1, else exit 0.
   *
   * @param results
   */
  reporter: function (results) {
    if (
      (typeof results.failed === `undefined` || results.failed === 0) &&
      (typeof results.errors === `undefined` || results.errors === 0)
    ) {
      process.exit(0)
    } else {
      process.exit(1)
    }
  },
}

async function next(browser) {
  return await browser.click(".session-footer .button")
}

async function createNewAccount(browser, networkData) {
  await browser.url(browser.launch_url + "/create")
  await browser.waitForElementVisible(`body`, 10000, true)
  await browser.waitForElementVisible("#sign-up-name", 10000, true)
  browser.setValue("#sign-up-name", "demo-account")
  await next(browser)
  browser.waitForElementVisible("#sign-up-password", 10000, true)
  await next(browser)
  browser.setValue("#sign-up-password", networkData.password)
  browser.setValue("#sign-up-password-confirm", networkData.password)
  await next(browser)
  browser.waitForElementVisible(".seed-table", 10000, true)
  browser.expect
    .element(".seed-table")
    .text.to.match(/(\d+\s+\w+\s+){23}\d+\s+\w+/)
    .before(10000)
  await next(browser)
  browser.expect.elements(".tm-form-msg--error").count.to.equal(1)
  browser.click("#sign-up-warning")
  await next(browser)
  browser.waitForElementVisible(".balance-header", 20000, true) // wait until signup is completed
}

async function initialiseDefaults(browser) {
  let network = "cosmos-hub-testnet"
  let feURI = "http://localhost:9080"
  let apiURI = "http://localhost:4000"
  let networkData = {}
  // parsing parameters
  // network
  process.argv.map((arg) => {
    // selected network
    if (arg.indexOf("--network=") !== -1)
      network = arg.slice(arg.indexOf("=") + 1)
    // frontend uri
    if (arg.indexOf("--fe=") !== -1) feURI = arg.slice(arg.indexOf("=") + 1)
    // api uri
    if (arg.indexOf("--api=") !== -1) apiURI = arg.slice(arg.indexOf("=") + 1)
  })
  networkData = networks.find((net) => net.network == network)
  if (!networkData) {
    throw new Error(`Initial data for "${network}" is not set`)
  }
  if (!feURI) {
    throw new Error(`Frontend uri for "${network}" is not set`)
  }
  if (!apiURI) {
    throw new Error(`API uri for "${network}" is not set`)
  }
  browser.globals.feURI = browser.launch_url = feURI
  browser.globals.apiURI = apiURI
  browser.globals.slug = "/" + networkData.slug
  browser.globals.expectedDiff = networkData.expectedDiff
  // checking the API for a localhost API
  if (apiURI.indexOf("//localhost:") !== -1) {
    await apiUp(browser)
  }
  // checking if network is local, the API should be local too
  if (network.indexOf("local-") === 0) {
    if (apiURI.indexOf("//localhost:") === -1) {
      throw new Error(
        `Can't test local network "${network}" against nonlocal API`
      )
    }
  }
  // open default page
  await browser.url(browser.launch_url + browser.globals.slug + "/portfolio")
  await browser.execute(
    function (apiURI, network) {
      // setting the api to localStorage
      window.localStorage.setItem("persistentapi", apiURI)
      // clear data from older tests
      window.localStorage.removeItem(`cosmos-wallets-index`)
      window.localStorage.setItem(`network`, `"${network}"`)
      window.localStorage.setItem(`isE2eTest`, `"true"`)
    },
    [apiURI, network]
  )
  return networkData
}

async function defineNeededValidators(browser) {
  // need to store validators, cause they can shuffle during the test
  await browser.url(browser.launch_url + browser.globals.slug + "/validators")
  await browser.waitForElementVisible(".li-validator", 10000)
  const validators = await browser.execute(function () {
    const validatorLIs = document.getElementsByClassName("li-validator")
    if (validatorLIs.length < 2) {
      throw new Error(`No enough validators to check`)
    }
    return {
      first: validatorLIs[0].getAttribute("data-name"),
      second: validatorLIs[1].getAttribute("data-name"),
    }
  })
  browser.globals.validatorOneName = validators.value.first
  browser.globals.validatorTwoName = validators.value.second
}

async function storeAccountData(browser, networkData) {
  // refreshing and saving all needed info of a newly created account
  await browser.pause(500) // needed for localStorage variable setting
  await browser.url(browser.launch_url)
  const tempAcc = await browser.execute(
    function (networkData) {
      // saving account info from localStorage
      let session = window.localStorage.getItem(
        `session_${networkData.network}`
      )
      let wallet
      if (session) {
        session = JSON.parse(session)
        wallet = window.localStorage.getItem(
          `cosmos-wallets-${session.address}`
        )
        if (wallet) {
          wallet = JSON.parse(wallet)
        } else {
          throw new Error(
            `No wallet info for newly created account in ${networkData.network}`
          )
        }
      } else {
        throw new Error(
          `No session info for newly created account in ${networkData.network}`
        )
      }
      return {
        address: session.address,
        wallet: wallet.wallet,
      }
    },
    [networkData]
  )
  // wallet info
  browser.globals.wallet = tempAcc.value.wallet
  // address
  browser.globals.address = tempAcc.value.address
  return true
}

async function fundingTempAccount(browser, networkData) {
  // remember the hash of the last transaction
  await browser.url(browser.launch_url + browser.globals.slug + "/transactions")
  browser.globals.lastHash = await getLastActivityItemHash(browser)
  await browser.url(browser.launch_url + browser.globals.slug + "/portfolio")
  await actionModalCheckout(
    browser,
    ".circle-send-button",
    // actions to do on details page
    async () => {
      await browser.setValue("#send-address", browser.globals.address)
      await browser.clearValue("#amount")
      await browser.setValue("#amount", networkData.fundingAmount)
    },
    // expected subtotal
    networkData.fundingAmount,
    networkData.fundingAmount,
    networkData.fundingAmount
  )
  // check if the hash is changed
  await browser.url(browser.launch_url + browser.globals.slug + "/transactions")
  // check if tx shows
  await waitForText(
    browser,
    ".tx:nth-of-type(1) .tx__content .tx__content__left h3",
    "Sent"
  )
  await waitForText(
    browser,
    ".tx:nth-of-type(1) .tx__content .tx__content__right",
    `${networkData.fundingAmount} ${browser.globals.denom}`
  )
  let iterations = 20
  while (iterations--) {
    let hash = await getLastActivityItemHash(browser)
    if (hash !== browser.globals.lastHash) {
      return
    }
    await browser.pause(300)
  }
  throw new Error(`Hash didn't changed!`)
}

async function createAccountAndFundIt(browser, done, networkData) {
  // changing network
  await browser.url(browser.launch_url)
  await browser.execute(
    function (networkData) {
      window.localStorage.setItem(`network`, `"${networkData.network}"`)
      return true
    },
    [networkData]
  )
  // define two first validators
  await defineNeededValidators(browser, networkData)
  await browser.refresh()
  // creating account
  await createNewAccount(browser, networkData)
  await storeAccountData(browser, networkData)
  // switching to master account
  await switchToAccount(browser, networkData)
  // funding main account
  if (browser.globals.availableAtoms * 1 < 25) {
    await fundMasterAccount(browser, networkData.network, networkData.address)
  }
  // funding temp account
  await fundingTempAccount(browser, networkData)
  networkData.address = browser.globals.address
  networkData.wallet = browser.globals.wallet
  networkData.password = "1234567890"
  // switching to temp account
  await switchToAccount(browser, networkData)
  done()
}

async function switchToAccount(
  browser,
  { address, network, wallet, password, name, stakeAmount, restakeAmount }
) {
  // clear parameters
  browser.globals.availableAtoms = 0
  browser.globals.denom = ""
  browser.globals.password = password
  browser.globals.stakeAmount = stakeAmount
  browser.globals.restakeAmount = restakeAmount
  // test if the test account was funded as we need the account to have funds in the tests
  const response = await axios.post(browser.globals.apiURI, {
    query: `{overview(networkId: "${network}", address: "${address}") {totalStake}}`,
  })
  if (response.data.errors) {
    throw new Error(JSON.stringify(response.data.errors))
  }
  if (Number(response.data.data.overview.totalStake) === 0) {
    throw new Error(`Account ${address} in ${network} has no funds`)
  }
  await browser.url(browser.launch_url)
  await browser.execute(
    function ({ address, network, wallet, name }) {
      // setting network
      window.localStorage.setItem(`network`, `"${network}"`)
      // skip sign in
      window.localStorage.setItem(
        `session_${network}`,
        JSON.stringify({
          address: address,
          sessionType: "local",
        })
      )
      // setting wallet
      window.localStorage.setItem(
        `cosmos-wallets-${address}`,
        JSON.stringify({
          name: name,
          wallet: wallet,
          address: address,
        })
      )
      return true
    },
    [{ address, network, wallet, name }]
  )
  await browser.refresh()
  await getAccountBalance(browser)
  // wait until on portfolio page to make sure future tests have the same state
  browser.expect.element(".balance-header").to.be.visible.before(10000)
  // switching to homepage
  await browser.url(browser.launch_url)
  return true
}

async function apiUp(browser) {
  console.log("Testing if API is up")
  const start = new Date().getTime()
  // we need to wait until the testnet is up and the account has money
  let apiUp = false
  while (!apiUp) {
    if (new Date().getTime() - start > 90000) {
      throw new Error("Timed out waiting for API to be up.")
    }
    try {
      // test if the api can return networks list
      const response = await axios.post(browser.globals.apiURI, {
        query: `{networks {id}}`,
      })
      if (response.data.errors) {
        throw new Error(JSON.stringify(response.data.errors))
      }
      if (Number(response.data.data.networks.length) === 0) {
        continue
      }
      apiUp = true
    } catch (err) {
      console.log("Failed to check API", err)
      console.log("Waiting 1s for API to be up")
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}
