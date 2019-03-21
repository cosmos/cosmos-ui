import { shallowMount } from "@vue/test-utils"
import TabMyDelegations from "renderer/components/staking/TabMyDelegations"
import validators from "../../store/json/validators.js"
import { stakingTxs } from "../../store/json/txs"

// TODO: remove this dirty addition: the real cleanup will be done in a separate PR
// the problem is mock VS real implementation have different keys: shares in mock, shares_amount in SDK
// const unbondingTransactions = lcdClientMock.state.txs.slice(5).map(t => {
//   t.tx.value.msg[0].value.shares_amount = t.tx.value.msg[0].value.shares
//   return t
// })

describe(`Component: TabMyDelegations`, () => {

  const getters = {
    transactions: {
      staking: []
    },
    delegates: {
      delegates: validators
    },
    delegation: {
      unbondingDelegations: {
      },
      loaded: true
    },
    committedDelegations: {
    },
    connected: true,
    bondDenom: `uatom`,
    session: { signedIn: true },
    lastHeader: { height: `20` }
  }

  describe(`view`, () => {
    let wrapper, $store

    beforeEach(() => {
      $store = {
        commit: jest.fn(),
        dispatch: jest.fn(),
        getters: JSON.parse(JSON.stringify(getters)) // clone so we don't overwrite by accident
      }

      wrapper = shallowMount(TabMyDelegations, {
        mocks: {
          $store,
          $route: {
            path: `/staking/my-delegations`
          }
        },
        stubs: [`router-link`]
      })
    })

    it(`should show committed validators`, () => {
      $store.getters.committedDelegations = {
        [validators[0].operator_address]: 42
      }

      expect(wrapper.vm.$el).toMatchSnapshot()
    })

    it(`should show unbonding validators and the current committed validator`, () => {
      wrapper.setData({
        time: {
          // get unbonding time for an unbonding tx
          getUnbondingTime: jest.fn(() => Date.now() + 10000)
        }
      })
      $store.getters.delegation.unbondingDelegations = {
        [validators[1].operator_address]: {
          creation_height: `170`,
          min_time: new Date(Date.now()).toISOString()
        }
      }
      $store.getters.transactions.staking = [stakingTxs[3]]

      expect(wrapper.html()).toContain(`Pending Undelegations`)
      expect(wrapper.vm.$el).toMatchSnapshot()
    })

    it(`should show a message if not staked yet to any validator`, () => {
      $store.getters.committedDelegations = {}

      expect(wrapper.html()).toContain(`No Active Delegations`)
      expect(wrapper.vm.$el).toMatchSnapshot()
    })

    it(`should show a message if not still connecting to a node`, () => {
      $store.getters.connected = false

      expect(wrapper.exists(`tm-data-connecting`)).toBe(true)
    })

    it(`should show a message if not still loading delegations`, () => {
      $store.getters.delegation.loading = true

      expect(wrapper.exists(`tm-data-loading`)).toBe(true)
    })

    it(`should show a message if not signed in`, () => {
      $store.getters.session.signedIn = false

      expect(wrapper.exists(`card-sign-in-required`)).toBe(true)
    })
  })

  describe(`computed`, () => {
    it(`unbondingTransactions`, async () => {
      const address = validators[0].operator_address
      const transactions = [stakingTxs[3]]

      expect(
        TabMyDelegations.computed.unbondingTransactions({
          delegation: {
            unbondingDelegations: {
              [address]: {
                creation_height: `170`,
                min_time: new Date().toISOString()
              }
            }
          },
          transactions: {
            staking: transactions
          }
        })
      ).toHaveLength(1)
    })

    describe(`yourValidators`, () => {
      it(`should return validators if signed in`, () => {
        expect(
          TabMyDelegations.computed.yourValidators({
            committedDelegations: {
              [validators[0].operator_address]: 1,
              [validators[2].operator_address]: 2
            },
            delegates: { delegates: validators },
            session: { signedIn: true }
          })
        ).toEqual([validators[0], validators[2]])
      })

      it(`should return false if not signed in`, () => {
        expect(
          TabMyDelegations.computed.yourValidators({
            committedDelegations: {
              [validators[0].operator_address]: 1,
              [validators[2].operator_address]: 2
            },
            delegates: { delegates: validators },
            session: { signedIn: false }
          })
        ).toBe(false)
      })
    })

    describe(`update rewards on new blocks`, () => {
      describe(`shouldn't update`, () => {
        it(`if hasn't waited for 20 blocks `, () => {
          const $store = { dispatch: jest.fn() }
          const yourValidators = [{}]
          const newHeader = { height: `30` }
          TabMyDelegations.watch.lastHeader.handler.call(
            { $store, yourValidators },
            newHeader)
          expect($store.dispatch).not.toHaveBeenCalledWith(
            `getRewardsFromAllValidators`,
            yourValidators
          )
        })

        it(`if user doesn't have any delegations `, () => {
          const $store = { dispatch: jest.fn() }
          const yourValidators = []
          const newHeader = { height: `40` }
          TabMyDelegations.watch.lastHeader.handler.call(
            { $store, yourValidators },
            newHeader)
          expect($store.dispatch).not.toHaveBeenCalledWith(
            `getRewardsFromAllValidators`,
            yourValidators
          )
        })

        describe(`should update rewards `, () => {
          it(`if has waited for 20 blocks and has delegations`, () => {
            const $store = { dispatch: jest.fn() }
            const yourValidators = [{}]
            const newHeader = { height: `40` }
            TabMyDelegations.watch.lastHeader.handler.call(
              { $store, yourValidators },
              newHeader)
            expect($store.dispatch).toHaveBeenCalledWith(
              `getRewardsFromAllValidators`,
              yourValidators
            )
          })
        })
      })
    })
  })
})
