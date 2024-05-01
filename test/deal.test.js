const { expect } = require("chai")
const { ethers } = require("hardhat");

describe("Deal Contract", function () {
    let contract;
    let dealContract;

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



    before(async function () {
        const Register = await ethers.getContractFactory("RegisterUsers");
        const reg = await Register.deploy();
        contract = await reg.deployed();

        const Deal = await ethers.getContractFactory("DealContract");
        const deal = await Deal.deploy(contract.address);
        dealContract = await deal.deployed();
    })

    describe("Create User", async function () {

        it("Create Deal for issuer", async function () {
            await expect(contract.createUser(IssuerUserAccount, IssuerGroup1, IssuerKycStatus, IssuerWalletAddress, IssuerData)).to.emit(contract, "CreateNewUser")
            const userDetails = await contract.getUserDetails(IssuerUserAccount);
            expect(await contract.checkUserIssuer(IssuerUserAccount)).to.be.true;
            expect(userDetails.group).to.be.equal(1);
            expect(IssuerUserAccount).to.exist;
            await expect(dealContract.createDeal(IssuerUserAccount, DealID, TokenName, TokenSymbol, TotalSupply, TokenAddress))
                .to.emit(dealContract, "DealCreated")
        })

        it("Reverted when user is not issuer", async function () {
            await contract.createUser(InvestorUserAccount, Investorgroup0, InvestorKycStatus, InvestorWalletAddress, InvestorData)
            await expect(dealContract.createDeal(InvestorUserAccount, DealID, TokenName, TokenSymbol, TotalSupply, TokenAddress), 'User not issuer').to.be.reverted;
        });

        it("Reverted when Duplicate deal created", async function () {
            await expect(dealContract.createDeal(IssuerUserAccount, DealID, TokenName, TokenSymbol, TotalSupply, TokenAddress), "Duplicate deal").to.be.reverted;
        });
        // it("Reverted when Duplicate deal created", async function () {
        //     const DealID =0;
        //     await expect(dealContract.createDeal(IssuerUserAccount, DealID, TokenName, TokenSymbol, TotalSupply, TokenAddress), "Invalid dealId").to.be.reverted;
        // });

    })


    describe("Check Deals details", async function () {
        it("Get Deal Details", async function () {
            const other = await dealContract.getDealDetails(DealID)
            expect(other.userAccountId, other.dealId, other.tokenName, other.tokenSymbol, other.totalSupply,
                other.tokenContractAddress).to.deep.equal(10, 1, "Token", "Token", 1000, "0x793ea9692Ada1900fBd0B80FFFEc6E431fe8b391");
        })

        it("Reverted when deal not exist", async function () {
            const DealId = 4;
            await expect(dealContract.getDealDetails(DealId), "Deal not exist").to.be.reverted;
        })

    });


    describe("User deals", async function () {
        it("Get user dealList", async function () {
            const list = await dealContract.getUsersDealList(IssuerUserAccount);
            expect(list).to.deep.equal([DealID])
        });

        it("check user is issuer or not", async function () {
            await expect(dealContract.getUsersDealList(InvestorUserAccount), 'User not issuer').to.be.reverted;
        });

        it("Revert when user not exist , kyc status not true", async function () {
            const InvestorkycStatus = false;
            await contract.updateUserKYC(InvestorUserAccount, InvestorkycStatus)
            await expect(dealContract.getUsersDealList(InvestorUserAccount), "KYC status false").to.be.reverted;
        });
    })

})