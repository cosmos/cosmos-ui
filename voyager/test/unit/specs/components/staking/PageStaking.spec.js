import setup from "../../../helpers/vuex-setup"
import htmlBeautify from "html-beautify"
import PageStaking from "renderer/components/staking/PageStaking"

describe("PageStaking", () => {
  let wrapper, store
  let { mount } = setup()

  beforeEach(() => {
    let instance = mount(PageStaking)
    wrapper = instance.wrapper
    store = instance.store

    store.state.user.address = "abc"
    store.commit("setAtoms", 1337)
    store.commit("addDelegate", {
      pub_key: {
        type: "ed25519",
        data: "pubkeyX"
      },
      voting_power: 10000,
      shares: 5000,
      description: {
        description: "descriptionX",
        moniker: "candidateX",
        country: "USA"
      }
    })
    store.commit("addDelegate", {
      pub_key: {
        type: "ed25519",
        data: "pubkeyY"
      },
      voting_power: 30000,
      shares: 10000,
      description: {
        description: "descriptionY",
        moniker: "candidateY",
        country: "Canada"
      }
    })
    wrapper.update()
  })

  it("has the expected html structure", () => {
    expect(htmlBeautify(wrapper.html())).toMatchSnapshot()
  })

  it("should show the search on click", () => {
    wrapper.find(".ni-tool-bar i.search").trigger("click")
    expect(wrapper.contains(".ni-modal-search")).toBe(true)
  })

  it("should refresh candidates on click", () => {
    wrapper
      .findAll(".ni-tool-bar i")
      .at(1)
      .trigger("click")
    expect(store.dispatch).toHaveBeenCalledWith("getDelegates")
  })

  it("should sort the delegates by selected property", () => {
    expect(wrapper.vm.filteredDelegates.map(x => x.id)).toEqual([
      "88564A32500A120AA72CEFBCF5462E078E5DDB70B6431F59F778A8DC4DA719A4",
      "7A9D783CE542B23FA23DC7F101460879861205772606B4C3FAEAFBEDFB00E7BD",
      "651E7B12B3C7234FB82B4417C59DCE30E4EA28F06AD0ACAEDFF05F013E463F10",
      "pubkeyY",
      "pubkeyX"
    ])

    wrapper.vm.sort.property = "id"
    wrapper.vm.sort.order = "desc"
    expect(wrapper.vm.filteredDelegates.map(x => x.id)).toEqual([
      "pubkeyY",
      "pubkeyX",
      "88564A32500A120AA72CEFBCF5462E078E5DDB70B6431F59F778A8DC4DA719A4",
      "7A9D783CE542B23FA23DC7F101460879861205772606B4C3FAEAFBEDFB00E7BD",
      "651E7B12B3C7234FB82B4417C59DCE30E4EA28F06AD0ACAEDFF05F013E463F10"
    ])
  })

  it("should filter the delegates", () => {
    store.commit("setSearchVisible", ["delegates", true])
    store.commit("setSearchQuery", ["delegates", "dateX"])
    expect(wrapper.vm.filteredDelegates.map(x => x.id)).toEqual(["pubkeyX"])
    wrapper.update()
    expect(wrapper.vm.$el).toMatchSnapshot()
    store.commit("setSearchQuery", ["delegates", "dateY"])
    expect(wrapper.vm.filteredDelegates.map(x => x.id)).toEqual(["pubkeyY"])
  })

  it("should show the amount of selected delegates", () => {
    store.commit("addToCart", store.state.delegates.delegates[0])
    store.commit("addToCart", store.state.delegates.delegates[1])
    wrapper.update()
    expect(
      wrapper
        .find(".fixed-button-bar strong")
        .text()
        .trim()
    ).toContain("2")
  })

  it("should show placeholder if delegates are loading", () => {
    let { wrapper } = mount(PageStaking, {
      getters: {
        delegates: () => ({
          delegates: [],
          loading: true
        })
      },
      stubs: { "data-loading": "<data-loading />" }
    })

    expect(wrapper.contains("data-loading")).toBe(true)
  })
})
