import config from "src/../config"
import gql from "graphql-tag"

function parseLedgerErrors(error) {
  // TODO move this error rewrite into the ledger lib
  /* istanbul ignore next: specific error rewrite */
  if (error.message.trim().startsWith("Device is already open")) {
    throw new Error(
      "Something went wrong connecting to your Ledger. Please refresh your page and try again."
    )
  }
  throw error
}

export const getAddressFromLedger = async (networkId, apollo) => {
  const ledger = await getLedgerConnector(networkId, apollo)

  try {
    const address = await ledger.getCosmosAddress() // TODO this should become `getAddress` to also work for not Cosmos networks

    return address
  } catch (err) {
    parseLedgerErrors(err)
  } finally {
    // cleanup. if we leave this open, the next connection will brake for HID
    // TODO move this into the leder lib
    ledger.cosmosApp.transport.close()
  }
}

export async function showAddressOnLedger(networkId, apollo) {
  const ledger = await getLedgerConnector(networkId, apollo)

  try {
    await ledger.confirmLedgerAddress()
  } catch (err) {
    parseLedgerErrors(err)
  } finally {
    // cleanup. if we leave this open, the next connection will brake for HID
    // TODO move this into the leder lib
    ledger.cosmosApp.transport.close()
  }
}

async function getLedgerConnector(networkId, apollo) {
  const {
    data: { network }
  } = await apollo.query({
    query: gql`
      query Network {
        network(id: "${networkId}") {
          id
          ledger_app,
          address_prefix
        }
      }
    `,
    fetchPolicy: "cache-first"
  })

  if (!network)
    throw new Error(
      "Couldn't get network information. Please try again later or contact the Lunie team."
    )

  switch (network.ledger_app) {
    case "cosmos": {
      const { default: Ledger } = await import("@lunie/cosmos-ledger")

      const HDPATH = [44, 118, 0, 0, 0]
      const ledger = new Ledger(
        {
          testModeAllowed: config.testModeAllowed
        },
        HDPATH,
        network.address_prefix
      )

      return ledger
    }
    default:
      throw new Error(
        "Lunie doesn't support connecting to the Ledger for this network."
      )
  }
}
