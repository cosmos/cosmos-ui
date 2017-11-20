export const mainCounter = state => state.counters.main
export const allTransactions = state => state.transactions
export const notifications = state => state.notifications
export const logOutput = state => state.log.output

export const nodeIP = state => state.node.nodeIP
export const connected = state => state.node.connected
export const lastHeader = state => state.node.lastHeader

export const candidates = state => state.candidates.list
export const shoppingCart = state => state.shoppingCart.candidates
export const user = state => state.user
export const config = state => state.config

// monitor
export const blockchain = state => state.blockchain
export const validators = state => state.validators.validators
export const delegators = state => state.delegators

// govern
export const proposals = state => state.proposals

// wallet
export const wallet = state => state.wallet

// ui
export const filters = state => state.filters
