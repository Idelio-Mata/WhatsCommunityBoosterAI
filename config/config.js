// Load environment variables from .env file using dotenv
require('dotenv').config();
const path = require('path');

/**
 * Helper to parse integer environment variables with a fallback default.
 * Returns the parsed integer if valid, otherwise the provided default.
 */
function parseIntEnv(varName, defaultValue) {
  const value = process.env[varName];
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

// Determine if the application is running in production mode
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Configuration object with sensible defaults and environment overrides
const config = Object.freeze({
  // Basic bot settings
  BOT_NAME: process.env.BOT_NAME || 'WhatsCommunityBoosterAI',
  ADMIN_NUMBER: process.env.ADMIN_NUMBER || '',
  DEFAULT_GROUP_ID: process.env.DEFAULT_GROUP_ID || '',

  // Timing and rate limits
  DELAY_MIN: parseIntEnv('DELAY_MIN', 45000), // minimum delay between actions (ms)
  DELAY_MAX: parseIntEnv('DELAY_MAX', 120000), // maximum delay between actions (ms)
  DAILY_LIMIT: parseIntEnv('DAILY_LIMIT', 20), // max actions per day

  // Dashboard configuration
  DASHBOARD_PORT: parseIntEnv('DASHBOARD_PORT', 3000),
  DASHBOARD_PASSWORD: process.env.DASHBOARD_PASSWORD || 'changeme',
  REPORT_TIME: process.env.REPORT_TIME || '20:00',

  // File system paths (using absolute paths via path.join)
  DB_PATH: process.env.DB_PATH || path.join(process.cwd(), 'data', 'bot.db'),
  EXCEL_PATH: process.env.EXCEL_PATH || path.join(process.cwd(), 'data', 'contacts.xlsx'),
  SESSION_PATH: process.env.SESSION_PATH || path.join(process.cwd(), 'auth_info_baileys'),
  LOGS_PATH: process.env.LOGS_PATH || path.join(process.cwd(), 'logs'),

  // Environment flag
  IS_PRODUCTION,
});

module.exports = config;
