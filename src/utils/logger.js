/**
 * Logger utility using pino.
 * In development mode it logs to console with pretty output.
 * In production mode it writes daily log files to LOGS_PATH.
 */

const fs = require('fs');
const path = require('path');
const pino = require('pino');
const config = require('../../config/config');

// Ensure logs directory exists
if (!fs.existsSync(config.LOGS_PATH)) {
  fs.mkdirSync(config.LOGS_PATH, { recursive: true });
}

let logger;

if (config.IS_PRODUCTION) {
  // Create a write stream for daily log file
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const logFile = path.join(config.LOGS_PATH, `bot-${date}.log`);
  const stream = fs.createWriteStream(logFile, { flags: 'a' });
  logger = pino({ level: 'info' }, stream);
} else {
  // Development: pretty console output with colors
  logger = pino({
    transport: {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  });
}

module.exports = logger;