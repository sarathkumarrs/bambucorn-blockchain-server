const { web3 } = require('./signeTransaction')
const Voting = require('../../artifacts/contracts/VoteRequest.sol/VoteRequest.json')
const abi = Voting.abi
const address = process.env.VOTING_ADDRESS
const contract = new web3.eth.Contract(abi, address)
/**
 * @return {object} - Return voting details based on proposalId
*/
async function getVotingDetails(proposalId) {
  try {
    const votingDetails = await contract.methods
      .getVotingDetails(proposalId)
      .call()

    const VotingDetails = {
      UserAccountId: votingDetails.userAccountId,
      DealId: votingDetails.dealId,
      ProposalId: votingDetails.proposalId,
      VotingData: JSON.parse(votingDetails.votingData)
    }
    // console.log('helper function call(getVotingDetails)', VotingDetails)
    return VotingDetails
  } catch (err) {
    return err.message
  }
}

module.exports = { getVotingDetails }
