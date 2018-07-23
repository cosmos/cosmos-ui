import Vue from "vue"
import Electron from "vue-electron"
import Router from "vue-router"
import Tooltip from "vue-directive-tooltip"
import Vuelidate from "vuelidate"
import Raven from "raven-js"
import { ipcRenderer, remote } from "electron"

import App from "./App"
import routesConstructor from "./routes"
import Node from "./connectors/node"
import Store from "./vuex/store"

const config = remote.getGlobal("config")

// exporting this for testing
let store
let node
let router

// Raven serves automatic error reporting. It is turned off by default
Raven.config("").install()

// handle uncaught errors
window.addEventListener("unhandledrejection", function(event) {
  Raven.captureException(event.reason)
})
window.addEventListener("error", function(event) {
  Raven.captureException(event.reason)
})
Vue.config.errorHandler = error => {
  Raven.captureException(error)
  // shrinkStacktrace(error)
  // return true
}

Vue.use(Electron)
Vue.use(Router)
Vue.use(Tooltip, { delay: 1 })
Vue.use(Vuelidate)

async function main() {
  let lcdPort = getQueryParameter("lcd_port")
  console.log("Expecting lcd-server on port:", lcdPort)
  node = Node(lcdPort, config.mocked)

  store = Store({ node })
  store.dispatch("loadTheme")

  const routes = routesConstructor(store)
  router = new Router({
    scrollBehavior: () => ({ y: 0 }),
    routes
  })

  router.beforeEach((to, from, next) => {
    if (from.fullPath !== to.fullPath && !store.getters.user.pauseHistory)
      store.commit("addHistory", from.fullPath)
    next()
  })

  ipcRenderer.on("error", (event, error) => {
    switch (error.code) {
      case "NO_NODES_AVAILABLE":
        store.commit("setModalNoNodes", true)
        break
      default:
        store.commit("setModalError", true)
        store.commit("setModalErrorMessage", error.message)
    }
  })
  ipcRenderer.on("approve-hash", (event, hash) => {
    console.log(hash)
    store.commit("setNodeApprovalRequired", hash)
  })
  ipcRenderer.on("open-about-menu", () => {
    router.push("/about")
  })

  let firstStart = true
  ipcRenderer.on("connected", (event, nodeIP) => {
    node.rpcConnect(nodeIP)
    store.dispatch("rpcSubscribe")
    // store.dispatch("subscribeToBlocks")

    if (firstStart) {
      store.dispatch("showInitialScreen")

      // test connection
      node.lcdConnected().then(connected => {
        if (connected) {
          ipcRenderer.send("successful-launch")
        }
      })

      firstStart = false
    } else {
      store.dispatch("reconnected")
    }
  })

  ipcRenderer.send("booted")

  return new Vue({
    router,
    ...App,
    store
  }).$mount("#app")
}

main()

// exporting this for testing
module.exports.store = store
module.exports.node = node
module.exports.router = router

function getQueryParameter(name) {
  let queryString = window.location.search.substring(1)
  let pairs = queryString
    .split("&")
    .map(pair => pair.split("="))
    .filter(pair => pair[0] === name)
  if (pairs.length > 0) {
    return pairs[0][1]
  }
  return null
}
