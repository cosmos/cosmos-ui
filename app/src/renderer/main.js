"use strict"
/**
 * Main module
 * @module main
 */

import _Vue from "vue"
import Router from "vue-router"
import Tooltip from "vue-directive-tooltip"
import Vuelidate from "vuelidate"
import * as _Sentry from "@sentry/browser"
import axios from "axios"

import App from "./App"
import routes from "./routes"
import _Node from "./connectors/node"
import _Store from "./vuex/store"
import * as urlHelpers from "../helpers/url.js"
const _config = require(`../config.json`)

/**
 * Main method to prepare the boot process. It acts as the entrypoint.
 */
async function main(
  getURLParams = urlHelpers.getURLParams,
  startApp = _startApp
) {
  const params = getURLParams(window)
  const enrichedConfig = Object.assign({}, _config, params)

  startApp(enrichedConfig)
}

/**
 * Start the Vue app
 */
async function _startApp(
  config,
  Node = _Node,
  Store = _Store,
  env = process.env,
  Sentry = _Sentry,
  Vue = _Vue
) {
  /* istanbul ignore next */
  Vue.config.errorHandler = (error, vm, info) => {
    console.error(`An error has occurred: ${error}

  Guru Meditation #${info}`)

    _Sentry.captureException(error)

    if (store.state.devMode) {
      throw error
    }
  }

  /* istanbul ignore next */
  Vue.config.warnHandler = (msg, vm, trace) => {
    console.warn(`A warning has occurred: ${msg}

  Guru Meditation #${trace}`)

    if (store.state.devMode) {
      throw new Error(msg)
    }
  }

  Vue.use(Router)
  Vue.use(Tooltip, { delay: 1 })
  Vue.use(Vuelidate)

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
  }

  console.log(`Expecting stargate at: ${config.stargate}`)

  const node = Node(axios, config.stargate)
  const store = Store({ node })
  const router = new Router({
    scrollBehavior: () => ({ y: 0 }),
    routes
  })

  router.beforeEach((to, from, next) => {
    if (from.fullPath !== to.fullPath && !store.getters.user.pauseHistory)
      store.commit(`addHistory`, from.fullPath)
    next()
  })

  store.dispatch(`connect`)
  store.dispatch(`showInitialScreen`)

  return new Vue({
    router,
    ...App,
    store
  }).$mount(`#app`)
}

// run
main()

// export for tests only
module.exports.main = main
module.exports.startApp = _startApp
