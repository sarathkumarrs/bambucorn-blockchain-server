const { web3 } = require('./signeTransaction')
const DealToken = require('../../artifacts/contracts/DealToken.sol/DirectDealToken.json')
const abi = DealToken.abi
const { getAddressFromSymbol } = require('./factory.js')
/**
 * @return {object} - Return transfer token details based on dealInvestmentId
*/
async function getTransferTokenDetails(dealInvestmentId, TokenSym) {
  try {
    const address = await getAddressFromSymbol(TokenSym)
    const contract = new web3.eth.Contract(abi, address)
    const MintingDetails = await contract.methods
      .getTransferTokenDetails(dealInvestmentId)
      .call()
    const currentDate = MintingDetails.time * 1000
    const dateTime = new Date(+currentDate)
    const time = dateTime.toISOString()
    const TokenDetails = {
      UserAccountId: MintingDetails.userAccountId,
      DealId: MintingDetails.dealId,
      WalletAddress: MintingDetails.walletAddress,
      DealInvestmentId: MintingDetails.dealInvestmentId,
      TokenName: MintingDetails.tokenName,
      TokenSymbol: MintingDetails.tokensymbol,
      TokenAmount: MintingDetails.tokenBalance,
      MintingTime: time
    }
    console.log("minting details_____________", TokenDetails)
    return TokenDetails
  } catch (err) {
    return err.message
  }
}

module.exports = { getTransferTokenDetails }
