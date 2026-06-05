/**
 * WhatsApp automation bot module using Baileys.
 *
 * This module provides a singleton Baileys socket instance and helper
 * functions to connect, send messages and manage a simple pending‑reply
 * workflow.
 *
 * @module src/bot/whatsapp
 */

const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const logger = require('../utils/logger');
const config = require('../../config/config');
const { markReplied } = require('../data/database');
const { addContactToGroup } = require('./groups');
const { greeting } = require('./messages');

/** @type {import('@whiskeysockets/baileys').WASocket | null} */
let sock = null;

/**
 * Map of contacts waiting for a reply.
 * Key: phone JID (e.g. "123456789@s.whatsapp.net")
 * Value: any payload you wish to keep – currently the contact object.
 */
const pendingReply = new Map();

/**
 * Connects to WhatsApp using Baileys.
 *
 * Loads authentication state from the path defined in `config.SESSION_PATH`,
 * fetches the latest Baileys version, creates a socket with a silent logger,
 * and wires up event listeners for connection updates and incoming messages.
 *
 * @returns {Promise<import('@whiskeysockets/baileys').WASocket>} The connected socket.
 */
async function connectWhatsApp() {
    // 3.1 Load auth state
    const { state, saveCreds } = await useMultiFileAuthState(config.SESSION_PATH);

    // 3.2 Fetch latest Baileys version
    const { version } = await fetchLatestBaileysVersion();

    // 3.3 Create socket with silent logger
    sock = makeWASocket({
        version,
        auth: state,
        logger: {
            // Baileys expects a pino logger; we provide a minimal silent one.
            level: 'silent',
            info: () => {},
            error: () => {},
            debug: () => {},
            warn: () => {},
        },
    });

    // 3.4 Save credentials on update
    sock.ev.on('creds.update', saveCreds);

    // 3.5 Connection updates handling
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            // Show QR code in terminal
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                logger.error('Logged out from WhatsApp. Delete the session folder to re‑login.');
            } else {
                logger.warn('Connection closed, reconnecting in 5 seconds...');
                await delay(5000);
                await connectWhatsApp();
            }
        } else if (connection === 'open') {
            logger.info('WhatsApp connection opened');
        }
    });

    // 3.6 Message upsert handling
    sock.ev.on('messages.upsert', async (msgUpsert) => {
        const { type, messages } = msgUpsert;
        if (type !== 'notify') return;
        for (const msg of messages) {
            if (msg.key?.fromMe) continue; // skip own messages
            const senderJid = msg.key?.remoteJid;
            if (!senderJid) continue;
            if (pendingReply.has(senderJid)) {
                // Mark as replied in DB
                await markReplied(senderJid);
                pendingReply.delete(senderJid);
                // Add contact to group (implementation defined in ./groups)
                const contact = pendingReply.get(senderJid);
                await addContactToGroup(senderJid);
            }
        }
    });

    return sock;
}

/**
 * Sends a plain text message to a given JID.
 *
 * @param {string} jid - The WhatsApp JID to send the message to.
 * @param {string} text - The message content.
 * @returns {Promise<import('@whiskeysockets/baileys').WASendMessageResult>} Result of the send operation.
 */
async function sendMessage(jid, text) {
    if (!sock) throw new Error('Socket not initialized. Call connectWhatsApp() first.');
    return await sock.sendMessage(jid, { text });
}

/**
 * Sends a greeting to a contact and registers the contact for a pending reply.
 *
 * @param {{ name: string, phone: string }} contact - Contact information.
 * @returns {Promise<void>}
 */
async function sendGreeting(contact) {
    const greetText = greeting(contact.name);
    const jid = contact.phone; // Its alread normalized.
    await sendMessage(jid, greetText);
    // Register pending reply keyed by JID
    pendingReply.set(jid, contact);
}

/**
 * Returns the current Baileys socket instance.
 *
 * @returns {import('@whiskeysockets/baileys').WASocket | null}
 */
function getSocket() {
    return sock;
}

module.exports = {
    connectWhatsApp,
    sendMessage,
    sendGreeting,
    getSocket,
    /** expose pendingReply for testing/debugging */
    pendingReply,
};
