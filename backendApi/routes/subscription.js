const { router } = require('../helpers/signeTransaction')
const subController = require('../controllers/subscription')
const { SubscriptionParams, ValidateResult, DealId, DealInvestmentId, UserAccountId } = require('../helpers/validation')

// need to check wallet address already subscribe for that deal
router.post('/:DealId/createDealSubscription', [SubscriptionParams, DealId, ValidateResult], subController.createDealSubscription)

router.get('/:DealInvestmentId/getSubscriptionDetails', [DealInvestmentId, ValidateResult], subController.getSubscriptionDetails)

router.get('/:UserAccountId/getUserSubscriptions', [UserAccountId, ValidateResult], subController.getUserSubscriptions)

router.get('/:UserAccountId/getUserSubscribedDeals', [UserAccountId, ValidateResult], subController.getUserSubscribedDeals)

router.get('/:DealId/getSubscribedUsersForDeal', [DealId, ValidateResult], subController.getSubscribedUsersForDeal)

router.get('/:DealInvestmentId/getSubscriptionAmount', [DealInvestmentId, ValidateResult], subController.getSubscriptionAmount)

module.exports = router
