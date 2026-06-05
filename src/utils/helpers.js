/**
 * Utility helper functions for the WhatsApp automation bot.
 * No external dependencies – only Node.js built‑ins are used.
 * All functions are exported individually using CommonJS.
 */

/**
 * Strips all non‑digit characters from a phone number and appends the
 * WhatsApp JID domain.
 *
 * @param {string} phone - The raw phone number (e.g. "+258 84-123 4567").
 * @returns {string} Normalized JID (e.g. "258841234567@s.whatsapp.net").
 */
function normalizePhone(phone) {
  const digits = phone.replace(/\D+/g, '');
  return `${digits}@s.whatsapp.net`;
}

/**
 * Returns a random integer between min and max (inclusive).
 *
 * @param {number} min - Minimum delay in milliseconds.
 * @param {number} max - Maximum delay in milliseconds.
 * @returns {number} Random delay.
 */
function randomDelay(min, max) {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

/**
 * Returns a promise that resolves after the specified number of milliseconds.
 * Useful with async/await for pausing execution.
 *
 * @param {number} ms - Milliseconds to sleep.
 * @returns {Promise<void>} Promise that resolves after the delay.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Returns today's date in UTC formatted as YYYY‑MM‑DD.
 *
 * @returns {string} UTC date string.
 */
function todayDate() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a daily report message for WhatsApp.
 *
 * @param {Object} stats - Statistics object with fields:
 *   messages_sent, replies, added, failed.
 * @param {Object} [groupBreakdown] - Optional map of group name → count.
 * @returns {string} Formatted report string using WhatsApp markdown.
 */
function formatReport(stats, groupBreakdown) {
  const { messages_sent, replies, added, failed } = stats;
  const successRate = messages_sent > 0
   ? Math.round((added / messages_sent) * 100)
   : 0;
  const date = todayDate();
  const botName = require('../../config/config').BOT_NAME || 'Bot';

  let report = `*${botName} – Daily Report (${date})*\n\n`;
  report += `📨 Messages Sent: ${messages_sent}\n`;
  report += `💬 Replies: ${replies}\n`;
  report += `➕ Added: ${added}\n`;
  report += `❌ Failed: ${failed}\n`;
  report += `✅ Success Rate: ${successRate.toFixed(2)}%\n`;

  if (groupBreakdown && Object.keys(groupBreakdown).length) {
    report += '\n*Group Breakdown:*\n';
    for (const [group, count] of Object.entries(groupBreakdown)) {
      report += `- ${group}: ${count}\n`;
    }
  }

  report += '\n_Status: Operational_';
  return report;
}

module.exports = {
  normalizePhone,
  randomDelay,
  sleep,
  todayDate,
  formatReport,
};
