describe(`RPC Connector`, () => {
  let connector = {}

  function newConnector() {
    jest.resetModules()
    const RpcWrapper = require(`renderer/connectors/rpcWrapper`)

    connector = {}
    const newRpcClient = RpcWrapper(connector)

    Object.assign(connector, newRpcClient)
  }

  beforeEach(() => {
    jest.mock(`tendermint`, () => () => ({
      on() {},
      removeAllListeners() {},
      ws: { destroy() {} }
    }))
    jest.mock(`electron`, () => ({ ipcRenderer: { send: () => jest.fn() } }))

    newConnector()
  })

  it(`should init the rpc connection`, () => {
    connector.rpcConnect(`localhost`)
    expect(connector.rpc).toBeDefined()
    expect(connector.rpcInfo.connected).toBe(true)
  })

  it(`should remember if it could not connect via rpc`, () => {
    jest.mock(`tendermint`, () => () => ({
      on(value, cb) {
        if (value === `error`) {
          cb({ code: `ECONNREFUSED` })
        }
      }
    }))
    newConnector()
    connector.rpcConnect(`localhost`)
    expect(connector.rpc).toBeDefined()
    expect(connector.rpcInfo.connected).toBe(false)
  })

  it(`should not react to error codes not meaning connection failed`, () => {
    jest.mock(`tendermint`, () => () => ({
      on(value, cb) {
        if (value === `error`) {
          cb({ code: `ABCD` })
        }
      }
    }))
    connector.rpcConnect(`localhost`)
    expect(connector.rpc).toBeDefined()
    expect(connector.rpcInfo.connected).toBe(true)
  })

  it(`should cleanup the old websocket when connecting again`, () => {
    connector.rpcConnect(`localhost`)

    const spyListeners = jest.spyOn(connector.rpc, `removeAllListeners`)
    const spyDestroy = jest.spyOn(connector.rpc.ws, `destroy`)

    connector.rpcConnect(`localhost`)

    expect(spyListeners).toHaveBeenCalledWith(`error`)
    expect(spyDestroy).toHaveBeenCalled()
  })

  describe(`reconnect`, () => {
    beforeEach(() => {
      jest.mock(`tendermint`, () => () => ({
        on() {},
        removeAllListeners() {},
        ws: { destroy() {} }
      }))
    })

    it(`should signal a reconnect intent to the main thread`, async () => {
      const { ipcRenderer } = require(`electron`)
      ipcRenderer.send = jest.fn()
      connector.rpcReconnect()
      expect(ipcRenderer.send).toHaveBeenCalledWith(`reconnect`)
    })

    it(`should not reconnect again if already reconnecting`, async () => {
      const { ipcRenderer } = require(`electron`)
      ipcRenderer.send = jest.fn()
      connector.rpcReconnect()
      connector.rpcReconnect()
      expect(ipcRenderer.send).toHaveBeenCalledTimes(1)
    })
  })
})
