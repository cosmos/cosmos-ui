import * as Sentry from "@sentry/browser"
import { coinsToObject } from "scripts/common.js"

export default ({ node }) => {
  const emptyState = {
    validators: [],
    loading: false,
    loaded: false,
    error: null,
    validatorHash: null,
    /* validatorInfo use the following format:
            { 
                self_bond_rewards: { 
                    denom1: amount1,
                    ... ,
                    denomN: amountN 
                },
                val_commission: { 
                    denom1: amount1,
                    ... ,
                    denomN: amountN 
                },
                rewards: { 
                    denom1: amount1,
                    ... ,
                    denomN: amountN 
                } 
            } 
        */
    distributionInfo: {}
  }
  const state = JSON.parse(JSON.stringify(emptyState))

  const mutations = {
    setValidators(state, validators) {
      state.validators = validators
    },
    setValidatorHash(state, validatorHash) {
      state.validatorHash = validatorHash
    },
    setValidatorDistributionInfo(state, info) {
      state.distributionInfo = info
    }
  }

  const actions = {
    reconnected({ state, dispatch }) {
      if (state.loading) {
        dispatch(`getValidators`)
      }
    },
    resetSessionData({ rootState }) {
      // clear previous account state
      rootState.validators = JSON.parse(JSON.stringify(emptyState))
    },
    // TODO: rename to getValidatorSet
    async getValidators({ state, commit, rootState }) {
      state.loading = true

      if (!rootState.connection.connected) return

      try {
        const validators = (await node.getValidatorSet()).validators
        state.error = null
        state.loading = false
        state.loaded = true
        commit(`setValidators`, validators)
      } catch (error) {
        commit(`notifyError`, {
          title: `Error fetching validator set`,
          body: error.message
        })
        Sentry.captureException(error)
        state.error = error
      }
    },
    async maybeUpdateValidators({ state, commit, dispatch }, header) {
      const validatorHash = header.validators_hash
      if (validatorHash === state.validatorHash) return
      commit(`setValidatorHash`, validatorHash)
      await dispatch(`getValidators`)
    },
    async getValidatorDistributionInfoAndRewards({ commit }, validatorAddr) {
      state.loading = true
      try {
        let { self_bond_rewards, val_commission } = await node.getValidatorDistributionInformation(validatorAddr)
        const rewardsArray = await node.getValidatorRewards(validatorAddr)

        const rewards = coinsToObject(rewardsArray)
        self_bond_rewards = coinsToObject(self_bond_rewards)
        val_commission = coinsToObject(val_commission)

        commit(`setValidatorDistributionInfo`, { self_bond_rewards, val_commission, rewards })
        state.error = null
      } catch (error) {
        commit(`notifyError`, {
          title: `Error querying distribution parameters`,
          body: error.message
        })
        Sentry.captureException(error)
        state.error = error
      }
      state.loading = false
      state.loaded = true
    },
  }

  return {
    state,
    mutations,
    actions
  }
}
