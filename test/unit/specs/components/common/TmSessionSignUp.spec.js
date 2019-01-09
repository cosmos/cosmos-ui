import setup from "../../../helpers/vuex-setup"
import Vuelidate from "vuelidate"
import NISessionSignUp from "common/TmSessionSignUp"
jest.mock(`renderer/google-analytics.js`, () => () => {})

let instance = setup()
instance.localVue.use(Vuelidate)

describe(`NISessionSignUp`, () => {
  let wrapper, store

  beforeEach(() => {
    let test = instance.mount(NISessionSignUp, {
      getters: {
        connected: () => true
      }
    })
    store = test.store
    wrapper = test.wrapper
  })

  it(`has the expected html structure`, () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`should go back to the welcome screen on click`, () => {
    wrapper
      .findAll(`.tm-session-header a`)
      .at(0)
      .trigger(`click`)
    expect(store.commit.mock.calls[0][0]).toBe(`setModalSessionState`)
    expect(store.commit.mock.calls[0][1]).toBe(`welcome`)
  })

  it(`should open the help modal on click`, () => {
    wrapper
      .findAll(`.tm-session-header a`)
      .at(1)
      .trigger(`click`)
    expect(store.commit.mock.calls[0]).toEqual([`setModalHelp`, true])
  })

  it(`should close the modal on successful login`, async () => {
    const commit = jest.fn()
    await wrapper.vm.onSubmit({
      $store: {
        commit,
        dispatch: jest.fn(() => `key`)
      },
      $v: {
        $touch: () => {},
        $error: false
      },
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`, // <-- doesn#t check for correctness of seed
        signUpName: `testaccount`,
        signUpWarning: true
      }
    })
    expect(commit).toHaveBeenCalledWith(`setModalSession`, false)
  })

  it(`should signal signedin state on successful login`, async () => {
    const commit = jest.fn()
    const dispatch = jest.fn(() => `key`)
    await wrapper.vm.onSubmit({
      $store: {
        commit,
        dispatch
      },
      $v: {
        $touch: () => {},
        $error: false
      },
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`, // <-- doesn#t check for correctness of seed
        signUpName: `testaccount`,
        signUpWarning: true
      }
    })
    expect(commit).toHaveBeenCalledWith(`notify`, expect.any(Object))
    expect(dispatch).toHaveBeenCalledWith(`signIn`, {
      password: `1234567890`,
      account: `testaccount`
    })
  })

  it(`should set error collection opt in state`, async () => {
    const commit = jest.fn()
    const dispatch = jest.fn(() => `key`)
    await wrapper.vm.onSubmit({
      $store: {
        commit,
        dispatch
      },
      $v: {
        $touch: () => {},
        $error: false
      },
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`, // <-- doesn#t check for correctness of seed
        signUpName: `testaccount`,
        signUpWarning: true,
        errorCollection: true
      }
    })
    expect(dispatch).toHaveBeenCalledWith(`setErrorCollection`, {
      account: `testaccount`,
      optin: true
    })

    dispatch.mockClear()

    await wrapper.vm.onSubmit({
      $store: {
        commit,
        dispatch
      },
      $v: {
        $touch: () => {},
        $error: false
      },
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`, // <-- doesn#t check for correctness of seed
        signUpName: `testaccount`,
        signUpWarning: false,
        errorCollection: false
      }
    })
    expect(dispatch).toHaveBeenCalledWith(`setErrorCollection`, {
      account: `testaccount`,
      optin: false
    })
  })

  it(`should show error if warnings not acknowledged`, () => {
    wrapper.setData({
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`,
        signUpName: `testaccount`,
        signUpWarning: false
      }
    })
    wrapper.vm.onSubmit()
    expect(store.commit).not.toHaveBeenCalled()
    expect(wrapper.find(`.tm-form-msg-error`)).toBeDefined()
  })

  it(`should show error if password is not 10 long`, async () => {
    wrapper.setData({
      fields: {
        signUpPassword: `123456789`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`,
        signUpName: `testaccount`,
        signUpWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect(store.commit.mock.calls[0]).toBeUndefined()
    expect(wrapper.find(`.tm-form-msg-error`)).toBeDefined()
  })

  it(`should show error if password is not confirmed`, async () => {
    wrapper.setData({
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `notthesame`,
        signUpSeed: `bar`,
        signUpName: `testaccount`,
        signUpWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect(store.commit.mock.calls[0]).toBeUndefined()
    expect(wrapper.find(`.tm-form-msg-error`)).toBeDefined()
  })

  it(`should show an error if account name is not 5 long`, async () => {
    wrapper.setData({
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`,
        signUpName: `test`,
        signUpWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect(store.commit.mock.calls[0]).toBeUndefined()
    expect(wrapper.find(`.tm-form-msg-error`)).toBeDefined()
  })

  it(`should not continue if creation failed`, async () => {
    store.dispatch = jest.fn(() => Promise.resolve(null))
    wrapper.setData({
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`,
        signUpName: `testaccount`,
        signUpWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect(store.commit).not.toHaveBeenCalled()
  })

  it(`should show a notification if creation failed`, async () => {
    store.dispatch = jest.fn(() => Promise.reject({ message: `test` }))
    wrapper.setData({
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`,
        signUpName: `testaccount`,
        signUpWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect(store.commit.mock.calls[0][0]).toEqual(`notifyError`)
    expect(store.commit.mock.calls[0][1].body).toEqual(`test`)
  })
})
