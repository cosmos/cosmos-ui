import setup from "../../helpers/vuex-setup"

let instance = setup()

describe("Module: Delegates", () => {
  let store

  beforeEach(() => {
    let test = instance.shallow()
    store = test.store
  })

  it("adds delegate to state", () => {
    store.commit("addDelegate", {
      owner: "foo",
      tokens: "10"
    })
    expect(store.state.delegates.delegates[0]).toEqual({
      id: "foo",
      owner: "foo",
      tokens: "10",
      voting_power: "10.00"
    })
    expect(store.state.delegates.delegates.length).toBe(1)
  })

  it("replaces existing delegate with same id", () => {
    store.commit("addDelegate", {
      owner: "foo",
      tokens: "12",
      updated: true
    })
    expect(store.state.delegates.delegates[0]).toEqual({
      id: "foo",
      owner: "foo",
      tokens: "12",
      updated: true,
      voting_power: "12.00"
    })
    expect(store.state.delegates.delegates.length).toBe(1)
  })

  it("parses delegate tokens with fraction value", () => {
    store.commit("addDelegate", {
      owner: "foo",
      tokens: "4000/40",
      updated: true
    })
    expect(store.state.delegates.delegates[0]).toEqual({
      id: "foo",
      owner: "foo",
      tokens: "4000/40",
      updated: true,
      voting_power: "100.00"
    })
    expect(store.state.delegates.delegates.length).toBe(1)
  })

  it("fetches all candidates", async () => {
    await store.dispatch("getDelegates")
    let lcdClientMock = require("renderer/connectors/lcdClientMock.js")
    expect(store.state.delegates.delegates.map(x => x.owner)).toEqual(
      lcdClientMock.validators
    )
  })

  it("should query for delegates on reconnection", () => {
    jest.resetModules()
    let axios = require("axios")
    store.state.node.stopConnecting = true
    store.state.delegates.loading = true
    jest.spyOn(axios, "get")
    store.dispatch("reconnected")
    expect(axios.get.mock.calls).toMatchSnapshot()
  })

  it("should not query for delegates on reconnection if not stuck in loading", () => {
    jest.resetModules()
    let axios = require("axios")
    store.state.node.stopConnecting = true
    store.state.delegates.loading = false
    jest.spyOn(axios, "get")
    store.dispatch("reconnected")
    expect(axios.get.mock.calls.length).toBe(0)
  })
})
