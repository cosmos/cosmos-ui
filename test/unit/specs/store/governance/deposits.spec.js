import depositsModule from "renderer/vuex/modules/governance/deposits.js"
import lcdClientMock from "renderer/connectors/lcdClientMock.js"
const { proposals, deposits } = lcdClientMock.state
const addresses = lcdClientMock.addresses

const mockRootState = {
  wallet: {
    address: addresses[0],
    balances: [{
      denom: `stake`,
      amount: 100
    }]
  },
  connection: {
    connected: true
  }
}

describe(`Module: Deposits`, () => {
  let module

  beforeEach(() => {
    module = depositsModule({ node: {} })
  })

  it(`adds deposits to state`, () => {
    const { mutations, state } = module
    mutations.setProposalDeposits(state, `1`, deposits)
    expect(state.deposits[`1`]).toEqual(deposits)
  })

  it(`fetches all deposits from a proposal`, async () => {
    module = depositsModule({
      node: {
        getProposalDeposits: proposalId => Promise.resolve(deposits[proposalId])
      }
    })
    const { actions, state } = module
    const commit = jest.fn()
    Object.keys(proposals).forEach(async (proposal_id, i) => {
      await actions.getProposalDeposits(
        { state, commit, rootState: mockRootState },
        proposal_id
      )
      expect(commit.mock.calls[i]).toEqual([
        `setProposalDeposits`,
        proposal_id,
        deposits[proposal_id]
      ])
    })
  })

  it(`submits a deposit to a proposal`, async () => {
    const { actions } = module
    jest.useFakeTimers()

    const dispatch = jest.fn()
    const commit = jest.fn()
    const amount = [
      {
        denom: `stake`,
        amount: `15`
      }
    ]

    const proposalIds = Object.keys(proposals)
    proposalIds.forEach(async (proposal_id, i) => {
      await actions.submitDeposit(
        { rootState: mockRootState, dispatch, commit },
        { proposal_id, amount }
      )

      expect(dispatch.mock.calls[i]).toEqual([
        `sendTx`,
        {
          type: `postProposalDeposit`,
          to: proposal_id,
          proposal_id,
          depositor: addresses[0],
          amount
        }
      ])

      jest.runAllTimers()
      expect(dispatch.mock.calls[i + proposalIds.length]).toEqual([
        `getProposalDeposits`,
        proposal_id
      ])
      expect(commit).toHaveBeenCalledWith(`updateWalletBalance`, {
        denom: `stake`,
        amount: 85
      })
    })
  })

  it(`should store an error if failed to load deposits`, async () => {
    module = depositsModule({
      node: {
        getProposalDeposits: () => Promise.reject(new Error(`Error`))
      }
    })
    const { actions, state } = module
    await actions.getProposalDeposits({
      state,
      rootState: mockRootState,
      commit: jest.fn()
    })
    expect(state.error.message).toBe(`Error`)
  })
})
