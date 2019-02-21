"use strict"

export default opts => ({
  blocks: require(`./blocks.js`).default(opts),
  transactions: require(`./transactions.js`).default(opts),
  config: require(`./config.js`).default(opts),
  delegates: require(`./delegates.js`).default(opts),
  delegation: require(`./delegation.js`).default(opts),
  distribution: require(`./distribution.js`).default(opts),
  filters: require(`./filters.js`).default(opts),
  connection: require(`./connection.js`).default(opts),
  notifications: require(`./notifications.js`).default(opts),
  onboarding: require(`./onboarding.js`).default(opts),
  proposals: require(`./governance/proposals.js`).default(opts),
  votes: require(`./governance/votes.js`).default(opts),
  deposits: require(`./governance/deposits.js`).default(opts),
  governanceParameters: require(`./governance/parameters.js`).default(opts),
  send: require(`./send.js`).default(opts),
  user: require(`./user.js`).default(opts),
  validators: require(`./validators.js`).default(opts),
  ledger: require(`./ledger.js`).default(opts),
  wallet: require(`./wallet.js`).default(opts),
  keybase: require(`./keybase.js`).default(opts),
  stakingParameters: require(`./parameters.js`).default(opts),
  pool: require(`./pool.js`).default(opts)
})
