"use strict"
/**
 * Main module
 * @module main
 */

import _Vue from "vue"
import Router from "vue-router"
import Tooltip from "vue-directive-tooltip"
import Vuelidate from "vuelidate"
import VueClipboard from "vue-clipboard2"
import * as _Sentry from "@sentry/browser"
import axios from "axios"

import App from "../App"
import routes from "../routes"
import _Node from "../connectors/node"
import _Store from "../vuex/store"
import * as urlHelpers from "../../helpers/url.js"
import _config from "../../config"
import { enableGoogleAnalytics } from "../google-analytics"
const _enableGoogleAnalytics = enableGoogleAnalytics

export const routeGuard = store => (to, from, next) => {
  if (from.fullPath !== to.fullPath && !store.getters.session.pauseHistory) {
    store.commit(`addHistory`, from.fullPath)
  }

  if (to.redirectedFrom == `/staking` && store.state.session.signedIn) {
    to = Object.assign({}, to, {
      path: `/staking/my-delegations`,
      fullPath: `/staking/my-delegations`,
      name: `My Delegations`
    })
    next(to.path)
  } else if (
    !store.state.session.signedIn &&
    to.matched.some(record => record.meta.requiresAuth)
  ) {
    // redirect to session page if auth required
    store.commit(`setSessionModalView`, `welcome`)
    store.commit(`toggleSessionModal`, true)
  }
  next()
}

/**
 * Start the Vue app
 */
export const startApp = async (
  urlParams,
  config,
  Node = _Node,
  Store = _Store,
  env = process.env,
  Sentry = _Sentry,
  Vue = _Vue,
  enableGoogleAnalytics = _enableGoogleAnalytics
) => {
  Vue.use(Router)
  Vue.use(Tooltip, { delay: 1 })
  Vue.use(Vuelidate)
  Vue.use(VueClipboard)

  // directive to focus form fields
  /* istanbul ignore next */
  Vue.directive(`focus`, {
    inserted: function(el) {
      el.focus()
    }
  })

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
    /* istanbul ignore next */
    window.addEventListener(`unhandledrejection`, function(event) {
      Sentry.captureException(event.reason)
    })
    /* istanbul ignore next */
    window.addEventListener(`error`, function(event) {
      Sentry.captureException(event.reason)
    })

    enableGoogleAnalytics(config.google_analytics_uid)
  }

  const stargate = urlParams.stargate || config.stargate
  console.log(`Expecting stargate at: ${stargate}`)

  const node = Node(axios, stargate)
  const store = Store({ node })
  const router = new Router({
    scrollBehavior: () => ({ y: 0 }),
    routes
  })

  router.beforeEach(routeGuard(store))
  
  if (urlParams.experimental) {
    store.commit(`setExperimentalMode`)
  }
  if (urlParams.insecure) {
    store.commit(`setInsecureMode`)
  }
  if (urlParams.rpc) {
    store.commit(`setRpcUrl`, urlParams.rpc)
  }

  store.dispatch(`showInitialScreen`)
  store.dispatch(`connect`)
    .then(() => {
      store.dispatch(`checkForPersistedSession`)
    })

  return new Vue({
    router,
    ...App,
    store
  }).$mount(`#app`)
}

/**
 * Main method to prepare the boot process. It acts as the entrypoint.
 */
export const main = async (
  getURLParams = urlHelpers.getURLParams,
  start = startApp,
  config = _config
) => {
  const params = getURLParams(window)
  await start(params, config)
}
