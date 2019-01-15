import setup from "../../../helpers/vuex-setup.js"
import TmSessionAccountDelete from "common/TmSessionAccountDelete"

describe(`TmSessionAccountDelete`, () => {
  let wrapper, store

  beforeEach(() => {
    const { mount } = setup()
    const instance = mount(TmSessionAccountDelete)
    wrapper = instance.wrapper
    store = instance.store

    store.commit = jest.fn()
    store.dispatch = jest.fn(async () => true)
  })

  it(`has the expected html structure`, () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`should go back to the login screen on click`, () => {
    wrapper
      .findAll(`.tm-session-header a`)
      .at(0)
      .trigger(`click`)
    expect(store.commit.mock.calls[0]).toEqual([
      `setModalSessionState`,
      `sign-in`
    ])
  })

  it(`should open the help modal on click`, () => {
    wrapper
      .findAll(`.tm-session-header a`)
      .at(1)
      .trigger(`click`)
    expect(store.commit.mock.calls[0]).toEqual([`setModalHelp`, true])
  })

  it(`should go back on successful deletion`, async () => {
    wrapper.setData({
      fields: {
        deletionPassword: `1234567890`,
        deletionWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect(store.commit.mock.calls[0]).toEqual([
      `setModalSessionState`,
      `welcome`
    ])
  })

  it(`should show error if password not 10 long`, async () => {
    wrapper.setData({
      fields: {
        deletionPassword: `123`,
        deletionWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect(store.commit.mock.calls[0]).toBeUndefined()
    expect(wrapper.find(`.tm-form-msg-error`)).toBeDefined()
  })

  it(`should show error if deletionWarning is not acknowledged`, async () => {
    wrapper.setData({
      fields: {
        deletionPassword: `1234567890`,
        deletionWarning: false
      }
    })
    await wrapper.vm.onSubmit()
    expect(store.commit.mock.calls[0]).toBeUndefined()
    expect(wrapper.find(`.tm-form-msg-error`)).toBeDefined()
  })

  it(`should show a notification if deletion failed`, async () => {
    store.dispatch = jest.fn(() => Promise.reject(`Planned rejection`))
    wrapper.setData({
      fields: {
        deletionPassword: `1234567890`,
        deletionWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect(store.commit).toHaveBeenCalled()
    expect(store.commit.mock.calls[0][0]).toBe(`notifyError`)
  })
})
