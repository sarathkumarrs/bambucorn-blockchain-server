const { createLogger, format, transports } = require('winston')

const myFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.align(),
  format.printf((info) => {
    const { timestamp, level, message, stack } = info
    return `${timestamp} [${level}] ${message}${stack ? '\n' + stack : ''}`
  })
)

// Create a logger instance for info logs
const infoLogger = createLogger({
  format: format.combine(
    // format.colorize({ all: true, colors: { info: 'green' } }),
    format.simple(),
    format.errors({ stack: true }),
    myFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: 'logs/server.log',
      format: format.combine(
        format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
        format.align(),
        format.printf((info) => {
          const { timestamp, level, message, stack } = info
          const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message)
          return `${timestamp} [${level}] ${formattedMessage}${stack ? '\n' + stack : ''}`
        })
      )
    })
  ],
  level: 'info'

})

// Create a logger instance for error logs
const errorLogger = createLogger({
  format: format.combine(
    // format.colorize({ all: true, colors: { error: 'red' } }),
    format.simple(),
    format.errors({ stack: true }),
    myFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: 'logs/error.log',
      format: format.combine(
        format.simple(),
        format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
        format.align(),
        format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`)
      )
    })
  ],
  level: 'error'
})

module.exports = { infoLogger, errorLogger }
