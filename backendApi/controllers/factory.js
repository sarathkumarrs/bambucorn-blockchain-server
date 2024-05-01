const { web3, signPostTransaction, signPostTransactionWithRetry, sendResponse } = require('../helpers/signeTransaction')
const { getTokenDetailsFromSymbol, getAddressFromSymbol } = require('../helpers/factory.js')
const { getUserDetails } = require('../helpers/registration.js')
const Factory = require('../../artifacts/contracts/Factory.sol/DirectTokenFactory.json')
const { infoLogger, errorLogger } = require('../helpers/logger.js')
const { Mutex } = require('async-mutex');
const mutex = new Mutex();

const abi = Factory.abi
const address = process.env.FACTORY_ADDRESS
const contract = new web3.eth.Contract(abi, address)
web3.eth.handleRevert = true

/**
 * Create Deal.
 * @param {number} DealId - DealId should be unique for each deal
 * @param {string} TokenName - DealToken name
 * @param {string} TokenSymbol - TokenSymbol should be unique for each deal token
 * @param {number} TotalInvestment - Total investment for each deal
 */
exports.createDeal = async (req, res) => {
  try {
    const release = await mutex.acquire();
    const {
      DealId,
      TokenName,
      TokenSymbol,
      TotalInvestment
    } = req.body
    const user = await getUserDetails(req.params.UserAccountId)
    if (user.UserAccountId === req.params.UserAccountId) {
      if (user.Group === (1).toString()) {
        signPostTransaction(contract.methods.createNewDealToken(req.params.UserAccountId, DealId, TokenName, TokenSymbol, TotalInvestment, process.env.GETH_ADMIN, process.env.SUBSCRIPTION_ADDRESS, process.env.DEAL_ADDRESS, process.env.REGISTRATION_ADDRESS), address)
          .then(async () => {
            const TokenAddress = await getAddressFromSymbol(TokenSymbol)
            const TokenNameAndSymbol = await getTokenDetailsFromSymbol(TokenSymbol)
            const TokenDetails = {
              UserAccountId: req.params.UserAccountId,
              DealId,
              TokenAddress,
              TokenName: TokenNameAndSymbol[0],
              TokenSymbol: TokenNameAndSymbol[1],
              TotalInvestment
            }
            release();
            infoLogger.info(`createDeal: ${JSON.stringify(TokenDetails)}`)
            sendResponse(res, 201, TokenDetails)
          }).catch((error) => {
            release();
            errorLogger.error(`router function call(createNewDealToken) 400 : ${JSON.stringify(error.reason)}`)
            sendResponse(res, 400, error.reason)
          })
      } else {
        release();
        errorLogger.error('router function call(createNewDealToken) 400 : You are not issuer')
        sendResponse(res, 400, 'You are not issuer')
      }
    } else {
      errorLogger.error('router function call(createNewDealToken) 404 : User not Exist')
      sendResponse(res, 404, 'User not Exist')
    }

  } catch (error) {
    if (error.reason) {
      release();
      errorLogger.error(`router function call(createNewDealToken) 400 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      release();
      errorLogger.error(`router function call(createNewDealToken) 400 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
/**
 * Retrive token address from deal TokenSymbol
 * @param {object} req - Request to fetch token address based on the provided TokenSymbol
 */
exports.getAddressFromSymbol = async (req, res) => {
  try {
    const TokenAddress = await getAddressFromSymbol(req.params.TokenSymbol)
    infoLogger.info(JSON.stringify(TokenAddress))
    sendResponse(res, 200, TokenAddress)
  } catch (error) {
    errorLogger.error(`router function call(getAddressFromSymbol) 500 : ${JSON.stringify(error.message)}`)
    sendResponse(res, 500, error.message)
  }
}
/**
 * Retrive deal owner address from deal TokenSymbol
 * @param {object} req - Request to fetch owner address based on the provided TokenSymbol
 */
exports.getTokenDetailsFromSymbol = async (req, res) => {
  try {
    const TokenDetails = await getTokenDetailsFromSymbol(req.params.TokenSymbol)
    const TokenDet = {
      TokenName: TokenDetails[0],
      TokenSymbol: TokenDetails[1]
    }
    infoLogger.info(`router function call(getTokenDetailsFromSymbol): ${JSON.stringify(TokenDet)}`)
    sendResponse(res, 200, TokenDet)
  } catch (error) {
    errorLogger.error(`router function call(getTokenDetailsFromSymbol) 500) : ${JSON.stringify(error.message)}`)
    sendResponse(res, 500, error.message)
  }
}
