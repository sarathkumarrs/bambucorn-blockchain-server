const { expect } = require("chai")
const { ethers } = require("hardhat");

describe("Subscription Contract", function () {
    let contract;
    let dealContract;
    let subscriptionContract;

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
    const TokenAddress = "0x793ea9692Ada1900fBd0B80FFFEc6E431fe8b391"

    //subscription
    //investoraccountId- InvestorUserAccount
    //deal- DealID
    const DealInvestmentId = 1;
    const SubscriptionAmount = 10
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

        await contract.createUser(InvestorUserAccount, Investorgroup0, InvestorKycStatus, InvestorWalletAddress, InvestorData)
        user2 = await contract.getUserDetails(InvestorUserAccount);

        expect(await contract.checkUserIssuer(IssuerUserAccount)).to.be.true
        expect(user1.userAccountId).is.exist;

        expect(await contract.checkUserInvestor(InvestorUserAccount)).to.be.true
        expect(user2.userAccountId).is.exist;

        await expect(dealContract.createDeal(IssuerUserAccount, DealID, TokenName, TokenSymbol, TotalSupply, TokenAddress))
            .to.emit(dealContract, "DealCreated")

    })

    describe("Create User subscription", async function () {
        it("Subscribe deal", async function () {
            const dealDetails = await dealContract.getDealDetails(DealID);
            expect(await contract.checkUserInvestor(InvestorUserAccount)).to.be.true
            expect(dealDetails.dealId).is.exist;
            expect(user2.userAccountId).is.exist;
            await subscriptionContract.createDealSubscription(InvestorUserAccount, DealID, DealInvestmentId, SubscriptionAmount);
        })

        it("Revert if deal investment Id already subscribe", async function () {
            await subscriptionContract.createDealSubscription(InvestorUserAccount, DealID, DealInvestmentId, SubscriptionAmount);
            await expect(subscriptionContract.createDealSubscription(InvestorUserAccount, DealID, DealInvestmentId, SubscriptionAmount), "DealInvestmentId already exist").to.be.reverted;
        })

        it("Revert if user not exist", async function () {
            const InvestorUserAccount = 12;
            await expect(subscriptionContract.createDealSubscription(InvestorUserAccount, DealID, DealInvestmentId, SubscriptionAmount), "User not exist").to.be.reverted;
        })

        it("Revert if Deal not exist", async function () {
            const Dealid = 10;
            await expect(subscriptionContract.createDealSubscription(InvestorUserAccount, Dealid, DealInvestmentId, SubscriptionAmount)
                , "DealId not present").to.be.reverted;
        })

    })




    describe("Get User subscription", async function () {
        it("Get subscription details", async function () {
            await subscriptionContract.createDealSubscription(InvestorUserAccount, DealID, DealInvestmentId, SubscriptionAmount);
            const subscriptionDetails = await subscriptionContract.getDealSubscriptionDetails(DealInvestmentId);
            expect(subscriptionDetails.userAccountId).to.be.equal(InvestorUserAccount)
            expect(subscriptionDetails.dealId).to.be.equal(DealID)
            expect(subscriptionDetails.dealInvestmentId).to.be.equal(DealInvestmentId)
            expect(subscriptionDetails.investedAmount).to.be.equal(10)
        })

        it("Revert if investment id not match for getsbscription details", async function () {
            const dealInvestmentId = 23;
            await expect(subscriptionContract.getDealSubscriptionDetails(dealInvestmentId)
                , "DealInvestmentId not exist").to.be.reverted;
        })
        it("Revert if investment id is 0 ", async function () {
            const dealInvestmentId = 0;
            await expect(subscriptionContract.getDealSubscriptionDetails(dealInvestmentId)
                , "DealInvestmentId not valid").to.be.reverted;
        })

    })

    describe("Get Subscription amount", async function () {
        it("get subscription amount", async function () {
            await subscriptionContract.createDealSubscription(InvestorUserAccount, DealID, DealInvestmentId, SubscriptionAmount);
            const amt = await subscriptionContract.getDealSubscriptionAmount(DealInvestmentId)
            expect(amt).to.be.equal(10)
        })
        it("Revert if investment id not exist ", async function () {
            const DealInvestmentId = 60;
            await expect(subscriptionContract.getDealSubscriptionAmount(DealInvestmentId), "DealInvestmentId not exist").to.be.reverted;
        })
    })

    describe("Get user Subscription Ids", async function () {
        it("Get subscription ids", async function () {
            await subscriptionContract.createDealSubscription(InvestorUserAccount, DealID, DealInvestmentId, SubscriptionAmount);
            const ids = await subscriptionContract.getUserSubscriptions(InvestorUserAccount);
            expect(ids).to.deep.equal([1])
        })
        it("Revert if user id not exist ", async function () {
            const InvestorUserAccount = 60;
            await expect(subscriptionContract.getUserSubscriptions(InvestorUserAccount)
                , "KYC status false").to.be.reverted;
        })
    })

    describe("Get user Subscription Deals", async function () {
        it("Get subscription deal ids", async function () {
            await subscriptionContract.createDealSubscription(InvestorUserAccount, DealID, DealInvestmentId, SubscriptionAmount);
            const ids = await subscriptionContract.getUserSubscribedDeals(InvestorUserAccount);
            expect(ids).to.deep.equal([1])
        })
    })

    describe("Get getSubscribed Users For Deal", async function () {
        it("Get user ids for scribed deal", async function () {
            await subscriptionContract.createDealSubscription(InvestorUserAccount, DealID, DealInvestmentId, SubscriptionAmount);
            const ids = await subscriptionContract.getSubscribedUsersList(DealID);
            expect(ids).to.deep.equal([3])
        })
    })

})

