const { signPostTransaction, web3, signPostTransactionWithRetry, sendResponse } = require('../helpers/signeTransaction')
const { getVotingDetails } = require('../helpers/voting')
const { getDealDetailsHelper } = require('../helpers/dealBase')
const { getUserDetails } = require('../helpers/registration.js')
const Voting = require('../../artifacts/contracts/VoteRequest.sol/VoteRequest.json')
const abi = Voting.abi
const address = process.env.VOTING_ADDRESS
const contract = new web3.eth.Contract(abi, address)
const { infoLogger, errorLogger } = require('../helpers/logger.js')
const { Mutex } = require('async-mutex');
const mutex = new Mutex();

web3.eth.handleRevert = true

/**
 * Retrive issuer created deal specific prposal count
 * @param {Object} req- Request to get prposal count based on DealId
 * @param {Object} res- Get prosal count
 */
exports.getProposalPerDeal = async (req, res) => {
  try {
    const deal = await getDealDetailsHelper(req.params.DealId)
    if (deal.DealId == req.params.DealId) {
      const Proposals = await contract.methods.getProposalPerDeal(req.params.DealId).call()
      infoLogger.info(`getProposalPerDeal: ${JSON.stringify(Proposals)}`)
      sendResponse(res, 200, Proposals)
    } else {
      errorLogger.error('router function call(getProposalPerDeal) 404 : Deal not exist')
      sendResponse(res, 404, 'Deal not exist')
    }
  } catch (error) {
    if (error.reason) {
      errorLogger.error(`router function call(getProposalPerDeal) 400 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      errorLogger.error(`router function call(getProposalPerDeal) 500 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
/**
 * Create a voting proposal for deal
 * @param {number} UserAccountId- Issuer AccountId to create proposal for deal
 * @param {number} ProposalId- Proposal unique id
 * @param {Object} VotingData- This object stores proposal with options
 */
exports.addVotingOnBlockchain = async (req, res) => {
  try {
    const release = await mutex.acquire();
    const { UserAccountId, ProposalId, VotingData } = req.body
    const user = await getUserDetails(UserAccountId)
    if (user.KycStatus == false) {
      release();
      errorLogger.error('addVotingOnBlockchain: User KYC status false')
      return sendResponse(res, 400, 'User KYC status false')
    }
    if (user.Group != 1) {
      release();
      errorLogger.error('addVotingOnBlockchain: User not issuer')
      return sendResponse(res, 400, 'User not issuer')
    }
    getDealDetailsHelper(req.params.DealId)
      .then((deal) => {
        if (deal.DealId == req.params.DealId) {
          if (deal.UserAccountId == UserAccountId) {
            signPostTransaction(contract.methods.setVotingData(UserAccountId, req.params.DealId, ProposalId, JSON.stringify(VotingData)), address)
              .then(async (votingData) => {
                const GetVotingDetails = await getVotingDetails(ProposalId)
                GetVotingDetails.VotingHash = votingData
                release();
                infoLogger.info(`addVotingOnBlockchain: ${JSON.stringify(GetVotingDetails)}`)
                sendResponse(res, 201, GetVotingDetails)
              }).catch((error) => {
                release();
                errorLogger.error(`router function call(setVotingData) 400 : ${JSON.stringify(error.reason)}`)
                sendResponse(res, 400, error.reason)
              })
          } else {
            release();
            errorLogger.error('router function call(setVotingData) 404 : User not exist')
            sendResponse(res, 404, 'User not exist')
          }
        } else {
          release();
          errorLogger.error('router function call(setVotingData) 404 : Deal not exist')
          sendResponse(res, 404, 'Deal not exist')
        }
      })

  } catch (error) {
    if (error.reason) {
      release();
      errorLogger.error(`router function call(setVotingData) 400 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      release();
      errorLogger.error(`router function call(setVotingData) 500 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
/**
 * Retrive deal specific proposal details
 * @param {Object} req - Request to get proposal details based on provided ProposalId
 * @param {Object} res - Get proposal detail
 */
exports.getVotingDetails = async (req, res) => {
  try {
    const Voting = await contract.methods.getVotingDetails(req.params.ProposalId).call()
    const VotingResult = {
      UserAccountId: Voting.userAccountId,
      DealId: Voting.dealId,
      ProposalId: Voting.proposalId,
      VotingData: JSON.parse(Voting.votingData)
    }
    infoLogger.info(`getVotingDetails: ${JSON.stringify(VotingResult)}`)
    sendResponse(res, 200, VotingResult)
  } catch (error) {
    if (error.reason) {
      errorLogger.error(`router function call(getVotingDetails) 404 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 404, error.reason)
    } else {
      errorLogger.error(`router function call(getVotingDetails) 404 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
/**
 * Retrive propsal list
 * @param {Object} req - Request to get prposal list based on DealId
 * @param {Object} res - Get proposals list
 */
// exports.getUserDealsVotedProposal = async (req, res) => {
//   try {
//     const deal = await getDealDetailsHelper(req.params.DealId)
//     if (deal.DealId == req.params.DealId) {
//       const DealPropsals = []
//       for (let i = 0; i < deal.length; i++) {
//         const currentDate = deal.timestamp * 1000
//         const d = new Date(+currentDate)
//         const time = d.toISOString()

//         DealPropsals.push({
//           // DealId: events[i].returnValues.dealId,
//           ProposalId: deal.proposalId,
//           VotingData: deal.votingData,
//           Timestamp: time
//         })
//       }
//       infoLogger.info(`getUserDealsVotedProposal: ${JSON.stringify(DealPropsals)}`)
//       sendResponse(res, 200, DealPropsals)
//     } else {
//       errorLogger.error('router function call(getUserDealsVotedProposal) 404 : Deal not exist')
//       sendResponse(res, 404, 'Deal not exist')
//     }
//     // }
//   } catch (error) {
//     if (error.reason) {
//       errorLogger.error(`router function call(getUserDealsVotedProposal) 400 : ${JSON.stringify(error.reason)}`)
//       sendResponse(res, 400, error.reason)
//     } else {
//       errorLogger.error(`router function call(getUserDealsVotedProposal) 500 : ${JSON.stringify(error.message)}`)
//       sendResponse(res, 500, error.message)
//     }
//   }
// }


exports.getUserDealsVotedProposal = async (req, res) => {
  try {
    const deal = await getDealDetailsHelper(req.params.DealId)
    if (deal.DealId == req.params.DealId) {


      const dealProposal = await contract.methods.getUserDealsVotedProposal(req.params.DealId).call()
      const DealPropsals = []
      for (let i = 0; i < dealProposal.length; i++) {

        const Voting = await contract.methods.getVotingDetails(dealProposal[i]).call()
        DealPropsals.push({
          UserAccountId: Voting.userAccountId,
          DealId: Voting.dealId,
          ProposalId: Voting.proposalId,
          VotingData: JSON.parse(Voting.votingData)
        })

      }

      infoLogger.info(JSON.stringify(DealPropsals))
      sendResponse(res, 200, DealPropsals)
    } else {
      errorLogger.error('router function call(getUserDealsVotedProposal) 404 : Deal not exist')
      sendResponse(res, 404, 'Deal not exist')
    }
    // }
  } catch (error) {
    if (error.reason) {
      errorLogger.error(`router function call(getUserDealsVotedProposal) 400 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      errorLogger.error(`router function call(getUserDealsVotedProposal) 500 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
/**
 * Retrive proposal created deal list based on user
 * @param {Object} req - Request to get deal list based on UserAccountId
 * @param {Object} res - Get proposals created deal list
 */
exports.getUsersVotedDeals = async (req, res) => {
  try {
    const user = await getUserDetails(req.params.UserAccountId)
    if (user.UserAccountId == req.params.UserAccountId) {
      const ProposedDeals = await contract.methods.getUsersVotedDeals(req.params.UserAccountId).call()
      infoLogger.info(`router function call(getUsersVotedDeals): ${JSON.stringify(ProposedDeals)}`)
      sendResponse(res, 200, ProposedDeals)
    } else {
      errorLogger.error(`router function call(getUsersVotedDeals) 404 :User not exist }`)
      sendResponse(res, 400, 'User not exist')
    }
  } catch (error) {
    if (error.reason) {
      errorLogger.error(`router function call(getUsersVotedDeals) 404 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      errorLogger.error(`router function call(getUsersVotedDeals) 500 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}

