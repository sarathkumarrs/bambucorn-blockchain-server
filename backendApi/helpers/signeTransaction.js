const express = require('express')
const router = new express.Router()
const Web3 = require('web3')
const dotenv = require('dotenv')
const Tx = require('ethereumjs-tx').Transaction
const Common = require('ethereumjs-common').default
dotenv.config()

const option = {
  timeout: 60000 * 2, // ms
  reconnect: {
    auto: true,
    delay: 5000, // ms
    maxAttempts: 5,
    onTimeout: false
  }
}

const web3 = new Web3(process.env.GETH_ENV, option)

// const signPostTransactionWithRetry = async (method, address) => {
//   let retryCount = 0;
//   const maxRetries = 5;
//   const retryInterval = 20000;
//   const attemptTransaction = async () => {
//     try {
//       const result = await signPostTransaction(method, address);
//       if (result) {
//         return result; // Successful transaction, return the result
//       }
//     } catch (error) {
//       console.error('Error during transaction:', error);
//       if (error.message.includes('Replacement transaction underpriced')) {
//         if (retryCount < maxRetries) {
//           retryCount++;
//           console.log(`Retrying transaction (Attempt ${retryCount})...`);
//           await new Promise((resolve) => setTimeout(resolve, retryInterval));
//           return await attemptTransaction();
//         } else {
//           console.error('Transaction failed after maximum retries.');
//           return null;
//         }
//       } else {
//         throw error;
//       }
//     }
//   }
//   return await attemptTransaction();
// }

const signPostTransaction = async (method, address) => {

  try {
    const getcount = await web3.eth.getTransactionCount(process.env.GETH_ADMIN, 'pending')
    // let gasprice = await web3.eth.getGasPrice()
    // gasprice = Math.round(gasprice * 1.2)
    const txObject = {
      nonce: getcount,
      to: address,
      gasLimit: web3.utils.toHex(8000000),
      // gasPrice: 200000,
      data: method.encodeABI()
    }

    const common = Common.forCustomChain('mainnet', { networkId: 85785, chainId: 85785, name: 'besu' }, 'byzantium')
    const tx = new Tx(txObject, { common })
    const pvtKeyBuffer = Buffer.from(process.env.PK, 'hex')
    tx.sign(pvtKeyBuffer)
    const serializedTx = tx.serialize()
    const raw = '0x' + serializedTx.toString('hex')

    const result = await web3.eth.sendSignedTransaction(raw);

    if (!result.err) {
      console.log('Transaction hash: ' + result.transactionHash);
      const receipt = await web3.eth.getTransactionReceipt(result.transactionHash);

      if (receipt.status === true) {
        console.log('Transaction was successful.');
        return result.transactionHash;
      } else {
        console.log('Transaction failed or was reverted.');
        return null;
      }
    } else {
      throw new Error(result.err.message);
    }
  } catch (error) {
    throw error;
  }
}


function sendResponse(res, statusCode, message) {
  if (statusCode === 400) {
    res.status(statusCode).json({
      statusCode: 400,
      error: message,
      data: null
    })
  }
  if (statusCode === 404) {
    res.status(statusCode).json({
      statusCode: 404,
      error: message,
      data: null
    })
  }
  if (statusCode === 403) {
    res.status(statusCode).json({
      statusCode: 403,
      error: message,
      data: null
    })
  }

  if (statusCode === 401) {
    res.status(statusCode).json({
      statusCode: 401,
      error: message,
      data: null
    })
  }

  if (statusCode === 200) {
    res.status(statusCode).json({
      statusCode: 200,
      error: null,
      data: message
    })
  }

  if (statusCode === 201) {
    res.status(statusCode).json({
      statusCode: 201,
      error: null,
      data: message
    })
  }
  if (statusCode === 500) {
    res.status(statusCode).json({
      statusCode: 500,
      error: message,
      data: null
    })
  }
}

module.exports = { sendResponse, express, router, Web3, web3, signPostTransaction }
