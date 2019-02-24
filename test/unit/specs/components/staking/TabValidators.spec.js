import { shallowMount } from "@vue/test-utils"
import TabValidators from "renderer/components/staking/TabValidators"

const delegates = [
  {
    operator_address: `cosmosvaladdr15ky9du8a2wlstz6fpx3p4mqpjyrm5ctqzh8yqw`,
    pub_key: `cosmosvalpub1234`,
    revoked: false,
    tokens: `14`,
    delegator_shares: `14`,
    description: {
      website: `www.monty.ca`,
      details: `Mr Mounty`,
      moniker: `mr_mounty`,
      country: `Canada`
    },
    status: 2,
    bond_height: `0`,
    bond_intra_tx_counter: 6,
    proposer_reward_pool: null,
    commission: {
      rate: `0`,
      max_rate: `0`,
      max_change_rate: `0`,
      update_time: `1970-01-01T00:00:00Z`
    },
    prev_bonded_shares: `0`
  },
  {
    operator_address: `cosmosvaladdr15ky9du8a2wlstz6fpx3p4mqpjyrm5ctplpn3au`,
    pub_key: `cosmosvalpub5678`,
    revoked: false,
    tokens: `0`,
    delegator_shares: `0`,
    description: {
      website: `www.greg.com`,
      details: `Good Guy Greg`,
      moniker: `good_greg`,
      country: `USA`
    },
    status: 2,
    bond_height: `0`,
    bond_intra_tx_counter: 6,
    proposer_reward_pool: null,
    commission: {
      rate: `0`,
      max_rate: `0`,
      max_change_rate: `0`,
      update_time: new Date(Date.now()).toISOString()
    },
    prev_bonded_shares: `0`
  },
  {
    operator_address: `cosmosvaladdr15ky9du8a2wlstz6fpx3p4mqpjyrm5ctgurrg7n`,
    pub_key: `cosmosvalpub8910`,
    tokens: `19`,
    delegator_shares: `19`,
    description: {
      details: `Herr Schmidt`,
      website: `www.schmidt.de`,
      moniker: `herr_schmidt_revoked`,
      country: `DE`
    },
    revoked: true,
    status: 2,
    bond_height: `0`,
    bond_intra_tx_counter: 6,
    proposer_reward_pool: null,
    commission: {
      rate: `0`,
      max_rate: `0`,
      max_change_rate: `0`,
      update_time: new Date(Date.now()).toISOString()
    },
    prev_bonded_shares: `0`
  }
]

describe(`TabValidators`, () => {
  let wrapper, $store

  const getters = {
    delegates: {
      delegates,
      loading: false,
      loaded: true
    },
    connected: true
  }

  beforeEach(async () => {
    $store = {
      getters
    }

    wrapper = shallowMount(TabValidators, {
      mocks: {
        $store
      }
    })
  })

  it(`has the expected html structure`, async () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`shows a message if still connecting`, async () => {
    $store = {
      getters: {
        delegates: {
          delegates,
          loading: false,
          loaded: false
        },
        connected: false
      }
    }

    wrapper = shallowMount(TabValidators, {
      mocks: {
        $store
      }
    })

    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`shows a message if still loading`, async () => {
    $store = {
      getters: {
        delegates: {
          delegates,
          loading: true,
          loaded: false
        },
        connected: true
      }
    }

    wrapper = shallowMount(TabValidators, {
      mocks: {
        $store
      }
    })
  })

  it(`shows a message if there is nothing to display`, async () => {
    $store = {
      getters: {
        delegates: {
          delegates: [],
          loading: false,
          loaded: true
        },
        connected: true
      }
    }

    wrapper = shallowMount(TabValidators, {
      mocks: {
        $store
      }
    })

    expect(wrapper.vm.$el).toMatchSnapshot()
  })
})
