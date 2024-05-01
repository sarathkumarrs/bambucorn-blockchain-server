const { expect } = require("chai")
const { ethers } = require("hardhat");

describe("Voting Contract", function () {
    let contract;
    let dealContract;
    let voteContract

    //issuer userAccountId
    const IssuerUserAccount = 10;
    const IssuerGroup1 = 1;
    const IssuerWalletAddress = "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720";
    const IssuerKycStatus = true;
    const IssuerData = "";



    //deal
    const DealID = 1;
    const TokenName = "Token";
    const TokenSymbol = "Token";
    const TotalSupply = 1000;
    const TokenAddress = "0x793ea9692Ada1900fBd0B80FFFEc6E431fe8b391"

    //voting
    const proposalId = 1;
    const votingData = {
        "Votingquestion": "New strategy should be implemented?,Option 1: Yes - 73%,Option 2: No - 27%"
    }

    before(async function () {
        const Register = await ethers.getContractFactory("RegisterUsers");
        const reg = await Register.deploy();
        contract = await reg.deployed();

        const Deal = await ethers.getContractFactory("DealContract");
        const deal = await Deal.deploy(contract.address);
        dealContract = await deal.deployed();

        const Vote = await ethers.getContractFactory("VoteRequest");
        const vote = await Vote.deploy(contract.address, dealContract.address);
        voteContract = await vote.deployed();
    })

    describe("Create proposal", async function () {

        it("set voting details", async function () {
            await contract.createUser(IssuerUserAccount, IssuerGroup1, IssuerKycStatus, IssuerWalletAddress, IssuerData)
            const user1 = await contract.getUserDetails(IssuerUserAccount);
            //create deal
            expect(await contract.checkUserIssuer(IssuerUserAccount)).to.be.true
            expect(user1.userAccountId).is.exist;
            await dealContract.createDeal(IssuerUserAccount, DealID, TokenName, TokenSymbol, TotalSupply, TokenAddress)
            const dealDetails = await dealContract.getDealDetails(DealID);
            expect(dealDetails.dealId).to.be.equal(DealID)
            await voteContract.setVotingData(IssuerUserAccount, DealID, proposalId, votingData);
        })

        it("Revert when deal not match for create voting proposals", async function () {
            const DealID = 10;
            await expect(voteContract.setVotingData(IssuerUserAccount, DealID, proposalId, votingData)
                , "DealId not present").to.be.reverted;
        })
        it("Revert when user not match for create voting proposals", async function () {
            const IssuerUserAccount = 11;
            await expect(voteContract.setVotingData(IssuerUserAccount, DealID, proposalId, votingData)
                , "UserAccountId not found").to.be.reverted;
        })
        // it("Revert when user & Deal not match for create voting proposals", async function () {
        //     const IssuerUserAccount = 11;
        //     const DealId = 100
        //     const proposalId = 3;
        //     const WalletAddress = "0x2546BcD3c84621e976D8185a91A922aE77ECEc30"
        //     await contract.createUser(IssuerUserAccount, IssuerGroup1, IssuerKycStatus, WalletAddress, IssuerData)
        //     await dealContract.createDeal(IssuerUserAccount, DealId, TokenName, TokenSymbol, TotalSupply, TokenAddress)
        //     await expect(voteContract.setVotingData(IssuerUserAccount, DealID, proposalId, JSON.stringify(votingData))
        //         , "Deal or user not valid").to.be.reverted;
        // })

    })

    // describe("Update voting proposal", async function () {

    //     it("update Voting proposal", async function () {
    //         const votingData = {
    //             "Votingquestion": "New Proposal?,Option 1: Yes - 73%,Option 2: No - 27%"
    //         }
    //         await voteContract.updateVotingData(UserAccountId, DealID, proposalId, JSON.stringify(votingData))
    //         // ,"dealId not present").to.be.reverted; 
    //     })
    //     it("Revert when dealId not match for update proposal", async function () {
    //         const DealID = 10;
    //         await expect(voteContract.updateVotingData(UserAccountId, DealID, proposalId, JSON.stringify(votingData))
    //             , "This deal id not exist blockchain").to.be.reverted;
    //     })
    //     it("Revert when userId not match for update proposal", async function () {
    //         const UserAccountId = 11;
    //         await expect(voteContract.updateVotingData(UserAccountId, DealID, proposalId, JSON.stringify(votingData))
    //             , "This user id not exist blockchain").to.be.reverted;
    //     })
    //     it("Revert when proposalId not match for update proposal", async function () {
    //         const proposalId = 11;
    //         await expect(voteContract.updateVotingData(UserAccountId, DealID, proposalId, JSON.stringify(votingData))
    //             , "This proposa id not exist blockchain").to.be.reverted;
    //     })
    // })
    describe("Get user voting Details", async function () {
        it("User proposed deal list", async function () {
            const proposalDeatils = await voteContract.getVotingDetails(proposalId)
            console.log("+++++++++++", proposalDeatils)
            expect(proposalDeatils.userAccountId).to.be.equal(IssuerUserAccount)
            expect(proposalDeatils.dealId).to.be.equal(DealID)
            expect(proposalDeatils.proposalId).to.be.equal(proposalId)
            // expect(proposalDeatils.votingData).to.deep.equal('{"Votingquestion":"New Proposal?,Option 1: Yes - 73%,Option 2: No - 27%"}')
        })
        it("Revert when proposal not exist", async function () {
            const proposalId = 34;
            await expect(voteContract.getVotingDetails(proposalId)
                , "Proposal not exist").to.be.reverted;
        })
    })

    describe("Get user proposed voting deal", async function () {

        it("User proposed deal list", async function () {
            const dealList = await voteContract.getUsersVotedDeals(IssuerUserAccount)
            console.log("User proposed deal list", dealList);
            expect(dealList).to.deep.equal([1]);
            // ,"").to.be.reverted; 
        })
        it("Revert when user not exist", async function () {
            const IssuerUserAccount = 34;
            await expect(voteContract.getUsersVotedDeals(IssuerUserAccount)
                , "UserAccountId not found").to.be.reverted;
        })
        it("Revert when user id is 0", async function () {
            const IssuerUserAccount = 0;
            await expect(voteContract.getUsersVotedDeals(IssuerUserAccount)
                , "Incorrect userAccountId").to.be.reverted;
        })
    })

    describe("Get Deals voted proposal list", async function () {

        it("User proposal list", async function () {
            const dealList = await voteContract.getUserDealsVotedProposal(DealID)
            expect(dealList).to.deep.equal([1]);
        })
        // it("Revert when user not exist", async function () {
        //     const IssuerUserAccount = 34;
        //     await expect(voteContract.getUserDealsVotedProposal(DealID)
        //         , "UserAccountId not found").to.be.reverted;
        // })
        it("Revert when Deal not exist", async function () {
            const DealID = 34;
            await expect(voteContract.getUserDealsVotedProposal(DealID)
                , "DealId not present").to.be.reverted;
        })
    })




})