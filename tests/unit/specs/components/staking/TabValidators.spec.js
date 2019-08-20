import { shallowMount } from "@vue/test-utils"
import TabValidators from "src/components/staking/TabValidators"
import validators from "../../store/json/validators.js"

describe(`TabValidators`, () => {
  let wrapper, $store, $apollo

  const state = {
    session: {
      signedIn: true
    },
    delegates: {
      delegates: validators,
      loading: false,
      loaded: true
    }
  }

  const getters = {
    committedDelegations: {
      [validators[0].operator_address]: 42
    },

    connected: true,
    lastHeader: { height: 20 },
    yourValidators: validators
  }

  beforeEach(async () => {
    $apollo = {
      queries: {
        validators: {
          loading: true
        }
      }
    }
    $store = {
      dispatch: jest.fn(),
      getters,
      state
    }

    wrapper = shallowMount(TabValidators, {
      mocks: {
        $store,
        $apollo
      }
    })
  })

  it(`shows a list of validators`, async () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`shows a message if still connecting`, async () => {
    $store = {
      dispatch: jest.fn(),
      state: {
        session: {
          signedIn: true
        },
        delegates: {
          delegates: validators,
          loading: false,
          loaded: false
        }
      },
      getters: {
        committedDelegations: {
          [validators[0].operator_address]: 42
        },
        connected: false,
        lastHeader: { height: 20 },
        yourValidators: validators
      }
    }

    wrapper = shallowMount(TabValidators, {
      mocks: {
        $store,
        $apollo
      }
    })

    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`shows a message if still loading`, async () => {
    $store = {
      dispatch: jest.fn(),
      state: {
        session: {
          signedIn: true
        },
        delegates: {
          delegates: validators,
          loading: true,
          loaded: false
        }
      },
      getters: {
        committedDelegations: {
          [validators[0].operator_address]: 42
        },
        connected: true,
        lastHeader: { height: 20 },
        yourValidators: validators
      }
    }

    wrapper = shallowMount(TabValidators, {
      mocks: {
        $store,
        $apollo
      }
    })

    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`shows a message if there is nothing to display`, async () => {
    $store = {
      dispatch: jest.fn(),
      state: {
        session: {
          signedIn: true
        },
        delegates: {
          delegates: [],
          loading: false,
          loaded: true
        }
      },
      getters: {
        committedDelegations: {
          [validators[0].operator_address]: 42
        },
        connected: true,
        lastHeader: { height: 20 },
        yourValidators: validators
      }
    }

    wrapper = shallowMount(TabValidators, {
      mocks: {
        $store,
        $apollo
      }
    })

    expect(wrapper.vm.$el).toMatchSnapshot()
  })
})
