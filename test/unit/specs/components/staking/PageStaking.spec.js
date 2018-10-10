import setup from "../../../helpers/vuex-setup"
import htmlBeautify from "html-beautify"
import PageStaking from "renderer/components/staking/PageStaking"
import lcdClientMock from "renderer/connectors/lcdClientMock.js"

describe(`PageStaking`, () => {
  let wrapper, store
  let { mount } = setup()

  beforeEach(() => {
    let instance = mount(PageStaking)
    wrapper = instance.wrapper
    store = instance.store

    store.commit(`setConnected`, true)
    store.state.user.address = lcdClientMock.addresses[0]
    store.commit(`setAtoms`, 1337)
    wrapper.update()
  })

  it(`has the expected html structure`, async () => {
    // after importing the @tendermint/ui components from modules
    // the perfect scroll plugin needs a $nextTick and a wrapper.update
    // to work properly in the tests (snapshots weren't matching)
    // this has occured across multiple tests
    await wrapper.vm.$nextTick()
    wrapper.update()
    expect(htmlBeautify(wrapper.html())).toMatchSnapshot()
  })

  it(`should show the search on click`, () => {
    wrapper.find(`.tm-tool-bar i.search`).trigger(`click`)
    expect(wrapper.contains(`.tm-modal-search`)).toBe(true)
  })

  it(`should refresh candidates on click`, () => {
    wrapper
      .findAll(`.tm-tool-bar i`)
      .at(1)
      .trigger(`click`)
    expect(store.dispatch).toHaveBeenCalledWith(`updateDelegates`)
  })

  it(`should sort the delegates by selected property`, () => {
    wrapper.vm.sort.property = `operator_address`
    wrapper.vm.sort.order = `desc`

    expect(
      wrapper.vm.sortedFilteredEnrichedDelegates.map(x => x.operator_address)
    ).toEqual(lcdClientMock.validators)

    wrapper.vm.sort.property = `operator_address`
    wrapper.vm.sort.order = `asc`

    expect(
      wrapper.vm.sortedFilteredEnrichedDelegates.map(x => x.operator_address)
    ).toEqual(lcdClientMock.validators.reverse())
  })

  it(`should filter the delegates`, () => {
    store.commit(`setSearchVisible`, [`delegates`, true])
    store.commit(`setSearchQuery`, [
      `delegates`,
      lcdClientMock.validators[2].substr(20, 26)
    ])
    expect(
      wrapper.vm.sortedFilteredEnrichedDelegates.map(x => x.operator_address)
    ).toEqual([lcdClientMock.validators[2]])
    wrapper.update()
    expect(wrapper.vm.$el).toMatchSnapshot()
    store.commit(`setSearchQuery`, [
      `delegates`,
      lcdClientMock.validators[1].substr(20, 26)
    ])
    expect(
      wrapper.vm.sortedFilteredEnrichedDelegates.map(x => x.operator_address)
    ).toEqual([lcdClientMock.validators[1]])
  })

  it(`should update 'somethingToSearch' when there's nothing to search`, () => {
    expect(wrapper.vm.somethingToSearch).toBe(true)
    let delegates = store.state.delegates.delegates
    store.commit(`setDelegates`, [])
    expect(wrapper.vm.somethingToSearch).toBe(false)

    store.commit(`setDelegates`, delegates)
    expect(wrapper.vm.somethingToSearch).toBe(true)
  })

  it(`should not show search when there is nothing to search`, () => {
    let { wrapper } = mount(PageStaking, {
      getters: {
        delegates: () => ({
          delegates: [],
          loading: true
        })
      },
      stubs: { "tm-data-loading": `<data-loading />` }
    })
    wrapper.update()

    expect(wrapper.vm.setSearch()).toEqual(false)
  })
})
