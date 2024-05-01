const { web3 } = require('./signeTransaction')
const Subscription = require('../../artifacts/contracts/DealSubscription.sol/DealSubscription.json')
const abi = Subscription.abi
const address = process.env.SUBSCRIPTION_ADDRESS

const contract = new web3.eth.Contract(abi, address)
/**
 * @return {object} - Return Token subscription details
*/
async function getSubscriptionDetails(dealInvestmentId) {
  try {
    const getSubscDetails = await contract.methods
      .getDealSubscriptionDetails(dealInvestmentId)
      .call()
    const currentDate = getSubscDetails.timestamp * 1000
    const dateTime = new Date(+currentDate)
    const time = dateTime.toISOString()
    const getSubscriptionDetails = {
      UserAccountId: getSubscDetails.userAccountId,
      DealId: getSubscDetails.dealId,
      DealInvestmentId: getSubscDetails.dealInvestmentId,
      TokensSubscribed: getSubscDetails.investedAmount,
      Timestamp: time
    }
    // console.log(' helper function call(getDealSubscriptionDetails)', getSubscriptionDetails)
    return getSubscriptionDetails
  } catch (err) {
    return err.message
  }
}
/**
 * @return {object} - Check deal and sunscription match if yes turn true or else return false
*/
async function checkDealAndSubscription(userAccountIdId, dealId, dealInvestmentId) {
  try {
    const getSubscDetails = await contract.methods
      .checkDealAndUser(userAccountIdId, dealId, dealInvestmentId)
      .call()
    if (getSubscDetails === true) {
      return true
    } else {
      return false
    }
  } catch (err) {
    return err.message
  }
}

module.exports = { getSubscriptionDetails, checkDealAndSubscription }
