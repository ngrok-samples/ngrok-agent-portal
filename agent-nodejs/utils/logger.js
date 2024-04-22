var appRoot = require('app-root-path');
const winston = require('winston');
var path = require('path');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  silly: 5
}

const level = () => {
  const env = process.env.NODE_ENV || 'development'
  const isDevelopment = env === 'development'
  return isDevelopment ? 'debug' : 'warn'
}

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(colors)

function formatParams(info) {
  const { timestamp, level, message, ...args } = info;

  return `${timestamp} ${level} ${message} ${Object.keys(args).length
    ? JSON.stringify(args, "", "")
    : ""}`;
}

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  //winston.format.align(),
  winston.format.printf(formatParams)
);

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(formatParams)
);

let logger;
if (process.env.NODE_ENV !== "production") {
  logger = winston.createLogger({
    level: 'debug',
    format: developmentFormat,
    exitOnError: false, // do not exit on handled exceptions
    transports: [new winston.transports.Console()],
  });
} else {
  logger = winston.createLogger({
    level: 'debug',
    format: productionFormat,
    exitOnError: false, // do not exit on handled exceptions
    transports: [
      new winston.transports.File({ 
        filename: "/tmp/ngrok-agent-nodejs-error.log", 
        level: "error",
        maxsize: 5242880, // 5MB
        maxFiles: 1,
      }),
      new winston.transports.File({ 
        filename: "/tmp/ngrok-agent-nodejs-combined.log", 
        maxsize: 5242880, // 5MB
        maxFiles: 1,
      }),
    ]
  });
}

module.exports = logger;