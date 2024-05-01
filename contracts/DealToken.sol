//SPDX-License-Identifier:UNLICENSED

pragma solidity ^0.8.0;

/**  

 @title - RegisterUsers.sol , Deal.sol , DealSubscription.sol ,ERC20.sol

 @notice - inherit RegisterUsers, Deal, DealSubscription & ERC20 token functionality details  

 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./DealSubscription.sol";

import "./Deal.sol";

import "./RegisterUsers.sol";

/**  

 @title - DirectDealToken 

 @notice - this contract used to create a token for deal created by issuer & transfer tokens to investors wallet 

 */

contract DirectDealToken is ERC20 {
    DealSubscription immutable subscription;

    DealContract deal;

    RegisterUsers immutable register;

    /** 

     *@notice - this variable used to store unique token name for deal 

     */

    string dealTokenName;

    /** 

     *@notice -This variable used to store token symbol for deal 

     */

    string dealTokenSymbol;

    /** 

     *@notice - This variable used to store token total investment for deal 

     */

    uint256 dealTotalInvestment;

    /** 

     *@notice - This variable used to store current dealId 

     */

    uint256 dealId;

    /** 

     *@notice - This variable used to store token generation wallet address for deal 

     */

    address tokenGenWalletAddress;

    /** 

     *@notice - Store respective contract addresss in constract instance and create deal and dealToken

    */

    constructor(
        uint256 _userAccountId,
        uint256 _dealId,
        string memory _tokenName,
        string memory _tokenSymbol,
        uint256 _totalInvestment,
        address _tokenGenWallet,
        address _subscriptionContractAddress,
        address _dealContractAddress,
        address _registrationContractAddress
    ) ERC20(_tokenName, _tokenSymbol) {
        require(
            _tokenGenWallet != address(0),
            "Please enter valid token generation address"
        );

        subscription = DealSubscription(_subscriptionContractAddress);

        deal = DealContract(_dealContractAddress);

        register = RegisterUsers(_registrationContractAddress);

        dealTokenName = _tokenName;

        dealTokenSymbol = _tokenSymbol;

        dealTotalInvestment = _totalInvestment;

        tokenGenWalletAddress = _tokenGenWallet;

        dealId = _dealId;

        deal.createDeal(
            _userAccountId,
            _dealId,
            dealTokenName,
            dealTokenSymbol,
            dealTotalInvestment,
            address(this)
        );

        _mint(tokenGenWalletAddress, _totalInvestment);
    }

    /** 

     *@notice --> It emits after successfully transfer token into investor wallet 

     */

    event TransferTokensIntoWallet(
        uint256 userAccountId,
        address walletAddress,
        uint256 indexed dealId,
        uint256 indexed dealInvestmentId,
        string tokenName,
        string tokensymbol,
        uint256 tokenBalance,
        uint256 timestamp
    );

    /** 

     *@notice - This struct used to store transfer token details 

     */

    struct TransferTokenDetails {
        uint256 userAccountId;
        uint256 dealId;
        address walletAddress;
        uint256 dealInvestmentId;
        string tokenName;
        string tokenSymbol;
        uint256 tokenAmount;
        uint256 time;
    }

    /** 

     *@notice - This modifier used to check deal exists or not 

     */

    modifier isDealIdExist(uint256 _dealId) {
        require(deal.checkDealExistOrNot(_dealId), "DealId not exist");

        _;
    }

    /** 

     *@notice - This maps transfer token details stored in TransferTokenDetails struct 

     */

    mapping(uint256 => TransferTokenDetails) mapTransferTokens;

    /** 

     *@notice - This mapping used to check investor already minted for deal or not 
     *@dev - isUserAlreadyInvested[userAccountId][dealId][dealInvestmentId]

     */

    mapping(uint256 => mapping(uint256 => mapping(uint256 => bool))) isUserAlreadyInvested;

    /** 

     *@notice - This mapping used to map list of all investors who invested in deal
     *@dev - countDealInvestors[dealId]

     */

    mapping(uint256 => uint256[]) countDealInvestors;

    /** 

     *@notice - Function to transfer token into investors wallet  

    *@param _userAccountId -->Request for investor userAccountId which is already subscribed 

    *@param _dealId --> Request for invested dealId. 

    *@param _dealInvestmentId -->Request for subscription id 

    *@param _tokens -->  Request for transfer token amount/invested token amount

   */

    function transferDealTokens(
        uint256 _userAccountId, ///investor userAccountId
        uint256 _dealId,
        uint256 _dealInvestmentId,
        uint256 _tokens
    ) external isDealIdExist(_dealId) {
        require(_dealId == dealId, "Deal not match");

        require(
            subscription.checkDealAndUser(
                _userAccountId,
                _dealId,
                _dealInvestmentId
            ),
            "User not subscribed for deal"
        );

        require(
            !isUserAlreadyInvested[_userAccountId][_dealId][_dealInvestmentId],
            "You have already invested in a deal"
        );

        require(
            subscription.getDealSubscriptionAmount(_dealInvestmentId) <=
                _tokens,
            "Insufficient amount"
        );

        address investorAddress = register.getUserWalletAddress(_userAccountId);

        transfer(investorAddress, _tokens);

        isUserAlreadyInvested[_userAccountId][_dealId][
            _dealInvestmentId
        ] = true;

        countDealInvestors[_dealId].push(_userAccountId);

        mapTransferTokens[_dealInvestmentId] = TransferTokenDetails({
            userAccountId: _userAccountId,
            dealId: _dealId,
            walletAddress: investorAddress,
            dealInvestmentId: _dealInvestmentId,
            tokenName: dealTokenName,
            tokenSymbol: dealTokenSymbol,
            time: block.timestamp,
            tokenAmount: _tokens
        });

        register.setUserWalletDetails(
            _userAccountId,
            _dealId,
            ERC20.symbol(),
            ERC20.balanceOf(investorAddress)
        );
        emit TransferTokensIntoWallet(
            _userAccountId,
            investorAddress,
            dealId,
            _dealInvestmentId,
            dealTokenName,
            dealTokenSymbol,
            _tokens,
            block.timestamp
        );
    }

    // /* @dev - To get minting token details for specific subscription id

    //     @params dealInvestmentId- Subscription id

    // */

    // function getTokenMintingDetails(

    //     uint256 dealInvestmentId

    // ) public view returns (string memory, uint256, uint256) {

    //     return (

    //         mapTransferTokens[dealInvestmentId].TokenSymbol,

    //         mapTransferTokens[dealInvestmentId].TokenAmount,

    //         mapTransferTokens[dealInvestmentId].Time

    //     );

    // }

    /** 

     *@notice - Function to get all transfer token details matched with dealInvestmentId
     *@param _dealInvestmentId --> Request for subscription id 
     *@return --> It returns transfer token details

     */

    function getTransferTokenDetails(
        uint256 _dealInvestmentId
    ) public view returns (TransferTokenDetails memory) {
        if (
            mapTransferTokens[_dealInvestmentId].dealInvestmentId !=
            _dealInvestmentId
        ) {
            revert("Enter valid dealInvestmentId");
        }

        return mapTransferTokens[_dealInvestmentId];
    }

    /** 

     *@notice - Function to get token name and symbol 
     *@return --> It returns deal token name and symbol 

     */

    function getTokenNameAndSymbol()
        external
        view
        returns (string memory, string memory)
    {
        return (dealTokenName, dealTokenSymbol);
    }

    /** 

     *@notice - Function to get list of all ivestors for deal 

     *@param _dealId -->Request for existing dealId

     *@return --> It returns invested users list for specified deal 

     */

    //getAllUsersForDeal
    function getAllInvestorsForDeal(
        uint256 _dealId
    ) public view isDealIdExist(_dealId) returns (uint256[] memory) {
        return countDealInvestors[_dealId];
    }

    /** 

     *@notice - Function to check user already invested in deal or not 

     *@param _userAccountId --> Investor userAccountId 

     *@param _dealId --> User invested deal id 

     *@param _dealInvestmentId --> Investment id for deal 

     *@return --> If user already invested in deal, it returns true 

     */

    function checkUserAlreadyInvested(
        uint256 _userAccountId, ///investor userAccountId
        uint256 _dealId,
        uint256 _dealInvestmentId
    ) public view returns (bool) {
        return
            isUserAlreadyInvested[_userAccountId][_dealId][_dealInvestmentId]
                ? true
                : false;
    }
}
