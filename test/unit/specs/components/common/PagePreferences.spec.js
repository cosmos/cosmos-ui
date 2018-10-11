import setup from "../../../helpers/vuex-setup"
import PagePreferences from "renderer/components/common/PagePreferences"
jest.mock(`renderer/google-analytics.js`, () => () => {})

describe(`PagePreferences`, () => {
  let wrapper, store
  let instance = setup()

  beforeEach(async () => {
    let test = instance.mount(PagePreferences)
    wrapper = test.wrapper
    store = test.store

    await store.dispatch(`signIn`, {
      account: `default`,
      password: `1234567890`
    })
  })

  it(`has the expected html structure if connected`, async () => {
    // after importing the @tendermint/ui components  modules
    // the perfect scroll plugin needs a $nextTick and a wrapper.update
    // to work properly in the tests (snapshots weren't matching)
    // this has occured across multiple tests
    await wrapper.vm.$nextTick()
    wrapper.update()
    expect(wrapper.vm.$el).toMatchSnapshot()
    expect(wrapper.vm.$el.outerHTML).toContain(`Select network`)
    expect(wrapper.vm.$el.outerHTML).toContain(`View tutorial`)
    expect(wrapper.vm.$el.outerHTML).toContain(`Automatically send`)
    expect(wrapper.vm.$el.outerHTML).toContain(`Switch account`)
    expect(wrapper.vm.$el.outerHTML).toContain(`Sign Out`)
  })

  it(`should sign the user out`, async () => {
    wrapper.vm.signOut()
    expect(store.dispatch).toHaveBeenCalledWith(`signOut`)
    expect(store.commit).toHaveBeenCalledWith(`notifySignOut`)
  })

  it(`should set the error collection opt in`, async () => {
    let errorCollection = wrapper.vm.user.errorCollection
    wrapper.vm.setErrorCollection()
    expect(store.dispatch).toHaveBeenCalledWith(`setErrorCollection`, {
      account: `default`,
      optin: !errorCollection
    })
    expect(wrapper.vm.user.errorCollection).not.toBe(errorCollection)
  })

  it(`can switch the theme`, () => {
    wrapper.vm.setAppTheme()
    expect(store.commit).toHaveBeenCalledWith(`setTheme`, `light`)
    expect(store.state.themes.active).toBe(`light`)
    // store.commit.mockClear()
    wrapper.vm.setAppTheme()
    expect(store.commit).toHaveBeenCalledWith(`setTheme`, `dark`)
    expect(store.state.themes.active).toBe(`dark`)
  })

  it(`can show onboarding again`, () => {
    wrapper.find(`#toggle-onboarding`).trigger(`click`)
    expect(store.commit).toHaveBeenCalledWith(`setOnboardingState`, 0)
    expect(store.commit).toHaveBeenCalledWith(`setOnboardingActive`, true)
    wrapper.update()
    expect(wrapper.find(`#onboarding`)).toBeDefined()
  })

  describe(`Select network to connect to`, () => {
    it(`Live Testnet`, () => {
      const instance = {
        networkSelectActive: `live`,
        $store: {
          dispatch: jest.fn()
        }
      }

      PagePreferences.methods.setMockedConnector.call(instance)

      expect(instance.$store.dispatch.mock.calls).toEqual([
        [`setMockedConnector`, false]
      ])
    })
    it(`Offline Mode`, () => {
      const instance = {
        networkSelectActive: `mock`,
        $store: {
          dispatch: jest.fn()
        }
      }

      PagePreferences.methods.setMockedConnector.call(instance)

      expect(instance.$store.dispatch.mock.calls).toEqual([
        [`setMockedConnector`, true]
      ])
    })
  })

  it(`switches mocked mode again`, async () => {
    let test = instance.mount(PagePreferences, {
      getters: {
        mockedConnector: () => true
      }
    })
    wrapper = test.wrapper
    store = test.store
    await store.dispatch(`signIn`, {
      account: `default`,
      password: `1234567890`
    })
    wrapper.vm.networkSelectActive = `live`
    wrapper.vm.setMockedConnector()
    expect(store.dispatch).toHaveBeenCalledWith(`setMockedConnector`, false)
  })
})
