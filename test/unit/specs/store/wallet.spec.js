import setup from "../../helpers/vuex-setup"

let instance = setup()

describe(`Module: Wallet`, () => {
  let store, node

  beforeEach(() => {
    let test = instance.shallow(null)
    store = test.store
    node = test.node
  })

  // DEFAULT

  it(`should have an empty state by default`, () => {
    expect(store.state.wallet).toMatchSnapshot()
  })

  // MUTATIONS

  it(`should set wallet balances `, () => {
    const balances = [{ denom: `leetcoin`, amount: `1337` }]
    store.commit(`setWalletBalances`, balances)
    expect(store.state.wallet.balances).toBe(balances)
  })

  it(`should set wallet key and clear balance `, () => {
    const address = `tb1v9jxgun9wdenzv3nu98g8r`
    store.commit(`setWalletAddress`, address)
    expect(store.state.wallet.address).toBe(address)
    expect(store.state.wallet.balances).toEqual([])
  })

  it(`should set denoms`, () => {
    const denoms = [`acoin`, `bcoin`, `ccoin`]
    store.commit(`setDenoms`, denoms)
    expect(store.state.wallet.denoms).toBe(denoms)
  })

  // ACTIONS

  it(`should initialize wallet`, async () => {
    const address = `tb1mjt6dcdru8lgdz64h2fu0lrzvd5zv8sfcvkv2l`
    await store.dispatch(`initializeWallet`, address)
    expect(store.state.wallet.address).toEqual(address)
  })

  it(`should query wallet state`, async () => {
    store.dispatch(`queryWalletState`)
    expect(store.state.wallet.balances).toEqual([])
    expect(store.state.transactions.wallet).toEqual([])
    expect(store.state.send.nonce).toBe(`0`)
  })

  it(`should query wallet balances`, async () => {
    store.commit(`setWalletAddress`, `abcd`)
    node.queryAccount = () =>
      Promise.resolve({
        coins: [
          {
            denom: `fermion`,
            amount: 42
          }
        ]
      })
    await store.dispatch(`queryWalletBalances`)
    expect(store.state.wallet.balances).toEqual([
      {
        amount: 42,
        denom: `fermion`
      }
    ])
  })

  it(`should load denoms`, async () => {
    await store.dispatch(`loadDenoms`)
    expect(store.state.wallet.denoms).toEqual([`mycoin`, `fermion`, `gregcoin`])
  })

  it(`should query the balances on reconnection`, () => {
    store.state.node.stopConnecting = true
    store.state.wallet.balancesLoading = true
    store.state.wallet.address = `12345678901234567890`
    jest.spyOn(node, `queryAccount`)
    store.dispatch(`reconnected`)
    expect(node.queryAccount).toHaveBeenCalled()
  })

  it(`should not query the balances on reconnection if not stuck in loading`, () => {
    store.state.node.stopConnecting = true
    store.state.wallet.balancesLoading = false
    jest.spyOn(node, `queryAccount`)
    store.dispatch(`reconnected`)
    expect(node.queryAccount).not.toHaveBeenCalled()
  })

  it(`should be in loading state before querying account, and not in loading state after`, async () => {
    node.queryAccount = () =>
      Promise.resolve({
        coins: [
          {
            denom: `fermion`,
            amount: 42
          }
        ]
      })

    expect(store.state.wallet.balancesLoading).toBe(true)
    await store.dispatch(`initializeWallet`, `tb1wdhk6e2pv3j8yetnwv0yr6s6`)
    expect(store.state.wallet.balancesLoading).toBe(false)
  })

  it(`should query wallet data at specified height`, async done => {
    jest.useFakeTimers()
    let height = store.state.node.lastHeader.height
    store.dispatch(`queryWalletStateAfterHeight`, height + 1).then(() => done())
    store.state.node.lastHeader.height++
    jest.runAllTimers()
    jest.useRealTimers()
  })

  it(`should not error when subscribing with no address`, async () => {
    store.state.wallet.address = null
    store.state.wallet.decodedAddress = null
    store.dispatch(`walletSubscribe`)
  })

  it(`should handle subscription errors`, async () => {
    store.state.wallet.address = `x`
    store.state.wallet.decodedAddress = `x`

    console.error = jest.fn()
    node.rpc.subscribe = jest.fn(({}, cb) => {
      //query is param
      cb(Error(`foo`))
    })

    store.dispatch(`walletSubscribe`)
    expect(console.error.mock.calls).toMatchSnapshot()
  })

  it(`should query wallet on subscription txs`, async () => {
    store.state.wallet.address = `x`
    store.state.wallet.decodedAddress = `x`

    await new Promise(resolve => {
      node.queryAccount = jest.fn(() => {
        if (node.queryAccount.mock.calls.length < 2) return
        resolve()
      })

      node.rpc.subscribe = jest.fn(({}, cb) => {
        // query is param
        cb(null, { data: { value: { TxResult: { height: -1 } } } })
      })

      store.dispatch(`walletSubscribe`)
    })
  })

  it(`should backup to polling balances for now`, async () => {
    jest.useFakeTimers()
    store.state.wallet.address = `x`
    store.state.wallet.decodedAddress = `x`

    await new Promise(resolve => {
      node.queryAccount = jest.fn(() => {
        if (node.queryAccount.mock.calls.length < 2) return
        resolve()
      })

      store.dispatch(`walletSubscribe`)
      jest.runAllTimers()
    })
  })
})
