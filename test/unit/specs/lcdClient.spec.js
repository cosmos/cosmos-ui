let axios = require(`axios`)
let LcdClient = require(`renderer/connectors/lcdClient.js`)
let lcdClientMock = require(`renderer/connectors/lcdClientMock.js`)

describe(`LCD Client`, () => {
  let client = LcdClient()

  it(`makes a GET request with no args`, async () => {
    axios.get = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve({ data: { foo: `bar` } }))

    let res = await client.keys.values()
    expect(res).toEqual({ foo: `bar` })
    expect(axios.get.mock.calls[0]).toEqual([
      `http://localhost:8998/keys`,
      undefined
    ])
  })

  it(`makes a GET request with one arg`, async () => {
    axios.get = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve({ data: { foo: `bar` } }))

    let res = await client.keys.get(`myKey`)
    expect(res).toEqual({ foo: `bar` })
    expect(axios.get.mock.calls[0]).toEqual([
      `http://localhost:8998/keys/myKey`,
      undefined
    ])
  })

  it(`makes a POST request`, async () => {
    axios.post = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve({ data: { foo: `bar` } }))

    let res = await client.keys.add()
    expect(res).toEqual({ foo: `bar` })
    expect(axios.post.mock.calls[0]).toEqual([
      `http://localhost:8998/keys`,
      undefined
    ])
  })

  it(`makes a POST request with args and data`, async () => {
    axios.put = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve({ data: { foo: `bar` } }))

    let res = await client.keys.set(`myKey`, { abc: 123 })
    expect(res).toEqual({ foo: `bar` })
    expect(axios.put.mock.calls[0]).toEqual([
      `http://localhost:8998/keys/myKey`,
      { abc: 123 }
    ])
  })

  it(`makes a GET request with an error`, async () => {
    axios.get = jest.fn().mockReturnValueOnce(
      Promise.reject({
        response: {
          data: `foo`
        }
      })
    )

    try {
      await await client.keys.values()
    } catch (err) {
      expect(err.message).toBe(`foo`)
    }
    expect(axios.get.mock.calls[0]).toEqual([
      `http://localhost:8998/keys`,
      undefined
    ])
  })

  it(`delete requests have the correct format for data`, async () => {
    axios.delete = (path, config) => {
      expect(config).toEqual({ data: { password: `abc` } })
      return Promise.resolve({ data: { foo: `bar` } })
    }

    await client.keys.delete(`test`, { password: `abc` })
  })

  it(`does not throw error for empty results`, async () => {
    axios.get = jest.fn().mockReturnValueOnce(
      Promise.reject({
        response: {
          data: `account bytes are empty`
        }
      })
    )
    let res = await client.queryAccount(`address`)
    expect(res).toBe(null)
  })

  it(`queries for shares for a validator and delegate`, async () => {
    axios.get = jest.fn().mockReturnValueOnce(
      Promise.resolve({
        response: {
          data: {
            shares: 5
          }
        }
      })
    )
    await client.queryDelegation(`abc`, `efg`)
    expect(axios.get.mock.calls[0]).toEqual([
      `http://localhost:8998/stake/delegators/abc/delegations/efg`,
      undefined
    ])
  })

  it(`does not throw error for empty results`, async () => {
    axios.get = jest.fn().mockReturnValueOnce(
      Promise.reject({
        response: {
          data: `account bytes are empty`
        }
      })
    )
    let res = await client.queryAccount(`address`)
    expect(res).toBe(null)
  })

  it(`throws error for error other than empty account`, async () => {
    axios.get = jest.fn().mockReturnValueOnce(
      Promise.reject({
        response: {
          data: `something failed`
        }
      })
    )
    try {
      await client.queryAccount(`address`)
    } catch (err) {
      expect(err.message).toBe(`something failed`)
    }
  })

  it(`checks for the connection with the lcd by performing a simple request`, async () => {
    client.keys.values = () => Promise.resolve()
    expect(await client.lcdConnected()).toBeTruthy()

    client.keys.values = () => Promise.reject()
    expect(await client.lcdConnected()).toBeFalsy()
  })

  it(`queries for indexed transactions`, async () => {
    let axios = require(`axios`)
    axios.get = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve({ data: [] }))
      .mockReturnValueOnce(Promise.resolve({ data: [`abc`] }))
    let result = await client.txs(`abc`)

    expect(axios.get).toHaveBeenCalledTimes(2)
    client.keys.values = () => Promise.resolve()
    expect(result).toEqual([`abc`])
  })

  it(`queries for a delegation summary for a delegator`, async () => {
    axios.get = jest.fn().mockReturnValue({})
    await client.getDelegator(`abc`)
    expect(axios.get.mock.calls[0]).toEqual([
      `http://localhost:8998/stake/delegators/abc`,
      undefined
    ])
  })

  it(`queries for a delegation txs`, async () => {
    axios.get = jest
      .fn()
      .mockReturnValue(Promise.resolve({ data: lcdClientMock.txs }))
    await client.getDelegatorTxs(`abc`)
    await client.getDelegatorTxs(`abc`, [`bonding`])
    await client.getDelegatorTxs(`abc`, [`unbonding`])
    await client.getDelegatorTxs(`abc`, [`redelegate`])
    expect(axios.get.mock.calls).toEqual([
      [`http://localhost:8998/stake/delegators/abc/txs`, undefined],
      [
        `http://localhost:8998/stake/delegators/abc/txs?type=bonding`,
        undefined
      ],
      [
        `http://localhost:8998/stake/delegators/abc/txs?type=unbonding`,
        undefined
      ],
      [
        `http://localhost:8998/stake/delegators/abc/txs?type=redelegate`,
        undefined
      ]
    ])
  })

  it(`queries for undelegations between a delegator and a validator`, async () => {
    axios.get = jest.fn().mockReturnValue({})
    await client.queryUnbonding(`abc`, `def`)
    expect(axios.get.mock.calls[0]).toEqual([
      `http://localhost:8998/stake/delegators/abc/unbonding_delegations/def`,
      undefined
    ])
  })

  it(`queries for a validator`, async () => {
    axios.get = jest.fn().mockReturnValue({})
    await client.getCandidate(`abc`)
    expect(axios.get.mock.calls[0]).toEqual([
      `http://localhost:8998/stake/validators/abc`,
      undefined
    ])
  })

  it(`queries for staking parameters`, async () => {
    axios.get = jest.fn().mockReturnValue({})
    await client.getParameters()
    expect(axios.get.mock.calls[0]).toEqual([
      `http://localhost:8998/stake/parameters`,
      undefined
    ])
  })

  it(`queries for staking pool`, async () => {
    axios.get = jest.fn().mockReturnValue({})
    await client.getPool()
    expect(axios.get.mock.calls[0]).toEqual([
      `http://localhost:8998/stake/pool`,
      undefined
    ])
  })

  it(`queries a validator signing information`, async () => {
    axios.get = jest.fn().mockReturnValue({})
    await client.queryValidatorSigningInfo(`pubKey`)
    expect(axios.get.mock.calls[0]).toEqual([
      `http://localhost:8998/slashing/signing_info/pubKey`,
      undefined
    ])
  })
})
