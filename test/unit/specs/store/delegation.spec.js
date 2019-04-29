import lcdClientMock from "src/connectors/lcdClientMock.js"
import delegationModule from "src/vuex/modules/delegation.js"

const mockRootState = {
  connection: {
    connected: true
  },
  session: {
    address: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`,
    signedIn: true
  },
  stakingParameters: lcdClientMock.state.stakingParameters
}

describe(`Module: Delegations`, () => {
  let state, actions, mutations

  beforeEach(() => {
    const instance = delegationModule({ node: {} })
    state = instance.state
    actions = instance.actions
    mutations = instance.mutations
  })

  it(`adds delegate to cart`, () => {
    mutations.addToCart(state, { id: `foo`, x: 1 })
    expect(state.delegates[0]).toEqual({
      id: `foo`,
      delegate: { id: `foo`, x: 1 },
      atoms: 0
    })
    expect(state.delegates.length).toBe(1)
  })

  it(`does not add delegate to cart if already exists`, () => {
    mutations.addToCart(state, { id: `foo` })
    mutations.addToCart(state, { id: `foo`, x: 1 })
    expect(state.delegates[0].id).toBe(`foo`)
    expect(state.delegates[0].x).toBe(undefined)
    expect(state.delegates.length).toBe(1)
  })

  it(`removes delegate from cart`, () => {
    mutations.addToCart(state, { id: `foo` })
    mutations.addToCart(state, { id: `bar` })
    mutations.removeFromCart(state, `foo`)
    expect(state.delegates[0]).toEqual({
      id: `bar`,
      delegate: { id: `bar` },
      atoms: 0
    })
    expect(state.delegates.length).toBe(1)
  })

  it(`sets committed atoms for delegate`, () => {
    mutations.addToCart(state, { id: `foo` })
    mutations.setCommittedDelegation(state, { candidateId: `foo`, value: 123 })
    expect(state.committedDelegates).toEqual({ foo: 123 })
  })

  it(`sets committed atoms for delegate to 0`, () => {
    mutations.addToCart(state, { id: `foo` })
    mutations.setCommittedDelegation(state, { candidateId: `foo`, value: 123 })
    mutations.setCommittedDelegation(state, { candidateId: `foo`, value: 0 })
    expect(state.committedDelegates).toEqual({})
  })

  describe(`fetch delegation data`, () => {
    let node, commit
    beforeEach(async () => {
      node = {
        getDelegations: jest.fn(
          () =>
            lcdClientMock.state.stake[lcdClientMock.addresses[0]].delegations
        ),
        getUndelegations: jest.fn(() => [
          {
            validator_address: lcdClientMock.validators[0],
            entries: [
              {
                balance: `1`,
                completion_time: new Date(Date.now()).toUTCString()
              }
            ]
          }
        ]),
        getRedelegations: jest.fn(
          () =>
            lcdClientMock.state.stake[lcdClientMock.addresses[0]].redelegations
        )
      }
      const instance = delegationModule({
        node
      })
      state = instance.state
      actions = instance.actions
      mutations = instance.mutations
      commit = jest.fn()

      await actions.getBondedDelegates(
        {
          state,
          rootState: mockRootState,
          commit,
          dispatch: jest.fn()
        },
        lcdClientMock.state.candidates
      )
    })

    it(`fetches bonded delegates`, async () => {
      expect(node.getDelegations).toHaveBeenCalled()
      expect(commit).toHaveBeenCalledWith(`setCommittedDelegation`, {
        candidateId: `cosmosvaladdr15ky9du8a2wlstz6fpx3p4mqpjyrm5ctqzh8yqw`,
        value: 14
      })
      expect(commit).toHaveBeenCalledWith(
        `addToCart`,
        lcdClientMock.state.candidates[0]
      )
    })

    it(`fetches current undelegations`, async () => {
      expect(node.getUndelegations).toHaveBeenCalled()
      expect(commit).toHaveBeenCalledWith(`setUnbondingDelegations`, [
        {
          validator_address: lcdClientMock.validators[0],
          entries: [
            {
              balance: `1`,
              completion_time: new Date(Date.now()).toUTCString()
            }
          ]
        }
      ])
    })

    it(`should remove dead delegations and undelegations`, async () => {
      mutations.setCommittedDelegation(state, {
        candidateId: lcdClientMock.validators[2],
        value: 1
      })
      mutations.setUnbondingDelegations(state, [
        {
          validator_address: lcdClientMock.validators[2],
          entries: [
            {
              balance: 1
            }
          ]
        }
      ])
      expect(state.committedDelegates[lcdClientMock.validators[2]]).toBeTruthy()
      expect(
        state.unbondingDelegations[lcdClientMock.validators[2]]
      ).toBeTruthy()

      const commit = jest.fn()
      await actions.getBondedDelegates(
        {
          state,
          rootState: mockRootState,
          commit,
          dispatch: jest.fn()
        },
        lcdClientMock.state.candidates
      )

      expect(commit).toHaveBeenCalledWith(`setCommittedDelegation`, {
        candidateId: lcdClientMock.validators[2],
        value: 0
      })
      expect(commit).toHaveBeenCalledWith(`setUnbondingDelegations`, [
        {
          validator_address: lcdClientMock.validators[0],
          entries: [
            { balance: `1`, completion_time: `Thu, 01 Jan 1970 00:00:42 GMT` }
          ]
        }
      ])
    })
  })

  it(`should simulate a delegation transaction`, async () => {
    const validator_address = lcdClientMock.state.candidates[0].operator_address
    const amount = 10
    const dispatch = jest.fn(() => 123123)

    const res = await actions.simulateDelegation(
      {
        rootState: mockRootState,
        getters: {
          liquidAtoms: 1000
        },
        state,
        dispatch,
        commit: jest.fn()
      },
      { validator_address, amount }
    )

    expect(dispatch).toHaveBeenCalledWith(`simulateTx`, {
      type: `postDelegation`,
      to: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`,
      delegator_address: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`,
      validator_address,
      amount: {
        denom: `STAKE`,
        amount: `10`
      }
    })

    expect(res).toBe(123123)
  })

  it(`submits delegation transaction`, async () => {
    const validator_address = lcdClientMock.state.candidates[0].operator_address
    const amount = 10
    const gas = `1234567`
    const gas_prices = [{ denom: `uatom`, amount: `123` }]
    const password = ``
    const submitType = `ledger`

    const dispatch = jest.fn()

    await actions.submitDelegation(
      {
        rootState: mockRootState,
        getters: {
          liquidAtoms: 1000
        },
        state,
        dispatch,
        commit: jest.fn()
      },
      { validator_address, amount, gas, gas_prices, password, submitType }
    )

    expect(dispatch).toHaveBeenCalledWith(`sendTx`, {
      type: `postDelegation`,
      to: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`,
      delegator_address: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`,
      validator_address,
      gas,
      gas_prices,
      submitType,
      password,
      amount: {
        denom: `STAKE`,
        amount: `10`
      }
    })

    expect(dispatch).toHaveBeenCalledWith(`getAllTxs`)
  })

  it(`should simulate an undelegation transaction`, async () => {
    const validator = lcdClientMock.state.candidates[0]
    const amount = 10
    const dispatch = jest.fn(() => 123123)

    const res = await actions.simulateUnbondingDelegation(
      {
        rootState: mockRootState,
        state,
        dispatch
      },
      { validator, amount }
    )

    expect(dispatch).toHaveBeenCalledWith(`simulateTx`, {
      type: `postUnbondingDelegation`,
      to: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`,
      delegator_address: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`,
      validator_address: validator.operator_address,
      amount: {
        amount: `10`,
        denom: `STAKE`
      }
    })
    expect(res).toBe(123123)
  })

  it(`submits undelegation transaction`, async () => {
    const validator = lcdClientMock.state.candidates[0]
    const amount = 10
    const password = ``
    const submitType = `ledger`
    const dispatch = jest.fn()

    await actions.submitUnbondingDelegation(
      {
        rootState: mockRootState,
        state,
        dispatch
      },
      { validator, amount, password, submitType }
    )

    expect(dispatch).toHaveBeenCalledWith(`sendTx`, {
      type: `postUnbondingDelegation`,
      to: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`,
      delegator_address: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`,
      validator_address: validator.operator_address,
      amount: {
        amount: `10`,
        denom: `STAKE`
      },
      password,
      submitType
    })
    expect(dispatch).toHaveBeenCalledWith(`getAllTxs`)
  })

  it(`should simulate a redelegation transaction`, async () => {
    const validatorSrc = lcdClientMock.state.candidates[0]
    const validatorDst = lcdClientMock.state.candidates[1]
    const amount = 10
    const dispatch = jest.fn(() => 123123)

    const res = await actions.simulateRedelegation(
      {
        rootState: mockRootState,
        state,
        dispatch
      },
      { validatorSrc, validatorDst, amount }
    )

    expect(dispatch).toHaveBeenCalledWith(`simulateTx`, {
      type: `postRedelegation`,
      to: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`,
      delegator_address: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`,
      validator_src_address: validatorSrc.operator_address,
      validator_dst_address: validatorDst.operator_address,
      amount: {
        amount: `10`,
        denom: `STAKE`
      }
    })
    expect(res).toBe(123123)
  })
  it(`submits redelegation transaction`, async () => {
    const validatorSrc = lcdClientMock.state.candidates[0]
    const validatorDst = lcdClientMock.state.candidates[1]
    const amount = 10
    const password = ``
    const submitType = `ledger`
    const dispatch = jest.fn()

    await actions.submitRedelegation(
      {
        rootState: mockRootState,
        state,
        dispatch
      },
      { validatorSrc, validatorDst, amount, password, submitType }
    )

    expect(dispatch).toHaveBeenCalledWith(`sendTx`, {
      type: `postRedelegation`,
      to: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`,
      delegator_address: `cosmos15ky9du8a2wlstz6fpx3p4mqpjyrm5ctpesxxn9`,
      validator_src_address: validatorSrc.operator_address,
      validator_dst_address: validatorDst.operator_address,
      amount: {
        amount: `10`,
        denom: `STAKE`
      },
      password,
      submitType
    })
    expect(dispatch).toHaveBeenCalledWith(`getAllTxs`)
  })

  describe(`queries the delegated atoms on reconnection`, () => {
    it(`when the user has logged in and is loading`, async () => {
      const dispatch = jest.fn()
      await actions.reconnected({
        state: { loading: true },
        dispatch,
        rootState: { session: { signedIn: true } }
      })
      expect(dispatch).toHaveBeenCalledWith(`getBondedDelegates`)
    })

    it(`fails if delegations are not loading`, async () => {
      const dispatch = jest.fn()
      await actions.reconnected({
        state: { loading: false },
        dispatch,
        rootState: { session: { signedIn: true } }
      })
      expect(dispatch).not.toHaveBeenCalledWith(`getBondedDelegates`)
    })

    it(`fails if the user hasn't logged in`, async () => {
      const dispatch = jest.fn()
      await actions.reconnected({
        state: { loading: true },
        dispatch,
        rootState: { session: { signedIn: false } }
      })
      expect(dispatch).not.toHaveBeenCalledWith(`getBondedDelegates`)
    })
  })

  it(`updating delegations should not update another users state after signing out and in again`, async () => {
    jest.useFakeTimers()

    const node = {
      getDelegations: jest.fn(
        () => new Promise(resolve => setTimeout(() => resolve([]), 10000))
      ),
      getUndelegations: jest.fn(() => []),
      getRedelegations: jest.fn(() => [])
    }
    const instance = delegationModule({
      node
    })
    state = instance.state
    actions = instance.actions
    mutations = instance.mutations
    const commit = jest.fn()

    const rootState = JSON.parse(JSON.stringify(mockRootState))
    actions.getBondedDelegates(
      {
        state,
        rootState,
        commit,
        dispatch: jest.fn()
      },
      lcdClientMock.state.candidates
    )

    rootState.session.address = `other_address`

    jest.runAllTimers()

    expect(commit).not.toHaveBeenCalled()
  })

  it(`should store a undelegation`, async () => {
    mutations.setUnbondingDelegations(state, [
      {
        validator_address: lcdClientMock.validators[0],
        entries: [
          {
            balance: `100`,
            creation_height: `12`,
            completion_time: new Date().toUTCString()
          }
        ]
      }
    ])

    expect(state.unbondingDelegations[lcdClientMock.validators[0]]).toEqual([
      {
        balance: `100`,
        creation_height: `12`,
        completion_time: new Date().toUTCString()
      }
    ])
  })

  it(`should update the atoms on a delegation optimistically`, async () => {
    const commit = jest.fn()
    const delegates = lcdClientMock.state.candidates
    const stakingTransactions = {}
    stakingTransactions.delegations = [
      {
        validator: delegates[0],
        atoms: 109
      },
      {
        validator: delegates[1],
        atoms: 456
      }
    ]
    const committedDelegates = {
      [delegates[0].operator_address]: 10
    }

    await actions.submitDelegation(
      {
        rootState: mockRootState,
        state: {
          committedDelegates
        },
        getters: {
          liquidAtoms: 1000
        },
        dispatch: () => {},
        commit
      },
      {
        amount: `100`,
        validator_address: delegates[0].operator_address,
        password: `12345`
      }
    )
    expect(commit).toHaveBeenCalledWith(`updateWalletBalance`, {
      denom: `STAKE`,
      amount: 900
    })
    expect(commit).toHaveBeenCalledWith(`setCommittedDelegation`, {
      candidateId: delegates[0].operator_address,
      value: 110
    })
  })

  it(`should update delegates after delegation`, async () => {
    jest.useFakeTimers()
    const stakingTransactions = {}
    stakingTransactions.unbondings = [
      {
        validator: {
          operator_address: lcdClientMock.validators[0],
          delegator_shares: `100`,
          tokens: `100`
        },
        balance: {
          amount: `100`
        }
      }
    ]

    const dispatch = jest.fn()
    await actions.submitDelegation(
      {
        rootState: mockRootState,
        getters: {
          liquidAtoms: 1000
        },
        state,
        dispatch,
        commit: jest.fn()
      },
      { stakingTransactions }
    )
    jest.runAllTimers()
    expect(dispatch).toHaveBeenCalledWith(`updateDelegates`)
    expect(dispatch).toHaveBeenCalledWith(`getAllTxs`)
  })

  it(`should store an error if failed to load delegations`, async () => {
    const node = lcdClientMock
    const { state, actions } = delegationModule({ node })
    jest
      .spyOn(node, `getDelegations`)
      .mockImplementationOnce(async () => Promise.reject(`Error`))
    await actions.getBondedDelegates({
      state,
      rootState: mockRootState,
      commit: jest.fn(),
      dispatch: jest.fn()
    })
    expect(state.error).toBe(`Error`)
  })

  it(`should store an error if failed to load undelegations`, async () => {
    const node = lcdClientMock
    const { state, actions } = delegationModule({ node })
    jest
      .spyOn(node, `getUndelegations`)
      .mockImplementationOnce(async () => Promise.reject(`Error`))
    await actions.getBondedDelegates({
      state,
      rootState: mockRootState,
      commit: jest.fn(),
      dispatch: jest.fn()
    })
    expect(state.error).toBe(`Error`)
  })

  it(`should store an error if failed to load redelegations`, async () => {
    const node = lcdClientMock
    const { state, actions } = delegationModule({ node })
    jest
      .spyOn(node, `getRedelegations`)
      .mockImplementationOnce(async () => Promise.reject(`Error`))
    await actions.getBondedDelegates({
      state,
      rootState: mockRootState,
      commit: jest.fn(),
      dispatch: jest.fn()
    })
    expect(state.error).toBe(`Error`)
  })

  it(`should load delegates and delegations if signed in`, async () => {
    const node = lcdClientMock
    const { actions } = delegationModule({ node })

    const dispatch = jest.fn(() => [])

    await actions.updateDelegates({
      dispatch,
      rootState: {
        session: {
          signedIn: true
        }
      }
    })

    expect(dispatch).toHaveBeenCalledWith(`getDelegates`)
    expect(dispatch).toHaveBeenCalledWith(`getBondedDelegates`, [])
  })

  it(`should load delegations on sign in`, async () => {
    const { actions } = delegationModule({ node: {} })

    const dispatch = jest.fn(() => [])

    await actions.initializeWallet({ dispatch })

    expect(dispatch).toHaveBeenCalledWith(`updateDelegates`)
  })
})
