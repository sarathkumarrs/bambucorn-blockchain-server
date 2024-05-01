//SPDX-License-Identifier:UNLICENSED

pragma solidity ^0.8.0;

/**  

 @title - RegisterUsers.sol  

 @notice - Inherit user functionality and details  

 */

import "./RegisterUsers.sol";

/**  

 @title - DealContract  

 @notice - Storing & managing deal specific details  

 */

contract DealContract {
    /** 

     *@dev - create RegisterUsers contract instance 

     */

    RegisterUsers immutable regUser;

    /** 

     *@dev - assigned register Users contract address to instance 

     */

    constructor(address registerContractAddress) {
        regUser = RegisterUsers(registerContractAddress);
    }

    /** 

     *@notice - It emits after successfully deal created by issuer on platform

     */

    event DealCreated(
        uint256 indexed userAccountId, /// issuer userAccountId
        uint256 indexed dealId,
        string symbol,
        uint256 totalSupply,
        uint256 timestamp
    );

    /** 

     *@notice- struct for storing deal details 

     */

    struct Deal {
        uint256 userAccountId; /// issuer userAccountId
        uint256 dealId;
        string tokenName;
        string tokenSymbol;
        uint256 totalSupply;
        address tokenContractAddress;
    }

    /** 

     *@notice - modifier used to check user is issuer or not 
  
     */

    /// issuer userAccountId
    modifier isUserIssuer(uint256 _userAccountId) {
        require(regUser.checkUserIssuer(_userAccountId), "User not issuer");

        _;
    }

    /** 

     *@notice - It maps deal details stored in Deal struct
     *@dev - mapDeals[dealId]
     */

    mapping(uint256 => Deal) mapDeals;

    /** 

     *@notice - It maps issuer created deal list 
     *@dev - usersDealList[userAccountId]  

     */

    /// issuer userAccountId

    mapping(uint256 => uint256[]) usersDealList;

    /** 

     *@notice - Function for create new deal 

     *@param _userAccountId --> Request for existing issuer userAccountId to create new deal

     *@param _dealId --> Request for unique dealId (deal identifier) 

     *@param _tokenName --> Request for deal TokenName 

     *@param _tokenSymbol --> Request for deal tokenSymbol(unique for each deal)

     *@param _totalSupply --> Request for deal token totalSupply (passing at the time of token creation in DealToken contract) 

     *@param _tokenAddress --> Request for deal token contract address (it will generate after token creates sucessfully on blockchain) 

     */

    function createDeal(
        uint256 _userAccountId, /// issuer userAccountId
        uint256 _dealId,
        string memory _tokenName,
        string memory _tokenSymbol,
        uint256 _totalSupply,
        address _tokenAddress
    ) external isUserIssuer(_userAccountId) {
        require(mapDeals[_dealId].dealId != _dealId, "Duplicate deal");

        mapDeals[_dealId] = Deal({
            userAccountId: _userAccountId,
            dealId: _dealId,
            tokenName: _tokenName,
            tokenSymbol: _tokenSymbol,
            totalSupply: _totalSupply,
            tokenContractAddress: _tokenAddress
        });

        usersDealList[_userAccountId].push(_dealId);

        emit DealCreated(
            _userAccountId,
            _dealId,
            _tokenSymbol,
            _totalSupply,
            block.timestamp
        );
    }

    /** 

     *@notice - Function to check deal exists or not and is user belongs to that deal or not. 

     *@param _userAccountId --> Request for issuer userAccountId 

     *@param _dealId --> Request for issuer created dealId 

     *@return -->If deal is exist & specified issuer is owner of that deal then it returns true 

     */

    function checkDealDetails(
        uint256 _userAccountId, /// issuer userAccountId
        uint256 _dealId
    ) public view isUserIssuer(_userAccountId) returns (bool) {
        require(mapDeals[_dealId].dealId == _dealId, "Deal not exist");

        return mapDeals[_dealId].userAccountId == _userAccountId ? true : false;
    }

    /** 

     *@notice - Function to check deal exists or not 

     *@param _dealId --> Request for existing dealId 

     *@return --> If deal exists then it returns true 

     */

    function checkDealExistOrNot(uint256 _dealId) public view returns (bool) {
        require(_dealId != 0, "Not valid dealId");

        return mapDeals[_dealId].dealId == _dealId ? true : false;
    }

    /** 

     *@notice - Function to get deal list created by issuer 

     *@param _userAccountId --> issuer userAccountId 

     *@return --> It returns issuer created deal list 

     */

    function getUsersDealList(
        uint256 _userAccountId /// issuer userAccountId
    ) public view isUserIssuer(_userAccountId) returns (uint256[] memory) {
        // bool result = regUser.checkUser(userAccountId);

        // require(result == true, "User not exist");

        return usersDealList[_userAccountId];
    }

    /** 

     *@notice - Function to get existing deal details 

     *@param _dealId -->Request for dealId to get dealId relevant deal details. 

     *@return --> It returns deal specific deal details 

     */

    function getDealDetails(uint256 _dealId) public view returns (Deal memory) {
        require(mapDeals[_dealId].dealId == _dealId, "Deal not exist");

        require(_dealId != 0, "Not valid dealId");

        return mapDeals[_dealId];
    }
}
