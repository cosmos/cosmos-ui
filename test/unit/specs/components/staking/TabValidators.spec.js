import setup from "../../../helpers/vuex-setup"
import TabValidators from "renderer/components/staking/TabValidators"
import lcdClientMock from "renderer/connectors/lcdClientMock.js"

const { stakingParameters } = lcdClientMock.state

describe(`TabValidators`, () => {
  let wrapper
  let store
  const { mount } = setup()

  beforeEach(async () => {
    const instance = mount(TabValidators, {
      doBefore: ({ store }) => {
        store.commit(`setConnected`, true)
      },
      stubs: {
        "tm-data-connecting": true,
        "tm-data-loading": true,
        "tm-data-empty": true,
        "short-bech32": true
      }
    })
    wrapper = instance.wrapper
    store = instance.store
    store.state.stakingParameters = stakingParameters
    await store.dispatch(`getDelegates`)
  })

  it(`has the expected html structure`, async () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`shows a message if still connecting`, async () => {
    store.state.delegates.loaded = false
    store.commit(`setConnected`, false)
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`shows a message if still loading`, async () => {
    store.state.delegates.loading = true
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`shows a message if there is nothing to display`, async () => {
    store.state.delegates.delegates = []
    expect(wrapper.vm.$el).toMatchSnapshot()
  })
})
