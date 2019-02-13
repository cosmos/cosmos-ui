/* istanbul ignore file */
import axios from "axios"
import config from "./config"

const networkPath = `../networks/${config.default_network}`

export default async function() {
  const genesis = (await axios(`${networkPath}/genesis.json`)).data
  const networkName = genesis.chain_id

  return {
    genesis,
    path: networkPath,
    name: networkName
  }
}
