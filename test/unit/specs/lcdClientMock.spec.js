import b32 from "scripts/b32"

describe(`LCD Client Mock`, () => {
  let client, lcdClientMock

  beforeEach(() => {
    jest.resetModules()
    lcdClientMock = require(`renderer/connectors/lcdClientMock.js`)
    client = lcdClientMock
  })

  it(`shows a connected state`, async () => {
    expect(await client.lcdConnected()).toBe(true)
  })

  it(`generates seeds`, async () => {
    let seed = await client.generateSeed()
    expect(seed.split(` `).length).toBe(24)
  })

  it(`persists keys`, async () => {
    let seed = await client.generateSeed()
    let res = await client.storeKey({
      name: `foo`,
      password: `1234567890`,
      seed
    })

    b32.decode(res.address)

    res = await client.listKeys()
    expect(res.find(k => k.name === `foo`)).toBeDefined()

    res = await client.getKey(`foo`)
    expect(res.name).toBe(`foo`)
  })

  it(`updates keys`, async () => {
    let res = await client.storeKey({
      name: `foo`,
      password: `1234567890`,
      seed_phrase: `seed some thin`
    })

    res = await client.updateKey(`foo`, {
      name: `foo`,
      old_password: `1234567890`,
      new_password: `12345678901`
    })
    await expect(
      client.updateKey(`foo`, {
        name: `foo`,
        old_password: `1234567890`,
        new_password: `12345678901`
      })
    ).rejects.toMatchSnapshot()

    res = await client.getKey(`foo`)
    expect(res.name).toBe(`foo`)
  })

  it(`deletes keys`, async () => {
    let res = await client.storeKey({
      name: `foo`,
      password: `1234567890`,
      seed_phrase: `seed some thin`
    })

    await expect(
      client.deleteKey(`foo`, { name: `foo`, password: `___` })
    ).rejects.toMatchSnapshot()
    await client.deleteKey(`foo`, { name: `foo`, password: `1234567890` })
    res = await client.getKey(`foo`)
    expect(res).toBeUndefined()
  })

  it(`persists a sent tx`, async () => {
    let res = await client.txs(lcdClientMock.addresses[0])
    expect(res.length).toBe(2) // predefined txs

    let { address: toAddr } = await client.storeKey({
      name: `bar`,
      password: `1234567890`,
      seed_phrase: `seed some thin`
    })
    res = await client.send(toAddr, {
      base_req: {
        sequence: 1,
        name: `default`
      },
      fees: [],
      amount: [
        {
          denom: `mycoin`,
          amount: `50`
        }
      ]
    })
    expect(res.height).toBeDefined()

    res = await client.txs(lcdClientMock.addresses[0])
    expect(res.length).toBe(3)
  })

  it(`queries a tx by it's hash`, async () => {
    let tx = await client.tx(lcdClientMock.state.txs[0].hash)
    expect(tx.height).toBe(1)
  })

  it(`query and update the nonce`, async () => {
    let { sequence } = await client.queryAccount(lcdClientMock.addresses[0])
    expect(sequence).toBe(`1`)

    let { address: toAddr } = await client.storeKey({
      name: `bar`,
      password: `1234567890`,
      seed_phrase: `seed some thin`
    })
    await client.send(toAddr, {
      base_req: {
        sequence: 1,
        name: `default`
      },
      fees: [],
      amount: [
        {
          denom: `mycoin`,
          amount: `50`
        }
      ]
    })
    let account = await client.queryAccount(lcdClientMock.addresses[0])
    expect(account.sequence).toBe(`2`)
  })

  it(`queries an account`, async () => {
    let data = await client.queryAccount(lcdClientMock.addresses[0])
    expect(data.coins.find(c => c.denom === `mycoin`).amount).toBe(`1000`)

    let res = await client.queryAccount(`address_doesnt_exist`)
    expect(res).toBe(undefined)
  })

  it(`sends coins`, async () => {
    let toAddr = `tb1424xlh5d8q86tv4dyrdjjckg9h02rmd2c4v7dc`
    let res = await client.send(toAddr, {
      base_req: {
        sequence: 1,
        name: `default`
      },
      fees: [],
      amount: [
        {
          denom: `mycoin`,
          amount: `50`
        }
      ]
    })
    expect(res.check_tx.code).toBe(0)

    let account = await client.queryAccount(lcdClientMock.addresses[0])
    expect(account.coins.find(c => c.denom === `mycoin`).amount).toBe(`950`)

    let receiveAccount = await client.queryAccount(toAddr)
    expect(receiveAccount.coins.find(c => c.denom === `mycoin`).amount).toBe(
      `50`
    )
  })

  it(`sends coins to existing account`, async () => {
    let toAddr = `tb1424xlh5d8q86tv4dyrdjjckg9h02rmd2c4v7dc`
    let res = await client.send(toAddr, {
      base_req: {
        sequence: 1,
        name: `default`
      },
      fees: [],
      amount: [
        {
          denom: `mycoin`,
          amount: `50`
        }
      ]
    })
    expect(res.check_tx.code).toBe(0)

    res = await client.send(toAddr, {
      base_req: {
        sequence: 2,
        name: `default`
      },
      fees: [],
      amount: [
        {
          denom: `mycoin`,
          amount: `50`
        }
      ]
    })
    expect(res.check_tx.code).toBe(0)

    let account = await client.queryAccount(lcdClientMock.addresses[0])
    expect(account.coins.find(c => c.denom === `mycoin`).amount).toBe(`900`)

    let receiveAccount = await client.queryAccount(toAddr)
    expect(receiveAccount.coins.find(c => c.denom === `mycoin`).amount).toBe(
      `100`
    )
  })

  it(`fails to send coins you dont have`, async () => {
    let { address: toAddr } = await client.storeKey({
      name: `bar`,
      password: `1234567890`,
      seed_phrase: `seed some thin`
    })
    let res = await client.send(toAddr, {
      base_req: {
        sequence: 1,
        name: `default`
      },
      fees: [],
      amount: [
        {
          denom: `mycoin`,
          amount: `100000`
        }
      ]
    })
    expect(res.check_tx.code).toBe(1)
  })

  it(`fails to send coins from a nonexistent account`, async () => {
    let toAddr = `tb1424xlh5d8q86tv4dyrdjjckg9h02rmd2c4v7dc`
    await client.storeKey({
      name: `somekey`,
      password: `1234567890`,
      seed_phrase: `seed some thin test lol`
    })
    let res = await client.send(toAddr, {
      base_req: {
        sequence: 1,
        name: `somekey`
      },
      fees: [],
      amount: [
        {
          denom: `mycoin`,
          amount: `100000`
        }
      ]
    })
    expect(res.check_tx.code).toBe(1)
  })

  it(`fails to send negative amounts`, async () => {
    let { address: toAddr } = await client.storeKey({
      name: `bar`,
      password: `1234567890`,
      seed: `seed some thin`
    })
    let res = await client.send(toAddr, {
      base_req: {
        sequence: 1,
        name: `default`
      },
      fees: [],
      amount: [
        {
          denom: `mycoin`,
          amount: `-50`
        }
      ]
    })
    expect(res.check_tx.code).toBe(1)
  })

  it(`queries for all candidates`, async () => {
    let data = await client.getCandidates()
    expect(data.length).toBeGreaterThan(0)
  })

  it(`queries for one candidate`, async () => {
    let validator = await client.getCandidate(lcdClientMock.validators[0])
    expect(validator).toBe(
      lcdClientMock.state.candidates.find(
        v => v.operator_address === lcdClientMock.validators[0]
      )
    )
  })

  it(`queries bondings per delegator`, async () => {
    let res = await client.queryDelegation(
      lcdClientMock.addresses[0],
      lcdClientMock.validators[0]
    )
    expect(res.shares).toMatchSnapshot()
  })

  it(`executes a delegate tx`, async () => {
    let stake = await client.queryDelegation(
      lcdClientMock.addresses[0],
      lcdClientMock.validators[1]
    )
    expect(stake).toBeUndefined()

    let res = await client.updateDelegations(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegations: [
        {
          delegator_addr: lcdClientMock.addresses[0],
          validator_addr: lcdClientMock.validators[1],
          delegation: { denom: `mycoin`, amount: `10` }
        }
      ],
      begin_unbondings: []
    })
    expect(res.length).toBe(1)
    expect(res[0].check_tx.log).toBe(``)
    expect(res[0].check_tx.code).toBe(0)

    let updatedStake = await client.queryDelegation(
      lcdClientMock.addresses[0],
      lcdClientMock.validators[1]
    )
    expect(updatedStake.shares).toBe(`10`)
  })

  it(`executes an unbond tx`, async () => {
    let res = await client.updateDelegations(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegations: [
        {
          delegator_addr: lcdClientMock.addresses[0],
          validator_addr: lcdClientMock.validators[1],
          delegation: { denom: `mycoin`, amount: `10` }
        }
      ],
      begin_unbondings: []
    })
    expect(res.length).toBe(1)
    expect(res[0].check_tx.log).toBe(``)
    expect(res[0].check_tx.code).toBe(0)

    let initialStake = await client.queryDelegation(
      lcdClientMock.addresses[0],
      lcdClientMock.validators[1]
    )
    expect(initialStake.shares).toBe(`10`)

    res = await client.updateDelegations(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 2
      },
      delegations: [],
      begin_unbondings: [
        {
          delegator_addr: lcdClientMock.addresses[0],
          validator_addr: lcdClientMock.validators[1],
          shares: `5`
        }
      ]
    })
    expect(res.length).toBe(1)
    expect(res[0].check_tx.log).toBe(``)
    expect(res[0].check_tx.code).toBe(0)

    let updatedStake = await client.queryDelegation(
      lcdClientMock.addresses[0],
      lcdClientMock.validators[1]
    )
    expect(updatedStake.shares).toBe(`5`)
  })

  it(`can not stake fermions you dont have`, async () => {
    let res = await client.updateDelegations(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegations: [
        {
          delegator_addr: lcdClientMock.addresses[0],
          validator_addr: lcdClientMock.validators[1],
          delegation: { denom: `mycoin`, amount: String(100000 * 10000000000) }
        }
      ],
      begin_unbondings: []
    })
    expect(res.length).toBe(1)
    expect(res[0].check_tx.log).toBe(`Not enough coins in your account`)
    expect(res[0].check_tx.code).toBe(1)
  })

  it(`errors when delegating with incorrect nonce`, async () => {
    let res = await client.updateDelegations(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegations: [
        {
          delegator_addr: lcdClientMock.addresses[0],
          validator_addr: lcdClientMock.validators[1],
          delegation: { denom: `mycoin`, amount: `10` }
        }
      ],
      begin_unbondings: []
    })
    expect(res.length).toBe(1)
    expect(res[0].check_tx.log).toBe(``)
    expect(res[0].check_tx.code).toBe(0)

    res = await client.updateDelegations(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegations: [
        {
          delegator_addr: lcdClientMock.addresses[0],
          validator_addr: lcdClientMock.validators[1],
          delegation: { denom: `mycoin`, amount: `10` }
        }
      ],
      begin_unbondings: []
    })
    expect(res.length).toBe(1)
    expect(res[0].check_tx.log).toBe(`Expected sequence "2", got "1"`)
    expect(res[0].check_tx.code).toBe(2)
  })

  it(`errors when delegating with nonexistent account`, async () => {
    client.state.keys.push({
      name: `nonexistent_account`,
      password: `1234567890`,
      address: lcdClientMock.addresses[1]
    })
    let res = await client.updateDelegations(lcdClientMock.addresses[0], {
      base_req: {
        name: `nonexistent_account`,
        sequence: 1
      },
      delegations: [
        {
          delegator_addr: lcdClientMock.addresses[0],
          validator_addr: lcdClientMock.validators[1],
          delegation: { denom: `mycoin`, amount: `10` }
        }
      ],
      begin_unbondings: []
    })
    expect(res.length).toBe(1)
    expect(res[0].check_tx.log).toBe(`Nonexistent account`)
    expect(res[0].check_tx.code).toBe(1)
  })

  it(`delegates to multiple validators at once`, async () => {
    let res = await client.updateDelegations(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegations: [
        {
          delegator_addr: lcdClientMock.addresses[0],
          validator_addr: lcdClientMock.validators[1],
          delegation: { denom: `mycoin`, amount: `10` }
        },
        {
          delegator_addr: lcdClientMock.addresses[0],
          validator_addr: lcdClientMock.validators[0],
          delegation: { denom: `mycoin`, amount: `10` }
        }
      ],
      begin_unbondings: []
    })
    expect(res.length).toBe(2)
    expect(res[0].check_tx.log).toBe(``)
    expect(res[0].check_tx.code).toBe(0)
    expect(res[1].check_tx.log).toBe(``)
    expect(res[1].check_tx.code).toBe(0)

    let stake1 = await client.queryDelegation(
      lcdClientMock.addresses[0],
      lcdClientMock.validators[1]
    )
    expect(stake1.shares).toMatchSnapshot()

    let stake2 = await client.queryDelegation(
      lcdClientMock.addresses[0],
      lcdClientMock.validators[0]
    )
    expect(stake2.shares).toMatchSnapshot()
  })

  it(`errors when delegating negative amount`, async () => {
    let res = await client.updateDelegations(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegations: [
        {
          delegator_addr: lcdClientMock.addresses[0],
          validator_addr: lcdClientMock.validators[1],
          delegation: { denom: `mycoin`, amount: `-10` }
        }
      ],
      begin_unbondings: []
    })
    expect(res.length).toBe(1)
    expect(res[0].check_tx.log).toBe(`Amount cannot be negative`)
    expect(res[0].check_tx.code).toBe(1)
  })

  it(`errors when unbonding with no delegation`, async () => {
    let res = await client.updateDelegations(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegations: [],
      begin_unbondings: [
        {
          delegator_addr: lcdClientMock.addresses[0],
          validator_addr: lcdClientMock.validators[1],
          shares: `10`
        }
      ]
    })
    expect(res.length).toBe(1)
    expect(res[0].check_tx.log).toBe(`Nonexistent delegation`)
    expect(res[0].check_tx.code).toBe(2)
  })

  it(`ends unbondings`, async () => {
    await client.updateDelegations(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegations: [],
      begin_unbondings: [
        {
          delegator_addr: lcdClientMock.addresses[0],
          validator_addr: lcdClientMock.validators[0],
          shares: `5`
        }
      ]
    })
    expect(
      lcdClientMock.state.stake[lcdClientMock.addresses[0]]
        .unbonding_delegations
    ).toHaveLength(1)
    let res = await client.updateDelegations(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 2
      },
      complete_unbondings: [
        {
          validator_addr: lcdClientMock.validators[0]
        }
      ]
    })
    expect(res.length).toBe(1)
    expect(res[0].check_tx.log).toBe(``)
    expect(res[0].check_tx.code).toBe(0)
    expect(
      lcdClientMock.state.stake[lcdClientMock.addresses[0]]
        .unbonding_delegations
    ).toHaveLength(0)
  })

  it(`fails unbondings if account doesn't exist`, async () => {
    delete client.state.stake[lcdClientMock.addresses[0]]
    let res = await client.updateDelegations(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      begin_unbondings: [
        {
          validator_addr: lcdClientMock.validators[0]
        }
      ]
    })
    expect(res.length).toBe(1)
    expect(res[0].check_tx.code).toBe(2)
  })

  it(`fails ends unbondings if account doesn't exist`, async () => {
    delete client.state.stake[lcdClientMock.addresses[0]]
    let res = await client.updateDelegations(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      complete_unbondings: [
        {
          validator_addr: lcdClientMock.validators[0]
        }
      ]
    })
    expect(res.length).toBe(1)
    expect(res[0].check_tx.code).toBe(2)
  })

  it(`queries for summary of delegation information for a delegator`, async () => {
    let delegation = await client.getDelegator(lcdClientMock.addresses[0])
    expect(Object.keys(delegation)).toEqual([
      `delegations`,
      `unbonding_delegations`
    ])
  })

  it(`queries for an unbonding delegation between a validator and a delegator`, async () => {
    await client.updateDelegations(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegations: [],
      begin_unbondings: [
        {
          delegator_addr: lcdClientMock.addresses[0],
          validator_addr: lcdClientMock.validators[0],
          shares: `10`
        }
      ]
    })
    let undelegations = await client.queryUnbonding(
      lcdClientMock.addresses[0],
      lcdClientMock.validators[0]
    )

    expect(undelegations.shares).toBe(`10`)
  })

  it(`queries for staking txs`, async () => {
    await client.updateDelegations(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegations: [
        {
          delegator_addr: lcdClientMock.addresses[0],
          validator_addr: lcdClientMock.validators[1],
          delegation: { denom: `mycoin`, amount: `10` }
        }
      ],
      begin_unbondings: [
        {
          delegator_addr: lcdClientMock.addresses[0],
          validator_addr: lcdClientMock.validators[0],
          shares: `10`
        }
      ]
    })
    let txs = await client.getDelegatorTxs(lcdClientMock.addresses[0])
    expect(txs).toHaveLength(2)

    txs = await client.getDelegatorTxs(lcdClientMock.addresses[0], [`bonding`])
    expect(txs).toHaveLength(1)
    expect(txs[0].tx.value.msg[0].type).toBe(`cosmos-sdk/MsgDelegate`)

    txs = await client.getDelegatorTxs(lcdClientMock.addresses[0], [
      `unbonding`
    ])
    expect(txs).toHaveLength(1)
    expect(txs[0].tx.value.msg[0].type).toBe(`cosmos-sdk/BeginUnbonding`)
  })

  it(`queries for staking parameters`, async () => {
    let parameters = await client.getParameters()
    expect(Object.keys(parameters)).toContain(
      `inflation_max`,
      `inflation_min`,
      `goal_bonded`,
      `unbonding_time`,
      `max_validators`,
      `bond_denom`
    )
  })

  it(`queries for staking pool`, async () => {
    let pool = await client.getPool()
    expect(Object.keys(pool)).toContain(
      `loose_tokens`,
      `bonded_tokens`,
      `inflation_last_time`,
      `inflation`,
      `date_last_commission_reset`,
      `prev_bonded_shares`
    )
  })

  it(`queries for validator signing information`, async () => {
    let signing_info = await client.queryValidatorSigningInfo()
    expect(Object.keys(signing_info)).toContain(
      `start_height`,
      `index_offset`,
      `jailed_until`,
      `signed_blocks_counter`
    )
  })
})
