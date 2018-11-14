import votesModule from "renderer/vuex/modules/governance/votes.js"
import lcdClientMock from "renderer/connectors/lcdClientMock.js"
let { proposals, votes } = lcdClientMock.state
let addresses = lcdClientMock.addresses

describe(`Module: Votes`, () => {
  let module

  beforeEach(() => {
    module = votesModule({ node: {} })
  })

  it(`adds votes to state`, () => {
    let { mutations, state } = module
    mutations.setProposalVotes(state, proposals[0].proposal_id, votes)
    expect(state.votes[proposals[0].proposal_id]).toEqual(votes)
  })

  it(`fetches all votes from a proposal`, async () => {
    module = votesModule({
      node: {
        queryProposalVotes: proposalId => Promise.resolve(votes[proposalId])
      }
    })
    let { actions, state } = module
    let commit = jest.fn()
    proposals.forEach(async (proposal, i) => {
      let proposalID = proposal.proposal_id
      await actions.getProposalVotes({ state, commit }, proposalID)
      expect(commit.mock.calls[i]).toEqual([
        `setProposalVotes`,
        proposalID,
        votes[proposalID]
      ])
    })
  })

  it(`submits a vote on a proposal`, async () => {
    let { actions } = module
    jest.useFakeTimers()

    const rootState = {
      config: {
        bondingDenom: `stake`
      },
      wallet: {
        address: addresses[0]
      }
    }
    let dispatch = jest.fn()
    proposals.forEach(async (proposal, i) => {
      await actions.submitVote(
        { rootState, dispatch },
        proposal.proposal_id,
        `yes`
      )
      expect(dispatch.mock.calls[i]).toEqual([
        `sendTx`,
        {
          type: `submitProposalVote`,
          proposal_id: proposal.proposal_id,
          voter: addresses[0],
          option: `yes`
        }
      ])

      jest.runAllTimers()
      expect(dispatch.mock.calls[i + proposals.length]).toEqual([
        `getProposalVotes`,
        proposal.proposal_id
      ])
    })
  })
})
