import * as Sentry from "@sentry/browser"
import Vue from "vue"
import BigNumber from "bignumber.js"

export const setProposalTally = (commit, node) => async proposal => {
  commit(`setProposal`, proposal)
  const final_tally_result =
    proposal.proposal_status === `VotingPeriod`
      ? await node.get.proposalTally(proposal.proposal_id)
      : { ...proposal.final_tally_result }
  commit(`setProposalTally`, {
    proposal_id: proposal.proposal_id,
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
        const proposals = await node.get.proposals()
        if (proposals.length > 0) {
          await Promise.all(proposals.map(setProposalTally(commit, node)))
        }

        state.error = null
        state.loaded = true
        state.loading = false
      } catch (error) {
        Sentry.captureException(error)
        state.error = error
      }
    },
    async getProposal({ state, commit }, proposal_id) {
      state.loading = true
      try {
        const proposal = await node.get.proposal(proposal_id)
        setProposalTally(commit, node)(proposal)
        state.error = null
        state.loaded = true
        state.loading = false
        return proposal
      } catch (error) {
        Sentry.captureException(error)
        state.error = error
      }
      return undefined
    },
    async simulateProposal(
      { dispatch },
      { title, description, type, initial_deposit }
    ) {
      return await dispatch(`simulateTx`, {
        type: `MsgSubmitProposal`,
        txArguments: {
          proposalType: type,
          title,
          description,
          initialDeposits: initial_deposit
        }
      })
    },
    async submitProposal(
      {
        state,
        rootState: { wallet },
        dispatch,
        commit
      },
      {
        type,
        title,
        description,
        gas,
        gas_prices,
        initial_deposit,
        password,
        submitType
      }
    ) {
      await dispatch(`sendTx`, {
        type: `MsgSubmitProposal`,
        txArguments: {
          proposalType: type,
          title,
          description,
          initialDeposits: initial_deposit
        },
        gas,
        gas_prices,
        password,
        submitType
      })

      // optimistic updates
      initial_deposit.forEach(({ amount, denom }) => {
        const oldBalance = wallet.balances.find(
          balance => balance.denom === denom
        )
        commit(`updateWalletBalance`, {
          denom,
          amount: BigNumber(oldBalance.amount)
            .minus(amount)
            .toNumber()
        })
      })

      const latestId = Object.keys(state.proposals).reduce((latest, id) => {
        return latest > Number(id) ? latest : Number(id)
      }, 0)
      commit(`setProposal`, {
        proposal_id: String(latestId + 1),
        proposal_content: {
          value: {
            title,
            description
          }
        },
        initial_deposit
      })

      await dispatch(`getProposals`)
      await dispatch(`getAllTxs`)
    }
  }
  return {
    state,
    actions,
    mutations
  }
}
