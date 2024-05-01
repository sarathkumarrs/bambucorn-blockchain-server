const { expect } = require("chai")
const { ethers } = require("hardhat");

describe("DealToken Contract", function () {
    let contract;
    let dealContract;
    let subscriptionContract;
    let tokenContract;

    let dealDetails;
    let user1;
    let user2;
    let subscriptionDetails;

    //issuer userAccountId
    const IssuerUserAccount = 10;
    const IssuerGroup1 = 1;
    const IssuerWalletAddress = "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720";
    const IssuerKycStatus = true;
    const IssuerData = "";

    //Investor userAccountId
    const InvestorUserAccount = 3
    const Investorgroup0 = 0;
    const InvestorWalletAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
    const InvestorKycStatus = true;
    const InvestorData = ""

    //deal
    const DealID = 1;
    const TokenName = "Token";
    const TokenSymbol = "Token";
    const TotalSupply = 1000;

    // const TokenAddress = "0x793ea9692Ada1900fBd0B80FFFEc6E431fe8b391"

    //subscription
    //investoraccountId- InvestorUserAccount
    //deal- DealID
    // const DealInvestmentId = 1;
    // const SubscriptionAmount = 10
    const TokenGenWalletAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

    this.beforeEach(async function () {
        const Register = await ethers.getContractFactory("RegisterUsers");
        const reg = await Register.deploy();
        contract = await reg.deployed();

        const Deal = await ethers.getContractFactory("DealContract");
        const deal = await Deal.deploy(contract.address);
        dealContract = await deal.deployed();

        const Subscription = await ethers.getContractFactory("DealSubscription");
        const sub = await Subscription.deploy(contract.address, dealContract.address);
        subscriptionContract = await sub.deployed();

        await contract.createUser(IssuerUserAccount, IssuerGroup1, IssuerKycStatus, IssuerWalletAddress, IssuerData)
        user1 = await contract.getUserDetails(IssuerUserAccount);

        // await contract.createUser(InvestorUserAccount, Investorgroup0, InvestorKycStatus, InvestorWalletAddress, InvestorData)
        // user2 = await contract.getUserDetails(InvestorUserAccount);

        expect(await contract.checkUserIssuer(IssuerUserAccount)).to.be.true
        expect(user1.userAccountId).is.exist;

        // expect(await contract.checkUserInvestor(InvestorUserAccount)).to.be.true
        // expect(user2.userAccountId).is.exist;

        const TokenFcatory = await ethers.getContractFactory("DirectTokenFactory");
        const token = await TokenFcatory.deploy();
        tokenContract = await token.deployed();

    })

    describe("Deploy deal Token contract", async function () {
        it("Deploy deal based on  deal id ", async function () {
            await tokenContract.createNewDealToken(IssuerUserAccount, DealID, TokenName, TokenSymbol, TotalSupply, TokenGenWalletAddress, subscriptionContract.address, dealContract.address, contract.address);
            dealDetails = await dealContract.getDealDetails(DealID)
            expect(dealDetails.dealId).to.be.equal(DealID)
        })
        it("revert when duplicate deal symbol", async function () {
            await tokenContract.createNewDealToken(IssuerUserAccount, DealID, TokenName, TokenSymbol, TotalSupply, TokenGenWalletAddress, subscriptionContract.address, dealContract.address, contract.address);
            await expect(tokenContract.createNewDealToken(IssuerUserAccount, DealID, TokenName, TokenSymbol, TotalSupply, TokenGenWalletAddress, subscriptionContract.address, dealContract.address, contract.address), "This token symbol already exist").to.be.reverted;
        })

    })

})