/**
 * Group management utilities for the WhatsApp automation bot.
 *
 * This module provides functions to fetch groups, resolve a group ID from a
 * name, and add a contact to a group. All functions are documented with JSDoc
 * and exported using CommonJS syntax.
 */

const logger = require('../utils/logger');
const config = require('../../config/config');
const { markAdded } = require('../data/database');
const { welcome, groupNotFound } = require('./messages');
const { getSocket } = require('./whatsapp');

/**
 * Map storing group name (lower‑case) → group JID.
 * @type {Map<string, string>}
 */
const groupMap = new Map();

/**
 * Fetch all participating groups from the WhatsApp socket and populate the
 * internal {@link groupMap}. The map key is the group subject (name) in lower‑case
 * and the value is the group JID.
 *
 * @async
 * @returns {Promise<Map<string, string>>} The populated group map.
 */
async function fetchGroups() {
    try {
        const sock = getSocket();
        const groups = await sock.groupFetchAllParticipating();
        // groups is an object where each key is a JID and the value contains
        // metadata including the subject (group name).
        let count = 0;
        for (const jid in groups) {
            if (Object.prototype.hasOwnProperty.call(groups, jid)) {
                const groupInfo = groups[jid];
                const name = (groupInfo?.subject || '').toLowerCase();
                if (name) {
                    groupMap.set(name, jid);
                    count++;
                }
            }
        }
        logger.info(`Fetched ${count} groups`);
        return groupMap;
    } catch (error) {
        logger.error({err: error}, 'Error fetching groups:');
        throw error;
    }
}

/**
 * Resolve a group JID from a provided group name.
 *
 * The resolution follows these rules:
 * 1. If `groupName` is falsy, return {@link config#DEFAULT_GROUP_ID}.
 * 2. Try an exact case‑insensitive match in {@link groupMap}.
 * 3. Try a partial match – return the first entry where the stored key
 *    includes the supplied name or vice‑versa.
 * 4. If no match is found, fall back to {@link config#DEFAULT_GROUP_ID} and log a warning.
 *
 * @param {string} groupName The name of the group to resolve.
 * @returns {string} The resolved group JID.
 */
function resolveGroupId(groupName) {
    if (!groupName) {
        return config.DEFAULT_GROUP_ID;
    }

    const nameLower = groupName.toLowerCase();

    // Exact match
    if (groupMap.has(nameLower)) {
        return groupMap.get(nameLower);
    }

    // Partial match – iterate over entries
    for (const [key, jid] of groupMap.entries()) {
        if (key.includes(nameLower) || nameLower.includes(key)) {
            return jid;
        }
    }

    logger.warn(`Group "${groupName}" not found, falling back to default`);
    return config.DEFAULT_GROUP_ID;
}

/**
 * Add a contact to a group and send a welcome message.
 *
 * @param {Object} contact The contact information.
 * @param {string} contact.phone The phone number (e.g. "1234567890@s.whatsapp.net").
 * @param {string} contact.name The display name of the contact.
 * @param {string} contact.group_name The target group name.
 * @returns {Promise<boolean>} `true` on success, `false` otherwise.
 */
async function addContactToGroup(contact) {
    const sock = getSocket();
    try {
        const groupId = resolveGroupId(contact.group_name);
        if (!groupId) {
            // Send a message to the contact (assuming a function exists to send DM)
            // Here we just use the generic groupNotFound message.
            await sock.sendMessage(contact.phone, { text: groupNotFound() });
            logger.error(`Group not found for contact ${contact.phone}`);
            return false;
        }

        // Add participant to the group
        await sock.groupParticipantsUpdate(groupId, [contact.phone], 'add');
        // Mark as added in the database
        await markAdded(contact.phone, groupId);
        // Send welcome message to the group
        await sock.sendMessage(groupId, { text: welcome(contact.name) });
        logger.info(`Added contact ${contact.phone} to group ${groupId}`);
        return true;
    } catch (err) {
        logger.error({err}, 'Failed to add contact to group:');
        return false;
    }
}

module.exports = {
    groupMap,
    fetchGroups,
    resolveGroupId,
    addContactToGroup,
};