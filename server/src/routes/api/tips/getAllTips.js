// server/src/routes/api/[tips]/getAllTips.js
// Route for GET /tips  - Get all tips

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');

// GET /tips  - Get all tips
module.exports = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM CuratedTips');

    if (result.rows.length > 0) {
      res.status(200).send(createSuccessResponse({ data: result.rows })); // 200 OK with MULTIPLE records
    } else {
      res.status(404).send(createErrorResponse(404, `Not found curated tips`)); // 404 Not Found
    }
  } catch (err) {
    logger.error(err, `ERROR in GET /tips, Error fetching curated tips`);

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};
