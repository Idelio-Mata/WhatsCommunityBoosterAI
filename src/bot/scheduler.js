/**
 * Scheduler module for the WhatsApp automation bot.
 * Handles loading contacts, processing the message queue and sending daily reports.
 *
 * @module scheduler
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const config = require('../../config/config');

// Data layer helpers
const { loadContacts } = require('../data/contacts');
const { upsertContacts, getDailyStats, getContactsToProcess, markMessageSent, markFailed, getGroupBreakdown } = require('../data/database');

// Utility helpers
const { todayDate, randomDelay, sleep, formatReport } = require('../utils/helpers');

// WhatsApp interaction
const { sendGreeting, sendMessage } = require('./whatsapp');

/**
 * Starts the scheduler: loads contacts, starts the processing queue and schedules the daily report.
 *
 * @returns {void}
 */
function startScheduler() {
    // Initial load and start processing
    loadAndSync();
    processQueue();

    // Parse REPORT_TIME (HH:MM) into a cron expression "MM HH * * *"
    const [hour, minute] = config.REPORT_TIME.split(':');
    const cronExpression = `${minute} ${hour} * * *`;

    cron.schedule(cronExpression, () => {
        sendDailyReport().catch(err => {
            logger.error('Failed to send daily report:', err);
        });
    });
    logger.info(`Scheduled daily report at ${config.REPORT_TIME} (cron: ${cronExpression})`);
}

/**
 * Loads contacts from the Excel source and synchronises them with the database.
 *
 * @async
 * @returns {Promise<void>}
 */
async function loadAndSync() {
    try {
        const contacts = await loadContacts();
        if (Array.isArray(contacts) && contacts.length > 0) {
            await upsertContacts(contacts);
            logger.info(`Synced ${contacts.length} contacts`);
        } else {
            logger.info('No contacts to sync');
        }
    } catch (err) {
        logger.error({err},'Error loading and syncing contacts');
    }
}

/**
 * Continuously processes the message queue.
 * This function never resolves; it runs an infinite loop with appropriate delays.
 *
 * @async
 * @returns {Promise<void>}
 */
async function processQueue() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            const stats = await getDailyStats(todayDate());
            if (stats.messages_sent >= config.DAILY_LIMIT) {
                logger.info('Daily message limit reached, waiting 1 hour');
                await sleep(60 * 60 * 1000);
                continue;
            }

            const pending = await getContactsToProcess();
            if (!pending || pending.length === 0) {
                logger.info('No pending contacts, loading and syncing, then waiting 30 minutes');
                await loadAndSync();
                await sleep(30 * 60 * 1000);
                continue;
            }

            const contact = pending[0];
            const delaySec = randomDelay(config.DELAY_MIN, config.DELAY_MAX);
            logger.info(`Delaying ${delaySec} seconds before sending to ${contact.phone}`);
            await sleep(delaySec);

            try {
                await sendGreeting(contact);
                await markMessageSent(contact.phone);
                logger.info(`Message sent to ${contact.phone}`);
            } catch (err) {
                await markFailed(contact.phone, err.message);
                logger.error(`Failed to send to ${contact.phone}: ${err.message}`);
            }
        } catch (outerErr) {
            // Ensure the loop never crashes
            logger.error({err: outerErr},'Unexpected error in processQueue loop');
        }
    }
}

/**
 * Sends the daily report to the admin contact.
 *
 * @async
 * @returns {Promise<void>}
 */
async function sendDailyReport() {
    try {
        const stats = await getDailyStats(todayDate());
        const breakdown = await getGroupBreakdown(todayDate());
        const report = formatReport(stats, breakdown);
        const adminJid = `${config.ADMIN_NUMBER}@s.whatsapp.net`;
        await sendMessage(adminJid, report);
        logger.info('Daily report sent successfully');
    } catch (err) {
        logger.error({err},'Failed to send daily report:');
        throw err; // rethrow for the cron handler
    }
}

module.exports = {
    startScheduler,
    loadAndSync,
    processQueue,
    sendDailyReport,
};
