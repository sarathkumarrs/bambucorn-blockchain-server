const { web3, sendResponse } = require('../helpers/signeTransaction')
const { getDealDetailsHelper, getUserDealListHelper } = require('../helpers/dealBase')
const { getUserDetails } = require('../helpers/registration')
const { infoLogger, errorLogger } = require('../helpers/logger.js')

web3.eth.handleRevert = true

/**
 * Retrieves and displays deal details based on the provided DealId.
 * @param {object} req - The request object used to fetch deal details using DealId.
 * @param {Object} res - The response object used to return the deal details as an object.
 */
exports.getDealDetails = async (req, res) => {
  try {
    const DealDetails = await getDealDetailsHelper(req.params.DealId)
    if (DealDetails.DealId === req.params.DealId) {
      infoLogger.info(`getDealDetails : ${JSON.stringify(DealDetails)}`)
      sendResponse(res, 200, DealDetails)
    } else {
      errorLogger.error(`router function call(getDealDetailsHelper) 404: ${JSON.stringify(DealDetails)}`)
      sendResponse(res, 404, 'DealId not found')
    }
  } catch (error) {
    errorLogger.error(`router function call(getDealDetailsHelper) 500 : ${JSON.stringify(error.message)}`)
    sendResponse(res, 500, error.message)
  }
}
/**
 * Retrieves and displays user created deal list based on the provided UserAccountId.
 * @param {object} req - The request object used to fetch deal List using UserAccountId.
 * @param {Object} res - The response object used to return the deal list as an object.
 */
exports.getUserDealList = async (req, res) => {
  try {
    const user = await getUserDetails(req.params.UserAccountId)
    if (user.UserAccountId === req.params.UserAccountId) {
      if (user.Group === (1).toString()) {
        const UserDealList = await getUserDealListHelper(req.params.UserAccountId)
        infoLogger.info(`getUserDealList : ${JSON.stringify(UserDealList)}`)
        sendResponse(res, 200, UserDealList)
      } else {
        errorLogger.error(`router function call(getUserDealList) 400: You are not issuer`)
        sendResponse(res, 400, 'You are not issuer')
      }
    } else {
      errorLogger.error('router function call(getUserDealListHelper) 404 : User not exist')
      sendResponse(res, 404, 'User not exist')
    }
  } catch (error) {
    errorLogger.error(`router function call(getUserDealListHelper) 500: ${JSON.stringify(error.message)}`)
    sendResponse(res, 500, error.message)
  }
}
