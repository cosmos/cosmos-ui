import sendModule from "modules/send.js"
import lcdClientMock from "renderer/connectors/lcdClientMock.js"

jest.mock(`renderer/scripts/keystore.js`, () => ({
  getKey: () => ({
    cosmosAddress: `cosmos1r5v5srda7xfth3hn2s26txvrcrntldjumt8mhl`,
    privateKey: `8088c2ed2149c34f6d6533b774da4e1692eb5cb426fdbaef6898eeda489630b7`,
    publicKey: `02ba66a84cf7839af172a13e7fc9f5e7008cb8bca1585f8f3bafb3039eda3c1fdd`
  })
}))

jest.mock(`src/config.json`, () => ({
  default_gas: 42
}))

jest.mock(`renderer/scripts/wallet.js`, () => ({
  sign: jest.fn(() => []),
  createBroadcastBody: jest.fn(() => ({
    broadcast: `body`
  })),
  createSignedTx: jest.fn(() => {}),
  createSignMessage: jest.fn(() => {})
}))

const mockRootState = {
  user: { account: `default` },
  wallet: {
    accountNumber: `12`,
    address: `cosmos1demo`
  },
  connection: {
    connected: true,
    lastHeader: {
      chain_id: `mock-chain`
    }
  },
  ledger: { isConnected: false }
}

describe(`Module: Send`, () => {
  let module, state, actions, mutations, node

  const errMsgWithObject = {
    response: {
      data: `Msg 0 failed: {"codespace":4,"code":102,"abci_code":262246,"message":"existing unbonding delegation found"}`
    }
  }

  const errObject = {
    response: {
      data: {
        codespace: 4,
        code: 102,
        abci_code: 262246,
        message: `invalid sequence`
      }
    }
  }

  const errMsgNoObject = {
    response: {
      data: `unexpected error`
    }
  }

  beforeEach(() => {
    node = {
      send: jest.fn(() =>
        Promise.resolve({
          msg: {}
        })
      ),
      postTx: jest.fn(() =>
        Promise.resolve({
          check_tx: { code: 0 },
          deliver_tx: { code: 0 }
        })
      )
    }
    module = sendModule({
      node
    })
    state = module.state
    actions = module.actions
    mutations = module.mutations
  })

  // MUTATIONS

  it(`should set wallet nonce`, () => {
    const nonce = 959
    mutations.setNonce(state, nonce)
    expect(state.nonce).toBe(nonce)
  })

  it(`should prevent from downgrading a wallet nonce`, () => {
    state.nonce = 959
    mutations.setNonce(state, 1)
    expect(state.nonce).toBe(959)
  })

  // ACTIONS

  it(`should reset the nonce if session was changed`, () => {
    state.nonce = 959
    actions.resetSessionData({ state })
    expect(state.nonce).toBe(`0`)
  })

  describe(`send transactions`, () => {
    describe(`succeeds`, () => {
      describe(`signing with local keystore`, () => {
        it(`should send`, async () => {
          const args = {
            type: `send`,
            password: `1234567890`,
            amount: [{ denom: `mycoin`, amount: 123 }],
            submitType: `local`
          }
          await actions.sendTx(
            {
              state,
              dispatch: jest.fn(),
              commit: jest.fn(),
              rootState: mockRootState
            },
            args
          )
          expect(node.send).toHaveBeenCalledWith({
            amount: [{ amount: 123, denom: `mycoin` }],
            password: `1234567890`,
            base_req: {
              account_number: `12`,
              chain_id: `mock-chain`,
              from: `cosmos1demo`,
              gas: `42`,
              generate_only: true,
              sequence: `0`
            }
          })
          expect(node.postTx).toHaveBeenCalledWith({
            broadcast: `body`
          })
        })

        it(`should send using a to parameter`, async () => {
          const args = {
            type: `send`,
            to: `mock_address`,
            password: `1234567890`,
            amount: [{ denom: `mycoin`, amount: 123 }],
            submitType: `local`
          }
          await actions.sendTx(
            {
              state,
              dispatch: jest.fn(),
              commit: jest.fn(),
              rootState: mockRootState
            },
            args
          )
          expect(node.send).toHaveBeenCalledWith(`mock_address`, {
            amount: [{ amount: 123, denom: `mycoin` }],
            password: `1234567890`,
            base_req: {
              account_number: `12`,
              chain_id: `mock-chain`,
              from: `cosmos1demo`,
              gas: `42`,
              generate_only: true,
              sequence: `0`
            }
          })
          expect(node.postTx).toHaveBeenCalledWith({
            broadcast: `body`
          })
        })
      })

      describe(`signing with Ledger Nano S`, () => {
        xit(`should send`, async () => {
          const args = {
            type: `send`,
            password: `1234567890`,
            amount: [{ denom: `mycoin`, amount: 123 }],
            submitType: `ledger`
          }

          await actions.sendTx(
            {
              state,
              dispatch: jest.fn(),
              commit: jest.fn(),
              rootState: { ...mockRootState, ledger: { isConnected: true } }
            },
            args
          )
          expect(node.send).toHaveBeenCalledWith({
            amount: [{ amount: 123, denom: `mycoin` }],
            password: `1234567890`,
            base_req: {
              account_number: `12`,
              chain_id: `mock-chain`,
              from: `cosmos1demo`,
              gas: `42`,
              generate_only: true,
              sequence: `0`
            }
          })
          expect(node.postTx).toHaveBeenCalledWith({
            broadcast: `body`
          })
        })
      })
    })

    describe(`fails`, () => {
      it(`if the data has an object in message`, async () => {
        node.updateDelegations = jest.fn(() =>
          Promise.reject(errMsgWithObject.response.data)
        )
        const args = {
          type: `updateDelegations`,
          to: lcdClientMock.addresses[0],
          password: `1234567890`,
          delegations: [],
          begin_unbondings: [],
          begin_redelegates: [
            {
              shares: 10,
              validator_addr: lcdClientMock.validators[0],
              delegator_addr: lcdClientMock.addresses[0]
            }
          ]
        }
        await expect(
          actions.sendTx(
            {
              state,
              dispatch: jest.fn(),
              commit: jest.fn(),
              rootState: mockRootState
            },
            args
          )
        ).rejects.toEqual(new Error(`existing unbonding delegation found`))
      })

      it(`if the data has a string in 'message'`, async () => {
        node.postTx = () => Promise.reject(errMsgNoObject.response.data)
        const args = {
          to: `mock_address`,
          amount: [{ denom: `mycoin`, amount: 123 }]
        }
        await expect(
          actions.sendTx(
            {
              state,
              dispatch: jest.fn(),
              commit: jest.fn(),
              rootState: mockRootState
            },
            args
          )
        ).rejects.toEqual(new Error(`unexpected error`))
      })

      it(`if the data is an object and has a 'message' property`, async () => {
        node.postTx = () => Promise.reject(errObject.response.data)
        const args = {
          to: `mock_address`,
          password: `1234567890`,
          amount: [{ denom: `mycoin`, amount: 123 }]
        }
        await expect(
          actions.sendTx(
            {
              state,
              dispatch: jest.fn(),
              commit: jest.fn(),
              rootState: mockRootState
            },
            args
          )
        ).rejects.toEqual(new Error(`invalid sequence`))
      })

      it(`should signal check tx failure`, async () => {
        const args = {
          to: `mock_address`,
          password: `1234567890`,
          amount: [{ denom: `mycoin`, amount: 123 }]
        }
        node.postTx = async () => ({
          check_tx: { code: 1 },
          deliver_tx: { code: 0 }
        })
        await expect(
          actions.sendTx(
            {
              state,
              dispatch: jest.fn(),
              commit: jest.fn(),
              rootState: mockRootState
            },
            args
          )
        ).rejects.toEqual(new Error())
      })

      it(`should signal deliver tx failure`, async () => {
        const args = {
          to: `mock_address`,
          password: `1234567890`,
          amount: [{ denom: `mycoin`, amount: 123 }]
        }
        node.postTx = async () => ({
          check_tx: { code: 0 },
          deliver_tx: { code: 1 }
        })
        await expect(
          actions.sendTx(
            {
              state,
              dispatch: jest.fn(),
              commit: jest.fn(),
              rootState: mockRootState
            },
            args
          )
        ).rejects.toEqual(new Error())
      })

      it(`should handle tx failure in multiple tx result`, async () => {
        const args = {
          to: `mock_address`,
          password: `1234567890`,
          amount: [{ denom: `mycoin`, amount: 123 }]
        }
        node.postTx = async () => [
          {
            check_tx: { code: 0 },
            deliver_tx: { code: 0 }
          },
          {
            check_tx: { code: 0 },
            deliver_tx: { code: 1 }
          }
        ]
        await expect(
          actions.sendTx(
            {
              state,
              dispatch: jest.fn(),
              commit: jest.fn(),
              rootState: mockRootState
            },
            args
          )
        ).rejects.toEqual(new Error())
      })
    })

    it(`should interpret a returned empty array as failed delivery`, async () => {
      const args = {
        to: `mock_address`,
        password: `1234567890`,
        amount: [{ denom: `mycoin`, amount: 123 }]
      }
      node.postTx = async () => []
      await expect(
        actions.sendTx(
          {
            state,
            dispatch: jest.fn(),
            commit: jest.fn(),
            rootState: mockRootState
          },
          args
        )
      ).rejects.toEqual(new Error(`Error sending transaction`))
    })

    it(`should still send a transaction after failing to send another transaction`, async () => {
      const send = node.postTx.bind(node)

      node.postTx = () => Promise.reject(true)
      let args = {
        to: `mock_address`,
        password: `1234567890`,
        amount: [{ denom: `mycoin`, amount: 123 }]
      }
      let error1
      try {
        await actions.sendTx(
          {
            state,
            dispatch: jest.fn(),
            commit: jest.fn(),
            rootState: mockRootState
          },
          args
        )
      } catch (error) {
        error1 = error
      }
      expect(error1).toBeDefined()

      node.postTx = send
      args = {
        to: `mock_address`,
        password: `1234567890`,
        amount: [{ denom: `mycoin`, amount: 123 }]
      }
      let error2
      try {
        await actions.sendTx(
          {
            state,
            dispatch: jest.fn(),
            commit: jest.fn(),
            rootState: mockRootState
          },
          args
        )
      } catch (error) {
        error2 = error
      }
      expect(error2).toBeUndefined()
    })

    it(`should wait for currently sending tx to be sent`, async done => {
      jest.useFakeTimers()

      const args = {
        to: `mock_address`,
        password: `1234567890`,
        amount: [{ denom: `mycoin`, amount: 123 }]
      }
      const args2 = {
        to: `mock_address_2`,
        password: `1234567890`,
        amount: [{ denom: `mycoin`, amount: 123 }]
      }
      const dispatch = jest.fn(
        () =>
          new Promise(resolve => {
            setTimeout(
              () =>
                resolve({
                  check_tx: { code: 0 },
                  deliver_tx: { code: 0 }
                }),
              10000
            )
          })
      )
      actions
        .queueTx(
          {
            dispatch,
            state
          },
          args
        )
        .then(() => {
          jest.runAllTimers()
        })
      actions
        .queueTx(
          {
            dispatch,
            state
          },
          args2
        )
        .then(() => {
          expect(dispatch).toHaveBeenCalledTimes(2)
          expect(dispatch).toHaveBeenCalledWith(`sendTx`, args2)

          done()
        })
      expect(dispatch).toHaveBeenCalledTimes(1)
      expect(dispatch).toHaveBeenCalledWith(`sendTx`, args)

      jest.runAllTimers()
    })

    it(`should free the lock if sending a tx fails`, async () => {
      const args = {
        to: `mock_address`,
        password: `1234567890`,
        amount: [{ denom: `mycoin`, amount: 123 }]
      }
      const args2 = {
        to: `mock_address_2`,
        password: `1234567890`,
        amount: [{ denom: `mycoin`, amount: 123 }]
      }
      const dispatch = jest
        .fn()
        .mockRejectedValueOnce(`Error`)
        .mockResolvedValueOnce({})

      await actions
        .queueTx(
          {
            dispatch,
            state
          },
          args
        )
        .catch(err => {
          expect(err).toEqual(`Error`)
        })
      await actions.queueTx(
        {
          dispatch,
          state
        },
        args2
      )
      expect(dispatch).toHaveBeenCalledTimes(2)
    })

    it(`should query the wallet state before sending to acquire nonce`, async () => {
      const args = {
        to: `mock_address`,
        password: `1234567890`,
        amount: [{ denom: `mycoin`, amount: 123 }]
      }
      const dispatch = jest.fn()
      await actions.sendTx(
        {
          state,
          dispatch,
          commit: jest.fn(),
          rootState: mockRootState
        },
        args
      )
      expect(dispatch).toHaveBeenCalledWith(`queryWalletBalances`)
    })

    it(`should throw an error if not connected`, async () => {
      const args = {
        to: `mock_address`,
        amount: [{ denom: `mycoin`, amount: 123 }]
      }
      expect(
        actions.sendTx(
          {
            state,
            dispatch: jest.fn(),
            commit: jest.fn(),
            rootState: Object.assign({}, mockRootState, {
              connection: {
                connected: false
              }
            })
          },
          args
        )
      ).rejects.toEqual(
        new Error(
          `Currently not connected to a secure node. Please try again when Voyager has secured a connection.`
        )
      )
    })
  })
})
