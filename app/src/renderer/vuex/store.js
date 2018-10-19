"use strict"

import Vue from "vue"
import Vuex from "vuex"
import CryptoJS from "crypto-js"
import _ from "lodash"
import * as getters from "./getters"
import modules from "./modules"
import Raven from "raven-js"

Vue.use(Vuex)

export default (opts = {}) => {
  opts.commit = (...args) => store.commit(...args)
  opts.dispatch = (...args) => store.dispatch(...args)
  var store = new Vuex.Store({
    getters,
    // strict: true,
    modules: modules(opts),
    actions: {
      loadPersistedState
    }
  })

  let pending = null
  store.subscribe((mutation, state) => {
    // since persisting the state is costly we should only do it on mutations that change the data
    const updatingMutations = [
      `setWalletBalances`,
      `setWalletHistory`,
      `setCommittedDelegation`,
      `setUnbondingDelegations`,
      `setDelegates`,
      `setProposal`,
      `setProposalDeposits`,
      `setProposalVotes`,
      `setKeybaseIdentities`
    ]

    if (updatingMutations.indexOf(mutation.type) === -1) return

    // if the user is logged in cache the balances and the tx-history for that user
    if (!state.user.account || !state.user.password) return

    if (pending) {
      clearTimeout(pending)
    }
    pending = setTimeout(() => {
      persistState(state)
    }, 5000)
  })

  return store
}

function persistState(state) {
  try {
    const encryptedState = CryptoJS.AES.encrypt(
      JSON.stringify({
        transactions: {
          wallet: state.transactions.wallet,
          staking: state.transactions.staking
        },
        wallet: {
          balances: state.wallet.balances
        },
        delegation: {
          loadedOnce: state.delegation.loadedOnce,
          committedDelegates: state.delegation.committedDelegates,
          unbondingDelegations: state.delegation.unbondingDelegations
        },
        delegates: {
          delegates: state.delegates.delegates
        },
        keybase: {
          identities: state.keybase.identities
        },
        proposals: state.proposals,
        deposits: state.deposits,
        votes: state.votes
      }),
      state.user.password
    )
    // Store the state object as a JSON string
    localStorage.setItem(getStorageKey(state), encryptedState)
  } catch (err) {
    console.error(`Encrypting the state failed, removing cached state.`)
    Raven.captureException(err)
    // if encrypting the state fails, we cleanup
    localStorage.removeItem(getStorageKey(state))
  }
}

function getStorageKey(state) {
  const chainId = state.node.lastHeader.chain_id
  const address = state.user.address
  return `store_${chainId}_${address}`
}

function loadPersistedState({ state, commit }, { password }) {
  const cachedState = localStorage.getItem(getStorageKey(state))
  if (cachedState) {
    const bytes = CryptoJS.AES.decrypt(cachedState, password)
    const plaintext = bytes.toString(CryptoJS.enc.Utf8)

    // Replace the state object with the stored state
    let oldState = JSON.parse(plaintext)
    _.merge(state, oldState, {
      // set loading indicators to false
      transactions: {
        loading: false
      },
      wallet: {
        balancesLoading: false
      },
      delegates: {
        loading: false
      },
      proposals: {
        loading: false
      }
    })
    this.replaceState(state)

    // add all delegates the user has bond with already to the cart
    state.delegates.delegates
      .filter(d => state.delegation.committedDelegates[d.operator_address])
      .forEach(d => {
        commit(`addToCart`, d)
      })
  }
}
