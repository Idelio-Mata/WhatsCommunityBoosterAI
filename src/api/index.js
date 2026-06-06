/**
 * API entry point.
 *
 * Creates the main Express router for the WhatsApp automation bot and mounts
 * the individual feature routers.
 *
 * @module api/index
 */

const express = require('express');
const router = express.Router();

// Sub‑routers
const statsRouter = require('./routes/stats');
const contactsRouter = require('./routes/contacts');
const groupsRouter = require('./routes/groups');

// Mount the routers. The stats router defines its own paths (/stats and /activity)
// so it is mounted at the root of the API router.
router.use('/', statsRouter);
router.use('/contacts', contactsRouter);
router.use('/groups', groupsRouter);

module.exports = router;
