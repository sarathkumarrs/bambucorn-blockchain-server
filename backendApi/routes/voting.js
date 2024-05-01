const { router } = require('../helpers/signeTransaction')
const { VotingPostBodyParams, ProposalId, ValidateResult, DealId, UserAccountId } = require('../helpers/validation')
const votingController = require('../controllers/voting')

router.get('/:DealId/getProposalPerDeal', [DealId, ValidateResult], votingController.getProposalPerDeal)

router.post('/:DealId/addVotingOnBlockchain', [VotingPostBodyParams, DealId, ValidateResult], votingController.addVotingOnBlockchain)

router.get('/:ProposalId/getVotingDetails', [ProposalId, ValidateResult], votingController.getVotingDetails)

router.get('/:DealId/getUserDealsVotedProposal', [DealId, ValidateResult], votingController.getUserDealsVotedProposal)

router.get('/:UserAccountId/getUsersVotedDeals', [UserAccountId, ValidateResult], votingController.getUsersVotedDeals)

module.exports = router
