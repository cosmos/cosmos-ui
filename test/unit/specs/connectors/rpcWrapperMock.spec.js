describe(`RPC Wrapper Mock`, () => {
  const node = {}
  let wrapper

  beforeEach(() => {
    jest.resetModules()
    const mockedRpcWrapper = require(`renderer/connectors/rpcWrapperMock.js`)
    wrapper = mockedRpcWrapper(node)
    wrapper.rpcConnect(`localhost`)
  })

  it(`outputs validators`, done => {
    node.rpc.validators((error, data) => {
      expect(error).toBeNull()
      expect(data.validators).toBeDefined()
      done()
    })
  })

  it(`outputs a block`, done => {
    const height = 5
    node.rpc.block({ height: height, maxHeight: height }, (error, data) => {
      expect(error).toBeNull()
      expect(data.block).toBeDefined()
      done()
    })
  })

  it(`outputs a block header`, done => {
    const height = 5
    node.rpc.blockchain(
      { minHeight: height, maxHeight: height },
      (error, data) => {
        expect(error).toBeNull()
        expect(data.block_metas).toBeDefined()
        done()
      }
    )
  })

  it(`outputs a status`, done => {
    node.rpc.status((error, data) => {
      expect(error).toBeNull()
      expect(data.sync_info.latest_block_height).toBeDefined()
      done()
    })
  })

  it(`receives a stream of blocks`, done => {
    const blocks = []
    node.rpc.subscribe({ query: `tm.event = 'NewBlock'` }, (error, data) => {
      expect(error).toBeNull()
      expect(data.data.value.block).toBeDefined()
      blocks.push(data.data.value.block)
      if (blocks.length === 2) {
        done()
      }
    })
  })

  it(`receives a stream of block headers`, done => {
    const headers = []
    node.rpc.subscribe(
      { query: `tm.event = 'NewBlockHeader'` },
      (error, data) => {
        expect(error).toBeNull()
        expect(data.data.value.header).toBeDefined()
        headers.push(data.data.value.header)
        if (headers.length === 2) {
          done()
        }
      }
    )
  })
})
