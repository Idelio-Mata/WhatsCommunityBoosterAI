/**
 * Database module for WhatsApp automation bot.
 * Uses better-sqlite3 with WAL mode enabled.
 * Provides helper functions for contacts, messages, activity and stats.
 */

const path = require('path');
const Database = require('better-sqlite3');
const logger = require('../utils/logger'); // corrected path as per requirement
const { todayDate } = require('../utils/helpers');

// Resolve DB path from config
const { DB_PATH } = require('../../config/config');

/** @type {Database.Database} */
let db = null;

/**
 * Initialise the database, create tables and enable WAL mode.
 * @returns {Database.Database} The database instance.
 */
function initDatabase() {
  if (db) return db;
  const dbFile = path.resolve(__dirname, '..', '..', DB_PATH);
  db = new Database(dbFile);
  // Enable WAL for better performance
  db.pragma('journal_mode = WAL');

  // Create tables if they do not exist
  const createContacts = `
    CREATE TABLE IF NOT EXISTS contacts (
      phone TEXT PRIMARY KEY,
      name TEXT,
      group_name TEXT,
      group_id TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );`;
  const createMessages = `
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT,
      type TEXT,
      status TEXT,
      sent_at TEXT DEFAULT (datetime('now'))
    );`;
  const createActivity = `
    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT,
      action TEXT,
      group_id TEXT,
      detail TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );`;
  const createStatsDaily = `
    CREATE TABLE IF NOT EXISTS stats_daily (
      date TEXT PRIMARY KEY,
      messages_sent INTEGER DEFAULT 0,
      replies INTEGER DEFAULT 0,
      added INTEGER DEFAULT 0,
      failed INTEGER DEFAULT 0
    );`;

  db.exec(createContacts);
  db.exec(createMessages);
  db.exec(createActivity);
  db.exec(createStatsDaily);

  logger.info('Database initialised with WAL mode');
  return db;
}

/**
 * Upsert an array of contacts. Duplicates (by phone) are ignored.
 * @param {Array<{phone:string,name?:string,group_name?:string,group_id?:string,status?:string}>} contacts
 */
function upsertContacts(contacts) {
  if (!Array.isArray(contacts) || contacts.length === 0) return;
  const stmt = db.prepare(`
    INSERT INTO contacts (phone, name, group_name, group_id, status, created_at, updated_at)
    VALUES (@phone, @name, @group_name, @group_id, @status, @created_at, @updated_at)
    ON CONFLICT(phone) DO UPDATE SET
      name = CASE WHEN contacts.name = '' OR contacts.name IS NULL THEN excluded.name ELSE contacts.name END,
      group_name = CASE WHEN contacts.group_name = '' OR contacts.group_name IS NULL THEN excluded.group_name ELSE contacts.group_name END,
      updated_at = excluded.updated_at
  `);
  const now = new Date().toISOString();
  const insert = db.transaction((list) => {
    for (const c of list) {
      stmt.run({
        phone: c.phone,
        name: c.name || null,
        group_name: c.group_name || null,
        group_id: c.group_id || null,
        status: c.status || 'pending',
        created_at: now,
        updated_at: now,
      });
    }
  });
  insert(contacts);
}

/**
 * Get contacts with status 'pending'.
 * @returns {Array<Object>}
 */
function getContactsToProcess() {
  return db.prepare(`SELECT * FROM contacts WHERE status = 'pending'`).all();
}

/**
 * Helper to increment daily stats.
 * @param {string} column Column name to increment.
 */
function incrementDailyStat(column) {
  const date = todayDate();
  db.prepare(`
    INSERT INTO stats_daily (date, ${column}) VALUES (?, 1)
    ON CONFLICT(date) DO UPDATE SET ${column} = ${column} + 1
  `).run(date);
}

/**
 * Mark a message as sent for a phone.
 * @param {string} phone
 */
function markMessageSent(phone) {
  const now = new Date().toISOString();
  db.prepare(`UPDATE contacts SET status = 'sent', updated_at = ? WHERE phone = ?`).run(now, phone);
  db.prepare(`INSERT INTO messages (phone, type, status, sent_at) VALUES (?, 'greeting', 'sent', ?)`)
    .run(phone, now);
  incrementDailyStat('messages_sent');
  db.prepare(`INSERT INTO activity (phone, action, detail, created_at) VALUES (?, 'message_sent', NULL, ?)`)
    .run(phone, now);
}

/**
 * Mark a reply received for a phone.
 * @param {string} phone
 */
function markReplied(phone) {
  const now = new Date().toISOString();
  db.prepare(`UPDATE contacts SET status = 'replied', updated_at = ? WHERE phone = ?`).run(now, phone);
  incrementDailyStat('replies');
  db.prepare(`INSERT INTO activity (phone, action, detail, created_at) VALUES (?, 'reply_received', NULL, ?)`)
    .run(phone, now);
}

/**
 * Mark a contact as added to a group.
 * @param {string} phone
 * @param {string} groupId
 */
function markAdded(phone, groupId) {
  const now = new Date().toISOString();
  db.prepare(`UPDATE contacts SET status = 'added', group_id = ?, updated_at = ? WHERE phone = ?`)
    .run(groupId, now, phone);
  incrementDailyStat('added');
  db.prepare(`INSERT INTO activity (phone, action, group_id, created_at) VALUES (?, 'added_to_group', ?, ?)`)
    .run(phone, groupId, now);
}

/**
 * Mark a contact processing as failed.
 * @param {string} phone
 * @param {string} detail
 */
function markFailed(phone, detail) {
  const now = new Date().toISOString();
  db.prepare(`UPDATE contacts SET status = 'failed', updated_at = ? WHERE phone = ?`).run(now, phone);
  incrementDailyStat('failed');
  db.prepare(`INSERT INTO activity (phone, action, detail, created_at) VALUES (?, 'failed', ?, ?)`)
    .run(phone, detail, now);
}

/**
 * Get daily stats for a given date.
 * @param {string} date in YYYY-MM-DD format
 * @returns {{date:string,messages_sent:number,replies:number,added:number,failed:number}}
 */
function getDailyStats(date) {
  const row = db.prepare('SELECT * FROM stats_daily WHERE date = ?').get(date);
  if (row) return row;
  return { date, messages_sent: 0, replies: 0, added: 0, failed: 0 };
}

/**
 * Get breakdown of added contacts per group for a given date.
 * @param {string} date
 * @returns {Object<string, number>}
 */
function getGroupBreakdown(date) {
  const rows = db.prepare(`
    SELECT c.group_name, COUNT(*) as cnt
    FROM contacts c
    JOIN activity a ON a.phone = c.phone
    WHERE a.action = 'added_to_group' AND a.created_at LIKE ?
    GROUP BY c.group_name
  `).all(`${date}%`);
  const result = {};
  for (const r of rows) {
    result[r.group_name || 'unknown'] = r.cnt;
  }
  return result;
}

/**
 * Get recent activity rows.
 * @param {number} limit
 * @returns {Array<Object>}
 */
function getRecentActivity(limit = 20) {
  return db.prepare(`SELECT * FROM activity ORDER BY created_at DESC LIMIT ?`).all(limit);
}

/**
 * Get dashboard statistics.
 * @returns {Object}
 */
function getDashboardStats() {
  const total = db.prepare('SELECT COUNT(*) as cnt FROM contacts').get().cnt;
  const pending = db.prepare("SELECT COUNT(*) as cnt FROM contacts WHERE status = 'pending'").get().cnt;
  const sent = db.prepare("SELECT COUNT(*) as cnt FROM contacts WHERE status = 'sent'").get().cnt;
  const replied = db.prepare("SELECT COUNT(*) as cnt FROM contacts WHERE status = 'replied'").get().cnt;
  const added = db.prepare("SELECT COUNT(*) as cnt FROM contacts WHERE status = 'added'").get().cnt;
  const failed = db.prepare("SELECT COUNT(*) as cnt FROM contacts WHERE status = 'failed'").get().cnt;
  const today = todayDate();
  const todayStats = getDailyStats(today);
  return { total_contacts: total, pending, sent, replied, added, failed, today: todayStats };
}

/**
 * Get most recent contacts up to a limit.
 * @param {number} limit
 * @returns {Array<Object>}
 */
function getAllContacts(limit = 50) {
  return db.prepare(`SELECT * FROM contacts ORDER BY created_at DESC LIMIT ?`).all(limit);
}

/**
 * Update a contact identified by phone with the provided fields.
 * Only updates fields that are defined in the `fields` object.
 * Valid fields: name, group_name, status.
 * Status must be one of: pending, sent, replied, added, failed.
 * Always updates the `updated_at` column to the current datetime.
 * Returns the updated contact row.
 * @param {string} phone - The contact identifier.
 * @param {Object} fields - Object with optional keys: name, group_name, status.
 * @returns {Object} Updated contact record.
 */
function updateContact(phone, fields) {
  if (!phone) {
    const err = new Error('Phone is required');
    logger.error({ err }, 'updateContact: missing phone');
    throw err;
  }
  const allowedStatus = ['pending', 'sent', 'replied', 'added', 'failed'];
  const updates = [];
  const values = [];
  if (fields.name !== undefined) {
    updates.push('name = ?');
    values.push(fields.name);
  }
  if (fields.group_name !== undefined) {
    updates.push('group_name = ?');
    values.push(fields.group_name);
  }
  if (fields.status !== undefined) {
    if (!allowedStatus.includes(fields.status)) {
      const err = new Error('Invalid status value');
      logger.error({ err }, 'updateContact: invalid status');
      throw err;
    }
    updates.push('status = ?');
    values.push(fields.status);
  }
  // always update updated_at
  updates.push('updated_at = ?');
  const now = new Date().toISOString();
  values.push(now);
  // add phone for WHERE clause
  values.push(phone);

  const setClause = updates.join(', ');
  const stmt = db.prepare(`UPDATE contacts SET ${setClause} WHERE phone = ?`);
  stmt.run(...values);
  // return the updated row
  return db.prepare('SELECT * FROM contacts WHERE phone = ?').get(phone);
}

/**
 * Delete a contact and all related rows in messages and activity tables.
 * The deletions are performed inside a transaction to ensure atomicity.
 * Returns { deleted: true } on success.
 * @param {string} phone - The contact identifier to delete.
 * @returns {{deleted:boolean}}
 */
function deleteContact(phone) {
  if (!phone) {
    const err = new Error('Phone is required');
    logger.error({ err }, 'deleteContact: missing phone');
    throw err;
  }
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM contacts WHERE phone = ?').run(phone);
    db.prepare('DELETE FROM messages WHERE phone = ?').run(phone);
    db.prepare('DELETE FROM activity WHERE phone = ?').run(phone);
  });
  try {
    tx();
  } catch (err) {
    logger.error({ err }, 'Failed to delete contact');
    throw err;
  }
  return { deleted: true };
}

module.exports = {
  initDatabase,
  upsertContacts,
  getContactsToProcess,
  markMessageSent,
  markReplied,
  markAdded,
  markFailed,
  getDailyStats,
  getGroupBreakdown,
  getRecentActivity,
  getDashboardStats,
  getAllContacts,
  updateContact,
  deleteContact,
};
