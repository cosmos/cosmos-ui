import * as Sentry from "@sentry/browser"
import Vue from "vue"

export const setProposalTally = (commit, node) => async ({ value }) => {
  commit(`setProposal`, value)
  const final_tally_result =
    value.proposal_status === `VotingPeriod` ?
      await node.getProposalTally(value.proposal_id) :
      { ...value.final_tally_result }
  commit(`setProposalTally`, {
    proposal_id: value.proposal_id,
    final_tally_result
  })
}

export default ({ node }) => {
  const emptyState = {
    loading: false,
    loaded: false,
    error: null,
    proposals: {},
    tallies: {}
  }
  const state = JSON.parse(JSON.stringify(emptyState))
  const mutations = {
    setProposal(state, proposal) {
      Vue.set(state.proposals, proposal.proposal_id, proposal)
    },
    setProposalTally(state, { proposal_id, final_tally_result }) {
      Vue.set(state.tallies, proposal_id, final_tally_result)
    }
  }
  const actions = {
    async reconnected({ state, dispatch }) {
      if (state.loading) {
        await dispatch(`getProposals`)
      }
    },
    resetSessionData({ rootState }) {
      rootState.proposals = JSON.parse(JSON.stringify(emptyState))
    },
    async getProposals({ state, commit, rootState }) {
      state.loading = true
      if (!rootState.connection.connected) return

      try {
        const proposals = await node.getProposals()
        if (proposals.length > 0) {
          await Promise.all(
            proposals.map(setProposalTally(commit, node))
          )
        }
        state.error = null
        state.loading = false
        state.loaded = true
      } catch (error) {
        commit(`notifyError`, {
          title: `Error fetching proposals`,
          body: error.message
        })
        Sentry.captureException(error)
        state.error = error
      }
    },
    async getProposal({ state, commit }, proposal_id) {
      state.loading = true
      try {
        const proposal = await node.getProposal(proposal_id)
        setProposalTally(commit, node)(proposal)
        state.error = null
        state.loaded = true // TODO make state for single proposal
        state.loading = false
        return proposal
      } catch (error) {
        // This error currently will never be shown, we will end up in data-loading:
        // https://github.com/cosmos/voyager/issues/2099

        // commit(`notifyError`, {
        //   title: `Error querying proposal with id #${proposal_id}`,
        //   body: error.message
        // })
        Sentry.captureException(error)
        state.error = error
      }
      return undefined
    },
    async submitProposal(
      {
        rootState: { wallet },
        dispatch
      },
      { title, description, type, initial_deposit, password, submitType }
    ) {
      await dispatch(`sendTx`, {
        type: `postProposal`,
        proposer: wallet.address,
        proposal_type: type,
        title,
        description,
        initial_deposit,
        password,
        submitType
      })
      await dispatch(`getProposals`)
    }
  }
  return {
    state,
    actions,
    mutations
  }
}
