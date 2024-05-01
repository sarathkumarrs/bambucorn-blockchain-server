// SPDX-License-Identifier:UNLICENSED

pragma solidity ^0.8.0;

/**  

 @title - RegisterUsers.sol , Deal.sol 

 @notice - Inherit user and deal functionality details  

 */

import "./RegisterUsers.sol";

import "./Deal.sol";

/**  

 @title - DealSubscription 

 @notice - This contract for store & manage subscription functionality  

 */

contract DealSubscription {
    /** 

     *@dev - Create Registerusers contract instance & deal contract instance 

     */
    RegisterUsers immutable register;

    DealContract immutable deal;

    /** 

     *@dev - Pass Registerusers contract address & Deal contract address to contract instance

     */

    constructor(address registerContractAddress, address dealContractAddress) {
        register = RegisterUsers(registerContractAddress);

        deal = DealContract(dealContractAddress);
    }

    /** 

     *@notice - It emit's event when user successfully subscribe to deal on platform 

     */

    event SubscriptionLog(
        uint256 indexed userAccountId,
        uint256 indexed dealId,
        uint256 indexed dealInvestmentId,
        uint256 amount,
        uint256 timestamp
    );

    /** 

     *@notice - This struct used to store subscription details 

     */

    struct Subscription {
        uint256 userAccountId; ///investor userAccountId
        uint256 dealId;
        uint256 dealInvestmentId;
        uint256 investedAmount;
        uint256 timestamp;
    }

    /** 

     *@notice - This modifier used to check is user investor or not 

     */

    ///investor userAccountId
    modifier isUserInvestor(uint256 userAccountId) {
        require(
            register.checkUserInvestor(userAccountId),
            "You are not investor"
        );

        _;
    }

    /** 

     *@notice - This modifier used to check dealInvestmentId exist or not 

     */
    modifier isDealInvesmentIdPresent(uint256 dealInvestmentId) {
        if (
            allSubscriptions[dealInvestmentId].dealInvestmentId !=
            dealInvestmentId
        ) {
            revert("Deal investment id not exist");
        }
        _;
    }

    /** 

     *@notice - This modifier used to check deal is exist or not 

     */

    modifier isDealIdExist(uint256 dealId) {
        require(deal.checkDealExistOrNot(dealId), "DealId not present");

        _;
    }

    /** 

     *@notice - this mapping used to map subscription details 
     *@dev - allSubscriptions[userInvestmentId]

     */

    mapping(uint256 => Subscription) allSubscriptions;

    /** 

     *@notice - This mapping used to check is user already subscribed or not
     *@dev -isSubscribed[userAccountId][dealId][dealInvestmentId]

     */

    mapping(uint256 => mapping(uint256 => mapping(uint256 => bool))) isSubscribed;

    /** 

     *@notice - This mapping used to store users subscription deal id's 
     *@dev - mapUserInvestmentIds[userAccountId]

     */

    mapping(uint256 => uint256[]) mapUserInvestmentIds;

    /** 

     *@notice - This mapping used to get all users subscribed deals 
     *@dev - mapSubscribedDeals[userAccountId]

     */

    mapping(uint256 => uint256[]) mapSubscribedDeals;

    /** 

     *@notice - This mapping used to get deal specific user list 
     *@dev - mapDealInvestors[dealId]

     */

    mapping(uint256 => uint256[]) mapDealInvestors;

    /** 

     *@notice - Function to create subscription for deal 

     *@param _userAccountId --> Request for investor userAccountId for deal subscription 

     *@param _dealId --> Request for existing deal id for subscription 

     *@param _dealInvestmentId --> Request for unique dealInvestmentId to identify subscription

     *@param _subscriptionAmount --> Request for amount to be user subscribing 

     */

    function createDealSubscription(
        uint256 _userAccountId, ///investor userAccountId
        uint256 _dealId,
        uint256 _dealInvestmentId,
        uint256 _subscriptionAmount
    ) external isUserInvestor(_userAccountId) isDealIdExist(_dealId) {
        require(
            allSubscriptions[_dealInvestmentId].dealInvestmentId !=
                _dealInvestmentId,
            "DealInvestmentId already exist"
        );

        isSubscribed[_userAccountId][_dealId][_dealInvestmentId] = true;

        // push subscription id for getting user specific investment id

        mapUserInvestmentIds[_userAccountId].push(_dealInvestmentId);

        // map investor's in deal

        mapDealInvestors[_dealId].push(_userAccountId);

        // get user subscribed deals

        mapSubscribedDeals[_userAccountId].push(_dealId);

        allSubscriptions[_dealInvestmentId] = Subscription({
            userAccountId: _userAccountId,
            dealId: _dealId,
            dealInvestmentId: _dealInvestmentId,
            investedAmount: _subscriptionAmount,
            timestamp: block.timestamp //update name TokenBalance
        });

        emit SubscriptionLog(
            _userAccountId,
            _dealId,
            _dealInvestmentId,
            _subscriptionAmount,
            block.timestamp
        );
    }

    /** 

     *@notice - Function to get deal subscription details 

     *@param _dealInvestmentId --> Request for dealInvestmentId 

     *@return --> It returns deal subscription details for user's 

     */

    function getDealSubscriptionDetails(
        uint256 _dealInvestmentId
    ) public view returns (Subscription memory) {
        //check deal id exist or not

        if (
            allSubscriptions[_dealInvestmentId].dealInvestmentId !=
            _dealInvestmentId
        ) {
            revert("DealInvestmentId not exist");
        }

        require(
            allSubscriptions[_dealInvestmentId].dealInvestmentId != 0,
            "DealInvestmentId not valid"
        );

        return allSubscriptions[_dealInvestmentId];
    }

    /** 

     *@notice - Function to get subscription amount 

     *@param _dealInvestmentId --> Request for dealInvestmentId to get user subscription amount 

     *@return --> It returns subscription amount for deal 

     */

    function getDealSubscriptionAmount(
        uint256 _dealInvestmentId
    ) public view returns (uint256) {
        if (
            allSubscriptions[_dealInvestmentId].dealInvestmentId !=
            _dealInvestmentId
        ) {
            revert("DealInvestmentId not exist");
        }

        require(
            allSubscriptions[_dealInvestmentId].dealInvestmentId != 0,
            "DealInvestmentId not valid"
        );

        return allSubscriptions[_dealInvestmentId].investedAmount;
    }

    /** 

     *@notice - Function to get all subscriptions for user 

     *@param _userAccountId --> Request for userAccountId to get all subscriptions 

     *@return --> It returns list of user subscriptions id's

     */

    function getUserSubscriptions(
        uint256 _userAccountId ///investor userAccountId
    ) public view isUserInvestor(_userAccountId) returns (uint256[] memory) {
        return mapUserInvestmentIds[_userAccountId];
    }

    /** 

     *@notice - Function to get all subscribed deals for investor 

     *@param _userAccountId --> Request for userAccountId  

     *@return - It returns list of user subscribed deals 

     */

    function getUserSubscribedDeals(
        uint256 _userAccountId ///investor userAccountId
    ) public view isUserInvestor(_userAccountId) returns (uint256[] memory) {
        return mapSubscribedDeals[_userAccountId];
    }

    /** 

     *@notice - Function to check dealiId, userAccountId and DealInvestment id exist or not are they match or not

     *@param _userAccountId --> Request for userAccountId 

     *@param _dealId -->Request for dealId 

     *@param _dealInvestmentId --> Request for DealInvestmentId

     *@return --> It returns true, if specified user subscribed for deal.

     */

    function checkDealAndUser(
        uint256 _userAccountId, ///investor userAccountId
        uint256 _dealId,
        uint256 _dealInvestmentId
    )
        public
        view
        // isUserExist(_userAccountId)
        isDealInvesmentIdPresent(_dealInvestmentId)
        returns (bool)
    {
        return
            isSubscribed[_userAccountId][_dealId][_dealInvestmentId]
                ? true
                : false;
    }

    /**  

     *@notice - Function to get list of all subscribed users for specific deal 

     @param _dealId --> Request for dealId to get list of subscribed users for deal 

     @return --> It returns list of investors invested in specified deal 

    */

    function getSubscribedUsersList(
        uint256 _dealId
    ) public view isDealIdExist(_dealId) returns (uint256[] memory) {
        return mapDealInvestors[_dealId];
    }
}
