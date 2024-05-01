const { express, router, web3 } = require('../helpers/signeTransactionHelper')
const keythereum = require('keythereum')
const keystorePath = '//wsl.localhost/Ubuntu-22.04/home/priya/node1/'
router.use(express.json())

const rootKey = process.env.ROOT_KEY
// const unsealKey = process.env.UNSEAL_KEY

const vault = require('node-vault')({
  apiVersion: 'v1',
  endpoint: process.env.GETH_ENV,
  token: rootKey
})

const roleId = process.env.ROLE_ID
const secretId = process.env.SECRET_ID

router.get('/createWallet', async (req, res) => {
  await vault.approleLogin({
    role_id: roleId,
    secret_id: secretId
  })

  const newAccount = await web3.eth.personal.newAccount('priya')

  const keyObject = keythereum.importFromFile(newAccount, keystorePath)
  const privateKeys = await keythereum.recover('priya', keyObject)
  const covetKey = Buffer.from(privateKeys).toString('hex')

  const address = newAccount
  const privateKey = covetKey
  console.log('address', address, 'privateKey', privateKey)

  const data = {
    address,
    privateKey
  }
  const header = {
    token: rootKey
  }
  const option = { header, data }
  const results = await vault
    .write(`secret/data/${data.address}`, option)
    .then(async () => await vault.read(`secret/data/${data.address}`))
    .catch((err) => console.error(err))

  res.status(200).json({ 'account details': results.data.data })
})

module.exports = router
