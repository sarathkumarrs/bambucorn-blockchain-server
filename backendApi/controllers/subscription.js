const { web3, signPostTransaction, signPostTransactionWithRetry, sendResponse } = require('../helpers/signeTransaction.js')
const Subscription = require('../../artifacts/contracts/DealSubscription.sol/DealSubscription.json')
const { getUserDetails } = require('../helpers/registration.js')
const { getSubscriptionDetails } = require('../helpers/subscription.js')
const { getDealDetailsHelper } = require('../helpers/dealBase.js')
const { infoLogger, errorLogger } = require('../helpers/logger.js')
const { Mutex } = require('async-mutex');
const mutex = new Mutex();

const abi = Subscription.abi
const address = process.env.SUBSCRIPTION_ADDRESS
const contract = new web3.eth.Contract(abi, address)

web3.eth.handleRevert = true

/**
 * Create a user subscrition for deal
 * @param {number} UserAccountId- Investor account should be kyc vryfied
 * @param {number} DealInvestmentId- Unique investment id
 * @param {number} TokensSubscribed- Number of tokens investor can subscribe for the deal
 */
exports.createDealSubscription = async (req, res) => {
  try {
    const release = await mutex.acquire();
    const {
      UserAccountId,
      DealInvestmentId,
      TokensSubscribed
    } = req.body

    const deal = await getDealDetailsHelper(req.params.DealId)
    const user = await getUserDetails(UserAccountId)
    if (user.KycStatus == false) {
      release();
      errorLogger.error('GettokentransferDetails: User KYC status false')
      return sendResponse(res, 400, 'User KYC status false')
    }
    if (deal.DealId === req.params.DealId) {
      if (user.UserAccountId === (UserAccountId).toString()) {
        signPostTransaction(contract.methods
          .createDealSubscription(
            UserAccountId,
            req.params.DealId,
            DealInvestmentId,
            TokensSubscribed
          ), address)
          .then(async (createDealSubscriptioninfo) => {
            console.log("createDealSubscriptioninfo", createDealSubscriptioninfo)
            const SubscriptionDetails = await getSubscriptionDetails(DealInvestmentId)
            SubscriptionDetails.TransactionHash = createDealSubscriptioninfo
            release();
            infoLogger.info(`createDealSubscription: ${JSON.stringify(SubscriptionDetails)}`)
            sendResponse(res, 201, SubscriptionDetails)
          }).catch((error) => {
            release();
            errorLogger.error(`router function call(createDealSubscription) 400 : ${JSON.stringify(error.reason)}`)
            sendResponse(res, 400, error.reason)
          })
      } else {
        release();
        errorLogger.error('router function call(createDealSubscription) 400 : User not exist')
        sendResponse(res, 400, 'User not exist')
      }
    } else {
      release();
      errorLogger.error('router function call(createDealSubscription) 404 : Deal not exist')
      sendResponse(res, 404, 'Deal not exist')
    }
  } catch (error) {
    if (error.reason) {
      release();
      errorLogger.error(`router function call(createDealSubscription) 400 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      release();
      errorLogger.error(`router function call(createDealSubscription) 500 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
/**
 * Retrive subscription details subscribed for specific deal based on DealInvestmentId
 * @param {Object} req- Request to get subscription details for investor based on DealInvestmentId
 * @param {Object} res- Get investor subscription details
 */
exports.getSubscriptionDetails = async (req, res) => {
  try {
    const GetSubscDetailsinfo = await getSubscriptionDetails(
      req.params.DealInvestmentId
    )
    if (GetSubscDetailsinfo.DealInvestmentId === req.params.DealInvestmentId) {
      infoLogger.info(`router function call(getSubscriptionDetails):${JSON.stringify(GetSubscDetailsinfo)}`)
      sendResponse(res, 200, GetSubscDetailsinfo)
    } else {
      errorLogger.error(`router function call(getSubscriptionDetails) 404 : ${JSON.stringify(GetSubscDetailsinfo)}`)
      sendResponse(res, 404, GetSubscDetailsinfo)
    }
  } catch (error) {
    errorLogger.error(`router function call(getSubscriptionDetails) 500 : ${JSON.stringify(error.message)}`)
    sendResponse(res, 500, error.message)
  }
}
/**
 * Retrive subscription details subscribed for specific deal based on DealInvestmentId
 * @param {Object} req- Request to get subscription details for investor based on DealInvestmentId
 * @param {Object} res- Get investor subscription details
 */
exports.getUserSubscriptions = async (req, res) => {
  try {
    const user = await getUserDetails(req.params.UserAccountId)
    if (user.UserAccountId === (req.params.UserAccountId).toString()) {
      const getUserSubscription = await contract.methods
        .getUserSubscriptions(req.params.UserAccountId)
        .call()
      const UserSubscriptions = []
      for (let i = 0; i < getUserSubscription.length; i++) {
        const deal = await getSubscriptionDetails(getUserSubscription[i])
        console.log('deal', deal)
        UserSubscriptions.push({
          UserAccountId: deal.UserAccountId, //not in old code
          DealId: deal.DealId,
          DealInvestmentId: deal.DealInvestmentId,
          SubscriptionAmount: deal.TokensSubscribed,
          Timestamp: deal.Timestamp
        })
      }
      infoLogger.info(`router function call(getUserSubscriptions) : ${JSON.stringify(UserSubscriptions)}`)
      sendResponse(res, 200, UserSubscriptions)
    } else {
      errorLogger.error('router function call(getUserSubscriptions) 404', 'User not exist')
      sendResponse(res, 404, 'User not exist')
    }
  } catch (error) {
    if (error.reason) {
      errorLogger.error(`router function call(getUserSubscriptions) 400 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      errorLogger.error(`router function call(getUserSubscriptions) 500 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
/**
 * Retrive user subscribed deal list
 * @param {Object} req- Request to get list of subscribed deals based on DealInvestmentId
 * @param {Object} res- Get investor subscribed deal list
 */
exports.getUserSubscribedDeals = async (req, res) => {
  try {
    const user = await getUserDetails(req.params.UserAccountId)
    if (user.UserAccountId === (req.params.UserAccountId).toString()) {
      const GetUserSubscribedDeal = await contract.methods
        .getUserSubscribedDeals(req.params.UserAccountId)
        .call()
      const UserSubscribedDeals = []
      for (let i = 0; i < GetUserSubscribedDeal.length; i++) {
        const deal = await getDealDetailsHelper(GetUserSubscribedDeal[i])
        UserSubscribedDeals.push({
          DealId: deal.DealId,
          DealInvestmentId: deal.TotalInvestment,
          // SubscriptionAmount: events[i].returnValues.amount,
          // Timestamp: deal.timestamp
          //timestamp
        })
      }
      infoLogger.info(`router function call(getUserSubscribedDeals): ${JSON.stringify(UserSubscribedDeals)}`)
      sendResponse(res, 200, UserSubscribedDeals)
    } else {
      errorLogger.error('router function call(getUserSubscribedDeals) 404 : User not exist')
      sendResponse(res, 404, 'User not exist')
    }
  } catch (error) {
    if (error.reason) {
      errorLogger.error(`router function call(getUserSubscribedDeals) 400 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      errorLogger.error(`router function call(getUserSubscribedDeals) 500 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}

/**
 * Retrive subscribed users list based on DealId
 * @param {Object} req- Request to get subscribed users list for provided deal
 * @param {Object} res- Get subscribed users list for deal
 */
exports.getSubscribedUsersForDeal = async (req, res) => {
  try {
    const deal = await getDealDetailsHelper(req.params.DealId)
    if (deal.DealId === req.params.DealId) {
      const Subscribers = await contract.methods
        .getSubscribedUsersList(req.params.DealId)
        .call()
      console.log(Subscribers)
      const SubscriberList = [];
      for (let i = 0; i < Subscribers.length; i++) {
        const getUsers = await getUserDetails(Subscribers[i])

        SubscriberList.push({
          UserAccountId: getUsers.UserAccountId,
          WalletAddress: getUsers.WalletAddress
          //investmentid subscriptionAmount timestampt
        })
      }
      infoLogger.info(`router function call(getSubscribedUsersList): ${JSON.stringify(SubscriberList)}`)
      sendResponse(res, 200, SubscriberList)
    } else {
      errorLogger.error('router function call(getSubscribedUsersList)404 : Deal not exist')
      sendResponse(res, 404, 'Deal not exist')
    }
  } catch (error) {
    if (error.reason) {
      errorLogger.error(`router function call(getSubscribedUsersList) 400 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      errorLogger.error(`router function call(getSubscribedUsersList) 500 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
/**
 * Retrive user subscription amount
 * @param {Object} req- Request to get subscribed amount  based on user account and deal investment id
 * @param {Object} res- Get subscription amount
 */
exports.getSubscriptionAmount = async (req, res) => {
  try {
    const sub = await getSubscriptionDetails(req.params.DealInvestmentId)
    if (sub.DealInvestmentId === req.params.DealInvestmentId) {
      const SubscritionAmount = await contract.methods
        .getSubscriptionAmount(sub.UserAccountId, req.params.DealInvestmentId).call()
      infoLogger.info(`router function call(getSubscriptionAmount): ${JSON.stringify(SubscritionAmount)}`)
      sendResponse(res, 200, SubscritionAmount)
    } else {
      errorLogger.error('router function call(getSubscriptionAmount) 404 : Subscription id or deal id not exist')
      sendResponse(res, 404, 'Subscription id or deal id not exist')
    }
  } catch (error) {
    if (error.reason) {
      errorLogger.error(`router function call(getSubscriptionAmount) 400 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      errorLogger.error(`router function call(getSubscriptionAmount) 500 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
