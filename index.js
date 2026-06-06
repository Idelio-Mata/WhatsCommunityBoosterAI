/**
 * Entry point for the WhatsApp automation bot.
 *
 * This script orchestrates the startup sequence of the bot, including
 * initializing the database, launching the dashboard, connecting to the
 * WhatsApp service, loading groups and starting the scheduler. It also
 * handles graceful shutdown on SIGINT and SIGTERM.
 */

const logger = require('./src/utils/logger');
const config = require('./config/config');

// Import required modules
const { initDatabase } = require('./src/data/database');
const { startDashboard } = require('./src/dashboard/server');
const { connectWhatsApp } = require('./src/bot/whatsapp');
const { startScheduler } = require('./src/bot/scheduler');

/**
 * Main startup routine for the bot.
 *
 * The steps are executed in the exact order required by the specification.
 * Each step logs a success message using the shared Pino logger.
 */
async function main() {
  // Log bot name and version
  logger.info("WhatsCommunityBoosterAI v1.0.0 starting");

  // Initialise the database
  await initDatabase();
  logger.info("Database initialised successfully");

  // Start the dashboard server
  const dashboardServer = await startDashboard();
  const port = config.DASHBOARD_PORT || dashboardServer.address().port;
  logger.info(`Dashboard started on port ${port}`);

  // Connect to WhatsApp
  const sock = await connectWhatsApp();
  logger.info("WhatsApp connection established");

  // Start the scheduler
  startScheduler();
  logger.info("Scheduler started successfully");

  // Bot is ready
  const os = require("os");
  const interfaces = os.networkInterfaces();
  const allAddresses = Object.values(interfaces)
    .flat()
    .filter((i) => !i.internal);

  const ipv4 = allAddresses.find((i) => i.family === "IPv4")?.address;
  const ipv6 = allAddresses.find((i) => i.family === "IPv6")?.address;
  const localIp = ipv4 || ipv6 || "localhost";

  logger.info(
    `Bot is running and ready — Dashboard: http://${localIp}:${config.DASHBOARD_PORT}`,
  );
}

// Graceful shutdown handling
function shutdown() {
  logger.info('Shutting down bot gracefully');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Execute main and handle fatal errors
main().catch((err) => {
  logger.error({ err }, 'Fatal error during startup');
  process.exit(1);
});
