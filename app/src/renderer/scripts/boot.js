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

export const routeGuard = store => (to, from, next) => {
  if (from.fullPath !== to.fullPath && !store.getters.user.pauseHistory) {
    store.commit(`addHistory`, from.fullPath)
  }

  if (to.redirectedFrom == `/staking` && store.state.user.signedIn) {
    to = Object.assign({}, to, {
      path: `/staking/my-delegations`,
      fullPath: `/staking/my-delegations`,
      name: `My Delegations`
    })
    next(to.path)
  } else if (
    !store.state.user.signedIn &&
    to.matched.some(record => record.meta.requiresAuth)
  ) {
    // redirect to session page if auth required
    store.commit(`setModalSessionState`, `welcome`)
    store.commit(`setModalSession`, true)
  }
  next()
}

/**
 * Start the Vue app
 */
export const startApp = async (
  config,
  Node = _Node,
  Store = _Store,
  env = process.env,
  Sentry = _Sentry,
  Vue = _Vue
) => {
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
  }

  console.log(`Expecting stargate at: ${config.stargate}`)

  const node = Node(axios, config.stargate)
  const store = Store({ node })
  const router = new Router({
    scrollBehavior: () => ({ y: 0 }),
    routes
  })

  router.beforeEach(routeGuard(store))

  store.dispatch(`connect`)
  store.dispatch(`showInitialScreen`)

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
  start = startApp
) => {
  const params = getURLParams(window)
  const enrichedConfig = Object.assign({}, _config, params)

  await start(enrichedConfig)
}
