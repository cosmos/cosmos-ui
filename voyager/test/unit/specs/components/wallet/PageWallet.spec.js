import setup from "../../../helpers/vuex-setup"
import PageWallet from "renderer/components/wallet/PageWallet"

describe("PageWallet", () => {
  let wrapper, store
  let { mount } = setup()

  beforeEach(() => {
    let instance = mount(PageWallet, {
      stubs: { "modal-search": "<modal-search />" }
    })
    wrapper = instance.wrapper
    store = instance.store

    store.commit("setDenoms", ["ATOM", "FERMION", "TEST"])
    store.commit("setWalletAddress", "123abc456def")
    store.commit("setWalletBalances", [
      {
        denom: "ATOM",
        amount: 123
      },
      {
        denom: "FERMION",
        amount: 456
      }
    ])
    store.commit("setCommittedDelegation", { candidateId: "foo", value: 123 })
    store.commit("setSearchQuery", ["balances", ""])

    wrapper.update()
  })

  it("has the expected html structure", () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it("should sort the balances by denom", () => {
    expect(wrapper.vm.filteredBalances.map(x => x.denom)).toEqual([
      "FERMION",
      "ATOM",
      "TEST"
    ])
  })

  it("should filter the balances", () => {
    store.commit("setSearchVisible", ["balances", true])
    store.commit("setSearchQuery", ["balances", "atom"])
    wrapper.update()
    expect(wrapper.vm.filteredBalances.map(x => x.denom)).toEqual(["ATOM"])
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it("should update balances by querying wallet state", () => {
    wrapper.vm.updateBalances()
    expect(store.dispatch).toHaveBeenCalledWith("queryWalletState")
  })

  it("should show the search on click", () => {
    wrapper.vm.setSearch(true)
    expect(store.commit).toHaveBeenCalledWith("setSearchVisible", [
      "balances",
      true
    ])
  })

  it("should list the denoms that are available", () => {
    expect(wrapper.findAll(".ni-li-balance").length).toBe(2)
  })

  it("should show the n/a message if there are no denoms", () => {
    let { store, wrapper } = mount(PageWallet, {
      "data-empty": "<data-empty />"
    })
    store.commit("setWalletBalances", [])
    wrapper.update()
    expect(wrapper.find("data-empty")).toBeDefined()
  })

  it("should not show the n/a message if there are denoms", () => {
    wrapper.update()
    expect(wrapper.vm.allDenomBalances.length).not.toBe(0)
    expect(wrapper.vm.$el.querySelector("#no-balances")).toBe(null)
  })

  it("has a title for available balances", () => {
    expect(
      wrapper
        .find("#part-available-balances .ni-part-title")
        .text()
        .trim()
    ).toBe("Available Balances")
  })

  it("has a title for staked balances", () => {
    expect(
      wrapper
        .find("#part-staked-balances .ni-part-title")
        .text()
        .trim()
    ).toBe("Staked Balances")
  })

  it("has shows the correct number of staked tokens", () => {
    expect(
      wrapper
        .find("#part-staked-balances .ni-li-dd")
        .text()
        .trim()
    ).toBe("123")
  })

  it("has a number of staked tokens", () => {
    expect(wrapper.vm.stakedTokens).toBe(123)
  })

  it("has a label for the staking denomination", () => {
    expect(wrapper.vm.stakingDenom).toBe("FERMION")
  })
})
