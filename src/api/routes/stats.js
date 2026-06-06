/**
 * Router for statistics and recent activity endpoints.
 *
 * This module extracts the existing route handlers from the monolithic
 * `src/dashboard/server.js` file and adapts them to an Express router.
 * The router is intended to be mounted under the `/api` prefix, so the
 * exported routes are `/stats` and `/activity`.
 *
 * @module routes/stats
 */

const express = require('express');
const router = express.Router();

// Keep existing imports
const logger = require('../../utils/logger');
const { getDashboardStats, getRecentActivity } = require('../../data/database');

/**
 * GET /stats
 * Retrieves dashboard statistics.
 *
 * @name GetStats
 * @route {GET} /stats
 * @returns {Object} 200 - Dashboard statistics
 * @returns {Error} 500 - Internal server error
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (err) {
    logger.error({ err }, 'Erro ao obter stats do dashboard');
    res.status(500).json({ error: 'Erro interno' });
  }
});

/**
 * GET /activity
 * Retrieves recent activity with an optional limit.
 *
 * @name GetActivity
 * @route {GET} /activity
 * @param {number} limit.query - Maximum number of activity items (default 50)
 * @returns {Object} 200 - Recent activity data
 * @returns {Error} 500 - Internal server error
 */
router.get('/activity', async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  try {
    const activity = await getRecentActivity(limit);
    res.json(activity);
  } catch (err) {
    logger.error({ err }, 'Erro ao obter atividade recente');
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
