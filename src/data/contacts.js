/**
 * Module for loading contacts from an Excel file.
 *
 * The module uses the `exceljs` library to read the first worksheet of the
 * Excel file defined by `EXCEL_PATH` (imported from the project config). It
 * detects the columns for phone, name and group based on header keywords and
 * returns an array of contact objects:
 *   { phone, name, group_name, group_id }
 *
 * All phone numbers are normalised using the `normalizePhone` helper. The
 * function logs useful information – which columns were detected and how many
 * contacts were loaded – via the shared logger utility.
 *
 * Errors such as a missing file or an empty worksheet are logged but do not
 * cause the function to throw; an empty array is returned instead.
 */

const path = require('path');
const fs = require('fs');
const Excel = require('exceljs');

// Configuration and utilities
const { EXCEL_PATH } = require('../../config/config');
const logger = require('../utils/logger');
const { normalizePhone } = require('../utils/helpers');

/**
 * Detect column indexes based on header names.
 * @param {Array<string>} headers Row values from the first worksheet row.
 * @returns {{ phone: number, name: number, group: number }}
 */
function detectColumns(headers) {
  const lower = headers.map((h) => (h || '').toString().toLowerCase().trim());
  let phone = -1;
  let name = -1;
  let group = -1;

  lower.forEach((header, idx) => {
    if (phone === -1 && /phone|numero|number|telef/.test(header)) {
      phone = idx;
    }
    if (name === -1 && /name|nome/.test(header)) {
      name = idx;
    }
    if (group === -1 && /group|grupo/.test(header)) {
      group = idx;
    }
  });

  return { phone, name, group };
}

/**
 * Load contacts from the configured Excel file.
 *
 * The function reads the first worksheet, detects the relevant columns, and
 * builds an array of contact objects. Rows with an empty or undefined phone
 * value are skipped. Each phone is normalised using `normalizePhone`.
 *
 * @returns {Promise<Array<{ phone: string, name: string, group_name: string, group_id: string }>>}
 */
async function loadContacts() {
  // Resolve the absolute path to the Excel file
  const filePath = path.resolve(EXCEL_PATH);

  // Verify the file exists before attempting to read it
  if (!fs.existsSync(filePath)) {
    logger.error(`Contacts file not found at path: ${filePath}`);
    return [];
  }

  const workbook = new Excel.Workbook();
  try {
    await workbook.xlsx.readFile(filePath);
  } catch (err) {
    logger.error(`Failed to read contacts Excel file: ${err.message}`);
    return [];
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    logger.error('No worksheets found in contacts Excel file.');
    return [];
  }

  // If the worksheet has no data rows (only header or completely empty)
  if (worksheet.rowCount <= 1) {
    logger.warn('Worksheet is empty or contains only header row. No contacts to load.');
    return [];
  }

  // Get header row (first row)
  const headerRow = worksheet.getRow(1);
  const headers = headerRow.values.slice(1); // Excel rows are 1-indexed, values[0] is undefined
  const { phone: phoneIdx, name: nameIdx, group: groupIdx } = detectColumns(headers);

  logger.info(
    `Detected columns - phone: ${phoneIdx >= 0 ? phoneIdx + 1 : 'not found'}, ` +
      `name: ${nameIdx >= 0 ? nameIdx + 1 : 'not found'}, ` +
      `group: ${groupIdx >= 0 ? groupIdx + 1 : 'not found'}`
  );
  if (phoneIdx === -1) {
    logger.error('No phone column found. Expected header: phone, numero, number or telef');
    return [];
}

  const contacts = [];
  // Iterate over rows starting from the second row (data rows)
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const values = row.values.slice(1);
    const rawPhone = values[phoneIdx];
    if (!rawPhone) return; // skip rows without phone

    const phone = normalizePhone(rawPhone.toString());
    const name = nameIdx >= 0 ? values[nameIdx] || '' : '';
    const group_name = groupIdx >= 0 ? values[groupIdx] || '' : '';

    contacts.push({
      phone,
      name: name.toString(),
      group_name: group_name.toString(),
      group_id: '' // will be resolved later by groups.js
    });
  });

  logger.info(`Loaded ${contacts.length} contacts from ${filePath}`);
  return contacts;
}

module.exports = { loadContacts };
