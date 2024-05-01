
const { expect } = require("chai")
const { ethers } = require("hardhat");

//require("@nomiclabs/hardhat-waffle");

describe("User Registration", function () {
  let contract;

  //issuer userAccountId
  const IssuerUserAccount = 10;
  const IssuerGroup1 = 1;
  const IssuerWalletAddress = "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720";
  const IssuerKycStatus = true;
  const IssuerData = "";

  //investors userAccountId
  const InvestorUserAccount = 1;
  const InvestorGroup0 = 0;
  const InvestorWalletAddress = "0xcd3B766CCDd6AE721141F452C550Ca635964ce71"
  const InvestorKycStatus = true;
  const InvestorData = "";

  //create contract instance
  before(async function () {
    const Register = await ethers.getContractFactory("RegisterUsers");
    const reg = await Register.deploy();
    contract = await reg.deployed();
  })

  describe("Register user", function () {

    it("Create Issuer User", async function () {
      await expect(contract.createUser(IssuerUserAccount, IssuerGroup1, IssuerKycStatus, IssuerWalletAddress, IssuerData))
        .to.emit(contract, "CreateNewUser")
    })

    it("Create Investor User", async function () {
      await expect(contract.createUser(InvestorUserAccount, InvestorGroup0, InvestorKycStatus, InvestorWalletAddress, InvestorData))
        .to.emit(contract, "CreateNewUser")
    })

    it("Revert with an invalid group", async function () {
      const IssuerGroup = 2;
      await expect(
        contract.createUser(IssuerUserAccount, IssuerGroup, IssuerKycStatus, IssuerWalletAddress, IssuerData),
        "Invalid group"
      ).to.be.reverted;
    });

    it("Revert when userAccountId already exists", async function () {
      await expect(contract.createUser(IssuerUserAccount, IssuerGroup1, IssuerKycStatus, IssuerWalletAddress, IssuerData), 'User account already exist').to.be.reverted;
    });

    it("Revert when wallet address already exists", async function () {
      const IssuerWalletAddress = "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720";
      await expect(contract.createUser(IssuerUserAccount, IssuerGroup1, IssuerKycStatus, IssuerWalletAddress, IssuerData)
        , 'Wallet address already exist').to.be.reverted;
    });

    it("Reverted when call KYC status false", async function () {
      const IssuerKycStatus = false;
      await expect(
        contract.createUser(IssuerUserAccount, IssuerGroup1, IssuerKycStatus, IssuerWalletAddress, IssuerData),
        "Your KYC not verified"
      ).to.be.reverted;
    });

    it("Reverted when pass userAccountId '0'", async function () {
      const IssuerUserAccount = 0;
      await expect(
        contract.createUser(IssuerUserAccount, IssuerGroup1, IssuerKycStatus, IssuerWalletAddress, IssuerData),
        "Invalid userAccountId"
      ).to.be.reverted;
    });

  })

  describe("Get User Deatails", function () {
    it("Get User Details", async function () {
      const details = await contract.getUserDetails(IssuerUserAccount);
      expect(details.userAccountId).to.be.equal(IssuerUserAccount)
      expect(details.walletAddress).to.be.equal(IssuerWalletAddress)
      expect(details.kycStatus).to.be.equal(IssuerKycStatus).to.be.a('boolean')
      expect(details.group).to.be.equal(IssuerGroup1)
      expect(details.data).to.be.equal(IssuerData).to.be.a('string')
    })

    it("Revert if user account id not exist", async function () {
      const userAccount = 56;
      await expect(contract.getUserDetails(userAccount), "Not a registered user").to.be.reverted;
    })
  })

  describe("Check User Wallet Address", function () {
    it("Get user wallet address", async function () {
      const Address = await contract.getUserWalletAddress(IssuerUserAccount);
      expect(Address).to.be.equal(IssuerWalletAddress)
    })
    it("revert when userAccountId is '0'", async function () {
      const IssuerUserAccount = 0;
      await expect(contract.getUserWalletAddress(IssuerUserAccount), "Incorrect userAccountId").to.be.reverted;
    })
    it("Revert when userAccountId not exist", async function () {
      const IssuerUserAccount = 86;
      await expect(contract.getUserWalletAddress(IssuerUserAccount), "UserAccountId not found").to.be.reverted;
    })

  });

  describe("Check User Exist or Not", function () {

    it("Check User is Issuer or not", async function () {
      const checkUserIssuer = await contract.checkUserIssuer(IssuerUserAccount);
      expect(checkUserIssuer).to.be.equal(true)
    })

    it("Check User is Investor or not", async function () {
      const checkUserInvestor = await contract.checkUserInvestor(InvestorUserAccount);
      expect(checkUserInvestor).to.be.equal(true)
    })
  });


  describe("Update user Data", function () {

    it("Update registered user data", async function () {
      const Data = JSON.stringify({ "Name": "John" })
      const details = await contract.getUserDetails(IssuerUserAccount);
      expect(details.userAccountId).to.be.equal(IssuerUserAccount)
      await contract.updateUserData(IssuerUserAccount, Data);
      const detail = await contract.getUserDetails(IssuerUserAccount);
      expect(detail.data).to.deep.equal('{"Name":"John"}');
    })

    it("Revert when userAccountId not exist", async function () {
      const InvestorUserAccount = 50;
      await expect(contract.checkUserInvestor(InvestorUserAccount), 'UserAccountId not match').to.be.reverted;
    })
  });


  // describe("User Wallet details", function () {
  //   it("Add new token", async function () {
  //     const userAccount = 1;
  //     const symbol = "ETH";
  //     const balance = 100;
  //     const DealId = 1;
  //     await contract.setUserWalletDetails(userAccount, DealId, symbol, balance);
  //     const tokenDetails = await contract.getDealSpecificWalletDetails(userAccount, DealId)
  //     expect(tokenDetails).to.deep.equal([[1, 1, 'ETH', 100]])
  //   });
  // })

  // describe("Get user wallet tokens ", async function () {
  //   it("Get User tokens", async function () {
  //     const DealId = 1;
  //     const userAccount = 1;
  //     await contract.getDealSpecificWalletDetails(userAccount, DealId);
  //   })
  //   it("Reverted when user account not match or 0", async function () {
  //     const UserAccountId = 10
  //     const UserAccountIds = 0;
  //     const DealId = 1;
  //     await expect(contract.getDealSpecificWalletDetails(UserAccountId, DealId), "UserAccountId not found").to.be.reverted;
  //     await expect(contract.getDealSpecificWalletDetails(UserAccountIds, DealId), "UserAccountId not found").to.be.reverted;
  //   })

  // })

  // describe("Get All user wallet tokens ", async function () {
  //   it("Get User wallet tokens", async function () {
  //     const userAccount = 1;
  //     await contract.getAllUserWalletDetails(userAccount);
  //   })
  //   it("Reverted when user account not match or 0", async function () {
  //     const UserAccountId = 10
  //     const UserAccountIds = 0;
  //     await expect(contract.getAllUserWalletDetails(UserAccountId), "UserAccountId not found").to.be.reverted;
  //     await expect(contract.getAllUserWalletDetails(UserAccountIds), "UserAccountId not found").to.be.reverted;
  //   })

  // })

  describe("Update user KYC", function () {
    it("Update KYC", async function () {
      const InvestorkycStatus = false;
      const details = await contract.getUserDetails(InvestorUserAccount)
      expect(details.kycStatus).to.be.equal(true)
      await contract.updateUserKYC(InvestorUserAccount, InvestorkycStatus);
      const detail2 = await contract.getUserDetails(InvestorUserAccount)
      expect(detail2.kycStatus).to.be.equal(false)
    })

    it("Reverted when call same kyc status", async function () {
      const InvestorkycStatus = false;
      await expect(contract.updateUserKYC(InvestorUserAccount, InvestorkycStatus), 'KycStatus already updated').to.be.reverted;
    })

    it("Reverted when user id not exist", async function () {
      const InvestorUserAccount = 30;
      await expect(contract.updateUserKYC(InvestorUserAccount, InvestorKycStatus), 'UserAccountId not found').to.be.reverted;
    })
  });

})



















