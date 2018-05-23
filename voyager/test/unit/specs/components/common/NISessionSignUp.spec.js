import setup from "../../../helpers/vuex-setup"
import Vuelidate from "vuelidate"
import htmlBeautify from "html-beautify"
import NISessionSignUp from "common/NiSessionSignUp"
jest.mock("renderer/google-analytics.js", () => uid => {})

let instance = setup()
instance.localVue.use(Vuelidate)

describe("NISessionSignUp", () => {
  let wrapper, store

  beforeEach(() => {
    let test = instance.mount(NISessionSignUp)
    store = test.store
    wrapper = test.wrapper
  })

  it("has the expected html structure", () => {
    expect(htmlBeautify(wrapper.html())).toMatchSnapshot()
  })

  it("should go back to the welcome screen on click", () => {
    wrapper
      .findAll(".ni-session-header a")
      .at(0)
      .trigger("click")
    expect(store.commit.mock.calls[0][0]).toBe("setModalSessionState")
    expect(store.commit.mock.calls[0][1]).toBe("welcome")
  })

  it("should open the help modal on click", () => {
    wrapper
      .findAll(".ni-session-header a")
      .at(1)
      .trigger("click")
    expect(store.commit.mock.calls[0]).toEqual(["setModalHelp", true])
  })

  it("should close the modal on successful login", async () => {
    wrapper.setData({
      fields: {
        signUpPassword: "1234567890",
        signUpPasswordConfirm: "1234567890",
        signUpSeed: "bar", // <-- doesn#t check for correctness of seed
        signUpName: "testaccount",
        signUpWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect(store.commit).toHaveBeenCalledWith("setModalSession", false)
  })

  it("should signal signedin state on successful login", async () => {
    wrapper.setData({
      fields: {
        signUpPassword: "1234567890",
        signUpPasswordConfirm: "1234567890",
        signUpSeed: "bar", // <-- doesn#t check for correctness of seed
        signUpName: "testaccount",
        signUpWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect(
      store.commit.mock.calls.find(([action, _]) => action === "notify")[1]
    ).toMatchSnapshot()
    expect(store.dispatch).toHaveBeenCalledWith("signIn", {
      password: "1234567890",
      account: "testaccount"
    })
  })

  it("should set error collection opt in state", async () => {
    wrapper.setData({
      fields: {
        signUpPassword: "1234567890",
        signUpPasswordConfirm: "1234567890",
        signUpSeed: "bar", // <-- doesn#t check for correctness of seed
        signUpName: "testaccount",
        signUpWarning: true,
        errorCollection: true
      }
    })
    await wrapper.vm.onSubmit()
    expect(
      store.dispatch.mock.calls.find(
        ([action, _]) => action === "setErrorCollection"
      )[1]
    ).toMatchObject({
      account: "testaccount",
      optin: true
    })

    wrapper.setData({
      fields: {
        signUpPassword: "1234567890",
        signUpPasswordConfirm: "1234567890",
        signUpSeed: "bar", // <-- doesn#t check for correctness of seed
        signUpName: "testaccount",
        signUpWarning: true,
        errorCollection: false
      }
    })
    store.dispatch.mockClear()
    await wrapper.vm.onSubmit()
    expect(
      store.dispatch.mock.calls.find(
        ([action, _]) => action === "setErrorCollection"
      )[1]
    ).toMatchObject({
      account: "testaccount",
      optin: false
    })
  })

  it("should show error if warnings not acknowledged", () => {
    wrapper.setData({
      fields: {
        signUpPassword: "1234567890",
        signUpPasswordConfirm: "1234567890",
        signUpSeed: "bar",
        signUpName: "testaccount",
        signUpWarning: false
      }
    })
    wrapper.vm.onSubmit()
    expect(store.commit).not.toHaveBeenCalled()
    expect(wrapper.find(".ni-form-msg-error")).toBeDefined()
  })

  it("should show error if password is not 10 long", async () => {
    wrapper.setData({
      fields: {
        signUpPassword: "123456789",
        signUpPasswordConfirm: "1234567890",
        signUpSeed: "bar",
        signUpName: "testaccount",
        signUpWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect(store.commit.mock.calls[0]).toBeUndefined()
    expect(wrapper.find(".ni-form-msg-error")).toBeDefined()
  })

  it("should show error if password is not confirmed", async () => {
    wrapper.setData({
      fields: {
        signUpPassword: "1234567890",
        signUpPasswordConfirm: "notthesame",
        signUpSeed: "bar",
        signUpName: "testaccount",
        signUpWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect(store.commit.mock.calls[0]).toBeUndefined()
    expect(wrapper.find(".ni-form-msg-error")).toBeDefined()
  })

  it("should show an error if account name is not 5 long", async () => {
    wrapper.setData({
      fields: {
        signUpPassword: "1234567890",
        signUpPasswordConfirm: "1234567890",
        signUpSeed: "bar",
        signUpName: "test",
        signUpWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect(store.commit.mock.calls[0]).toBeUndefined()
    expect(wrapper.find(".ni-form-msg-error")).toBeDefined()
  })

  it("should not continue if creation failed", async () => {
    store.dispatch = jest.fn(() => Promise.resolve(null))
    wrapper.setData({
      fields: {
        signUpPassword: "1234567890",
        signUpPasswordConfirm: "1234567890",
        signUpSeed: "bar",
        signUpName: "testaccount",
        signUpWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect(store.commit).not.toHaveBeenCalled()
  })

  it("should show a notification if creation failed", async () => {
    store.dispatch = jest.fn(() => Promise.reject({ message: "test" }))
    wrapper.setData({
      fields: {
        signUpPassword: "1234567890",
        signUpPasswordConfirm: "1234567890",
        signUpSeed: "bar",
        signUpName: "testaccount",
        signUpWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect(store.commit.mock.calls[0][0]).toEqual("notifyError")
    expect(store.commit.mock.calls[0][1].body).toEqual("test")
  })
})
