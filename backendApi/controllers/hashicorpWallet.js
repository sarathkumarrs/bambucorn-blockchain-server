const { sendResponse } = require('../helpers/signeTransaction')
const { getWallet, getListWallet, unsealVault } = require('../helpers/hashicorpWallet')
const { infoLogger, errorLogger } = require('../helpers/logger.js')
/**
 * Retrive user wallet Details based on the provided UserAccountId from hashicorp vault.
 * @param {object} req - Request to fetch wallet data based on UserAccountId matching secret
 * @param {object} res - Get response object contain wallet details from hashicorp vault
 */
exports.getWalletDetails = async (req, res) => {
  try {
    if (req.params.UserAccountId) {
      const getWalletDetails = await getWallet(req.params.UserAccountId)
      infoLogger.log(`getWalletDetails:${getWalletDetails}`)
      sendResponse(res, 200, getWalletDetails)
    } else {
      errorLogger.error(`wallet address not fount : ${req.params.UserAccountId}`)
      sendResponse(res, 400, { WalletAddress: req.params.UserAccountId })
    }
  } catch (error) {
    errorLogger.error(`getWalletDetails : ${error.message}`)
    sendResponse(res, 500, error.message)
  }
}


exports.unsealTheVault = async (req, res) => {
  try {
    const result = await unsealVault();
    infoLogger.log(`unsealTheVault: ${JSON.stringify(result)}`)
    sendResponse(res, 200, result)
  } catch (error) {
    errorLogger.error(`unsealTheVault : ${JSON.stringify(error.message)}`)
    sendResponse(res, 500, error.message)
  }
}
/**
 * Retrive All secrets exist in hashicorp vault.
 * @param {object} req - Request to fetch secrets
 * @param {object} res - Get secrets in response object
 */
exports.getAllSecrets = async (req, res) => {
  try {
    const getAllWalletDetails = await getListWallet()
    infoLogger.log(`getAllSecrets:${JSON.stringify(getAllWalletDetails)}`)
    sendResponse(res, 200, getAllWalletDetails)
  } catch (error) {
    errorLogger.error(`getAllSecrets : ${JSON.stringify(error.message)}`)
    sendResponse(res, 500, error.message)
  }
}
