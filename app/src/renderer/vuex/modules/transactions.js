import { uniqBy } from "lodash"
import * as Sentry from "@sentry/browser"
import Vue from "vue"

export default ({ node }) => {
  const emptyState = {
    loading: false,
    loaded: false,
    error: null,
    bank: [], // {height, result: { gas, tags }, tx: { type, value: { fee: { amount: [{denom, amount}], gas}, msg: {type, inputs, outputs}}, signatures} }}
    staking: [],
    governance: [],
    distribution: []
  }

  const
    TypeBank = `bank`,
    TypeStaking = `staking`,
    TypeGovernance = `governance`,
    TypeDistribution = `distribution`

  const state = JSON.parse(JSON.stringify(emptyState))

  const mutations = {
    setBankTxs(state, txs) {
      state.bank = state.bank.concat(txs)
    },
    setStakingTxs(state, txs) {
      state.staking = state.staking.concat(txs)
    },
    setGovernanceTxs(state, txs) {
      state.governance = state.governance.concat(txs)
    },
    setDistributionTxs(state, txs) {
      state.distribution = state.distribution.concat(txs)
    },
    setHistoryLoading(state, loading) {
      Vue.set(state, `loading`, loading)
    }
  }

  const actions = {
    resetSessionData({ rootState }) {
      // clear previous account state
      rootState.transactions = JSON.parse(JSON.stringify(emptyState))
    },
    async reconnected({ state, dispatch, rootState }) {
      // TODO: remove signedIn check when we support the option for setting a custom address for txs page
      if (state.loading && rootState.session.signedIn) {
        await dispatch(`getAllTxs`)
      }
    },
    async getAllTxs({ commit, dispatch, state, rootState }) {
      try {
        commit(`setHistoryLoading`, true)

        if (!rootState.connection.connected) return

        const bankTxs = await dispatch(`getTx`, TypeBank)
        if (bankTxs.length > state.bank.length) {
          let newBankTxs = uniqBy(
            bankTxs.concat(state.bank),
            `txhash`
          )
          newBankTxs = await dispatch(`enrichTransactions`, {
            transactions: newBankTxs,
            txType: TypeBank
          })
          commit(`setBankTxs`, newBankTxs)
        }

        const stakingTxs = await dispatch(`getTx`, TypeStaking)
        if (stakingTxs.length > state.staking.length) {
          let newStakingTxs = uniqBy(
            stakingTxs.concat(state.staking),
            `txhash`
          )
          newStakingTxs = await dispatch(`enrichTransactions`, {
            transactions: newStakingTxs,
            txType: TypeStaking
          })
          commit(`setStakingTxs`, newStakingTxs)
        }

        const governanceTxs = await dispatch(`getTx`, TypeGovernance)
        if (governanceTxs.length > state.governance.length) {
          let newGovernanceTxs = uniqBy(
            governanceTxs.concat(state.governance),
            `txhash`
          )
          newGovernanceTxs = await dispatch(`enrichTransactions`, {
            transactions: newGovernanceTxs,
            txType: TypeGovernance
          })
          commit(`setGovernanceTxs`, newGovernanceTxs)
        }

        const distributionTxs = await dispatch(`getTx`, TypeDistribution)
        if (distributionTxs.length > state.distribution.length) {
          let newDistributionTxs = uniqBy(
            distributionTxs.concat(state.distribution),
            `txhash`
          )
          newDistributionTxs = await dispatch(`enrichTransactions`, {
            transactions: newDistributionTxs,
            txType: TypeDistribution
          })
          commit(`setDistributionTxs`, newDistributionTxs)
        }

        state.error = null
        commit(`setHistoryLoading`, false)
        state.loaded = true
      } catch (error) {
        Sentry.captureException(error)
        state.error = error
      }
    },
    async getTx({ rootState: { session: { address } } }, type) {
      let response
      const validatorAddress = address.replace(`cosmos`, `cosmosvaloper`)
      switch (type) {
        case TypeBank:
          response = await node.txs(address)
          break
        case TypeStaking:
          response = await node.getStakingTxs(address, validatorAddress)
          break
        case TypeGovernance:
          response = await node.getGovernanceTxs(address)
          break
        case TypeDistribution:
          response = await node.getDistributionTxs(address, validatorAddress)
          break
        default:
          throw new Error(`Unknown transaction type: ${type}`)
      }
      if (!response) {
        return []
      }
      return response
    },
    async enrichTransactions({ dispatch }, { transactions, txType }) {
      const enrichedTransactions = await Promise.all(
        transactions.map(async tx => {
          const blockMetaInfo = await dispatch(`queryBlockInfo`, tx.height)
          const enrichedTx = Object.assign({}, tx, {
            type: txType,
            time: new Date(blockMetaInfo.header.time).toISOString()
          })
          return enrichedTx
        })
      )
      return enrichedTransactions
    }
  }

  return {
    state,
    mutations,
    actions
  }
}
