const { router } = require('../helpers/signeTransaction')
const userController = require('../controllers/registration')

const { UserAccountId, CreateUserPrams, UserAccountIdQuery, DealIdQury, KycStatus, Data, ValidateResult } = require('../helpers/validation')

router.get('/getAllUsersDetails', userController.getAllUsers)

router.get('/:UserAccountId/getUserDetails', [UserAccountId, ValidateResult], userController.getUserDetails)

router.get('/getDealSpecificWalletDetails', [UserAccountIdQuery, DealIdQury, ValidateResult], userController.getDealSpecificWalletDetails)

router.get('/:UserAccountId/getAllUserWalletTokenDetails', [UserAccountId, ValidateResult], userController.getAllUserWalletTokenDetails)

router.post('/createUser', [CreateUserPrams, ValidateResult], userController.createUser)

router.put('/:UserAccountId/updateUserKYC', [UserAccountId, KycStatus, ValidateResult], userController.updateUserKYC)

router.get('/:UserAccountId/getUserWalletAddress', [UserAccountId, ValidateResult], userController.getUserWalletAddress)

router.put('/:UserAccountId/updateUserData', [Data, UserAccountId, ValidateResult], userController.updateUserData)

module.exports = router
