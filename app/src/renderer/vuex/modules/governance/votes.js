"use strict"

export default ({ node }) => {
  const state = {
    loading: false,
    error: null,
    votes: {}
  }

  const mutations = {
    setProposalVotes(state, proposalId, votes) {
      state.votes[proposalId] = votes
    }
  }
  let actions = {
    async getProposalVotes({ state, commit }, proposalId) {
      state.loading = true
      try {
        let votes = await node.queryProposalVotes(proposalId)
        commit(`setProposalVotes`, proposalId, votes)
        state.error = null
      } catch (err) {
        commit(`notifyError`, {
          title: `Error fetching votes`,
          body: err.message
        })
        state.error = err
      }
      state.loading = false
    },
    async submitVote({ rootState, dispatch }, { proposal_id, option }) {
      await dispatch(`sendTx`, {
        to: proposal_id,
        type: `submitProposalVote`,
        proposal_id,
        voter: rootState.wallet.address,
        option
      })
      await dispatch(`getProposalVotes`, proposal_id)
    }
  }
  return {
    state,
    actions,
    mutations
  }
}
