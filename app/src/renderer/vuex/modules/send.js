export default ({ node }) => {
  let lock = null

  let state = {
    nonce: 0
  }

  const mutations = {
    setNonce(state, nonce) {
      state.nonce = nonce
    }
  }

  async function doSend({ state, dispatch, commit, rootState }, args) {
    args.sequence = state.nonce
    args.name = rootState.user.account
    args.password = rootState.user.password
    args.account_number = rootState.wallet.accountNumber // TODO move into LCD?

    let chainId = rootState.node.lastHeader.chain_id
    args.chain_id = chainId
    // TODO enable again when IBC is enabled
    // args.src_chain_id = chainId // for IBC transfer

    // extract type
    let type = args.type || "send"
    delete args.type

    // extract "to" address
    let to = args.to
    delete args.to
    args.gas = "500000"

    // submit to LCD to build, sign, and broadcast
    let req = to ? node[type](to, args) : node[type](args)
    let res = await req.catch(err => {
      throw new Error(err.message)
    })

    // check response code
    assertOk(res)

    commit("setNonce", state.nonce + 1)

    // wait to ensure tx is committed before we query
    // XXX
    setTimeout(() => {
      dispatch("queryWalletState")
    }, 3 * 1000)
  }

  let actions = {
    // `lock` is a Promise which is set if we are in the process
    // of sending a transaction, so that we can ensure only one send
    // happens at once. otherwise, we might try to send 2 transactions
    // using the same sequence number, which means 1 of them won't be valid.
    async sendTx(...args) {
      // wait to acquire lock
      while (lock != null) {
        // eslint-disable-line no-unmodified-loop-condition
        await lock
      }

      try {
        // send and unlock when done
        lock = doSend(...args)
        // wait for doSend to finish
        let res = await lock
        return res
      } catch (err) {
        throw err
      } finally {
        // get rid of lock whether doSend throws or succeeds
        lock = null
      }
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
    return res.forEach(assertOk)
  }

  if (res.check_tx.code || res.deliver_tx.code) {
    let message = res.check_tx.log || res.deliver_tx.log
    throw new Error("Error sending transaction: " + message)
  }
}
