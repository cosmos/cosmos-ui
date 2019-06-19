import * as Sentry from "@sentry/browser"
import Vue from "vue"
import { coinsToObject } from "scripts/common.js"
import { throttle } from "scripts/blocks-throttle"

export default ({ node }) => {
  const emptyState = {
    loading: false,
    loaded: false,
    error: null,
    /* totalRewards use the following format:
        {
            denom1: amount1,
            ... ,
            denomN: amountN
        }
    */
    totalRewards: {},
    /* rewards use the following format:
        {
            validatorAddr1: {
                denom1: amount1,
                ... ,
                denomN: amountN
            },
            ... ,
            validatorAddrN: {
                denom1: amount1,
                ... ,
                denomN: amountN
            }
        }
    */
    rewards: {},
    parameters: {},
    /* outstandingRewards use the following format:
        {
            denom1: amount1,
            ... ,
            denomN: amountN
        }
    */
    outstandingRewards: {}
  }
  const state = JSON.parse(JSON.stringify(emptyState))
  const distributionsThrottle = throttle("distributions")(20)

  const mutations = {
    setTotalRewards(state, rewards) {
      state.totalRewards = rewards
    },
    setDelegationRewards(state, { validatorAddr, rewards }) {
      Vue.set(state.rewards, validatorAddr, rewards)
    },
    setDistributionParameters(state, parameters) {
      state.parameters = parameters
    },
    setOutstandingRewards(state, outstandingRewards) {
      state.outstandingRewards = outstandingRewards
    },
    setDistributionError(state, error) {
      state.error = error
    }
  }
  const actions = {
    async reconnected({ rootState, state, dispatch }) {
      if (state.loading && rootState.session.signedIn) {
        await dispatch(`getTotalRewards`)
      }
    },
    resetSessionData({ rootState }) {
      rootState.distribution = JSON.parse(JSON.stringify(emptyState))
    },
    async getTotalRewards({ state, rootState: { session }, commit }) {
      if (!session.address) return

      state.loading = true
      try {
        const rewardsArray = await node.get.delegatorRewards(session.address)
        const rewards = coinsToObject(rewardsArray)
        commit(`setTotalRewards`, rewards || {})
        commit(`setDistributionError`, null)
        state.loaded = true
      } catch (error) {
        Sentry.captureException(error)
        commit(`setDistributionError`, error)
      }
    },
    async postMsgWithdrawDelegationReward({ dispatch }) {
      await dispatch(`getTotalRewards`)
      await dispatch(`queryWalletBalances`)
      await dispatch(`getAllTxs`)
    },
    async getRewardsFromMyValidators(
      {
        state,
        dispatch,
        getters: { lastHeader, yourValidators }
      },
      force = false
    ) {
      await distributionsThrottle(
        state,
        Number(lastHeader.height),
        async () => {
          state.loading = true
          await Promise.all(
            yourValidators.map(validator =>
              dispatch(`getRewardsFromValidator`, validator.operator_address)
            )
          )
          state.loading = false
          state.loaded = true
        },
        force
      )
    },
    async getRewardsFromValidator(
      {
        state,
        rootState: { session },
        getters: { bondDenom },
        commit
      },
      validatorAddr
    ) {
      state.loading = true
      try {
        const rewardsArray = await node.get.delegatorRewardsFromValidator(
          session.address,
          validatorAddr
        )
        const rewards = coinsToObject(rewardsArray)

        // if the delegator has 0 rewards for a validator after a withdraw, this is trimmed
        // to properly differentiate between 0 rewards and no delegation,
        // we set the rewards to a 0 value on validators we know the delegator has bond with
        rewards[bondDenom] = rewards[bondDenom] || 0

        commit(`setDelegationRewards`, { validatorAddr, rewards })
        commit(`setDistributionError`, null)
        state.loaded = true
      } catch (error) {
        Sentry.captureException(error)
        commit(`setDistributionError`, error)
      }
      state.loading = false
    },
    // TODO: move to a common parameters module
    async getDistributionParameters({ commit }) {
      state.loading = true
      try {
        const parameters = await node.get.distributionParameters()
        commit(`setDistributionParameters`, parameters)
        commit(`setDistributionError`, null)
        state.loaded = true
      } catch (error) {
        Sentry.captureException(error)
        commit(`setDistributionError`, error)
      }
      state.loading = false
    },
    async getOutstandingRewards({ commit }) {
      state.loading = true
      try {
        const oustandingRewardsArray = await node.get.distributionOutstandingRewards()
        const oustandingRewards = coinsToObject(oustandingRewardsArray)
        commit(`setOutstandingRewards`, oustandingRewards)
        commit(`setDistributionError`, null)
        state.loaded = true
      } catch (error) {
        Sentry.captureException(error)
        commit(`setDistributionError`, error)
      }
      state.loading = false
    }
  }

  return {
    state,
    mutations,
    actions
  }
}
