import { parseTx, parseFee, parseValueObj } from "scripts/parsers"

const signedMessage = {
  type: "auth/StdTx",
  value: {
    msg: [
      {
        type: "cosmos-sdk/MsgSend",
        value: {
          amount: [
            {
              amount: "10000000",
              denom: "stake"
            }
          ],
          from_address: "cosmos1ek9cd8ewgxg9w5xllq9um0uf4aaxaruvcw4v9e",
          to_address: "cosmos1324vt5j3wzx0xsc32mjhkrvy5gn5ef2hrwcg29"
        }
      }
    ],
    fee: {
      amount: [
        {
          amount: "40",
          denom: "stake"
        }
      ],
      gas: "39953"
    },
    memo: "(Sent via Lunie)"
  }
}

const signedActionMessage = {
  type: "auth/StdTx",
  value: {
    msg: [
      {
        type: "cosmos-sdk/MsgDelegate",
        value: {
          amount: [
            {
              amount: "10000000",
              denom: "stake"
            }
          ],
          from_address: "cosmos1ek9cd8ewgxg9w5xllq9um0uf4aaxaruvcw4v9e",
          to_address: "cosmos1324vt5j3wzx0xsc32mjhkrvy5gn5ef2hrwcg29"
        }
      }
    ],
    fee: {
      amount: [
        {
          amount: "40",
          denom: "stake"
        }
      ],
      gas: "39953"
    },
    memo: "(Sent via Lunie)"
  }
}

describe(`parsers helper`, () => {
  it(`should parse a signedmessaged ParseTx`, () => {
    const shortMessage = {
      tx: {
        type: "auth/StdTx",
        value: {
          msg: "some message",
          fee: 0.01,
          memo: "Sent from Lunie"
        }
      }
    }
    expect(
      parseTx(`{"msgs":"some message","fee":0.01,"memo":"Sent from Lunie"}`)
    ).toMatchObject(shortMessage)
  })

  it(`should parse a signedmessaged parseFee`, () => {
    expect(parseFee(signedMessage)).toBe(40)
  })

  it(`should parse a signedmessaged parseValueObj`, () => {
    const parsedValueObj = {
      amount: "10000000",
      denom: "stake"
    }
    expect(parseValueObj(signedMessage)).toMatchObject(parsedValueObj)
  })

  it(`should parse a signedActionMessage parseValueObj`, () => {
    const parsedValueObj = [
      {
        amount: "10000000",
        denom: "stake"
      }
    ]
    expect(parseValueObj(signedActionMessage)).toMatchObject(parsedValueObj)
  })
})
