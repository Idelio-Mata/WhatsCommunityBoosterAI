/**
 * Groups API routes.
 *
 * Provides an endpoint to list all groups available in the bot.
 * The `/api` prefix will be applied when this router is mounted.
 *
 * @module routes/groups
 */

const express = require('express');
const router = express.Router();

// Utilities
const logger = require('../../utils/logger');
const { groupMap } = require('../../bot/groups');

/**
 * GET /
 * Returns an array of group objects.
 *
 * Each object contains:
 *   - name: the group name
 *   - id:   the group JID
 *
 * The source `groupMap` is a Map where the key is the group name and the value
 * is the group JID. The map is converted to the required array format before
 * sending the response.
 */
router.get('/', (req, res) => {
  try {
    const groups = [];
    for (const [name, id] of groupMap.entries()) {
      groups.push({ name, id });
    }
    res.json(groups);
  } catch (err) {
    logger.error({ err }, 'Erro ao obter grupos');
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
