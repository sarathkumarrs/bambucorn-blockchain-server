
const { web3 } = require('./signeTransaction')
const Deal = require('../../artifacts/contracts/Deal.sol/DealContract.json')
const abi = Deal.abi
const address = process.env.DEAL_ADDRESS
const contract = new web3.eth.Contract(abi, address)
/**
 * @return {object} - Get Deal details based on provided dealId
*/

async function getDealDetailsHelper(dealId) {
  try {
    const getDealInfo = await contract.methods
      .getDealDetails(dealId)
      .call()
    const Deal = {
      UserAccountId: getDealInfo.userAccountId,
      DealId: getDealInfo.dealId,
      TokenName: getDealInfo.tokenName,
      TokenSymbol: getDealInfo.tokenSymbol,
      TotalInvestment: getDealInfo.totalSupply,
      TokenContractAddress: getDealInfo.tokenContractAddress
    }
    // console.log('helper function call(getDealDetailsHelper)', Deal)
    return Deal
  } catch (err) {
    return err.message
  }
}
/**
 * @return {object} - Get Deal list based on UserAccountId
*/
async function getUserDealListHelper(userAccountId) {
  try {
    const getUserDealListInfo = await contract.methods
      .getUsersDealList(userAccountId)
      .call()
    const AllDealList = []
    for (let i = 0; i < getUserDealListInfo.length; i++) {
      const dealDetails = await getDealDetailsHelper(getUserDealListInfo[i]);
      // const currentDate = getUserDealListInfo.timestamp * 1000
      // const d = new Date(+currentDate)
      // const time = d.toISOString()
      AllDealList.push({
        DealId: dealDetails.DealId,
        TokenSymbol: dealDetails.TokenSymbol,
        TotalInvestment: dealDetails.TotalInvestment,
        // Timestamp: time                          
      })
    }
    // console.log(' helper function call(getUserDealListHelper)', getUserDealListHelper)
    return AllDealList
  } catch (err) {
    return err.message
  }
}

module.exports = {
  getDealDetailsHelper, getUserDealListHelper
}
