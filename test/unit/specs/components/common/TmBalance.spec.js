import { shallowMount } from "@vue/test-utils"
import TmBalance from "common/TmBalance"

describe(`TmBalance`, () => {
  let wrapper, $store

  beforeEach(async () => {
    $store = {
      getters: {
        connected: true,
        session: {
          address: `cosmos1address`,
          signedIn: true
        },
        liquidAtoms: 1230000000,
        totalAtoms: 3210000000,
        bondDenom: `stake`,
        distribution: {
          loaded: true,
          totalRewards: {
            stake: 1000450000000
          }
        },
        delegation: {
          loaded: true
        },
        wallet: {
          loaded: true
        },
        lastHeader: { height: `10` }
      },
      dispatch: jest.fn()
    }

    wrapper = shallowMount(TmBalance, {
      mocks: {
        $store
      },
      methods: {
        update: () => {}
      }
    })
  })

  it(`has the expected html structure before adding props`, () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`displays unbonded tokens`, () => {
    expect(wrapper.vm.unbondedAtoms).toBe(`1,230`)
  })

  it(`displays neither total tokens nor unbonded tokens if not completely loaded`, () => {
    wrapper.vm.wallet.loaded = false
    wrapper.vm.distribution.loaded = false
    expect(wrapper.vm.totalAtomsDisplay).toBe(`--`)
    expect(wrapper.vm.unbondedAtoms).toBe(`--`)
  })

  it(`should not display rewards if not loaded`, () => {
    wrapper.vm.distribution.loaded = false
    expect(wrapper.vm.rewards).toBe(`--`)
  })

  it(`gets user rewards`, () => {
    expect(wrapper.vm.rewards).toBe(`1,000,450`)
  })

  it(`shows 0 if user doesn't have rewards`, () => {
    wrapper.vm.$store.getters.distribution.totalRewards = {}
    expect(wrapper.vm.rewards).toBe(`0`)
  })

  it(`opens withdraw modal`, () => {
    const $refs = { modalWithdrawAllRewards: { open: jest.fn() } }
    TmBalance.methods.onWithdrawal.call({ $refs })
    expect($refs.modalWithdrawAllRewards.open).toHaveBeenCalled()
  })

  describe(`update balance and total rewards on new blocks`, () => {
    describe(`shouldn't update`, () => {
      it(`if user is not signed in `, () => {
        const $store = { dispatch: jest.fn() }
        const session = { signedIn: false }
        const newHeader = { height: `10` }
        const update = jest.fn()
        TmBalance.watch.lastHeader.handler.call(
          { session, $store, lastUpdate: 0, update },
          newHeader
        )
        expect(update).not.toHaveBeenCalledWith()
      })

      it(`if hasn't waited for 10 blocks `, () => {
        const $store = { dispatch: jest.fn() }
        const session = { signedIn: true }
        const newHeader = { height: `12` }
        const update = jest.fn()
        TmBalance.watch.lastHeader.handler.call(
          { session, $store, lastUpdate: 0, update },
          newHeader
        )
        expect(update).not.toHaveBeenCalledWith()
      })
    })

    describe(`should update balance and rewards `, () => {
      it(`if user is signed in initially`, () => {
        const session = { signedIn: true }
        const newHeader = { height: `10` }
        const update = jest.fn()
        TmBalance.watch.lastHeader.handler.call(
          { session, lastUpdate: 0, update },
          newHeader
        )
        expect(update).toHaveBeenCalledWith(10)
      })

      it(`if user is signed in and wait for 10 blocks`, () => {
        const session = { signedIn: true }
        const newHeader = { height: `20` }
        const update = jest.fn()
        TmBalance.watch.lastHeader.handler.call(
          { session, lastUpdate: 15, update },
          newHeader
        )
        expect(update).not.toHaveBeenCalled()
        TmBalance.watch.lastHeader.handler.call(
          { session, lastUpdate: 5, update },
          newHeader
        )
        expect(update).toHaveBeenCalledWith(20)
      })

      it(`triggers an update`, () => {
        const $store = { dispatch: jest.fn() }
        const self = {
          $store,
          lastUpdate: 0
        }
        TmBalance.methods.update.call(self, 10)
        expect($store.dispatch).toHaveBeenCalledWith(`getTotalRewards`)
        expect($store.dispatch).toHaveBeenCalledWith(`queryWalletBalances`)
        expect(self.lastUpdate).toBe(10)
      })
    })
  })
})
