import recoverModule from "src/vuex/modules/intercom.js"

describe(`Module: Intercom`, () => {
  let module, state, actions, node

  const intercom = {
    displayMessenger: jest.fn()
  }

  const spydisplayMessenger = jest.spyOn(intercom, "displayMessenger")

  beforeEach(() => {
    node = {}
    module = recoverModule({ node })
    actions = module.actions
    state = { intercom }
  })

  describe(`actions`, () => {
    it(`should display Intercom Messenger`, async () => {
      await actions.displayMessenger({ state })
      expect(spydisplayMessenger).toHaveBeenCalled()
    })
  })
})
