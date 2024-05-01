const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const helmet = require('helmet')
const fs = require('fs');

// const limitter = require('express-rate-limit')
const { errorLogger, infoLogger } = require('./helpers/logger.js')

const app = express()
dotenv.config()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const port = process.env.PORT
// app.use(cors({
//   origin: "http://127.0.0.1:4000",
//   methods: ['GET', 'POST', 'PUT']
// }))



app.use(helmet())

const cluster = require('cluster')
const os = require('os')

const numCPUs = os.cpus().length

if (cluster.isMaster) {
  // Fork worker processes
  fs.watch('.env', (eventType, filename) => {
    if (eventType === 'change') {
      // Reload the application when .env changes
      console.log('Detected change in .env file. Reloading application...');
      cluster.disconnect(); // Disconnect the master process
    }
  });
  // for (let i = 0; i < numCPUs; i++) {
  cluster.fork()
  // }
  cluster.on('exit', (worker, code, signal) => {
    // console.log(`${worker.process.pid} died`)
    cluster.fork()
  })
} else {
  // coockies parser body parser expir time
  app.use('/user', require('./routes/registration.js'))
  app.use('/deal', require('./routes/dealBase.js'))
  app.use('/dealToken', require('./routes/dealToken.js'))
  app.use('/vote', require('./routes/voting.js'))
  app.use('/subscribe', require('./routes/subscription.js'))
  app.use('/factory', require('./routes/factory.js'))
  app.use('/hashicorp', require('./routes/hashicorp.js'))

/*  app.use((req, res) => {
    errorLogger.error('Invalid request')
    res.status(404).send('Invalid route path')
  })*/

  app.get('/', (req, res) => {
    res.send("Node base path");
  });


  // console.log('running process', process.pid)
  app.listen(port, () => {
    // console.log(process.pid, 'process id')
    infoLogger.info(JSON.stringify(`Running server on ${port}`))
  })
}
