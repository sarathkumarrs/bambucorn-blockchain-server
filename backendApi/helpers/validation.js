const { body, param, query, validationResult } = require('express-validator')
const { sendResponse } = require('./signeTransaction')

const UserAccountId = [
  param('UserAccountId', 'Please enter UserAccountId').isInt()
]

const CreateUserPrams = [
  body('UserAccountId', 'Please enter UserAccountId').exists({ checkFalsy: true, checkNull: true }),
  body('Group', 'Please enter Group').exists(),
  body('KycStatus', 'Please enter KycStatus').exists()
]

const Data = [
  body('Data', 'Please enter Data').exists({ checkFalsy: true, checkNull: true })
]

const DealId = [
  param('DealId', 'Please enter DealId').isInt()
]
const DealIdQury = [
  query('DealId', 'Please enter DealId').exists({ checkFalsy: true, checkNull: true })
]

const UserAccountIdQuery = [
  query('UserAccountId', 'Please enter UserAccountId').exists({ checkFalsy: true, checkNull: true })
]

const KycStatus = [
  body('KycStatus', 'Please enter KycStatus').exists()
]

const TransferTokenParams = [
  body('TokenSymbol', 'Please enter TokenSymbol').exists({ checkFalsy: true, checkNull: true }),
  body('UserAccountId', 'Please enter UserAccountId').exists({ checkFalsy: true, checkNull: true }),
  body('DealId', 'Please enter DealId').exists({ checkFalsy: true, checkNull: true }),
  body('TokenAmount', 'Please enter TokenAmount').exists({ checkFalsy: true, checkNull: true })
]
const CreateTokenParams = [
  body('TokenName', 'Please enter TokenName').exists({ checkFalsy: true, checkNull: true }),
  body('TokenSymbol', 'Please enter TokenSymbol').exists({ checkFalsy: true, checkNull: true }),
  body('TotalInvestment', 'Please enter TotalInvestment').exists({ checkFalsy: true, checkNull: true }),
  body('DealId', 'Please enter DealId').exists({ checkFalsy: true, checkNull: true })
]
const DealInvestmentId = [
  param('DealInvestmentId', 'Please enter DealInvestmentId').isInt()
]

const TokenAndDealInvestmentId = [
  query('TokenSymbol', 'Please enter TokenSymbol').exists({ checkFalsy: true, checkNull: true }),
  query('DealInvestmentId', 'Please enter DealInvestmentId').exists({ checkFalsy: true, checkNull: true })
]
const TokenSymbol = [
  query('TokenSymbol', 'Please enter TokenSymbol').exists({ checkFalsy: true, checkNull: true })
]
const TokenSymbolParam = [
  param('TokenSymbol').isInt().withMessage('Please enter TokenSymbol')
]
const WalletAddress = [
  query('WalletAddress', 'Please enter WalletAddress').exists({ checkFalsy: true, checkNull: true })
]

const SubscriptionParams = [
  body('UserAccountId', 'Please enter UserAccountId').exists({ checkFalsy: true, checkNull: true }),
  body('DealInvestmentId', 'Please enter DealInvestmentId').exists({ checkFalsy: true, checkNull: true }),
  body('TokensSubscribed', 'Please enter TokensSubscribed').exists({ checkFalsy: true, checkNull: true })
]

const VotingPostBodyParams = [
  body('UserAccountId', 'Please enter UserAccountId').exists({ checkFalsy: true, checkNull: true }),
  body('ProposalId', 'Please enter ProposalId').exists({ checkFalsy: true, checkNull: true }),
  body('VotingData', 'Please enter VotingData').exists({ checkFalsy: true, checkNull: true })
]

const ProposalId = [
  param('ProposalId', 'Please enter ProposalId').isInt()
]

const UserAccountIdAndDealIdQuery = [
  query('DealId', 'Please enter DealId').exists({ checkFalsy: true, checkNull: true })
]

const ValidateResult = (req, res, next) => {
  const result = validationResult(req)
  if (!result.isEmpty()) {
    return sendResponse(res, 400, result)
  } else {
    next()
  }
}

module.exports = {
  UserAccountId,
  CreateUserPrams,
  Data,
  UserAccountIdQuery,
  DealId,
  KycStatus,
  TransferTokenParams,
  DealInvestmentId,
  TokenAndDealInvestmentId,
  TokenSymbol,
  WalletAddress,
  CreateTokenParams,
  TokenSymbolParam,
  SubscriptionParams,
  VotingPostBodyParams,
  ProposalId,
  UserAccountIdAndDealIdQuery,
  DealIdQury,
  ValidateResult
}
