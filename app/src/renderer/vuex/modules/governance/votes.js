import Vue from "vue"
import * as Sentry from "@sentry/browser"

export default ({ node }) => {
  const state = {
    loading: false,
    loaded: false,
    error: null,
    votes: {}
  }

  const mutations = {
    setProposalVotes(state, { proposalId, votes }) {
      Vue.set(state.votes, proposalId, votes)
    }
  }
  const actions = {
    async getProposalVotes({ state, commit, rootState }, proposalId) {
      state.loading = true

      if (!rootState.connection.connected) return

      try {
        const votes = await node.queryProposalVotes(proposalId)
        commit(`setProposalVotes`, { proposalId, votes })
        state.error = null
        state.loading = false
        state.loaded = true
      } catch (error) {
        commit(`notifyError`, {
          title: `Error fetching votes`,
          body: error.message
        })
        Sentry.captureException(error)
        state.error = error
      }
    },
    async submitVote(
      { rootState, dispatch },
      { proposal_id, option, password }
    ) {
      await dispatch(`sendTx`, {
        to: proposal_id,
        type: `submitProposalVote`,
        proposal_id,
        voter: rootState.wallet.address,
        option,
        password
      })
      await dispatch(`getProposalVotes`, proposal_id)
      await dispatch(`getProposal`, proposal_id)
    }
  }
  return {
    state,
    actions,
    mutations
  }
}
