// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

/**  

 @title - Ownable  

 @notice -This library used to add owner functionality  

 */

import "@openzeppelin/contracts/access/Ownable.sol";

/** 

 *@title - RegisterUser 

 *@notice - This contract for storing and managing user's data and KYC details 

 */

contract RegisterUsers is Ownable {
    /** 

     *@notice - It emits after successful user creation 
               
     */

    event CreateNewUser(
        uint256 indexed userAccountId,
        address walletAddress, ///issuer or investor userAccountId
        uint256 group,
        bool indexed kycStatus,
        uint256 timestamp
    );

    /** 

     * @notice - It emits after successful user KYC updation 

     */

    event UpdateKycDetails(
        uint256 indexed userAccountId, /// issuer or investor userAccountId
        bool indexed kycStatus,
        uint256 indexed timestamp
    );

    /** 

     *@notice - It emits after wallet details  gets added in AddWalletDetails struct successfully
               
     */

    event AddWalletDetails(
        uint256 indexed userAccountId, /// issuer or investor userAccountId
        uint256 dealId,
        string tokenSymbol,
        uint256 tokenBalance,
        uint256 timestamp
    );

    /** 

     *@notice - It emits after successfully updating user data on blockchain

     */

    /// issuer or investor userAccountId
    event UpdateUserData(uint256 indexed userAccountId, string indexed data);

    /** 

     *@notice- This struct used to store user registration details 

     */

    struct User {
        uint256 userAccountId; /// issuer or investor userAccountId
        address walletAddress;
        bool kycStatus;
        uint256 group;
        string data;
    }

    /** 

     *@notice- This struct used to store invested token details of investors

     */

    struct WalletDetails {
        uint256 userAccountId; /// investor userAccountId
        uint256 dealId;
        string tokenSymbol;
        uint256 tokenBalance;
    }

    /** 

     *@notice - This mapping used to map all token details stored in WalletDetails struct
     *@dev - mapWalletData[userAccountId]

     */

    mapping(uint256 => WalletDetails[]) mapWalletData;

    /** 

     *@notice - This mapping used to map all users details stored in User struct
     *@dev - mapUsers[userAccountId]

     */

    mapping(uint256 => User) mapUsers;

    /** 

     *@notice - This mapping used to check wallet address if already exists or not 
     *@dev -isWalletAddressExist[walletAddress]

     */

    mapping(address => bool) isWalletAddressExist;

    ///@notice - This variable used to count user wallet tokens

    // uint256 countToken;

    /** 

     *@notice - This mapping used to map deal specific tokens for user
     *@dev - mapWalletDealSpecificTokens[userAccountId][dealId]

     */

    mapping(uint256 => mapping(uint256 => WalletDetails[])) mapWalletDealSpecificTokens;

    /** 

     *@notice - Function to create new user (issuer or investor 

     *@param _userAccountId --> request for userAccountId 

     *@param _group  --> request for user group(investor/issuer) 

     *@param _kycStatus --> request for KYC status stored on backend 

     *@param _walletAddress --> request for wallet address created by web3 

     *@param _data ---> store extra data for user (incase any extra feiled require)

     */

    function createUser(
        uint256 _userAccountId,
        uint256 _group,
        bool _kycStatus,
        address _walletAddress,
        string memory _data
    ) public onlyOwner {
        // require(_group == 0 || _group == 1, "Invalid group");

        require(_userAccountId != 0, "Invalid userAccountId");

        require(
            mapUsers[_userAccountId].userAccountId != _userAccountId,
            "User account already exist"
        );

        require(
            !isWalletAddressExist[_walletAddress],
            "Wallet address already exist"
        );

        require(
            _walletAddress != msg.sender && _walletAddress != address(0x00),
            "Invalid address"
        );

        require(_kycStatus, "Your KYC not verified");

        isWalletAddressExist[_walletAddress] = true;

        mapUsers[_userAccountId] = User({
            userAccountId: _userAccountId,
            walletAddress: _walletAddress, //default 0 address
            kycStatus: _kycStatus,
            group: _group,
            data: _data
        });

        emit CreateNewUser(
            _userAccountId,
            _walletAddress,
            _group,
            _kycStatus,
            block.timestamp
        );
    }

    /** 

     *@notice - Function to update KYC details 

     *@param _userAccountId --> request existing userAccountId for KYC updation 

     *@param _updatedKYCStatus  --> request for updated KYC status (true/false) 

     */

    function updateUserKYC(
        uint256 _userAccountId,
        bool _updatedKYCStatus
    ) public onlyOwner {
        require(
            mapUsers[_userAccountId].userAccountId == _userAccountId &&
                _userAccountId != 0,
            "UserAccountId not found"
        );

        require(
            mapUsers[_userAccountId].kycStatus != _updatedKYCStatus,
            "KycStatus already updated"
        );

        mapUsers[_userAccountId].kycStatus = _updatedKYCStatus;

        emit UpdateKycDetails(
            _userAccountId,
            _updatedKYCStatus,
            block.timestamp
        );
    }

    /** 

     *@notice - Function to get user (issuer/investor) details 

     *@param _userAccountId --> request for existing userAccountId to get user details

     *@return - it returns user details for requested user

     */

    function getUserDetails(
        uint256 _userAccountId
    ) public view returns (User memory) {
        require(_userAccountId != 0, "Incorrect userAccountId");

        require(
            mapUsers[_userAccountId].userAccountId == _userAccountId,
            "Not a registered user"
        );

        return mapUsers[_userAccountId];
    }

    // /**

    //  *@notice - Function to check user registered or not

    //  *@param _userAccountId --> request to check userAccountId

    //  *@return - it returns true if user exists on blockchain platform

    //  */

    function checkUser(uint256 _userAccountId) external view returns (bool) {
        return
            mapUsers[_userAccountId].userAccountId == _userAccountId &&
                _userAccountId != 0 &&
                mapUsers[_userAccountId].kycStatus
                ? true
                : false;
    }

    /** 

     *@notice - Function to get user wallet address 

     *@param _userAccountId --> request for userAccountId 

     *@return - it returns user wallet address 

     */

    function getUserWalletAddress(
        uint256 _userAccountId
    ) external view returns (address) {
        require(
            mapUsers[_userAccountId].userAccountId == _userAccountId,
            "UserAccountId not found"
        );

        require(_userAccountId != 0, "Incorrect userAccountId");

        return mapUsers[_userAccountId].walletAddress;
    }

    /** 

     *@notice - Function to validate specified account id is for issuer or not  

     *@param _userAccountId --> Request issuer userAccountId 

     *@return - It returns true, if user is issuer.

     */

    function checkUserIssuer(
        uint256 _userAccountId
    ) public view returns (bool) {
        require(_userAccountId != 0, "Incorrect userAccountId");

        require(
            mapUsers[_userAccountId].userAccountId == _userAccountId,
            "UserAccountId not found"
        );

        require(mapUsers[_userAccountId].kycStatus, "KYC status false");

        return mapUsers[_userAccountId].group == 1 ? true : false;
    }

    /** 

     *@notice - Function to validate specified account id is for investor or not 

     *@param _userAccountId -->Request investor userAccountId

     *@return - It returns true ,if user is investor.

     */

    function checkUserInvestor(
        uint256 _userAccountId
    ) public view returns (bool) {
        require(_userAccountId != 0, "Incorrect userAccountId");

        require(
            mapUsers[_userAccountId].userAccountId == _userAccountId,
            "UserAccountId not found"
        );

        require(mapUsers[_userAccountId].kycStatus, "KYC status false");

        return mapUsers[_userAccountId].group == 0 ? true : false;
    }

    /** 

     *@notice - Function to store user invested tokens 

     *@param _userAccountId --> Request for userAccountId for investor 

     *@param _dealId---> Request for issuer invested  dealId 

     *@param _tokenSymbol---> Request for deal token symbol 

     *@param _tokenBalance -->Request for invested amount for token 

     */

    function setUserWalletDetails(
        uint256 _userAccountId,
        uint256 _dealId,
        string memory _tokenSymbol,
        uint256 _tokenBalance
    ) external {
        require(_userAccountId != 0, "Incorrect userAccountId");

        require(
            mapUsers[_userAccountId].userAccountId == _userAccountId,
            "UserAccountId  not found"
        );

        // countToken = 0;

        mapWalletDealSpecificTokens[_userAccountId][_dealId].push(
            WalletDetails(_userAccountId, _dealId, _tokenSymbol, _tokenBalance)
        );

        mapWalletData[_userAccountId].push(
            WalletDetails(_userAccountId, _dealId, _tokenSymbol, _tokenBalance)
        );

        // countToken++;

        emit AddWalletDetails(
            _userAccountId,
            _dealId,
            _tokenSymbol,
            _tokenBalance,
            block.timestamp
        );
    }

    /** 

     *@notice - Function to get all user invested token list 

     *@param _userAccountId -->  userAccountId for investor 

     *@return - It returns all user invested token list

     */

    function getAllUserWalletDetails(
        uint256 _userAccountId
    ) public view returns (WalletDetails[] memory) {
        require(
            mapUsers[_userAccountId].userAccountId == _userAccountId &&
                _userAccountId != 0,
            "UserAccountId not found"
        );

        return mapWalletData[_userAccountId];
    }

    /**
     *@notice - Function to update users data
     *@dev - Update data field
     *@param _userAccountId -->  Request userAccountId for requested user
     *@param _data ---> Request for update data
     */

    function updateUserData(
        uint256 _userAccountId,
        string memory _data
    ) public onlyOwner {
        require(
            mapUsers[_userAccountId].userAccountId == _userAccountId,
            "UserAccountId not match"
        );
        require(
            mapUsers[_userAccountId].kycStatus == true,
            "Your KYC not verified"
        );

        mapUsers[_userAccountId].data = _data;

        emit UpdateUserData(_userAccountId, _data);
    }

    /** 

     *@notice - Function get deal specific invested token list 

     *@param _userAccountId --> Request to match userAccountId 

     *@param _dealId ---> Request to match deal, invested by investor 

     *@return - It returns deal specific user invested token list 

     */

    function getDealSpecificWalletDetails(
        uint256 _userAccountId,
        uint256 _dealId
    ) public view returns (WalletDetails[] memory) {
        require(
            mapUsers[_userAccountId].userAccountId == _userAccountId &&
                _userAccountId != 0,
            "UserAccountId not found"
        );

        return mapWalletDealSpecificTokens[_userAccountId][_dealId];
    }
}
