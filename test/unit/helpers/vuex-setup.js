import Vuex from "vuex"
import VueRouter from "vue-router"
import { shallow, mount, createLocalVue } from "@vue/test-utils"
import { getCommits, getDispatches } from "./vuex-helpers.js"

import routes from "renderer/routes"

const Modules = require("renderer/vuex/modules").default
const Getters = require("renderer/vuex/getters")

export default function vuexSetup() {
  const localVue = createLocalVue()
  localVue.use(Vuex)
  localVue.use(VueRouter)

  function init(
    componentConstructor,
    testType = shallow,
    { stubs, getters = {}, propsData, methods, doBefore = () => {} } // doBefore receives router and store
  ) {
    const node = Object.assign({}, require("../helpers/node_mock"))
    const modules = Modules({ node })
    let store = new Vuex.Store({
      getters: Object.assign({}, Getters, getters),
      modules,
      actions: {
        loadPersistedState: () => {}
      }
    })
    store.commit("setDevMode", true)

    jest.spyOn(store, "dispatch")
    jest.spyOn(store, "commit")

    // helpers to make it easier to search events
    store.getCommits = getCommits.bind(this, store)
    store.getDispatches = getDispatches.bind(this, store)

    let router = new VueRouter({ routes })
    router.beforeEach((to, from, next) => {
      if (from.fullPath !== to.fullPath && !store.getters.user.pauseHistory)
        store.commit("addHistory", from.fullPath)
      next()
    })

    // execute some preparation logic on the store or router before mounting
    doBefore({ store, router })

    return {
      node,
      store,
      router,
      wrapper:
        componentConstructor &&
        testType(componentConstructor, {
          localVue,
          store,
          router,
          stubs,
          propsData,
          methods
        })
    }
  }

  return {
    localVue,
    shallow: (
      componentConstructor,
      { stubs, getters, propsData, methods, doBefore } = {}
    ) =>
      init(componentConstructor, shallow, {
        stubs,
        getters,
        propsData,
        methods,
        doBefore
      }),
    mount: (
      componentConstructor,
      { stubs, getters, propsData, methods, doBefore } = {}
    ) =>
      init(componentConstructor, mount, {
        stubs,
        getters,
        propsData,
        methods,
        doBefore
      })
  }
}
