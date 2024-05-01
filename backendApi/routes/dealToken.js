const { router } = require('../helpers/signeTransaction')

const { TransferTokenParams, DealInvestmentId, TokenAndDealInvestmentId, TokenSymbol, WalletAddress, DealId, ValidateResult } = require('../helpers/validation')
const tokenController = require('../controllers/dealToken')

router.post('/:DealInvestmentId/transferSubscriptionToken', [TransferTokenParams, DealInvestmentId, ValidateResult], tokenController.transferSubscriptionToken)

router.get('/getTokenTransferDetails', [TokenAndDealInvestmentId, ValidateResult], tokenController.getTokenTransferDetails)

router.get('/getOwnerAddress', [TokenSymbol, ValidateResult], tokenController.getWalletBalance)

router.get('/getWalletBalance', [TokenSymbol, WalletAddress, ValidateResult], tokenController.getWalletBalance)

router.get('/:DealId/getTokenTransferUsersList', [TokenSymbol, DealId, ValidateResult], tokenController.getTokenTransferUsersList)

module.exports = router
