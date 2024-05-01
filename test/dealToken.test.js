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

        const Token = await ethers.getContractFactory("DirectDealToken");
        const token = await Token.deploy(IssuerUserAccount, DealID, TokenName, TokenSymbol, TotalSupply, TokenGenWalletAddress, subscriptionContract.address, dealContract.address, contract.address);
        tokenContract = await token.deployed();

    })

    describe("Check deal details after token creation ", async function () {
        it("verify deal", async function () {
            dealDetails = await dealContract.getDealDetails(DealID)
            expect(dealDetails.dealId).to.be.equal(DealID)
        })

    })

    describe("Transfet tokens ", async function () {

        it("Transfer tokens into investor wallet", async function () {
            dealDetails = await dealContract.getDealDetails(DealID)
            expect(dealDetails.dealId).to.be.equal(DealID)
            await subscriptionContract.createDealSubscription(InvestorUserAccount, DealID, DealInvestmentId, SubscriptionAmount);
            subscriptionDetails = await subscriptionContract.getDealSubscriptionDetails(DealInvestmentId);
            expect(subscriptionDetails.dealInvestmentId).to.exist
            await expect(tokenContract.transferDealTokens(InvestorUserAccount, DealID, DealInvestmentId, SubscriptionAmount)).to.emit(tokenContract, "TransferTokensIntoWallet")
        })

        it("Revert when deal is not match", async function () {
            const DealId = 10;
            await expect(tokenContract.transferDealTokens(InvestorUserAccount, DealId, DealInvestmentId, SubscriptionAmount), "Deal not match").to.be.reverted;
        })

        it("Revert when subscriber not match", async function () {
            const InvestorUserAccount = 10;
            await expect(tokenContract.transferDealTokens(InvestorUserAccount, DealID, DealInvestmentId, SubscriptionAmount)
                , "Deal investment id not exist").to.be.reverted;
        })
        it("Revert when Already Invested", async function () {
            await expect(tokenContract.transferDealTokens(InvestorUserAccount, DealID, DealInvestmentId, SubscriptionAmount)
                , "You have already invested in a deal").to.be.reverted;
        })

        it("Revert when amount exceeds", async function () {
            const subAmt = 100000;
            await expect(tokenContract.transferDealTokens(InvestorUserAccount, DealID, DealInvestmentId, subAmt)
                , "Insufficient amount").to.be.reverted;
        })

        it("Get user wallet tokens", async function () {
            const tokenlist = await contract.getAllUserWalletDetails(InvestorUserAccount);
            console.log(tokenlist)
        })

        it("Reverted when user account not match or 0", async function () {
            const InvestorUserAccount = 11
            await expect(contract.getAllUserWalletDetails(InvestorUserAccount), "UserAccountId not found").to.be.reverted;
        })
    })


    // describe("Get transfet tokens details", async function () {

    //     it("get Token details ", async function () {
    //         await subscriptionContract.createDealSubscription(UserAccounId2, DealID, dealInvestmentId, SubscriptionAmount);
    //         subscriptionDetails = await subscriptionContract.getDealSubscriptionDetails(dealInvestmentId);
    //         expect(subscriptionDetails.dealInvestmentId).to.exist;
    //         expect(subscriptionDetails.dealInvestmentId).to.be.equal(dealInvestmentId);
    //         await tokenContract.transferDealTokens(UserAccounId2, DealID, dealInvestmentId, SubscriptionAmount);
    //         const TokenDetails = await tokenContract.getTransferTokenDetails(dealInvestmentId)
    //         expect(TokenDetails.TokenAmount).to.be.equal(subscriptionDetails.InvestedAmount);

    //     })
    //     it("revert Enter invalid dealInvestmentId ", async function () {
    //         const dealInvestmentId = 4;
    //         await expect(tokenContract.getTransferTokenDetails(dealInvestmentId), "Enter valid dealInvestmentId").to.be.reverted;
    //     })

    // })


    describe("Get list of invested peoples for deal", async function () {

        it("Get list of investors after transfer tokens into wallet", async function () {
            await subscriptionContract.createDealSubscription(InvestorUserAccount, DealID, DealInvestmentId, SubscriptionAmount);
            subscriptionDetails = await subscriptionContract.getDealSubscriptionDetails(DealInvestmentId);
            expect(subscriptionDetails.dealInvestmentId).to.exist;
            expect(subscriptionDetails.dealInvestmentId).to.be.equal(DealInvestmentId);
            await tokenContract.transferDealTokens(InvestorUserAccount, DealID, DealInvestmentId, SubscriptionAmount);
            // const TokenDetails = await tokenContract.getTransferTokenDetails(DealInvestmentId)
            // expect(TokenDetails.tokenAmount).to.be.equal(subscriptionDetails.investedAmount);
            const list = await tokenContract.getAllInvestorsForDeal(DealID)
            expect(list[0]).to.be.equal(InvestorUserAccount);

        })

    })

})