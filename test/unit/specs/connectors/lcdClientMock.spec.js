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
    const seed = await client.keys.seed()
    expect(seed.split(` `).length).toBe(24)
  })

  it(`persists keys`, async () => {
    const seed = await client.keys.seed()
    let res = await client.keys.add({
      name: `foo`,
      password: `1234567890`,
      seed
    })

    b32.decode(res.address)

    res = await client.keys.values()
    expect(res.find(k => k.name === `foo`)).toBeDefined()

    res = await client.keys.get(`foo`)
    expect(res.name).toBe(`foo`)
  })

  it(`updates keys`, async () => {
    let res = await client.keys.add({
      name: `foo`,
      password: `1234567890`,
      seed_phrase: `seed some thin`
    })

    res = await client.keys.set(`foo`, {
      name: `foo`,
      old_password: `1234567890`,
      new_password: `12345678901`
    })
    await expect(
      client.keys.set(`foo`, {
        name: `foo`,
        old_password: `1234567890`,
        new_password: `12345678901`
      })
    ).rejects.toMatchSnapshot()

    res = await client.keys.get(`foo`)
    expect(res.name).toBe(`foo`)
  })

  it(`deletes keys`, async () => {
    let res = await client.keys.add({
      name: `foo`,
      password: `1234567890`,
      seed_phrase: `seed some thin`
    })

    await expect(
      client.keys.delete(`foo`, { name: `foo`, password: `___` })
    ).rejects.toMatchSnapshot()
    await client.keys.delete(`foo`, { name: `foo`, password: `1234567890` })
    res = await client.keys.get(`foo`)
    expect(res).toBeUndefined()
  })

  it(`persists a sent tx`, async () => {
    let res = await client.txs(lcdClientMock.addresses[0])
    expect(res.length).toBe(2) // predefined txs

    const { address: toAddr } = await client.keys.add({
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

  it(`persists a sent tx to myself`, async () => {
    const res = await client.send(lcdClientMock.addresses[0], {
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
  })

  it(`only queries bank txs with the txs endpoint`, async () => {
    let res = await client.txs(lcdClientMock.addresses[0])
    expect(res.length).toBe(2) // predefined txs

    res = await client.postDelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegator_addr: lcdClientMock.addresses[0],
      validator_addr: lcdClientMock.validators[1],
      delegation: { denom: `mycoin`, amount: `10` }
    })
    expect(res.check_tx.code).toBe(0)

    res = await client.txs(lcdClientMock.addresses[0])
    expect(res.length).toBe(2)
  })

  it(`queries a tx by it's hash`, async () => {
    const tx = await client.tx(lcdClientMock.state.txs[0].hash)
    expect(tx.height).toBe(1)
  })

  it(`query and update the nonce`, async () => {
    const { sequence } = await client.getAccount(lcdClientMock.addresses[0])
    expect(sequence).toBe(`1`)

    const { address: toAddr } = await client.keys.add({
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
    const account = await client.getAccount(lcdClientMock.addresses[0])
    expect(account.sequence).toBe(`2`)
  })

  it(`queries an account`, async () => {
    const data = await client.getAccount(lcdClientMock.addresses[0])
    expect(data.coins.find(c => c.denom === `mycoin`).amount).toBe(`1000`)

    const res = await client.getAccount(`address_doesnt_exist`)
    expect(res).toBe(undefined)
  })

  it(`sends coins`, async () => {
    const toAddr = `tb1424xlh5d8q86tv4dyrdjjckg9h02rmd2c4v7dc`
    const res = await client.send(toAddr, {
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

    const account = await client.getAccount(lcdClientMock.addresses[0])
    expect(account.coins.find(c => c.denom === `mycoin`).amount).toBe(`950`)

    const receiveAccount = await client.getAccount(toAddr)
    expect(receiveAccount.coins.find(c => c.denom === `mycoin`).amount).toBe(
      `50`
    )
  })

  it(`sends coins to existing account`, async () => {
    const toAddr = `tb1424xlh5d8q86tv4dyrdjjckg9h02rmd2c4v7dc`
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

    const account = await client.getAccount(lcdClientMock.addresses[0])
    expect(account.coins.find(c => c.denom === `mycoin`).amount).toBe(`900`)

    const receiveAccount = await client.getAccount(toAddr)
    expect(receiveAccount.coins.find(c => c.denom === `mycoin`).amount).toBe(
      `100`
    )
  })

  it(`fails to send coins you dont have`, async () => {
    const { address: toAddr } = await client.keys.add({
      name: `bar`,
      password: `1234567890`,
      seed_phrase: `seed some thin`
    })
    const res = await client.send(toAddr, {
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
    const toAddr = `tb1424xlh5d8q86tv4dyrdjjckg9h02rmd2c4v7dc`
    await client.keys.add({
      name: `somekey`,
      password: `1234567890`,
      seed_phrase: `seed some thin test lol`
    })
    const res = await client.send(toAddr, {
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
    const { address: toAddr } = await client.keys.add({
      name: `bar`,
      password: `1234567890`,
      seed: `seed some thin`
    })
    const res = await client.send(toAddr, {
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
    const data = await client.getValidators()
    expect(data.length).toBeGreaterThan(0)
  })

  it(`queries for one candidate`, async () => {
    const validator = await client.getValidator(lcdClientMock.validators[0])
    expect(validator).toBe(
      lcdClientMock.state.candidates.find(
        v => v.operator_address === lcdClientMock.validators[0]
      )
    )
  })

  it(`queries bondings per delegator`, async () => {
    const res = await client.getDelegation(
      lcdClientMock.addresses[0],
      lcdClientMock.validators[0]
    )
    expect(res.shares).toMatchSnapshot()
  })

  it(`executes a delegate tx`, async () => {
    const stake = await client.getDelegation(
      lcdClientMock.addresses[0],
      lcdClientMock.validators[1]
    )
    expect(stake).toBeUndefined()

    const res = await client.postDelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegator_addr: lcdClientMock.addresses[0],
      validator_addr: lcdClientMock.validators[1],
      delegation: { denom: `mycoin`, amount: `10` }
    })
    expect(res.check_tx.log).toBe(``)
    expect(res.check_tx.code).toBe(0)

    const updatedStake = await client.getDelegation(
      lcdClientMock.addresses[0],
      lcdClientMock.validators[1]
    )
    expect(updatedStake.shares).toBe(`10`)
  })

  it(`executes an unbond tx`, async () => {
    let res = await client.postDelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegator_addr: lcdClientMock.addresses[0],
      validator_addr: lcdClientMock.validators[1],
      delegation: { denom: `mycoin`, amount: `10` }
    })
    expect(res.check_tx.log).toBe(``)
    expect(res.check_tx.code).toBe(0)

    const initialStake = await client.getDelegation(
      lcdClientMock.addresses[0],
      lcdClientMock.validators[1]
    )
    expect(initialStake.shares).toBe(`10`)

    res = await client.postUnbondingDelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 2
      },
      delegator_addr: lcdClientMock.addresses[0],
      validator_addr: lcdClientMock.validators[1],
      shares: `5`
    })
    expect(res.check_tx.log).toBe(``)
    expect(res.check_tx.code).toBe(0)

    const updatedStake = await client.getDelegation(
      lcdClientMock.addresses[0],
      lcdClientMock.validators[1]
    )
    expect(updatedStake.shares).toBe(`5`)
  })

  it(`can not stake fermions you dont have`, async () => {
    const res = await client.postDelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegator_addr: lcdClientMock.addresses[0],
      validator_addr: lcdClientMock.validators[1],
      delegation: { denom: `mycoin`, amount: String(100000) }
    })
    expect(res.check_tx.log).toBe(`Not enough coins in your account`)
    expect(res.check_tx.code).toBe(1)
  })

  it(`errors when delegating with incorrect nonce`, async () => {
    let res = await client.postDelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegator_addr: lcdClientMock.addresses[0],
      validator_addr: lcdClientMock.validators[1],
      delegation: { denom: `mycoin`, amount: `10` }
    })
    expect(res.check_tx.log).toBe(``)
    expect(res.check_tx.code).toBe(0)

    res = await client.postDelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegator_addr: lcdClientMock.addresses[0],
      validator_addr: lcdClientMock.validators[1],
      delegation: { denom: `mycoin`, amount: `10` }
    })
    expect(res.check_tx.log).toBe(`Expected sequence "2", got "1"`)
    expect(res.check_tx.code).toBe(2)
  })

  it(`errors when delegating with nonexistent account`, async () => {
    client.state.keys.push({
      name: `nonexistent_account`,
      password: `1234567890`,
      address: lcdClientMock.addresses[1]
    })
    const res = await client.postDelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `nonexistent_account`,
        sequence: 1
      },
      delegator_addr: lcdClientMock.addresses[1],
      validator_addr: lcdClientMock.validators[1],
      delegation: { denom: `mycoin`, amount: `10` }
    })
    expect(res.check_tx.log).toBe(`Nonexistent account`)
    expect(res.check_tx.code).toBe(1)
  })

  it(`errors when delegating negative amount`, async () => {
    const res = await client.postDelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegator_addr: lcdClientMock.addresses[0],
      validator_addr: lcdClientMock.validators[1],
      delegation: { denom: `mycoin`, amount: `-10` }
    })
    expect(res.check_tx.log).toBe(`Amount cannot be negative`)
    expect(res.check_tx.code).toBe(1)
  })

  it(`errors when unbonding with no delegation`, async () => {
    const res = await client.postUnbondingDelegation(
      lcdClientMock.addresses[0],
      {
        base_req: {
          name: `default`,
          sequence: 1
        },
        delegator_addr: lcdClientMock.addresses[0],
        validator_addr: lcdClientMock.validators[1],
        shares: `10`
      }
    )
    expect(res.check_tx.log).toBe(`Nonexistent delegation`)
    expect(res.check_tx.code).toBe(2)
  })

  it(`fails unbondings if account doesn't exist`, async () => {
    delete client.state.stake[lcdClientMock.addresses[0]]
    const res = await client.postUnbondingDelegation(
      lcdClientMock.addresses[0],
      {
        base_req: {
          name: `default`,
          sequence: 1
        },
        validator_addr: lcdClientMock.validators[0]
      }
    )
    expect(res.check_tx.code).toBe(2)
  })

  it(`errors relegation with no delegation`, async () => {
    const res = await client.postRedelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegator_addr: lcdClientMock.addresses[0],
      validator_src_addr: lcdClientMock.validators[2],
      validator_dst_addr: lcdClientMock.validators[1],
      shares: `100000000000`
    })
    expect(res.check_tx.code).toBe(3)
    expect(res.check_tx.log).toBe(
      `Nonexistent delegation with source validator`
    )
  })

  it(`fails redelegation if account doesn't exist`, async () => {
    delete client.state.stake[lcdClientMock.addresses[0]]
    const res = await client.postRedelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegator_addr: lcdClientMock.addresses[0],
      validator_src_addr: lcdClientMock.validators[0],
      validator_dst_addr: lcdClientMock.validators[1],
      shares: `100000000000`
    })
    expect(res.check_tx.code).toBe(3)
    expect(res.check_tx.log).toBe(
      `Nonexistent delegation with source validator`
    )
  })

  it(`fails redelegation if source validator doesn't exist`, async () => {
    const res = await client.postRedelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegator_addr: lcdClientMock.addresses[0],
      validator_src_addr: `abc`,
      validator_dst_addr: lcdClientMock.validators[1],
      shares: `100000000000`
    })
    expect(res.check_tx.code).toBe(3)
    expect(res.check_tx.log).toBe(`Nonexistent source validator`)
  })

  it(`fails redelegation if dest validator doesn't exist`, async () => {
    const res = await client.postRedelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegator_addr: lcdClientMock.addresses[0],
      validator_src_addr: lcdClientMock.validators[0],
      validator_dst_addr: `abc`,
      shares: `100000000000`
    })
    expect(res.check_tx.code).toBe(3)
    expect(res.check_tx.log).toBe(`Nonexistent destination validator`)
  })

  it(`fails redelegation if redelegation already present`, async () => {
    lcdClientMock.state.stake[lcdClientMock.addresses[0]].redelegations = [
      {
        validator_src_addr: lcdClientMock.validators[0],
        validator_dst_addr: lcdClientMock.validators[1]
      }
    ]
    const res = await client.postRedelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegator_addr: lcdClientMock.addresses[0],
      validator_src_addr: lcdClientMock.validators[0],
      validator_dst_addr: lcdClientMock.validators[1],
      shares: `100000000000`
    })
    expect(res.check_tx.code).toBe(3)
    expect(res.check_tx.log).toBe(`conflicting redelegation`)
  })

  it(`fails redelegation if redelegated shares is greater than the current balance`, async () => {
    const res = await client.postRedelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegator_addr: lcdClientMock.addresses[0],
      validator_src_addr: lcdClientMock.validators[0],
      validator_dst_addr: lcdClientMock.validators[1],
      shares: `500000000000`
    })
    expect(res.check_tx.code).toBe(3)
    expect(res.check_tx.log).toBe(
      `cannot redelegate more shares than the current delegated shares amount`
    )
  })

  it(`queries for delegation information for a delegator`, async () => {
    const delegations = await client.getDelegations(lcdClientMock.addresses[0])
    expect(Array.isArray(delegations)).toBe(true)
  })

  it(`queries for undelegation information for a delegator`, async () => {
    const delegations = await client.getUndelegations(
      lcdClientMock.addresses[0]
    )
    expect(Array.isArray(delegations)).toBe(true)
  })

  it(`queries for redelegation information for a delegator`, async () => {
    const delegations = await client.getRedelegations(
      lcdClientMock.addresses[0]
    )
    expect(Array.isArray(delegations)).toBe(true)
  })

  it(`queries for an unbonding delegation between a validator and a delegator`, async () => {
    await client.postUnbondingDelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegator_addr: lcdClientMock.addresses[0],
      validator_addr: lcdClientMock.validators[0],
      shares: `100000000000`
    })
    const undelegations = await client.getUnbondingDelegation(
      lcdClientMock.addresses[0],
      lcdClientMock.validators[0]
    )

    expect(undelegations.shares).toBe(`100000000000`)
  })

  it(`queries for an unbonding delegation between a validator and a delegator`, async () => {
    await client.postUnbondingDelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegator_addr: lcdClientMock.addresses[0],
      validator_addr: lcdClientMock.validators[0],
      shares: `100000000000`
    })
    const undelegations = await client.getUnbondingDelegation(
      lcdClientMock.addresses[0],
      lcdClientMock.validators[0]
    )

    expect(undelegations.shares).toBe(`100000000000`)
  })

  it(`queries for a redelegation from the delegator summary`, async () => {
    await client.postRedelegation(lcdClientMock.addresses[0], {
      base_req: {
        name: `default`,
        sequence: 1
      },
      delegator_addr: lcdClientMock.addresses[0],
      validator_src_addr: lcdClientMock.validators[0],
      validator_dst_addr: lcdClientMock.validators[1],
      shares: `10`
    })

    const redelegations = await client.getRedelegations(
      lcdClientMock.addresses[0]
    )
    expect(redelegations[0].balance.amount).toBe(`10`)
  })

  it(`queries for staking txs`, async () => {
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
    const parameters = await client.getStakingParameters()
    expect(parameters).toBeDefined()
    expect(parameters).toMatchObject(
      lcdClientMock.state.stakingParameters.parameters
    )
  })

  it(`queries for staking pool`, async () => {
    const pool = await client.getPool()
    expect(pool).toBeDefined()
    expect(pool).toMatchObject(lcdClientMock.state.pool)
  })

  it(`queries for validator signing information`, async () => {
    const signing_info = await client.getValidatorSigningInfo()
    expect(Object.keys(signing_info)).toContain(
      `start_height`,
      `index_offset`,
      `jailed_until`,
      `signed_blocks_counter`
    )
  })

  /* ============ Governance ============ */

  describe(`Governance`, () => {
    describe(`Proposals`, () => {
      it(`fetches all governance proposals`, async () => {
        const proposalsRes = await client.getProposals()
        expect(proposalsRes).toBeDefined()
      })

      it(`queries a single proposal`, async () => {
        const proposals = lcdClientMock.state.proposals
        const proposalRes = await client.getProposal(`1`)
        expect(proposalRes).toBeDefined()
        expect(proposalRes).toEqual(proposals[`1`])
      })

      describe(`fails to submit a proposal`, () => {
        it(`if the type is invalid`, async () => {
          const lenBefore = Object.keys(client.state.proposals).length
          const res = await client.postProposal({
            base_req: {
              name: `default`,
              sequence: 1
            },
            title: `A proposal`,
            description: `A description`,
            proposal_type: `Other`,
            proposer: lcdClientMock.addresses[0],
            initial_deposit: [
              {
                denom: `STAKE`,
                amount: `1`
              }
            ]
          })
          expect(res).toHaveLength(1)
          expect(res[0].check_tx.code).toBe(2)
          expect(res[0].check_tx.log).toBe(`Other is not a valid proposal type`)
          expect(Object.keys(client.state.proposals)).toHaveLength(lenBefore)
        })

        it(`if the deposit is invalid for whatever reason`, async () => {
          const lenBefore = Object.keys(client.state.proposals).length
          const res = await client.postProposal({
            base_req: {
              name: `default`,
              sequence: 1
            },
            title: `A proposal`,
            description: `A description`,
            proposal_type: `Text`,
            proposer: lcdClientMock.addresses[0],
            initial_deposit: [
              {
                denom: `STAKE`,
                amount: `-1`
              }
            ]
          })
          expect(res).toHaveLength(1)
          expect(res[0].check_tx.code).toBe(1)
          expect(res[0].check_tx.log).toBe(
            `Amount of STAKEs cannot be negative`
          )
          expect(Object.keys(client.state.proposals)).toHaveLength(lenBefore)
        })
      })

      describe(`successfuly submits a proposal`, () => {
        it(`when there are existing proposals`, async () => {
          const proposalIdsBefore = Object.keys(client.state.proposals)
          const maxProposalIdBefore = proposalIdsBefore.reduce(
            (max_id, id) => (id > max_id ? id : max_id),
            `0`
          )
          const proposal = {
            title: `A proposal`,
            description: `A description`,
            proposal_type: `Text`
          }
          await client.postProposal({
            base_req: {
              name: `default`,
              sequence: 1
            },
            proposer: lcdClientMock.addresses[0],
            initial_deposit: [
              {
                denom: `STAKE`, // TODO: use stake
                amount: `5`
              }
            ],
            ...proposal
          })
          expect(Object.keys(client.state.proposals)).toHaveLength(
            proposalIdsBefore.length + 1
          )

          const newProposalId = String(parseInt(maxProposalIdBefore) + 1)
          const res = await client.getProposal(newProposalId)
          expect(res).toBeDefined()
          expect(res).toMatchObject(proposal)
          expect(res.proposal_id).toEqual(newProposalId)
        })

        it(`when there are no previous proposals`, async () => {
          client.state.proposals = {}
          const proposal = {
            title: `A ParameterChange proposal`,
            description: `A description`,
            proposal_type: `ParameterChange`
          }
          await client.postProposal({
            base_req: {
              name: `default`,
              sequence: 1
            },
            proposer: lcdClientMock.addresses[0],
            initial_deposit: [
              {
                denom: `STAKE`, // TODO: use stake
                amount: `9`
              }
            ],
            ...proposal
          })
          expect(Object.keys(client.state.proposals)).toHaveLength(1)
          const res = await client.getProposal(`1`)
          expect(res).toBeDefined()
          expect(res).toMatchObject(proposal)
          expect(res.proposal_id).toEqual(`1`)
        })
      })
    })

    describe(`Tally`, () => {
      it(`queries a proposal's tally result`, async () => {
        const proposal = lcdClientMock.state.proposals[`2`]
        const res = await client.getProposalTally(`2`)
        expect(res).toBeDefined()
        expect(res).toEqual(proposal.final_tally_result)
      })
    })

    describe(`Parameters`, () => {
      it(`queries for governance deposit parameters`, async () => {
        const depositParams = lcdClientMock.state.governanceParameters.deposit
        const res = await client.getGovDepositParameters()
        expect(res).toBeDefined()
        expect(res).toEqual(depositParams)
      })

      it(`queries for governance tallying parameters`, async () => {
        const tallyingParams = lcdClientMock.state.governanceParameters.tallying
        const res = await client.getGovTallyingParameters()
        expect(res).toBeDefined()
        expect(res).toEqual(tallyingParams)
      })

      it(`queries for governance voting parameters`, async () => {
        const votingParams = lcdClientMock.state.governanceParameters.voting
        const res = await client.getGovVotingParameters()
        expect(res).toBeDefined()
        expect(res).toEqual(votingParams)
      })
    })

    describe(`Deposits`, () => {
      it(`queries a proposal deposits`, async () => {
        const { deposits } = lcdClientMock.state
        const depositsRes = await client.getProposalDeposits(`1`)
        expect(depositsRes).toBeDefined()
        expect(depositsRes).toEqual(deposits[`1`])
      })

      it(`queries a proposal deposit from an address`, async () => {
        const { deposits } = lcdClientMock.state
        const depositRes = await client.getProposalDeposit(
          `1`,
          deposits[`1`][0].depositor
        )
        expect(depositRes).toBeDefined()
        expect(depositRes).toEqual(deposits[`1`][0])
      })

      describe(`fails to submit deposit on proposal`, () => {
        it(`if account is nonexistent`, async () => {
          client.state.keys.push({
            name: `nonexistent_account`,
            password: `1234567890`,
            address: lcdClientMock.addresses[1]
          })

          const res = await client.postProposalDeposit({
            base_req: {
              name: `nonexistent_account`,
              sequence: 1
            },
            proposal_id: `5`,
            amount: [
              {
                denom: `STAKE`,
                amount: `1`
              }
            ],
            depositor: lcdClientMock.addresses[0]
          })
          expect(res).toHaveLength(1)
          expect(res[0].check_tx.log).toBe(`Nonexistent account`)
          expect(res[0].check_tx.code).toBe(1)
        })

        it(`if sequence is invalid`, async () => {
          const res = await client.postProposalDeposit({
            base_req: {
              name: `default`,
              sequence: 0
            },
            proposal_id: `5`,
            amount: [
              {
                denom: `STAKE`,
                amount: `1`
              }
            ],
            depositor: lcdClientMock.addresses[0]
          })
          expect(res).toHaveLength(1)
          expect(res[0].check_tx.code).toBe(2)
          expect(res[0].check_tx.log).toBe(`Expected sequence "1", got "0"`)
        })

        it(`if proposal is invalid`, async () => {
          const res = await client.postProposalDeposit({
            base_req: {
              name: `default`,
              sequence: 1
            },
            proposal_id: `17`,
            amount: [
              {
                denom: `STAKE`,
                amount: `1`
              }
            ],
            depositor: lcdClientMock.addresses[0]
          })
          expect(res).toHaveLength(1)
          expect(res[0].check_tx.code).toBe(3)
          expect(res[0].check_tx.log).toBe(`Nonexistent proposal`)
        })

        it(`if proposal is inactive`, async () => {
          const res = await client.postProposalDeposit({
            base_req: {
              name: `default`,
              sequence: 1
            },
            proposal_id: `1`,
            amount: [
              {
                denom: `STAKE`,
                amount: `1`
              }
            ],
            depositor: lcdClientMock.addresses[0]
          })
          expect(res).toHaveLength(1)
          expect(res[0].check_tx.code).toBe(3)
          expect(res[0].check_tx.log).toEqual(`Proposal #1 already finished`)
        })

        it(`if amount is negative`, async () => {
          const res = await client.postProposalDeposit({
            base_req: {
              name: `default`,
              sequence: 1
            },
            proposal_id: `5`,
            amount: [
              {
                denom: `STAKE`,
                amount: `-10`
              }
            ],
            depositor: lcdClientMock.addresses[0]
          })
          expect(res).toHaveLength(1)
          expect(res[0].check_tx.code).toBe(1)
          expect(res[0].check_tx.log).toBe(
            `Amount of STAKEs cannot be negative`
          )
        })

        it(`if the user doesn't have enough balance`, async () => {
          // user doesn't have any balance of the coin
          let res = await client.postProposalDeposit({
            base_req: {
              name: `default`,
              sequence: 1
            },
            proposal_id: `5`,
            amount: [
              {
                denom: `pump&DumpCoin`,
                amount: `10`
              }
            ],
            depositor: lcdClientMock.addresses[0]
          })
          expect(res).toHaveLength(1)
          expect(res[0].check_tx.code).toBe(1)
          expect(res[0].check_tx.log).toBe(
            `Not enough pump&DumpCoins in your account`
          )

          // user has not enough coins
          res = await client.postProposalDeposit({
            base_req: {
              name: `default`,
              sequence: 1
            },
            proposal_id: `5`,
            amount: [
              {
                denom: `STAKE`,
                amount: `1500`
              }
            ],
            depositor: lcdClientMock.addresses[0]
          })
          expect(res).toHaveLength(1)
          expect(res[0].check_tx.code).toBe(1)
          expect(res[0].check_tx.log).toBe(`Not enough STAKEs in your account`)
        })
      })

      describe(`submits successfully a deposit on an active proposal`, () => {
        it(`when user hasn't submitted a previous deposit`, async () => {
          const proposalBefore = await client.getProposal(`5`)
          const totalDepositBefore = proposalBefore.total_deposit.find(coin => {
            return coin.denom === `STAKE`
          })

          const userDepositBefore = await client.getProposalDeposit(
            `5`,
            lcdClientMock.addresses[0]
          )
          expect(totalDepositBefore).toEqual({ amount: `170`, denom: `STAKE` })
          expect(userDepositBefore).not.toBeDefined()

          const deposit = {
            proposal_id: `5`,
            amount: [
              {
                denom: `STAKE`,
                amount: `200`
              }
            ],
            depositor: lcdClientMock.addresses[0]
          }

          const res = await client.postProposalDeposit({
            base_req: {
              name: `default`,
              sequence: 1
            },
            ...deposit
          })
          expect(res).toBeDefined()

          // sshould have added the deposit to the proposal's total deposit
          const proposalAfter = await client.getProposal(`5`)
          const totalDepositAfter = proposalAfter.total_deposit.find(coin => {
            return coin.denom === `STAKE`
          })
          expect(totalDepositAfter).toEqual({ amount: `370`, denom: `STAKE` }) // 170 before + 200 new

          // should have updated the status of the proposal from `DepositPeriod` to `VotingPeriod`
          expect(proposalAfter.proposal_status).toEqual(`VotingPeriod`)

          // should have added the deposit from the depositor
          const userDepositAfter = await client.getProposalDeposit(
            `5`,
            lcdClientMock.addresses[0]
          )
          expect(userDepositAfter).toEqual(deposit)
        })

        it(`when user has previous deposit`, async () => {
          const proposalBefore = await client.getProposal(`2`)
          const totalSTAKEBefore = proposalBefore.total_deposit.find(coin => {
            return coin.denom === `STAKE`
          })
          const userDepositBefore = await client.getProposalDeposit(
            `2`,
            lcdClientMock.validators[0]
          )
          expect(totalSTAKEBefore).toBeDefined()
          expect(userDepositBefore).toBeDefined()

          const deposit = {
            proposal_id: `2`,
            amount: [
              {
                denom: `STAKE`,
                amount: `200`
              }
            ],
            depositor: lcdClientMock.validators[0]
          }

          const newTotalAmt =
            parseInt(totalSTAKEBefore.amount) +
            parseInt(deposit.amount[0].amount)

          const newDepositAmt =
            parseInt(userDepositBefore.amount[0].amount) +
            parseInt(deposit.amount[0].amount)

          const res = await client.postProposalDeposit({
            base_req: {
              name: `default`,
              sequence: 1
            },
            ...deposit
          })
          expect(res).toBeDefined()

          // should have increased total deposit of the proposal
          const proposalAfter = await client.getProposal(`2`)
          const totalSTAKEAfter = proposalAfter.total_deposit.find(coin => {
            return coin.denom === `STAKE`
          })
          expect(totalSTAKEAfter.amount).toEqual(String(newTotalAmt))

          // should have updated the deposit from the depositor
          const userDepositAfter = await client.getProposalDeposit(
            `2`,
            lcdClientMock.validators[0]
          )
          expect(userDepositAfter).toBeDefined()
          expect(userDepositAfter.amount[0].amount).toEqual(
            String(newDepositAmt)
          )
        })
      })
    })

    describe(`Votes`, () => {
      it(`queries a proposal votes`, async () => {
        const { votes } = lcdClientMock.state
        const votesRes = await client.getProposalVotes(`1`)
        expect(votesRes).toBeDefined()
        expect(votesRes).toEqual(votes[`1`])
      })

      it(`queries a proposal vote from an address`, async () => {
        const { votes } = lcdClientMock.state
        const voteRes = await client.getProposalVote(`1`, votes[`1`][0].voter)
        expect(voteRes).toBeDefined()
        expect(voteRes).toEqual(votes[`1`][0])
      })

      describe(`fails to vote on a proposal`, () => {
        it(`if account is nonexistent`, async () => {
          client.state.keys.push({
            name: `nonexistent_account`,
            password: `1234567890`,
            address: lcdClientMock.addresses[1]
          })

          const res = await client.postProposalVote({
            base_req: {
              name: `nonexistent_account`,
              sequence: 1
            },
            proposal_id: `2`,
            option: `abstain`,
            voter: lcdClientMock.addresses[0]
          })
          expect(res.length).toBe(1)
          expect(res[0].check_tx.log).toBe(`Nonexistent account`)
          expect(res[0].check_tx.code).toBe(1)
        })

        it(`if sequence is invalid`, async () => {
          const res = await client.postProposalVote({
            base_req: {
              name: `default`,
              sequence: 0
            },
            proposal_id: `2`,
            option: `yes`,
            voter: lcdClientMock.addresses[0]
          })
          expect(res.length).toBe(1)
          expect(res[0].check_tx.code).toBe(2)
          expect(res[0].check_tx.log).toBe(`Expected sequence "1", got "0"`)
        })

        it(`if proposal is invalid`, async () => {
          const res = await client.postProposalVote({
            base_req: {
              name: `default`,
              sequence: 1
            },
            proposal_id: `17`,
            option: `yes`,
            voter: lcdClientMock.addresses[0]
          })
          expect(res.length).toBe(1)
          expect(res[0].check_tx.code).toBe(3)
          expect(res[0].check_tx.log).toBe(`Nonexistent proposal`)
        })

        it(`if proposal is inactive`, async () => {
          const res = await client.postProposalVote({
            base_req: {
              name: `default`,
              sequence: 1
            },
            proposal_id: `1`,
            option: `yes`,
            voter: lcdClientMock.addresses[0]
          })
          expect(res.length).toBe(1)
          expect(res[0].check_tx.code).toBe(3)
          expect(res[0].check_tx.log).toBe(`Proposal #1 is inactive`)
        })

        it(`if the selected option is invalid`, async () => {
          const res = await client.postProposalVote({
            base_req: {
              name: `default`,
              sequence: 1
            },
            proposal_id: `2`,
            option: `other`,
            voter: lcdClientMock.addresses[0]
          })
          expect(res.length).toBe(1)
          expect(res[0].check_tx.code).toBe(3)
          expect(res[0].check_tx.log).toBe(`Invalid option 'other'`)
        })
      })

      describe(`votes successfully on a proposal`, () => {
        it(`if proposal is in 'VotingPeriod'`, async () => {
          const option = `no_with_veto`
          const proposalBefore = await client.getProposal(`2`)
          const optionBefore = proposalBefore.final_tally_result[option]

          await client.postProposalVote({
            base_req: {
              name: `default`,
              sequence: 1
            },
            proposal_id: `2`,
            option: option,
            voter: lcdClientMock.addresses[0]
          })

          const res = await client.getProposalVote(
            `2`,
            lcdClientMock.addresses[0]
          )
          expect(res).toBeDefined()
          expect(res.option).toEqual(option)

          // check if the tally was updated
          const proposalAfter = await client.getProposal(`2`)
          const optionAfter = proposalAfter.final_tally_result[option]
          expect(optionAfter).toEqual(String(parseInt(optionBefore) + 1))
        })
      })
    })

    it(`queries for governance txs`, async () => {
      let govTxs = await client.getGovernanceTxs(lcdClientMock.addresses[0])
      expect(govTxs).toHaveLength(2)
      expect(govTxs[0]).toEqual(lcdClientMock.state.txs[2])
      expect(govTxs[1]).toEqual(lcdClientMock.state.txs[3])

      govTxs = await client.getGovernanceTxs(lcdClientMock.addresses[1])
      expect(govTxs).toHaveLength(0)
    })
  })
})
