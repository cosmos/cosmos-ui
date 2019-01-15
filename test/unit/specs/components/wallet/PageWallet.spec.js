import setup from "../../../helpers/vuex-setup"
import PageWallet from "renderer/components/wallet/PageWallet"
import lcdClientMock from "renderer/connectors/lcdClientMock.js"

const { stakingParameters } = lcdClientMock.state

describe(`PageWallet`, () => {
  let wrapper, store
  const { mount } = setup()

  beforeEach(async () => {
    const instance = mount(PageWallet, {
      stubs: {
        "modal-search": true,
        "tm-data-connecting": true,
        "tm-data-loading": true
      },
      doBefore: ({ store }) => {
        store.commit(`setConnected`, true)
        store.commit(`setSearchQuery`, [`balances`, ``])
        store.commit(`setStakingParameters`, stakingParameters.parameters)
      }
    })
    wrapper = instance.wrapper
    store = instance.store

    await store.dispatch(`signIn`, {
      account: `default`,
      password: `1234567890`
    })
    store.commit(`setSearchQuery`, [`balances`, ``])
    store.commit(`setStakingParameters`, stakingParameters.parameters)
    // we need to wait for the denoms to have loaded
    // if not they load async and produce errors when the tests already passed
    await store.dispatch(`loadDenoms`)
  })

  it(`has the expected html structure`, async () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`should sort the balances by denom`, () => {
    expect(wrapper.vm.filteredBalances.map(x => x.denom)).toEqual([
      `fermion`,
      `STAKE`,
      `mycoin`,
      `gregcoin`
    ])
  })

  it(`should filter the balances`, async () => {
    store.commit(`setSearchVisible`, [`balances`, true])
    store.commit(`setSearchQuery`, [`balances`, `stake`])
    store.commit(`setStakingParameters`, stakingParameters.parameters)
    expect(wrapper.vm.filteredBalances.map(x => x.denom)).toEqual([`STAKE`])
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`should show the search on click`, () => {
    wrapper.vm.setSearch(true)
    expect(store.commit).toHaveBeenCalledWith(`setSearchVisible`, [
      `balances`,
      true
    ])
  })

  it(`should list the denoms that are available`, () => {
    expect(wrapper.findAll(`.tm-li-balance`).length).toBe(3)
  })

  it(`should show the n/a message if there are no denoms`, async () => {
    store.commit(`setWalletBalances`, [])
    expect(wrapper.find(`#account_empty_msg`).exists()).toBeTruthy()
  })

  it(`should not show the n/a message if there are denoms`, () => {
    expect(wrapper.vm.allDenomBalances.length).not.toBe(0)
    expect(wrapper.vm.$el.querySelector(`#no-balances`)).toBe(null)
  })

  it(`should update 'somethingToSearch' when there's nothing to search`, async () => {
    expect(wrapper.vm.somethingToSearch).toBe(true)
    store.commit(`setWalletBalances`, [])
    expect(wrapper.vm.somethingToSearch).toBe(false)
  })

  it(`should not show search when there's nothing to search`, async () => {
    store.commit(`setWalletBalances`, [])
    expect(wrapper.vm.setSearch()).toEqual(false)
  })

  it(`should show a message when still connecting`, () => {
    store.state.wallet.loaded = false
    store.state.connection.connected = false
    expect(wrapper.exists(`tm-data-connecting`)).toBe(true)
  })

  it(`should show a message when still loading`, () => {
    store.state.wallet.loaded = false
    store.state.wallet.loading = false
    store.state.connection.connected = true
    expect(wrapper.exists(`tm-data-loading`)).toBe(true)
  })
})
