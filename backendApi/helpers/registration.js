const { web3 } = require('./signeTransaction')
const userContractData = require('../../artifacts/contracts/RegisterUsers.sol/RegisterUsers.json')
const abi = userContractData.abi
const address = process.env.REGISTRATION_ADDRESS
const contract = new web3.eth.Contract(abi, address)
/**
 * @return {object} - Return user details
*/
async function getUserDetails(UserAccountId) {
  try {
    const investorDetail = await contract.methods
      .getUserDetails(UserAccountId)
      .call()
    const Details = {
      UserAccountId: investorDetail.userAccountId,
      KycStatus: investorDetail.kycStatus,
      WalletAddress: investorDetail.walletAddress,
      Group: investorDetail.group,
      Data: JSON.parse(investorDetail.data)
    }
    return Details
  } catch (err) {
    return err.message
  }
}
/**
 * @return {object} - Return wallet address based on UserAccountId
*/
async function getUserWalletAddress(UserAccountId) {
  try {
    const getWalletAddress = await contract.methods
      .getUserWalletAddress(UserAccountId)
      .call()
    return getWalletAddress
  } catch (error) {
    return error.message
  }
}

module.exports = { getUserDetails, getUserWalletAddress }
