import {
  sign,
  createBroadcastBody,
  createSignedTx
} from "../../scripts/wallet.js"
import { getKey } from "../../scripts/keystore"

export default ({ node }) => {
  let state = {
    lock: null,
    nonce: `0`
  }

  const mutations = {
    setNonce(state, nonce) {
      // we may query an account state that still has a nonce older then the one we locally have
      // this is because the nonce only updates after txs where incorporated in a block
      if (state.nonce < nonce) state.nonce = nonce
    }
  }

  let actions = {
    // `lock` is a Promise which is set if we are in the process
    // of sending a transaction, so that we can ensure only one send
    // happens at once. otherwise, we might try to send 2 transactions
    // using the same sequence number, which means 1 of them won't be valid.
    async queueTx({ dispatch, state }, args) {
      // wait to acquire lock
      while (state.lock != null) {
        // eslint-disable-line no-unmodified-loop-condition
        await state.lock
      }

      try {
        // send and unlock when done
        state.lock = dispatch(`sendTx`, args)
        // wait for sendTx to finish
        let res = await state.lock
        return res
      } catch (error) {
        throw error
      } finally {
        // get rid of lock whether doSend throws or succeeds
        state.lock = null
      }
    },
    resetSessionData({ state }) {
      state.nonce = `0`
    },
    async sendTx({ state, dispatch, commit, rootState }, args) {
      if (!rootState.connection.connected) {
        throw Error(
          `Currently not connected to a secure node. Please try again when Voyager has secured a connection.`
        )
      }

      await dispatch(`queryWalletBalances`) // the nonce was getting out of sync, this is to force a sync

      let requestMetaData = {
        sequence: state.nonce,
        name: `anonymous`,
        // name: rootState.user.account,
        // password: args.password,
        from: rootState.wallet.address,
        account_number: rootState.wallet.accountNumber, // TODO move into LCD?
        chain_id: rootState.connection.lastHeader.chain_id,
        gas: `50000000`,
        generate_only: true
      }
      args.base_req = requestMetaData

      // extract type
      let type = args.type || `send`
      delete args.type

      // extract "to" address
      let to = args.to
      delete args.to

      // submit to LCD to build, sign, and broadcast
      let req = to ? node[type](to, args) : node[type](args)

      let generationRes = await req.catch(err => {
        let message
        // TODO: get rid of this logic once the appended message is actually included inside the object message
        if (!err.response.data.message) {
          let idxColon = err.response.data.indexOf(`:`)
          let indexOpenBracket = err.response.data.indexOf(`{`)
          if (idxColon < indexOpenBracket) {
            // e.g => Msg 0 failed: {"codespace":4,"code":102,"abci_code":262246,"message":"existing unbonding delegation found"}
            message = JSON.parse(err.response.data.substr(idxColon + 1)).message
          } else {
            message = err.response.data
          }
        } else {
          message = err.response.data.message
        }
        throw new Error(message)
      })

      const wallet = getKey(rootState.user.account, args.password)
      delete args.password

      const tx = generationRes.value
      const signature = sign(tx, wallet, requestMetaData)
      const signedTx = createSignedTx(tx, signature)
      const body = createBroadcastBody(signedTx)

      const res = await node.postTx(body)

      // check response code
      assertOk(res)

      commit(`setNonce`, (parseInt(state.nonce) + 1).toString())
    }
  }

  return {
    state,
    mutations,
    actions
  }
}

function assertOk(res) {
  if (Array.isArray(res)) {
    if (res.length === 0) throw new Error(`Error sending transaction`)

    return res.forEach(assertOk)
  }

  if (res.check_tx.code || res.deliver_tx.code) {
    let message = res.check_tx.log || res.deliver_tx.log
    throw new Error(message)
  }
}
