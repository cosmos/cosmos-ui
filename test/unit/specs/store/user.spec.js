import userModule from "renderer/vuex/modules/user.js"

describe(`Module: User`, () => {
  let module, state, actions, mutations, node
  const accounts = [
    {
      address: `tb1zg69v7yszg69v7yszg69v7yszg69v7ysd8ep6q`,
      name: `ACTIVE_ACCOUNT`
    }
  ]

  beforeEach(() => {
    node = {}
    module = userModule({ node })
    state = module.state
    actions = module.actions
    mutations = module.mutations

    state.externals = {
      Sentry: {
        init: jest.fn()
      },
      enableGoogleAnalytics: jest.fn(),
      disableGoogleAnalytics: jest.fn(),
      track: jest.fn(),
      config: {
        development: false,
        google_analytics_uid: `UA-123`,
        version: `0.0.1`
      },
      loadKeys: () => [
        {
          name: `def`,
          address: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`
        }
      ],
      importKey: () => ({
        cosmosAddress: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`
      }),
      testPassword: () => true,
      generateSeed: () => `xxx`
    }
  })

  it(`should default to signed out state`, () => {
    expect(state.signedIn).toBe(false)
    expect(state.account).toBe(null)
    expect(state.address).toBe(null)
  })

  it(`should add and remove history correctly`, () => {
    expect(state.history.length).toBe(0)
    mutations.addHistory(state, `/`)
    expect(state.history.length).toBe(1)
    mutations.popHistory(state)
    expect(state.history.length).toBe(0)
  })
  it(`should pauseHistory correctly`, () => {
    expect(state.pauseHistory).toBe(false)
    mutations.pauseHistory(state, true)
    expect(state.pauseHistory).toBe(true)
    mutations.pauseHistory(state, false)
    expect(state.pauseHistory).toBe(false)
  })

  it(`should set accounts`, () => {
    mutations.setAccounts(state, accounts)
    expect(state.accounts).toEqual(accounts)
  })

  it(`should show an error if loading accounts fails`, async () => {
    jest.spyOn(console, `error`).mockImplementationOnce(() => {})

    jest.resetModules()
    jest.doMock(`renderer/scripts/keystore.js`, () => ({
      loadKeys: async () => {
        throw Error(`Error`)
      }
    }))

    const userModule = require(`renderer/vuex/modules/user.js`).default
    module = userModule({ node })
    state = module.state
    actions = module.actions

    const commit = jest.fn()
    await actions.loadAccounts({ commit, state })
    expect(commit).toHaveBeenCalledWith(`notifyError`, {
      body: `Error`,
      title: `Couldn't read keys`
    })
  })

  it(`should prepare the signin`, async () => {
    const commit = jest.fn()
    const dispatch = jest.fn()
    state.accounts = [{}]
    await actions.showInitialScreen({
      state,
      commit,
      dispatch
    })

    expect(commit).toHaveBeenCalledWith(`setModalSessionState`, `welcome`)
    expect(dispatch).toHaveBeenCalledWith(`resetSessionData`)
  })

  it(`should show a welcome screen if there are no accounts yet`, async () => {
    const commit = jest.fn()
    await actions.showInitialScreen({
      state,
      commit,
      dispatch: jest.fn()
    })

    expect(commit).toHaveBeenCalledWith(`setModalSessionState`, `welcome`)
  })

  it(`should test if the login works`, async () => {
    jest.resetModules()
    jest.doMock(`renderer/scripts/keystore.js`, () => ({
      testPassword: jest
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
    }))

    const userModule = require(`renderer/vuex/modules/user.js`).default
    module = userModule({ node })
    state = module.state
    actions = module.actions

    let output = await actions.testLogin(
      {},
      {
        account: `default`,
        password: `1234567890`
      }
    )
    expect(output).toBe(true)
    output = await actions.testLogin(
      {},
      {
        account: `default`,
        password: `1234567890`
      }
    )
    expect(output).toBe(false)
  })

  it(`should create a seed phrase`, async () => {
    const seed = await actions.createSeed()
    expect(seed).toBe(`xxx`)
  })

  it(`should create a key from a seed phrase`, async () => {
    const seedPhrase = `abc`
    const password = `123`
    const name = `def`
    const dispatch = jest.fn()
    await actions.createKey(
      { dispatch },
      {
        seedPhrase,
        password,
        name
      }
    )
    expect(dispatch).toHaveBeenCalledWith(`initializeWallet`, {
      address: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`
    })
  })

  it(`should sign in`, async () => {
    const password = `123`
    const account = `def`
    const commit = jest.fn()
    const dispatch = jest.fn()
    await actions.signIn({ state, commit, dispatch }, { password, account })
    expect(commit).toHaveBeenCalledWith(
      `setUserAddress`,
      `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`
    )
    expect(commit).toHaveBeenCalledWith(`setModalSession`, false)
    expect(dispatch).toHaveBeenCalledWith(`loadPersistedState`)
    expect(dispatch).toHaveBeenCalledWith(`initializeWallet`, {
      address: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`
    })
    expect(dispatch).toHaveBeenCalledWith(
      `loadErrorCollection`,
      `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`
    )
  })

  it(`should sign out`, async () => {
    const commit = jest.fn()
    const dispatch = jest.fn()
    await actions.signOut({ state, commit, dispatch })

    expect(commit).toHaveBeenCalledWith(`setModalSession`, true)
    expect(dispatch).toHaveBeenCalledWith(`showInitialScreen`)
    expect(state.account).toBeNull()
    expect(state.signedIn).toBeFalsy()
  })

  it(`should enable error collection`, async () => {
    jest.spyOn(console, `log`).mockImplementationOnce(() => {})
    const commit = jest.fn()
    await actions.setErrorCollection(
      {
        state,
        commit
      },
      { account: `abc`, optin: true }
    )

    expect(state.errorCollection).toBe(true)
    expect(localStorage.getItem(`voyager_error_collection_abc`)).toBe(`true`)
    expect(state.externals.enableGoogleAnalytics).toHaveBeenCalledWith(`UA-123`)
    expect(state.externals.track).toHaveBeenCalledWith(`pageview`, {
      dl: `/`
    })
    expect(state.externals.Sentry.init).toHaveBeenCalledWith({
      dsn: expect.stringMatching(`https://.*@sentry.io/.*`),
      release: `voyager@0.0.1`
    })
  })

  it(`should disable error collection`, async () => {
    jest.spyOn(console, `log`).mockImplementationOnce(() => {})
    const commit = jest.fn()
    await actions.setErrorCollection(
      {
        state,
        commit
      },
      { account: `abc`, optin: false }
    )

    expect(state.errorCollection).toBe(false)
    expect(localStorage.getItem(`voyager_error_collection_abc`)).toBe(`false`)
    expect(state.externals.disableGoogleAnalytics).toHaveBeenCalledWith(
      `UA-123`
    )
    expect(state.externals.Sentry.init).toHaveBeenCalledWith({})
  })

  it(`should not set error collection if in development mode`, async () => {
    jest.spyOn(console, `log`).mockImplementationOnce(() => {})
    const commit = jest.fn()
    state.externals.config.development = true
    await actions.setErrorCollection(
      {
        state,
        commit
      },
      { account: `abc`, optin: true }
    )

    expect(commit).toHaveBeenCalledWith(`notifyError`, {
      title: `Couldn't switch on error collection.`,
      body: `Error collection is disabled during development.`
    })
    expect(state.errorCollection).toBe(false)
    expect(localStorage.getItem(`voyager_error_collection_abc`)).toBe(`false`)
    expect(state.externals.disableGoogleAnalytics).toHaveBeenCalledWith(
      `UA-123`
    )
    expect(state.externals.Sentry.init).toHaveBeenCalledWith({})
  })

  it(`should load the persisted error collection opt in`, () => {
    localStorage.setItem(`voyager_error_collection_abc`, `true`)
    state.errorCollection = false

    const dispatch = jest.fn()
    actions.loadErrorCollection(
      {
        state,
        dispatch
      },
      `abc`
    )

    expect(dispatch).toHaveBeenCalledWith(`setErrorCollection`, {
      account: `abc`,
      optin: true
    })

    localStorage.setItem(`voyager_error_collection_abc`, `false`)
    state.errorCollection = true

    dispatch.mockClear()
    actions.loadErrorCollection(
      {
        state,
        dispatch
      },
      `abc`
    )

    expect(dispatch).toHaveBeenCalledWith(`setErrorCollection`, {
      account: `abc`,
      optin: false
    })
  })

  it(`should reload accounts on reconnect as this could be triggered by a switch from a mocked connection`, async () => {
    const dispatch = jest.fn()
    await actions.reconnected({ state, dispatch })
    expect(dispatch).toHaveBeenCalledWith(`loadAccounts`)
  })
})
