const Sentry = require('@sentry/node')
const Tendermint = require('./tendermint')
const database = require('../database')
const config = require('../../config')

class SlashingMonitor {
  constructor(networkId, rpcEndpoint, store) {
    this.networkId = networkId
    this.client = new Tendermint(networkId, rpcEndpoint)
    this.store = store
  }

  // to prevent adding a slash twice we filter the slashes
  storeSlashes(filterReason) {
    return (tendermintResponse) => {
      try {
        const slashes = tendermintResponse.events['slash.address']
          .map((address, index) => ({
            networkId: this.networkId,
            operatorAddress: address,
            reason: tendermintResponse.events['slash.reason'][index],
            amount: tendermintResponse.events['slash.power'][index], // on chain value. convert to Lunie value?
            height: tendermintResponse.height || tendermintResponse.data.value.header.height
          }))
          .filter(({ reason }) => reason === filterReason)
        database(config)("").upsert('slashes', slashes)
        console.log('Added', slashes.length, 'slashes')
        slashes.forEach(slash => {
          publishEvent(
            this.network.id,
            resourceTypes.VALIDATOR,
            eventTypes.SLASH,
            slash.operatorAddress,
            slash
          )
        })
      } catch (error) {
        console.error("Failed to add slashes", tendermintResponse.events, error)
        Sentry.captureException(error)
      }
    }
  }

  initialize() {
    this.client.subscribe(
      { query: "slash.reason='double_sign'" },
      this.storeSlashes('double_sign')
    )

    this.client.subscribe(
      { query: "slash.reason='missing_signature'" },
      this.storeSlashes('missing_signature')
    )

    // requires some more logic to not spam the notifications if a validator is down for 1000 blocks
    this.client.subscribe(
      { query: `tm.event='NewBlockHeader' AND liveness.missed_blocks >= 1` },
      async (response) => {
        try {
          console.log(response)
          const missedBlocks = response.events['liveness.address'].map(
            (address, index) => ({
              networkId: this.networkId,
              operatorAddress: address,
              blocks: response.events['liveness.missed_blocks'][index],
              reason: 'missed_blocks',
              height: response.data.value.header.height,
            })
          )
          const rows = await Promise.all(missedBlocks.map(async missedBlockEvent => {
            const lastMissedBlockEvent = await getLastMissedBlock(this.networkId, missedBlockEvent.operatorAddress)
            return aggregateMissedBlocks(lastMissedBlockEvent, missedBlockEvent)
          }))
          database(config)("").upsert("slashes", rows)
          console.log('Wrote missed block events', rows)
        } catch (error) {
          console.error("Failed to write missed block events", error)
          Sentry.captureException(error)
        }
      }
    )
  }
}

async function getLastMissedBlock(networkId, operatorAddress) {
  // get last liveness issue
  const {data} = await database(config)("").query(`
    query {
      slashes(where:{networkId:{_eq:"${networkId}"}, operatorAddress:{_eq:"${operatorAddress}"}, reason:{_eq:"missed_blocks"}}, order_by:{id:desc}, limit: 1) {
        height
        id
        reason
      }
    }
  `)

  return data.slashes[0]
}

function aggregateMissedBlocks(lastMissedBlockEvent, newMissedBlockEvent) {
  if (!lastMissedBlockEvent) return newMissedBlockEvent
  if (newMissedBlockEvent.height - newMissedBlockEvent.blocks <= lastMissedBlockEvent.height) {
    return {
      ...newMissedBlockEvent,
      id: lastMissedBlockEvent.id // overwrite old entry
    }
  }
  return newMissedBlockEvent
}

module.exports = SlashingMonitor
