import {
  coinsToObject,
  calculateShares,
  toMicroDenom,
  sleep
} from "scripts/common"

describe(`calculateShares`, () => {
  it(`should calculates shares `, () => {
    const validator = {
      tokens: `100000000`,
      delegator_shares: ` 99999999.99995`
    }
    const tokens = `0.000000000005`
    const shares = calculateShares(validator, tokens).toNumber()
    expect(shares).toBe(5e-12)
  })
})

describe(`coinsToObject`, () => {
  it(`transforms coins arrays to object`, () => {
    const coinArray = [
      { denom: `stake`, amount: `100` },
      { denom: `photino`, amount: `15` }
    ]
    const coins = coinsToObject(coinArray)
    expect(coins).toMatchObject({
      stake: 100,
      photino: 15
    })
  })
})

describe(`toMicroDenom`, () => {
  it(`returns the right micro denom of a given network`, () => {
    const microDenom = toMicroDenom(`ATOM`)
    expect(microDenom).toBe(`uatom`)
  })
})

describe(`sleep`, () => {
  it(`returns a true as a promise`, () => {
    jest.useFakeTimers()
    sleep()
    expect(setTimeout).toHaveBeenCalledTimes(1)
    expect(sleep(10)).resolves.toEqual(10)
    jest.useRealTimers()
  })
})
