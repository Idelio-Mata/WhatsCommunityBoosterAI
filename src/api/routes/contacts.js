/**
 * Contacts API routes.
 *
 * This router provides endpoints for retrieving, updating and deleting contacts.
 * The `/api` prefix is applied when the router is mounted in the main server.
 *
 * @module routes/contacts
 */

const express = require('express');
const router = express.Router();

// Utilities
const logger = require('../../utils/logger');
const { getAllContacts, updateContact, deleteContact } = require('../../data/database');

/**
 * GET /contacts
 * Retrieve a list of contacts.
 *
 * Query Parameters:
 *   - limit (number, optional): Maximum number of contacts to return. Defaults to 100.
 */
router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 100;
  try {
    const contacts = await getAllContacts(limit);
    res.json(contacts);
  } catch (err) {
    logger.error({ err }, 'Erro ao obter contactos');
    res.status(500).json({ error: 'Erro interno' });
  }
});

/**
 * PUT /contacts/:phone
 * Update a contact.
 *
 * Path Parameters:
 *   - phone (string): Phone number of the contact to update.
 *
 * Body (JSON):
 *   - name (string, optional)
 *   - group_name (string, optional)
 *   - status (string, optional) – one of: pending, sent, replied, added, failed
 */
router.put('/:phone', async (req, res) => {
  const { phone } = req.params;
  const { name, group_name, status } = req.body;

  // Build fields object with only provided valid keys
  const fields = {};
  if (typeof name === 'string') fields.name = name;
  if (typeof group_name === 'string') fields.group_name = group_name;
  if (typeof status === 'string' && ['pending', 'sent', 'replied', 'added', 'failed'].includes(status)) {
    fields.status = status;
  }

  if (Object.keys(fields).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided' });
  }

  try {
    const updated = await updateContact(phone, fields);
    res.json(updated);
  } catch (err) {
    logger.error({ err }, 'Erro ao atualizar contacto');
    res.status(500).json({ error: 'Erro interno' });
  }
});

/**
 * DELETE /contacts/:phone
 * Delete a contact.
 *
 * Path Parameters:
 *   - phone (string): Phone number of the contact to delete.
 */
router.delete('/:phone', async (req, res) => {
  const { phone } = req.params;
  try {
    await deleteContact(phone);
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Erro ao remover contacto');
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
