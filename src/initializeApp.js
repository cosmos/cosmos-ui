/* istanbul ignore file: really just integrations */

import { listenToExtensionMessages } from "scripts/extension-utils"
import {
  enableGoogleAnalytics,
  setGoogleAnalyticsPage
} from "scripts/google-analytics"
import * as Sentry from "@sentry/browser"
import config from "src/config"
import Node from "./connectors/node"
import router, { routeGuard } from "./router"
import Store from "./vuex/store"

export default function init(urlParams, env = process.env) {
  // add error handlers in production
  if (env.NODE_ENV === `production`) {
    // Sentry is used for automatic error reporting. It is turned off by default.
    Sentry.init({})

    // this will pass the state to Sentry when errors are sent.
    // this would also sent passwords...
    // Sentry.configureScope(scope => {
    //   scope.setExtra(_Store.state)
    // })

    // handle uncaught errors
    window.addEventListener(`unhandledrejection`, function(event) {
      Sentry.captureException(event.reason)
    })
    window.addEventListener(`error`, function(event) {
      Sentry.captureException(event.reason)
    })

    enableGoogleAnalytics(config.google_analytics_uid)
  }

  const stargate = urlParams.stargate || config.stargate
  console.log(`Expecting stargate at: ${stargate}`)

  const node = Node(stargate)
  const store = Store({ node })

  setGoogleAnalyticsPage(router.currentRoute.path)
  router.beforeEach(routeGuard(store))
  router.afterEach(to => {
    /* istanbul ignore next */
    setGoogleAnalyticsPage(to.path)
  })

  if (urlParams.experimental) {
    store.commit(`setExperimentalMode`)
  }
  if (urlParams.rpc) {
    store.commit(`setRpcUrl`, urlParams.rpc)
  }
  if (urlParams.insecure) {
    store.commit(`setInsecureMode`)
  }

  store.dispatch(`loadLocalPreferences`)
  store
    .dispatch(`connect`)
    // wait for connected as the check for session will sign in directly and query account data
    .then(() => {
      store.dispatch(`checkForPersistedSession`)
      store.dispatch("getDelegates")
      store.dispatch(`getPool`)
      store.dispatch(`getMintingParameters`)
    })

  listenToExtensionMessages(store)

  return { store, router }
}
