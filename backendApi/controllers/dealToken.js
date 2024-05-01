const { web3, signPostTransaction, signPostTransactionWithRetry, sendResponse } = require('../helpers/signeTransaction')
const { getAddressFromSymbol, getTokenDetailsFromSymbol } = require('../helpers/factory')
const { getSubscriptionDetails } = require('../helpers/subscription')
const { getTransferTokenDetails } = require('../helpers/dealToken')
const { getDealDetailsHelper } = require('../helpers/dealBase')
const { getUserDetails } = require('../helpers/registration.js')
const DealToken = require('../../artifacts/contracts/DealToken.sol/DirectDealToken.json')
const { infoLogger, errorLogger } = require('../helpers/logger.js')
const { Mutex } = require('async-mutex');
const mutex = new Mutex();

const abi = DealToken.abi

/**
 * Transfer tokens into investors wallet .
 * @param {string} TokenSymbol - Token symbol should match with dealId
 * @param {number} UserAccountId - Investor userAccountId
 * @param {number} DealId - Investor should already subscribed with maching dealId
 * @param {number} TokenAmount - Subscription amount should be match with TokenAmount
 */
exports.transferSubscriptionToken = async (req, res) => {
  try {
    const release = await mutex.acquire();
    const { TokenSymbol, UserAccountId, DealId, TokenAmount } = req.body
    const user = await getUserDetails(UserAccountId);
    if (user.KycStatus == false) {
      release();
      errorLogger.error('transferSubscriptionToken: User KYC status false')
      return sendResponse(res, 400, 'User KYC status false')
    }
    const SubscriptionDetails = await getSubscriptionDetails(req.params.DealInvestmentId)
    if (SubscriptionDetails.DealInvestmentId == req.params.DealInvestmentId) {
      if (SubscriptionDetails.UserAccountId == UserAccountId) {
        if (SubscriptionDetails.DealId == DealId) {
          const address = await getAddressFromSymbol(TokenSymbol)
          const contract = new web3.eth.Contract(abi, address)
          signPostTransaction(contract.methods.transferDealTokens(UserAccountId, DealId, req.params.DealInvestmentId, TokenAmount), address)
            .then(async (transaction) => {
              const MintedDetails = await getTransferTokenDetails(req.params.DealInvestmentId, TokenSymbol)
              console.log("MintedDetails+++++++++++", MintedDetails)
              MintedDetails.TransactionHash = transaction
              release();
              infoLogger.info(`transferSubscriptionToken : ${JSON.stringify(MintedDetails)}`)
              sendResponse(res, 201, MintedDetails)
            }).catch((error) => {
              release();
              errorLogger.error(`router function call(transferDealTokens) 400: ${JSON.stringify(error.reason)}`)
              sendResponse(res, 400, error.reason)
            })

        } else {
          release();
          errorLogger.error('router function call(transferDealTokens) 400 : Deal Id or userAccountId not valid')
          sendResponse(res, 400, 'Deal Id or userAccountId not valid')
        }
      } else {
        release();
        errorLogger.error('router function call(transferDealTokens) 400 : Investor not subscribed for this deal')
        sendResponse(res, 400, 'Investor not subscribed for this deal')
      }
    } else {
      release();
      errorLogger.error('router function call(transferDealTokens) 404 : InvestmentId not exist')
      sendResponse(res, 404, 'InvestmentId not exist')
    }
  } catch (error) {
    if (error.reason) {
      release();
      errorLogger.error(`router function call(transferDealTokens) 400 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      release();
      errorLogger.error(`router function call(transferDealTokens) 500: ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
/**
 * Retrive transfer token detail based on  Deal TokenSymbol and DealInvestmentId.
 * @param {string} TokenSymbol - Token symbol should match with investor sunscribed dealId
 * @param {number} DealInvestmentId - Check dealInvestmntId
 */
exports.getTokenTransferDetails = async (req, res) => {
  try {
    const { TokenSymbol, DealInvestmentId } = req.query
    const getSymbol = await getTokenDetailsFromSymbol(TokenSymbol)
    const Details = await getSubscriptionDetails(DealInvestmentId)
    const deal = await getDealDetailsHelper(Details.DealId)
    const user = await getUserDetails(Details.UserAccountId);

    if (user.KycStatus == false) {
      errorLogger.error('GettokentransferDetails: User KYC status false')
      return sendResponse(res, 400, 'User KYC status false')
    }

    if (DealInvestmentId != Details.DealInvestmentId) {
      errorLogger.error('GettokentransferDetails: DealInvestmentId does not exist on platform')
      return sendResponse(res, 400, 'DealInvestmentId does not exist on platform')
    }
    if (getSymbol[1] != TokenSymbol) {
      errorLogger.error('GettokentransferDetails: Token Symbol does not exist on platform')
      return sendResponse(res, 400, 'Token Symbol does not exist on platform')
    }

    if (getSymbol[1] != TokenSymbol && DealInvestmentId != Details.DealInvestmentId) {
      errorLogger.error('GettokentransferDetails: DealInvestmentId and TokenSymbol not valid')
      return sendResponse(res, 400, 'DealInvestmentId and TokenSymbol not valid')
    }
    if (getSymbol[1] != TokenSymbol && DealInvestmentId == Details.DealInvestmentId) {
      errorLogger.error('GettokentransferDetails: TokenSymbol not vaild')
      return sendResponse(res, 400, 'TokenSymbol not vaild')
    }
    if (getSymbol[1] == TokenSymbol && DealInvestmentId != Details.DealInvestmentId) {
      errorLogger.error('GettokentransferDetails: Deal investment id not found for this token')
      return sendResponse(res, 404, 'Deal investment id not found for this token')
    }
    if (Details.DealInvestmentId != DealInvestmentId && getSymbol[1] != TokenSymbol && deal.TokenSymbol != TokenSymbol) {
      errorLogger.error('GettokentransferDetails: Token symbol and deal investment id not match')
      return sendResponse(res, 404, 'Token symbol and deal investment id not match')
    }
    if (Details.DealInvestmentId == DealInvestmentId && getSymbol[1] == TokenSymbol && Details.DealId == deal.DealId && deal.TokenSymbol != TokenSymbol) {
      errorLogger.error('GettokentransferDetails: Token Symbol not match withInvestment')
      return sendResponse(res, 400, 'Token Symbol not match withInvestment')
    }

    const address = await getAddressFromSymbol(TokenSymbol)
    const contract = new web3.eth.Contract(abi, address)
    const check = await contract.methods.checkUserAlreadyInvested(Details.UserAccountId, Details.DealId, Details.DealInvestmentId).call()
    if (check == true) {
      const MintingDetails = await contract.methods
        .getTransferTokenDetails(DealInvestmentId)
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
      infoLogger.info(`getTokenTransferDetails : ${JSON.stringify(TokenDetails)}`)
      sendResponse(res, 200, TokenDetails)
    } else {
      errorLogger.error('router function call(getAllMintingDetails) 404 : Already not invested in this deal')
      sendResponse(res, 404, 'Already not invested in this deal')
    }
  } catch (error) {
    if (error.reason) {
      errorLogger.error(`router function call(getAllMintingDetails) 400 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      errorLogger.error(`router function call(getAllMintingDetails) 500 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
/**
 * Retrive Issuer wallet address based on TokenSymbol .
 * @param {string} TokenSymbol
 */
exports.getOwnerAddress = async (req, res) => {
  try {
    const { TokenSymbol } = req.query
    const address = await getAddressFromSymbol(TokenSymbol)
    const contract = new web3.eth.Contract(abi, address)
    const OwnerWalletAddress = await contract.methods.getOwnerAddress().call()
    infoLogger.info(`getOwnerAddress : ${JSON.stringify(OwnerWalletAddress)}`)
    sendResponse(res, 200, OwnerWalletAddress)
  } catch (error) {
    if (error.reason) {
      errorLogger.error(`router function call(getOwnerAddress) 404 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 404, error.message)
    } else {
      errorLogger.error(`router function call(getOwnerAddress) 500 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}

/**
 * Retrive Issuer wallet balance based on TokenSymbol .
 * @param {string} TokenSymbol
 */
exports.getWalletBalance = async (req, res) => {
  try {
    const { TokenSymbol, WalletAddress } = req.query
    const address = await getAddressFromSymbol(TokenSymbol)
    const contract = new web3.eth.Contract(abi, address)
    const UserWalletTokenBalance = await contract.methods
      .getWalletBalance(WalletAddress)
      .call()
    const WalletBal = {
      WalletAddress,
      TokenSymbol,
      WalletBalance: UserWalletTokenBalance
    }
    infoLogger.info(`getWalletBalance : ${JSON.stringify(UserWalletTokenBalance)}`)
    sendResponse(res, 200, WalletBal)
  } catch (error) {
    if (error.reason) {
      errorLogger.error(`router function call(getWalletBalance) 404 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 404, error.reason)
    } else {
      errorLogger.error(`router function call(getWalletBalance) 500 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
/**
 * Retrive Invested users list into specified deal token symbol.
 * @param {string} TokenSymbol - Request to fetch all investors list with matching token symbol
 */
exports.getTokenTransferUsersList = async (req, res) => {
  try {
    const { TokenSymbol } = req.query
    const getSym = await getTokenDetailsFromSymbol(TokenSymbol)
    const deal = await getDealDetailsHelper(req.params.DealId)

    if (getSym[1] != TokenSymbol) {
      errorLogger.error('getTokenTransferUsersList 400')
      return sendResponse(res, 400, 'TokenSymbol not exist')
    }

    if (deal.DealId != req.params.DealId && deal.TokenSymbol != TokenSymbol) {
      errorLogger.error('getTokenTransferUsersList 404')
      return sendResponse(res, 404, 'DealId not Exist')
    }

    if (deal.TokenSymbol == TokenSymbol && deal.DealId == req.params.DealId) {
      const address = await getAddressFromSymbol(TokenSymbol)
      const contract = new web3.eth.Contract(abi, address)
      const minters = await contract.methods.getAllInvestorsForDeal(req.params.DealId).call()
      //  UserAccountId: events[0].returnValues.userAccountId,
      // DealId: events[0].returnValues.dealId,
      // WalletAddress: events[0].returnValues.walletAddress,
      // DealInvestmentId: events[0].returnValues.dealInvestmentId,
      // TokenName: events[0].returnValues.tokenName,
      // TokenSymbol: events[0].returnValues.tokensymbol,
      // TokenAmount: events[0].returnValues.tokenBalance,
      // TransferTokenTime: time
      infoLogger.info(`getTokenTransferUsersList : ${JSON.stringify(minters)}`)
      sendResponse(res, 200, minters)
    } else {
      errorLogger.error('router function call(getAllInvestorsForDeal) 400 : Invalid TokenSymbol')
      sendResponse(res, 400, 'Invalid TokenSymbol')
    }
  } catch (error) {
    if (error.reason) {
      errorLogger.error(`router function call(getAllInvestorsForDeal) 400 ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      errorLogger.error(`router function call(getAllInvestorsForDeal) 400: ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
