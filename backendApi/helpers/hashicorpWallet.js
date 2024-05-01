
const Web3 = require('web3')
const web3 = new Web3(process.env.GETH_ENV)
const crypto = require('crypto')
const axios = require('axios');
const fs = require("fs")
const path = require("path")

const rootKey = process.env.ROOT_KEY
const roleId = process.env.ROLE_ID
const secretId = process.env.SECRET_ID


const NodeVault = require('node-vault');
const vault = NodeVault({
  endpoint: 'http://127.0.0.1:8200',
  apiVersion: 'v1',
  token: process.env.ROOT_KEY
});



const policyName = 'WalletSecrets'; // Policy name
const approleName = 'approle';

const policy = `
path "secret/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
`;

async function main() {
  try {
    // Initialize Vault and unseal it
    if (!process.env.ROOT_KEY && !process.env.UNSEAL_KEY) {
      const secrets = await initializeAndUnseal()
      const token = secrets.token
      const unsealKey = secrets.unsealKey
      if (!token && !unsealKey) {
        throw new Error("You must supply a status to change to")
      }

      const envPath = path.join(process.cwd(), ".env")
      let env = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/g);
      let prevExists = false
      for (let lineNumber in env) {
        if (env[lineNumber].startsWith("ROOT_KEY=") && env[lineNumber].startsWith("UNSEAL_KEY=")) {
          prevExists = true
          env[lineNumber] = `ROOT_KEY=${token}`
          env[lineNumber] = `UNSEAL_KEY=${unsealKey}`
          break
        }
      }
      if (!prevExists) env.push(`ROOT_KEY=${token}`)
      if (!prevExists) env.push(`UNSEAL_KEY=${unsealKey}`)

      const newEnv = env.join("\n")
      fs.writeFileSync(envPath, newEnv)
      console.log(`Successfully changed the status to "${token} ${unsealKey}"`)

    } else {

      // console.log("updatedVault", updatedVault)

      if (!process.env.SECRET_ID && !process.env.ROLE_ID) {

        await createPolicy(policyName, policy)

        await enableAppRole(process.env.ROOT_KEY);
        await configureAppRole(process.env.ROOT_KEY, approleName, policyName)

        const secretRole = await getRoleID(approleName, process.env.ROOT_KEY)

        const secretId = secretRole.secretId
        const rollId = secretRole.roleId

        if (!secretId && !rollId) {
          throw new Error("You must supply a status to change to")
        }

        const envPath = path.join(process.cwd(), ".env")
        let env = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/g);
        let prevExists = false
        for (let lineNumber in env) {
          if (env[lineNumber].startsWith("SECRET_ID=") && env[lineNumber].startsWith("ROLE_ID=")) {
            prevExists = true
            env[lineNumber] = `SECRET_ID=${secretId}`
            env[lineNumber] = `ROLE_ID=${rollId}`
            break
          }
        }
        if (!prevExists) env.push(`SECRET_ID=${secretId}`)
        if (!prevExists) env.push(`ROLE_ID=${rollId}`)
        const newEnv = env.join("\n")
        fs.writeFileSync(envPath, newEnv)

        console.log(`Successfully changed the roll & secrets to "${secretId}" ++ "${rollId}"`)
        await enableKVSecretsEngine(process.env.ROOT_KEY)
      }

      //await generateSecretID(approleName)


    }

  } catch (error) {
    console.error('Error:', error);
  }
}
main()


async function unsealVault() {
  try {
    const secret_shares = 1;
    const data = await vault.unseal({ secret_shares, key: process.env.UNSEAL_KEY });
    return data
  } catch (error) {
    return error.message
  }
}


async function initializeAndUnseal() {
  try {
    const secret_shares = 1;
    const secret_threshold = 1;
    const response = await vault.init({ secret_shares, secret_threshold });
    console.log(response, "response");
    vault.token = response.root_token;
    const keys = response.keys;
    await vault.unseal({ secret_shares, key: keys[0] });
    const secret = {
      unsealKey: keys[0],
      token: vault.token
    }
    return secret
  } catch (error) {
    throw new Error(`Error initializing and unsealing Vault: ${error}`);
  }
}

async function createPolicy(name, rules) {
  try {
    const endpoint = `http://127.0.0.1:8200/v1/sys/policies/acl/${name}`;
    await axios.post(endpoint, {
      policy: rules,
    }, {
      headers: {
        'X-Vault-Token': process.env.ROOT_KEY,
      },
    });

    console.log(`Policy created: ${name}`);
    return name;
  } catch (error) {
    throw new Error(`Error creating policy: ${error}`);
  }
}

// Call the function to create a policy

async function enableAppRole(token) {
  try {
    const response = await axios({
      method: 'post',
      url: 'http://127.0.0.1:8200/v1/sys/auth/approle',
      headers: {
        'X-Vault-Token': token, // Replace with your Vault token
      },
      data: {
        type: 'approle',
      },
    });

    if (response.status === 204) {
      console.log('AppRole authentication method enabled successfully.');
      return true;
    } else {
      const responseBody = await response.text();
      console.error(`Error enabling AppRole authentication method: ${response.status} - ${responseBody}`);
      return false;
    }
  } catch (error) {
    console.error(`Error enabling AppRole authentication method: ${error}`);
    return false;
  }
}

async function configureAppRole(token, approleName, policyName) {
  try {
    const response = await axios({
      method: 'post',
      url: 'http://127.0.0.1:8200/v1/auth/approle/role/' + approleName,
      headers: {
        'X-Vault-Token': token,
      },
      data: {
        policies: policyName,
        period: '1h',
      },
    });

    if (response.status === 204) {
      console.log(`AppRole configured: ${approleName}`);
      return true
    } else {
      console.error(`Error configuring AppRole: ${response.status} - ${response.data}`);
      return true
    }
  } catch (error) {
    console.error(`Error configuring AppRole: ${error}`);
    return true;
  }
}



async function getRoleID(approleName, token) {
  try {
    // Step 1: Retrieve the Role ID
    const response = await axios.get(`http://127.0.0.1:8200/v1/auth/approle/role/${approleName}/role-id`, {
      headers: {
        'X-Vault-Token': token,
      },
    });

    const roleId = response.data.data.role_id;
    console.log(`Role ID: ${roleId}`);


    // Step 2: Generate a Secret ID
    const secretIdResponse = await axios.post(`http://127.0.0.1:8200/v1/auth/approle/role/${approleName}/secret-id`, {}, {
      headers: {
        'X-Vault-Token': token,
      },
    });

    const secretId = secretIdResponse.data.data.secret_id;
    console.log(`Secret ID: ${secretId}`);

    return { roleId, secretId };
  } catch (error) {
    throw new Error(`Error getting Role ID and Secret ID: ${error}`);
  }
}


async function enableKVSecretsEngine(token) {
  try {
    // Define the API e}ndpoint for enabling the KV-V2 secrets engine
    const endpoint = `http://127.0.0.1:8200/v1/sys/mounts/secret`;

    // Make a POST request to enable the KV-V2 secrets engine
    const response = await axios.post(endpoint, {
      type: 'kv-v2',
    }, {
      headers: {
        'X-Vault-Token': token,
      },
    });

    console.log(`KV-V2 secrets engine enabled `);
    return true
  } catch (error) {
    throw new Error(`Error enabling KV-V2 secrets engine: ${error}`);
  }
}




const encrypt = (plainText, password) => {
  try {
    const iv = crypto.randomBytes(16)
    const key = crypto.createHash('sha256').update(password).digest('base64').substr(0, 32)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(plainText)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    const val = iv.toString('hex') + ':' + encrypted.toString('hex')
    return val
  } catch (error) {
    console.log(error)
  }
}

const decrypt = (encryptedText, password) => {
  try {
    const textParts = encryptedText.split(':')
    const iv = Buffer.from(textParts.shift(), 'hex')

    const encryptedData = Buffer.from(textParts.join(':'), 'hex')
    const key = crypto.createHash('sha256').update(password).digest('base64').substr(0, 32)
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)

    const decrypted = decipher.update(encryptedData)
    const decryptedText = Buffer.concat([decrypted, decipher.final()])
    const val = decryptedText.toString()
    return val
  } catch (error) {
    console.log(error)
  }
}

const createWallet = async (UserAccountId) => {
  await vault.approleLogin({
    role_id: roleId,
    secret_id: secretId
  })
  // const newAccount = await web3.eth.personal.newAccount('securityIssuence')
  // const keyObject = keythereum.importFromFile(newAccount, keystorePath)
  // const privateKeys = await keythereum.recover('securityIssuence', keyObject)
  const account = await web3.eth.accounts.create()
  // console.log("accounts:::::::::::", account)
  // const covetKey = Buffer.from(account.privateKey).toString('hex')
  // var encrypt= await encryptString(covetKey,encryptionMethod,key,iv);
  //
  // console.log('NodeJS encrypt: ', encrypt_token(covetKey));
  //  console.log(encrypt,"encrypt");
  const address = account.address
  const privateKey = encrypt(account.privateKey, process.env.UNLOCK)

  const data = {
    address,
    privateKey
  }
  const header = {
    token: rootKey
  }
  const option = { header, data }

  // console.log("header", header, "data", data)
  const results = await vault
    .write(`secret/data/MySecrets/${UserAccountId}`, option)
    .then(async () => await vault.read(`secret/data/MySecrets/${UserAccountId}`))
    .catch((err) => console.error(err))
  // console.log('wallet5', new Date().getTime())
  // console.log('results', results)
  return results;
}

const getWallet = async (UserAccountId) => {
  console.log('we have entered in getWallet')
  const result = await vault.approleLogin({
    role_id: roleId,
    secret_id: secretId
  })

  vault.token = result.auth.client_token
  const results = await vault.read(`secret/data/MySecrets/${UserAccountId}`)
  const decryptor = decrypt(results.data.data.privateKey, process.env.UNLOCK)
  return decryptor
}

const getListWallet = async (req, res) => {
  const result = await vault.approleLogin({
    role_id: roleId,
    secret_id: secretId
  })
  vault.token = result.auth.client_token
  // console.log(vault.token)
  const results = await vault.list('secret/metadata/MySecrets')

  // console.log(results.data.keys, 'ppp')
  return results.data.keys
}

module.exports = {
  createWallet,
  getWallet,
  getListWallet,
  unsealVault
}

// const {web3 } = require('./signeTransactionHelper')
// const keythereum = require('keythereum')
// const keystorePath = '/home/user/Bambu_GETH2/node1/'

// const rootKey = process.env.ROOT_KEY
// const unsealKey = process.env.UNSEAL_KEY

// const vault = require('node-vault')({
//   apiVersion: 'v1',
//   endpoint: 'http://127.0.0.1:8200',
//   token: rootKey,
// })

// const roleId = process.env.ROLE_ID
// const secretId = process.env.SECRET_ID

// const createWallet = async (req, res) => {
//   console.log('we have enterd')
//   await vault.approleLogin({
//     role_id: roleId,
//     secret_id: secretId,
//   })

//   const newAccount = await web3.eth.personal.newAccount('securityIssuence')

//   var keyObject = keythereum.importFromFile(newAccount, keystorePath)
//   var privateKeys = await keythereum.recover('securityIssuence', keyObject)
//   const covetKey = Buffer.from(privateKeys).toString('hex')

//   const address = newAccount
//   const privateKey = covetKey
//   console.log('address', address, 'privateKey', privateKey)

//   const data = {
//     address: address,
//     privateKey: privateKey,
//   }
//   const header = {
//     token: rootKey,
//   }
//   const option = { header, data }
//   const results = await vault
//     .write(`secret/data/${data.address}`, option)
//     .then(async () => await vault.read(`secret/data/${data.address}`))
//     .catch((err) => console.error(err))

//    console.log("results",results);
//    return results;

//   //   res.status(200).json({"account details":results.data.data});
// }

// const getWallet = async(walletAddress) => {
//   const result =  await vault.approleLogin({
//     role_id: roleId,
//     secret_id: secretId,
//   })

//   vault.token = result.auth.client_token;
//   const results = await vault.read(`secret/data/${walletAddress}`)

//   console.log("results",results.data.data.address ,">>>" ,results.data.data.privateKey);
//    return results;

//   //   res.status(200).json({"account details":results.data.data});
// }
// const getListWallet = async () => {
//   const result =  await vault.approleLogin({
//     role_id: roleId,
//     secret_id: secretId,
//   })
//   vault.token = result.auth.client_token;
//   // console.log(vault.token)
//   const results = await vault.list('secret/metadata');
//    console.log(results.data.keys,"ppp")
//    return results;
// }
// //   const getListDataWallet = async (req, res) => {
// //     const result =  await vault.approleLogin({
// //       role_id: roleId,
// //       secret_id: secretId,
// //     })
// //     vault.token = result.auth.client_token;
// //     console.log(vault.token)
// //     const results = await vault.list('secret/data/*');
// //     console.log(results,"ppp")
// //   }

// module.exports = { createWallet,getWallet,getListWallet}
