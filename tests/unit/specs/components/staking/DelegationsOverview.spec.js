import { shallowMount } from "@vue/test-utils"
import DelegationsOverview from "src/components/staking/DelegationsOverview"
import validators from "../../store/json/validators.js"

describe(`DelegationsOverview`, () => {
  let wrapper, $store

  const getters = {
    delegation: {
      loaded: true
    },
    bondDenom: `stake`,
    yourValidators: validators
  }

  beforeEach(() => {
    $store = {
      commit: jest.fn(),
      dispatch: jest.fn(),
      state: {
        minting: {
          annualProvision: "100"
        }
      },
      getters: JSON.parse(JSON.stringify(getters)) // clone so we don't overwrite by accident
    }

    wrapper = shallowMount(DelegationsOverview, {
      mocks: {
        $store
      },
      propsData: { validators }
    })
  })

  it(`shows an overview over all delegations of the user`, async () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })
})
