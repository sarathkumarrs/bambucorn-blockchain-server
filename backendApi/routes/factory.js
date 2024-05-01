const { router } = require('../helpers/signeTransaction')
const { CreateTokenParams, TokenSymbolParam, ValidateResult, UserAccountId } = require('../helpers/validation')

const factoryController = require('../controllers/factory')

router.post('/:UserAccountId/createDeal', [CreateTokenParams, UserAccountId, ValidateResult], factoryController.createDeal)

router.get('/:TokenSymbol/getAddressFromSymbol', [TokenSymbolParam, ValidateResult], factoryController.getAddressFromSymbol)

router.get('/:TokenSymbol/getTokenDetailsFromSymbol', [TokenSymbolParam, ValidateResult], factoryController.getTokenDetailsFromSymbol)

module.exports = router
