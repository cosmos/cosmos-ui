import * as Sentry from "@sentry/browser"
import fs from "fs-extra"
import { join } from "path"
import { remote } from "electron"
import { sleep } from "scripts/common.js"
const root = remote.getGlobal(`root`)

export default ({ node }) => {
  const emptyState = {
    balances: [],
    loading: true,
    loaded: false,
    error: null,
    denoms: [],
    address: null,
    subscribedRPC: null
  }
  const state = JSON.parse(JSON.stringify(emptyState))

  const mutations = {
    setWalletBalances(state, balances) {
      state.balances = balances
      state.loading = false
    },
    setWalletAddress(state, address) {
      state.address = address
    },
    setAccountNumber(state, accountNumber) {
      state.accountNumber = accountNumber
    },
    setDenoms(state, denoms) {
      state.denoms = denoms
    }
  }

  const actions = {
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
        const res = await node.queryAccount(state.address)
        if (!res) {
          state.loading = false
          state.loaded = true
          return
        }
        state.error = null
        const coins = res.coins || []
        commit(`setNonce`, res.sequence)
        commit(`setAccountNumber`, res.account_number)
        commit(`setWalletBalances`, coins)
        for (const coin of coins) {
          if (
            coin.denom === rootState.stakingParameters.parameters.bond_denom
          ) {
            commit(`setAtoms`, parseFloat(coin.amount))
            break
          }
        }
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
    async loadDenoms({ commit, state }, maxIterations = 10) {
      // read genesis.json to get default denoms

      // wait for genesis.json to exist
      const genesisPath = join(root, `genesis.json`)

      // wait for the genesis and load it
      // at some point give up and throw an error
      while (maxIterations) {
        try {
          await fs.pathExists(genesisPath)
          break
        } catch (error) {
          console.log(`waiting for genesis`, error, genesisPath)
          maxIterations--
          await sleep(500)
        }
      }
      if (maxIterations === 0) {
        const error = new Error(`Couldn't load genesis at path ${genesisPath}`)
        Sentry.captureException(error)
        state.error = error
        return
      }

      const genesis = await fs.readJson(genesisPath)
      const denoms = []
      for (const account of genesis.app_state.accounts) {
        if (account.coins) {
          for (const { denom } of account.coins) {
            denoms.push(denom)
          }
        }
      }

      commit(`setDenoms`, denoms)
    },
    queryWalletStateAfterHeight({ rootState, dispatch }, height) {
      return new Promise(resolve => {
        // wait until height is >= `height`
        const interval = setInterval(() => {
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

      function onTx(error, event) {
        if (error) {
          Sentry.captureException(error)
          console.error(`error subscribing to transactions`, error)
          return
        }
        dispatch(
          `queryWalletStateAfterHeight`,
          event.data.value.TxResult.height + 1
        )
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
