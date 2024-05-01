// eslint-disable-next-line comma-spacing
const { web3, signPostTransaction, signPostTransactionWithRetry, sendResponse } = require('../helpers/signeTransaction')
const userContractData = require('../../artifacts/contracts/RegisterUsers.sol/RegisterUsers.json')
const { getUserDetails } = require('../helpers/registration.js')
const getNewAccount = require('../helpers/hashicorpWallet')
const { getDealDetailsHelper } = require('../helpers/dealBase')
const { infoLogger, errorLogger } = require('../helpers/logger.js')
const abi = userContractData.abi
const address = process.env.REGISTRATION_ADDRESS
const contract = new web3.eth.Contract(abi, address)
//const { reportNotificationsQueue, addReportNotification } = require('../helpers/redis.js')
const { Mutex } = require('async-mutex');
const mutex = new Mutex();

web3.eth.handleRevert = true

/**
 * Retrive All registered users on blockchain.
 * @param {object} res - Get list of registered users in the form of object
 */
exports.getAllUsers = async (req, res) => {
  try {
    const events = await contract.getPastEvents('CreateNewUser', {
      // filter: {
      //   userAccountId: [req.params.UserAccountId] // Filter the second indexed parameter with value 123
      // },
      fromBlock: 0,
      toBlock: 'latest'
    })
    const AllUsersList = []
    for (let i = 0; i < events.length; i++) {
      const currentDate = events[i].returnValues.timestamp * 1000
      const dateTime = new Date(+currentDate)
      const time = dateTime.toISOString()
      AllUsersList.push({
        UserAccountId: events[i].returnValues.userAccountId,
        WalletAddress: events[i].returnValues.walletAddress,
        Group: events[i].returnValues.group,
        KycStatus: events[i].returnValues.kycStatus,
        Timestamp: time
      })
    }
    infoLogger.info(` Get All users : ${JSON.stringify(AllUsersList)}`)
    sendResponse(res, 200, AllUsersList)
  } catch (error) {
    errorLogger.error(`router function call(getAllUsersDetails) 500 : ${JSON.stringify(error.message)}`)
    sendResponse(res, 500, error.message)
  }
}
/**
 * Retrive users details based on provoided userAccountId.
 * @param {object} req- Request to fetch useres details with matching UserAccountId
 * @param {object} res- Get user information based on requested userAccountId
 */
exports.getUserDetails = async (req, res) => {
  try {
    const UserDetails = await getUserDetails(req.params.UserAccountId)
    if (UserDetails.UserAccountId === req.params.UserAccountId) {
      // console.log(typeof (UserDetails.UserAccountId), typeof (req.params.UserAccountId))
      infoLogger.info(`Get users details${JSON.stringify(UserDetails)}`)
      sendResponse(res, 200, UserDetails)
    } else {
      errorLogger.error(`router function call(getUserDetails) 404 : ${JSON.stringify(UserDetails)}`)
      sendResponse(res, 404, UserDetails)
    }
  } catch (error) {
    errorLogger.error(`router function call(getUserDetails) 500 : ${JSON.stringify(error.message)}`)
    sendResponse(res, 500, error.message)
  }
}
/**
 * Retrive Deal specific user wallet details.
 * @param {number} UserAccountId- Request to fetch users details with matching UserAccountId
 * @param {number} DealId- Get user information based on requested userAccountId
 */
exports.getDealSpecificWalletDetails = async (req, res) => {
  try {
    const { UserAccountId, DealId } = req.query
    const UserDetails = await getUserDetails(UserAccountId)
    const deal = await getDealDetailsHelper(DealId)
    if (UserDetails.UserAccountId == UserAccountId) {
      if (deal.DealId == DealId) {
        const UserTokenDetails = await contract.methods.getDealSpecificWalletDetails(UserAccountId, DealId).call()
        const Token = []
        for (const investment of UserTokenDetails) {
          Token.push({
            UserAccountId: investment[0],
            DealId: investment[1],
            TokenSymbol: investment[2],
            TokenBalance: investment[3]
          })
        }
        infoLogger.info(`getDealSpecificWalletDetails : ${JSON.stringify(Token)}`)
        sendResponse(res, 200, Token)
      } else {
        errorLogger.error('router function call(getDealSpecificWalletDetails) 404 : Deal not exist')
        sendResponse(res, 404, 'Deal not exist')
      }
    } else {
      errorLogger.error('router function call(getDealSpecificWalletDetails) 404 : User not exist')
      sendResponse(res, 404, 'User not exist')
    }
  } catch (error) {
    if (error.reason) {
      errorLogger.error(`router function call(getDealSpecificWalletDetails) 400 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      errorLogger.error(`router function call(getDealSpecificWalletDetails) 400 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
/**
 * Retrive All investor wallet token details based on provided userAccountId
 * @param {object} req- Request to fetch invested wallet token details based on provided userAccountId
 * @param {object} res- Get list on invested tokens stored in wallet.
 */
exports.getAllUserWalletTokenDetails = async (req, res) => {
  try {
    const user = await getUserDetails(req.params.UserAccountId)
    if (user.UserAccountId == req.params.UserAccountId) {
      const UserAllTokensDetails = await contract.methods.getAllUserWalletDetails(req.params.UserAccountId).call()
      const Token = []
      for (const investment of UserAllTokensDetails) {
        Token.push({
          UserAccountId: investment[0],
          DealId: investment[1],
          TokenSymbol: investment[2],
          TokenBalance: investment[3]
        })
      }
      infoLogger.info(`getAllUserWalletTokenDetails : ${JSON.stringify(Token)}`)
      sendResponse(res, 200, Token)
    } else {
      errorLogger.error('router function call(getAllUserWalletDetails) 404 : User not exist')
      sendResponse(res, 404, 'User not exist')
    }
  } catch (error) {
    if (error.reason) {
      errorLogger.error(`router function call(getAllUserWalletDetails) 400 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      errorLogger.error(`router function call(getAllUserWalletDetails) 500 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
/**
 * Create User- investor/issuer
 * @param {number} UserAccountId- Request to fetch invested wallet token details based on provided userAccountId
 * @param {number} Group- 0 indicate investor and 1 indicate issuer .
 * @param {boolean} KycStatus- Stored user kyc status true/false
 */
exports.createUser = async (req, res) => {
  try {
    const release = await mutex.acquire();
    const { UserAccountId, Group, KycStatus } = req.body
    const Data = JSON.stringify({})
    if (Group == 0 || Group == 1) {
      if (KycStatus == true) {
        contract.methods.checkUser(UserAccountId).call()
          .then(async (isUserExist) => {
            if (isUserExist === false) {
              getNewAccount.createWallet(UserAccountId)
                .then(async (walletAddress) => {
                  // console.log(walletAddress, walletAddress)
                  signPostTransaction(contract.methods
                    .createUser(UserAccountId, Group, KycStatus, walletAddress.data.data.address, Data), address)
                    .then(async () => {
                      const UserDetails = await getUserDetails(UserAccountId)
                      release();
                      infoLogger.info(`createUser : ${JSON.stringify(UserDetails)}`)
                      sendResponse(res, 201, UserDetails)
                    }).catch((error) => {
                      release();
                      errorLogger.error(`router function call in promises(createUser) 400, ${JSON.stringify(error)}`)
                      sendResponse(res, 400, error)
                    });
                }).catch((error) => {
                  release();
                  errorLogger.error(`router function call in promises(createUser) 500, ${JSON.stringify(error)}`)
                  sendResponse(res, 500, `Something went wrong in wallet creation${JSON.stringify(error)}`)
                });
            } else {
              release();
              errorLogger.error('router function call(createUser) 400 : User Already Exist')
              sendResponse(res, 400, 'User Already Exist')
            }
          })
      } else {
        release();
        errorLogger.error('router function call(createUser) 404 : You are not eligible for wallet creation')
        sendResponse(res, 401, 'You are not eligible for wallet creation')
      }
    } else {
      release();
      errorLogger.error('router function call(createUser) 400 : Not a valid group')
      sendResponse(res, 400, 'Not a valid group')
    }
  } catch (error) {
    if (error.reason) {
      release();
      errorLogger.error(`router function call(createUser) 400, ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      release();
      errorLogger.error(`router function call(createUser) 500', ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
/**
 * Update exiting user kyc status
 * @param {Object} req- Request to update kyc status based on provided userAccountId
 * @param {Object} res- Get updated user details
 */
exports.updateUserKYC = async (req, res) => {
  try {
    const release = await mutex.acquire();
    const user = await getUserDetails(req.params.UserAccountId)
      .then(async (user) => {
        if (user.UserAccountId === req.params.UserAccountId) {
          const { KycStatus } = req.body
          if (KycStatus === true) {
            signPostTransaction(contract.methods.updateUserKYC(req.params.UserAccountId, KycStatus), address)
              .then(async () => {
                const UserDetails = await getUserDetails(req.params.UserAccountId)
                const UpdateKycDetails = {
                  UpdateKycDetails: UserDetails
                }
                release();
                infoLogger.info(`updateUserKYC : ${JSON.stringify(UpdateKycDetails)}`)
                console.log('router function call(updateUserKYC)', UpdateKycDetails)
                sendResponse(res, 200, UpdateKycDetails)
              })
              .catch((error) => {
                release();
                errorLogger.error(`router function call(updateUserKYC) 400 : ${JSON.stringify(error.reason)}`)
                sendResponse(res, 400, error.reason)
              })
          } else if (KycStatus === false) {
            signPostTransaction(await contract.methods
              .updateUserKYC(req.params.UserAccountId, KycStatus), address)
              .then(async () => {
                const UserDetails = await getUserDetails(req.params.UserAccountId)
                const UpdateKycDetails = {
                  UpdateKycDetails: UserDetails
                }
                release();
                infoLogger.info(`updateUserKYC: ${JSON.stringify(UpdateKycDetails)}`)
                sendResponse(res, 200, UpdateKycDetails)
              }).catch((error) => {
                release();
                errorLogger.error(`router function call(updateUserKYC) 400 2: ${JSON.stringify(error.reason)}`)
                sendResponse(res, 400, error.reason)
              })

          } else {
            release();
            errorLogger.error('router function call(updateUserKYC) 2 401 : You are not eligible for wallet creation')
            sendResponse(res, 401, 'You are not eligible for wallet creation')
          }
        } else {
          release();
          errorLogger.error('router function call(updateUserKYC) 2 404 : User not Exist')
          sendResponse(res, 404, 'User not Exist')
        }
      })

  } catch (error) {
    if (error.reason) {
      release();
      errorLogger.error(`router function call(updateUserKYC) 2 400 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      release();
      errorLogger.error(`router function call(updateUserKYC) 2 500 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
/**
 * Retrive wallet address for provided userAccountId
 * @param {Object} req- Request to get wallet details based on UserAccountId
 * @param {Object} res- Get wallet details
 */
exports.getUserWalletAddress = async (req, res) => {
  try {
    const user = await getUserDetails(req.params.UserAccountId)
    if (user.UserAccountId === req.params.UserAccountId) {
      const GetWalletAddress = await contract.methods
        .getUserWalletAddress(req.params.UserAccountId)
        .call()
      const wallet = {
        UserWalletAddress: GetWalletAddress
      }
      infoLogger.info(`getUserWalletAddress : ${JSON.stringify(wallet)}`)
      sendResponse(res, 200, wallet)
    } else {
      errorLogger.error('router function call(getUserWalletAddress) 404 : User not exist')
      sendResponse(res, 404, 'User not exist')
    }
  } catch (error) {
    if (error.reason) {
      errorLogger.error(`router function call(getUserWalletAddress) 400 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      errorLogger.error(`router function call(getUserWalletAddress) 500 : ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
/**
 * Update users data parameter
 * @param {Object} req- Request to update data based on UserAccountId
 * @param {Object} res- Get users updated data field
 */
exports.updateUserData = async (req, res) => {
  try {
    const release = await mutex.acquire();
    const { Data } = req.body
    const user = await getUserDetails(req.params.UserAccountId)
    // .then(async (user) => {
    if (user?.UserAccountId === req.params.UserAccountId) {
      signPostTransaction(contract.methods
        .updateUserData(req.params.UserAccountId, JSON.stringify(Data)), address)
        .then(async () => {
          const userDetails = await getUserDetails(req.params.UserAccountId)
          release();
          infoLogger.info(`updateUserData : ${JSON.stringify(userDetails)}`)
          sendResponse(res, 200, userDetails)
        }).catch((error) => {
          release();
          errorLogger.error(`router function call(updateUserData) 404 : ${JSON.stringify(error.reason)}`)
          sendResponse(res, 400, error.reason)
        })
    } else {
      release();
      errorLogger.error('router function call(updateUserData) 404 : User not exist')
      sendResponse(res, 404, 'User not exist')
    }
    // }).catch((error) => {
    //   sendResponse(res, 400, error.reason)
    // })
  } catch (error) {
    if (error.reason) {
      release();
      errorLogger.error(`router function call(updateUserData) 400 : ${JSON.stringify(error.reason)}`)
      sendResponse(res, 400, error.reason)
    } else {
      release();
      errorLogger.error(`router function call(updateUserData) 500 :  ${JSON.stringify(error.message)}`)
      sendResponse(res, 500, error.message)
    }
  }
}
