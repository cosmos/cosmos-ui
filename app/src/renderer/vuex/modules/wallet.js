import * as Sentry from "@sentry/browser"
import Vue from "vue"
const config = require(`../../../config.json`)

export default ({ node }) => {
  let emptyState = {
    balances: [],
    loading: true,
    loaded: false,
    error: null,
    denoms: [],
    address: null,
    subscribedRPC: null
  }
  let state = JSON.parse(JSON.stringify(emptyState))

  let mutations = {
    setWalletBalances(state, balances) {
      Vue.set(state, `balances`, balances)
      Vue.set(state, `loading`, false)
    },
    updateWalletBalance(state, balance) {
      const findBalanceIndex = state.balances.findIndex(
        ({ denom }) => balance.denom === denom
      )
      if (findBalanceIndex === -1) {
        state.balances.push(balance)
        return
      }
      Vue.set(state.balances, findBalanceIndex, balance)
    },
    setWalletAddress(state, address) {
      Vue.set(state, `address`, address)
    },
    setAccountNumber(state, accountNumber) {
      Vue.set(state, `accountNumber`, accountNumber)
    },
    setDenoms(state, denoms) {
      Vue.set(state, `denoms`, denoms)
    }
  }

  let actions = {
    reconnected({ state, dispatch }) {
      if (state.loading && state.address) {
        dispatch(`queryWalletBalances`)
      }
    },
    initializeWallet({ commit, dispatch }, address) {
      commit(`setWalletAddress`, address)
      dispatch(`queryWalletBalances`)
      dispatch(`loadDenoms`)
      dispatch(`walletSubscribe`)
    },
    resetSessionData({ rootState }) {
      // clear previous account state
      rootState.wallet = JSON.parse(JSON.stringify(emptyState))
    },
    async queryWalletBalances({ state, rootState, commit }) {
      if (!state.address) return

      state.loading = true
      if (!rootState.connection.connected) return

      try {
        let res = await node.queryAccount(state.address)
        if (!res) {
          state.loading = false
          state.loaded = true
          return
        }
        state.error = null
        let coins = res.coins || []
        commit(`setNonce`, res.sequence)
        commit(`setAccountNumber`, res.account_number)
        commit(`setWalletBalances`, coins)
        state.loading = false
        state.loaded = true
      } catch (error) {
        commit(`notifyError`, {
          title: `Error fetching balances`,
          body: error.message
        })
        Sentry.captureException(error)
        state.error = error
      }
    },
    async sendCoins(
      { dispatch, commit, state },
      { receiver, amount, denom, password }
    ) {
      await dispatch(`sendTx`, {
        type: `send`,
        password,
        to: receiver,
        amount: [{ denom, amount: amount.toString() }]
      })

      const oldBalance = state.balances.find(balance => balance.denom === denom)
      commit(`updateWalletBalance`, {
        denom,
        amount: oldBalance.amount - amount
      })
    },
    async loadDenoms({ commit }) {
      commit(`setDenoms`, config.denoms)
    },
    queryWalletStateAfterHeight({ rootState, dispatch }, height) {
      return new Promise(resolve => {
        // wait until height is >= `height`
        let interval = setInterval(() => {
          if (rootState.connection.lastHeader.height < height) return
          clearInterval(interval)
          dispatch(`queryWalletBalances`)
          dispatch(`getBondedDelegates`)
          resolve()
        }, 1000)
      })
    },
    walletSubscribe({ state, dispatch }) {
      if (!state.address) return
      // check if we already subscribed to this rpc object
      // we need to resubscribe on rpc reconnections
      if (state.subscribedRPC === node.rpc) return

      state.subscribedRPC = node.rpc

      function onTx(data) {
        dispatch(`queryWalletStateAfterHeight`, data.TxResult.height + 1)
      }

      const queries = [
        `tm.event = 'Tx' AND sender = '${state.address}'`,
        `tm.event = 'Tx' AND recipient = '${state.address}'`,
        `tm.event = 'Tx' AND proposer = '${state.address}'`,
        `tm.event = 'Tx' AND depositor = '${state.address}'`,
        `tm.event = 'Tx' AND delegator = '${state.address}'`,
        `tm.event = 'Tx' AND voter = '${state.address}'`
      ]

      queries.forEach(query => {
        node.rpc.subscribe(
          {
            query
          },
          onTx
        )
      })
    }
  }

  return {
    state,
    mutations,
    actions
  }
}
