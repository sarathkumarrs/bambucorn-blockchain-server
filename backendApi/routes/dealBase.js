
const { router } = require('../helpers/signeTransaction')

const { DealId, UserAccountId, ValidateResult } = require('../helpers/validation')
const dealController = require('../controllers/dealBase')

router.get('/:DealId/getDealDetails', [DealId, ValidateResult], dealController.getDealDetails)

router.get('/:UserAccountId/getUserDealList', [UserAccountId, ValidateResult], dealController.getUserDealList)

module.exports = router
