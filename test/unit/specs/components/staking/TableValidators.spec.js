import { shallowMount } from "@vue/test-utils"
import TableValidators from "renderer/components/staking/TableValidators"
import validators from "../../store/json/validators.js"

describe(`TableValidators`, () => {
  let wrapper, $store

  const getters = {
    committedDelegations: {
      [validators[0].operator_address]: 10
    },
    session: {
      address: `address1234`,
      signedIn: true
    },
    distribution: {
      loaded: true,
      rewards: {
        cosmosvaladdr15ky9du8a2wlstz6fpx3p4mqpjyrm5ctqzh8yqw: {
          stake: 1000
        }
      }
    },
    bondDenom: `stake`,
    keybase: { [validators[0].description.identity]: `keybase` },
    pool: {
      pool: {
        bonded_tokens: 500001,
      }
    },
  }

  beforeEach(() => {
    $store = {
      commit: jest.fn(),
      dispatch: jest.fn(),
      getters: JSON.parse(JSON.stringify(getters)) // clone so we don't overwrite by accident
    }

    wrapper = shallowMount(TableValidators, {
      mocks: {
        $store
      },
      propsData: { validators }
    })
    wrapper.setData({ rollingWindow: 10000 })
  })

  it(`has the expected html structure`, async () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`should create an enriched validator object for a signed in user`, () => {
    expect(wrapper.vm.enrichedValidators[0].small_moniker).toBe(`mr_mounty`)
    expect(wrapper.vm.enrichedValidators[0].percent_of_vote)
      .toBe(0.27999944000112)
    expect(wrapper.vm.enrichedValidators[0].my_delegations).toBe(10)
    expect(wrapper.vm.enrichedValidators[0].commission).toBe(0)
    expect(wrapper.vm.enrichedValidators[0].keybase).toBe(`keybase`)
    expect(wrapper.vm.enrichedValidators[0].rewards).toBe(1000)
    expect(wrapper.vm.enrichedValidators[0].uptime).toBe(0.9998)
  })

  it(`should create an enriched validator object for a user who is not signed in`, () => {
    wrapper.vm.session.signedIn = false
    expect(wrapper.vm.enrichedValidators[1].my_delegations).toBe(0)
    expect(wrapper.vm.enrichedValidators[1].rewards).toBe(0)
  })

  it(`should have an uptime of 0 if no signing_info`, () => {
    expect(wrapper.vm.enrichedValidators[1].uptime).toBe(0)
  })

  it(`should sort the delegates by selected property`, () => {
    wrapper.vm.sort.property = `operator_address`
    wrapper.vm.sort.order = `desc`

    expect(
      wrapper.vm.sortedEnrichedValidators.map(x => x.operator_address)
    ).toEqual(validators.map(x => x.operator_address))

    wrapper.vm.sort.property = `operator_address`
    wrapper.vm.sort.order = `asc`

    expect(
      wrapper.vm.sortedEnrichedValidators.map(x => x.operator_address)
    ).toEqual(validators.map(x => x.operator_address).reverse())
  })

  it(`queries delegations on signin`, () => {
    const session = { address: `cosmos1address` }
    const $store = { dispatch: jest.fn() }
    TableValidators.watch.address.call({ $store, session })
    expect($store.dispatch).toHaveBeenCalledWith(`updateDelegates`)
  })

  it(`doesn't query delegations if not signed in`, () => {
    const session = { address: undefined }
    const $store = { dispatch: jest.fn() }
    TableValidators.watch.address.call({ $store, session })
    expect($store.dispatch).not.toHaveBeenCalledWith(`updateDelegates`)
  })

  it(`should filter the validators for your delegations`, () => {
    const session = { signedIn: true }
    expect(
      TableValidators.computed.yourValidators({
        committedDelegations: {
          [validators[0].operator_address]: 1,
          [validators[2].operator_address]: 2
        },
        validators,
        session
      })
    ).toEqual([validators[0], validators[2]])
  })

  it(`should not filter the validators if you're not signed in`, () => {
    const session = { signedIn: false }
    expect(
      TableValidators.computed.yourValidators({
        committedDelegations: {
          [validators[0].operator_address]: 1,
          [validators[2].operator_address]: 2
        },
        validators,
        session
      })
    ).not.toBeDefined()
  })
})
