
const { router } = require('../helpers/signeTransaction')
const hashicorpController = require('../controllers/hashicorpWallet')
const { UserAccountId, ValidateResult } = require('../helpers/validation')

router.get('/:UserAccountId/getWalletDetails', [UserAccountId, ValidateResult], hashicorpController.getWalletDetails)
router.get('/getAllSecrets', hashicorpController.getAllSecrets)
router.get('/unsealTheVault', hashicorpController.unsealTheVault);

module.exports = router
