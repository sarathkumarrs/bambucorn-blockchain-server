const { web3 } = require('./signeTransaction')
const Factory = require('../../artifacts/contracts/Factory.sol/DirectTokenFactory.json')
const abi = Factory.abi
const address = process.env.FACTORY_ADDRESS
const contract = new web3.eth.Contract(abi, address)

/**
 * @return {object} - Return contract address from TokenSymbol
*/
async function getAddressFromSymbol(TokenSymbol) {
  try {
    const TokenAddress = await contract.methods
      .getAddressFromSymbol(TokenSymbol)
      .call()
    return TokenAddress
  } catch (err) {
    return err.message
  }
}
/**
 * @return {object} - Return token details based on provided TokenSymbol
*/
async function getTokenDetailsFromSymbol(TokenSymbol) {
  try {
    const TokenDetails = await contract.methods
      .getTokenDetailsFromSymbol(TokenSymbol)
      .call()
    return TokenDetails
  } catch (err) {
    return err.message
  }
}

module.exports = { getAddressFromSymbol, getTokenDetailsFromSymbol }
