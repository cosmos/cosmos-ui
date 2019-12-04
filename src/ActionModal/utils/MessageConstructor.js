export const getMessage = async (
  messageType,
  transactionProperties,
  context
) => {
  const messageConstructor = await getMessageConstructor(context)
  const message = messageConstructor(
    messageType,
    context.userAddress,
    transactionProperties
  )
  return message
}

const getMessageConstructor = async context => {
  switch (context.networkId) {
    case `local-cosmos-hub-testnet`:
    case `cosmos-hub-mainnet`: {
      const { default: Cosmos } = await import("cosmos-apiV0")
      const cosmos = new Cosmos(context.url || "", context.chainId || "")
      return (messageType, userAddress, transactionProperties) =>
        cosmos[messageType](userAddress, transactionProperties)
    }
    case `cosmos-hub-testnet`: {
      const { default: Cosmos } = await import("cosmos-apiV2")
      const cosmos = new Cosmos(context.url || "", context.chainId || "")
      return (messageType, userAddress, transactionProperties) =>
        cosmos[messageType](userAddress, transactionProperties)
    }
  }
  throw Error("Network is not supported for signing transactions.")
}

export const getTransactionSigner = async context => {
  switch (context.networkId) {
    case `local-cosmos-hub-testnet`:
    case `cosmos-hub-mainnet`: {
      const { createSignedTransaction } = await import("cosmos-apiV0")
      return createSignedTransaction
    }
    case `cosmos-hub-testnet`: {
      const { createSignedTransaction } = await import("cosmos-apiV2")
      return createSignedTransaction
    }
  }
  throw Error("Network is not supported for signing transactions.")
}

export const getMultiMessage = async (context, messages) => {
  switch (context.networkId) {
    case `local-cosmos-hub-testnet`:
    case `cosmos-hub-mainnet`: {
      const { default: Cosmos } = await import("cosmos-apiV0")
      const cosmos = new Cosmos(context.url || "", context.chainId || "")
      return cosmos.MultiMessage(context.userAddress, messages)
    }
    case `cosmos-hub-testnet`: {
      const { default: Cosmos } = await import("cosmos-apiV2")
      const cosmos = new Cosmos(context.url || "", context.chainId || "")
      return cosmos.MultiMessage(context.userAddress, messages)
    }
  }
}

// Bank
/* istanbul ignore next */
export function MsgSend(
  senderAddress,
  {
    toAddress,
    amounts // [{ denom, amount}]
  }
) {
  return {
    type: `cosmos-sdk/MsgSend`,
    value: {
      from_address: senderAddress,
      to_address: toAddress,
      amount: amounts.map(Coin)
    }
  }
}

// Staking
/* istanbul ignore next */
export function MsgDelegate(
  senderAddress,
  { validatorAddress, amount, denom }
) {
  return {
    type: `cosmos-sdk/MsgDelegate`,
    value: {
      delegator_address: senderAddress,
      validator_address: validatorAddress,
      amount: Coin({ amount, denom })
    }
  }
}

/* istanbul ignore next */
export function MsgUndelegate(
  senderAddress,
  { validatorAddress, amount, denom }
) {
  return {
    type: `cosmos-sdk/MsgUndelegate`,
    value: {
      validator_address: validatorAddress,
      delegator_address: senderAddress,
      amount: Coin({ amount, denom })
    }
  }
}

/* istanbul ignore next */
export function MsgRedelegate(
  senderAddress,
  { validatorSourceAddress, validatorDestinationAddress, amount, denom }
) {
  return {
    type: `cosmos-sdk/MsgBeginRedelegate`,
    value: {
      delegator_address: senderAddress,
      validator_src_address: validatorSourceAddress,
      validator_dst_address: validatorDestinationAddress,
      amount: Coin({ amount, denom })
    }
  }
}

// Governance
/* istanbul ignore next */
export function MsgSubmitProposal(
  senderAddress,
  {
    title,
    description,
    initialDeposits // [{ denom, amount }]
  }
) {
  return {
    type: `cosmos-sdk/MsgSubmitProposal`,
    value: {
      content: {
        type: "cosmos-sdk/TextProposal",
        value: {
          title,
          description
        }
      },
      proposer: senderAddress,
      initial_deposit: initialDeposits.map(Coin)
    }
  }
}

/* istanbul ignore next */
export function MsgVote(senderAddress, { proposalId, option }) {
  return {
    type: `cosmos-sdk/MsgVote`,
    value: {
      voter: senderAddress,
      proposal_id: proposalId,
      option
    }
  }
}

/* istanbul ignore next */
export function MsgDeposit(
  senderAddress,
  {
    proposalId,
    amounts // [{ denom, amount }]
  }
) {
  return {
    type: `cosmos-sdk/MsgDeposit`,
    value: {
      depositor: senderAddress,
      proposal_id: proposalId,
      amount: amounts.map(Coin)
    }
  }
}

/* istanbul ignore next */
export function MsgWithdrawDelegationReward(
  senderAddress,
  { validatorAddress }
) {
  return {
    type: `cosmos-sdk/MsgWithdrawDelegationReward`,
    value: {
      delegator_address: senderAddress,
      validator_address: validatorAddress
    }
  }
}

function Coin({ amount, denom }) {
  return {
    amount: String(amount),
    denom
  }
}

/* istanbul ignore next */
function getMessageFormatter(messageType) {
  switch (messageType) {
    case "MsgSend":
      return MsgSend
    case "MsgDelegate":
      return MsgDelegate
    case "MsgUndelegate":
      return MsgUndelegate
    case "MsgRedelegate":
      return MsgRedelegate
    case "MsgSubmitProposal":
      return MsgSubmitProposal
    case "MsgVote":
      return MsgVote
    case "MsgDeposit":
      return MsgDeposit
    case "MsgWithdrawDelegationReward":
      return MsgWithdrawDelegationReward
    default:
      return null
  }
}

export function transformMessage(messageType, senderAddress, message) {
  const messageFormatter = getMessageFormatter(messageType)
  return messageFormatter(senderAddress, message)
}
