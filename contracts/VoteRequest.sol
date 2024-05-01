//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

/* import deal contract */

/**  

 @title - Deal.sol  

 @notice - Inherit deal details from deal contract  

 */

import "./Deal.sol";

/**  

 @title - VoteRequest  

 @notice - Storing and managing voting data  

 */

contract VoteRequest {
    /** 

     * @notice -Create instance of register Users contract & Deal contract 

     *  */

    RegisterUsers immutable regContract;

    DealContract immutable dealContract;

    /** 

     *@notice - Pass address of deal and registerUser contract 

     */

    constructor(
        address registrationContractAddress,
        address dealContractAddress
    ) {
        regContract = RegisterUsers(registrationContractAddress);

        dealContract = DealContract(dealContractAddress);
    }

    /** 

     *@notice - To emit event for storing voting details 

     */

    event AddVoting(
        uint256 indexed dealId,
        uint256 indexed proposalId,
        string votingData,
        uint256 timestamp
    );

    /** 

     *@notice - For update voting details 

     */

    // event UpdatedVoteResult(
    //     uint256 indexed dealId,
    //     uint256 indexed proposalId,
    //     string indexed votingData,
    //     uint256 timestamp
    // );

    /** 

     *@notice- To store voting result 

     */

    struct Vote {
        uint256 userAccountId; ///issuer userAccountId
        uint256 dealId;
        uint256 proposalId;
        string votingData;
    }

    /** 

     *@notice - To check is deal exist or not 

     */

    modifier isDealIdExist(uint256 dealId) {
        bool result = dealContract.checkDealExistOrNot(dealId);

        require(result, "DealId not present");

        _;
    }

    /** 

     *@notice - To check user is investor or not 

     */
    ///issuer userAccountId
    modifier isUserIssuer(uint256 userAccountId) {
        bool result = regContract.checkUserIssuer(userAccountId);

        require(result, "You are not investor");

        _;
    }

    /** 

     *@notice - To check proposal id exist or not. 

     */

    modifier isVotingExist(uint256 _proposalId) {
        require(
            mapVote[_proposalId].proposalId == _proposalId,
            " Proposal not exist"
        );

        _;
    }

    /** 

     *@notice -To map voting data 
     *@dev - mapVote[proposalId]

     */

    mapping(uint256 => Vote) mapVote;

    /** 

     *@notice - To count number of proposal created in deal 
     *@dev - proposalCountForEachDeal[dealId]
     */

    mapping(uint256 => uint256) proposalCountForEachDeal;

    /** 

     *@notice - To map user voted deal and proposals 
     *@dev - userVotedDealProposals[userAccountId][dealId]

     */

    mapping(uint256 => uint256[]) userVotedDealProposals;

    /** 

     *@notice -To map user voted deals 
     *@dev - userVotedDeals[usertAccountId]
     */

    mapping(uint256 => uint256[]) userVotedDeals;

    /** 

     *@notice -Function to add voting details 

     *@param _dealId --> Deal identification number 

     *@param _proposalId --> Proposal identification number 

     *@param _votingData --> voting details 

     */

    function setVotingData(
        uint256 _userAccountIdId, ///issuer userAccountId
        uint256 _dealId,
        uint256 _proposalId,
        string memory _votingData
    ) external isDealIdExist(_dealId) isUserIssuer(_userAccountIdId) {
        require(
            mapVote[_proposalId].proposalId != _proposalId,
            "This proposal already exist on blockchain"
        );

        // bool val = dealContract.checkDealDetails(userAccountIdId, dealId);

        // require(val, "Deal or user not valid");

        proposalCountForEachDeal[_dealId]++;

        userVotedDealProposals[_dealId].push(_proposalId);

        userVotedDeals[_userAccountIdId].push(_dealId);

        mapVote[_proposalId] = Vote({
            userAccountId: _userAccountIdId,
            dealId: _dealId,
            proposalId: _proposalId,
            votingData: _votingData
        });

        emit AddVoting(_dealId, _proposalId, _votingData, block.timestamp);
    }

    /** 

     *@notice - Function to get voting details 

     *@param _proposalId --> Proposal or noticeId to get voting details 

     *@return --> Voting details returns 

     */

    function getVotingDetails(
        uint256 _proposalId
    ) public view isVotingExist(_proposalId) returns (Vote memory) {
        require(_proposalId != 0, "Incorrect proposal id");

        return mapVote[_proposalId];
    }

    /** 

     *@notice -Function to retrive list of proposal id's for specified user created deal 

     *@param _dealId ---> Request for dealId 

     *@return --> Returns proposals for specific deals 

     */

    function getUserDealsVotedProposal(
        // uint256 _userAccountId, ///issuer userAccountId
        uint256 _dealId
    )
        public
        view
        isDealIdExist(_dealId)
        returns (
            // isUserIssuer(_userAccountId)
            uint256[] memory
        )
    {
        require(_dealId != 0, "Incorrect input");

        // bool val = dealContract.checkDealDetails(_userAccountId, _dealId);

        // require(val, "Deal or user not valid");

        return userVotedDealProposals[_dealId];
    }

    /** 

     *@notice - Function to get issuer requested proposal deal list 

     *@param _userAccountId---> Request userAccountId , get relevant proposed deal list. 

     *@return --> Return deal list 

     */

    function getUsersVotedDeals(
        uint256 _userAccountId ///issuer userAccountId
    ) public view isUserIssuer(_userAccountId) returns (uint256[] memory) {
        return userVotedDeals[_userAccountId];
    }

    /** 

     *@notice - Get per deal proposals list 

     *@param _dealId ---> Get relevant proposed deal list. 

     *@return --> Return proposal count number 

     */

    function getProposalPerDeal(uint256 _dealId) public view returns (uint256) {
        return proposalCountForEachDeal[_dealId];
    }

    // /**

    //  *@notice -Function to update voting details

    //  *@param userAccountId---> Request userAccountId , get relevant proposed deal list.

    //  */

    // function updateVotingData(
    //     uint256 _userAccountId,
    //     uint256 _dealId,
    //     uint256 _proposalId,
    //     string memory votingData
    // ) external {
    //     require(
    //         mapVote[proposalId].ProposalId == proposalId,
    //         "This proposa id not exist blockchain"
    //     );

    //     require(
    //         mapVote[proposalId].UserAccountId == userAccountId,
    //         "This user id not exist blockchain"
    //     );

    //     require(
    //         mapVote[proposalId].DealId == dealId,
    //         "This deal id not exist blockchain"
    //     );

    //     mapVote[proposalId] = Vote({
    //         UserAccountId: userAccountId,
    //         DealId: dealId,
    //         ProposalId: proposalId,
    //         VotingData: votingData
    //     });

    //     emit UpdatedVoteResult(dealId, proposalId, votingData, block.timestamp);
    // }
}
