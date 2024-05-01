//SPDX-License-Identifier:UNLICENSED

pragma solidity ^0.8.0;

/**  

 @title - DealToken.sol 

 @notice - Create new token token intance using DealToken contract 

 */

import "./DealToken.sol";

/** 

 *@title - IToken 

 *@notice - Get TokeName and TokenSymbol from dealToken contract 

 */

interface IToken {
    function getTokenNameAndSymbol()
        external
        view
        returns (string memory, string memory);
}

/** 

 *@title - DirectTokenFactory 

 *@notice - This factory contract for dynamic deal deployment 

 */

contract DirectTokenFactory {
    /** 

     *@notice - it emits after token creation done for deal 

     */

    // event TokenCreated(
    //     uint256 dalId,
    //     address tokenAddress,
    //     string tokenName,
    //     string tokenSymbol,
    //     uint256 timestamp
    // );

    /** 

     *@notice - this array used for storing token contract instance 

     */

    DirectDealToken[] tokenArray;

    /** 

     *@notice - this mapping used to check deal exist or not 
     *@dev - isTokenExist[tokenSymbol]

     */

    mapping(string => bool) isTokenExist;

    uint256 counter;

    /** 

     *@notice - This mapping used to map token address for specific token symbol 
     *@dev - tokenAddress[tokenSymbol]

     */

    mapping(string => address) tokenAddress;

    /** 

     *@notice -This mapping used to map token index 
     *@dev - tokenIndex[tokenSymbol]

     */

    mapping(string => uint256) tokenIndex;

    /** 

     *@notice  - Function to create token intance 

     *@param userAccountId --> Request for issuer userAccountId 

     *@param dealId  ---> Request for dealId 

     *@param tokenName  --> Request for tokenName 

     *@param tokenSymbol --> Request for tokenSymbol 

     *@param totalTokenInvestment -->Request for total amount for launching tokens on platform 

     *@param subscriptionContractAddress -->request for subscription contract address 

     *@param dealContractAddress -->request for deal contract address 

     *@param registerUserContractAddress --> request for register users contract address 

     */

    function createNewDealToken(
        uint256 userAccountId, ///issuer userAccountId
        uint256 dealId,
        string memory tokenName,
        string memory tokenSymbol,
        uint256 totalTokenInvestment,
        address tokenGenWallet,
        address subscriptionContractAddress,
        address dealContractAddress,
        address registerUserContractAddress // deals memory deal
    ) external {
        require(!isTokenExist[tokenSymbol], "This token symbol already exist");

        tokenIndex[tokenSymbol] = counter;

        counter++;

        isTokenExist[tokenSymbol] = true;

        DirectDealToken Token = new DirectDealToken(
            userAccountId,
            dealId,
            tokenName,
            tokenSymbol,
            totalTokenInvestment,
            tokenGenWallet,
            subscriptionContractAddress,
            dealContractAddress,
            registerUserContractAddress
        );

        tokenArray.push(Token);

        tokenAddress[tokenSymbol] = address(Token);

        // emit TokenCreated(
        //     dealId,
        //     address(Token),
        //     tokenName,
        //     tokenSymbol,
        //     block.timestamp
        // );
    }

    /** 

     *@notice  - function to get token address 

     *@param tokenSym --> request for existing token symbol to get matching deal contract 
     *@return -->it returns token address of matching token symbol
     */

    function getAddressFromSymbol(
        string memory tokenSym
    ) external view returns (address) {
        require(isTokenExist[tokenSym], "Token not found");

        return tokenAddress[tokenSym];
    }

    /** 

     *@notice - Function to get token details from symbol 
     *@param tokenSym --> Existing token symbol related details 
     *@param --> It returns token name and symbol for deal
     */

    function getTokenDetailsFromSymbol(
        string memory tokenSym
    ) external view returns (string memory, string memory) {
        require(isTokenExist[tokenSym], "Token not found");

        address tokenContract = tokenAddress[tokenSym];

        IToken token = IToken(tokenContract);

        return token.getTokenNameAndSymbol();
    }
}
