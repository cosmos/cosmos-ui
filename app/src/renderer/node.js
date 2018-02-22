'use strict'
const RpcClient = require('tendermint')
const RestClient = require('cosmos-sdk')

module.exports = function (nodeIP, relayPort, lcdPort) {
  const RELAY_SERVER = 'http://localhost:' + relayPort

  let node = new RestClient(RELAY_SERVER)

  Object.assign(node, {
    nodeIP,
    relayPort,
    lcdPort,
    lcdConnected: () => node.listKeys()
      .then(() => true, () => false),

    // RPC
    rpcConnecting: false,
    rpcOpen: true,
    initRPC (nodeIP) {
      if (node.rpc) {
        console.log('removing old websocket')

        // ignore disconnect error
        node.rpc.removeAllListeners('error')
        node.rpc.on('error', () => {})

        node.rpc.ws.destroy()
      }

      console.log('init rpc with', nodeIP)
      let newRpc = new RpcClient(`ws://${nodeIP}`)
      node.rpcOpen = true
      // we need to check immediately if he connection fails. later we will not be able to check this error
      newRpc.on('error', err => {
        console.log('rpc error', err)
        if (err.code === 'ECONNREFUSED' || err.code === 'ENETUNREACH') {
          node.rpcOpen = false
        }
      })

      node.rpc = newRpc
    },
    rpcReconnect: async (alreadyConnecting = node.rpcConnecting) => {
      if (alreadyConnecting) return null
      node.rpcConnecting = true

      console.log('trying to reconnect')

      let nodeIP = await fetch(RELAY_SERVER + '/reconnect').then(res => res.text())
      console.log('Reconnected to', nodeIP)
      if (nodeIP) {
        node.initRPC(nodeIP)
      } else {
        // try again in 3s
        await sleep(3000)
        return node.rpcReconnect(false)
      }

      node.rpcConnecting = false
      return nodeIP
    }
  })
  // TODO: eventually, get all data from light-client connection instead of RPC

  node.initRPC(nodeIP)
  return node
}

function sleep (ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
