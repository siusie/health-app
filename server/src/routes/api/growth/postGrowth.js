// server/src/routes/api/growth/postGrowth.js
// Route for POST /baby/[:babyId]/growth

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');

// POST /baby/[:babyId]/growth - Create a new Growth record for a specific baby [:babyId]
module.exports.createGrowth = async (req, res) => {
  const { babyId } = req.params;
  const { date, height, weight, notes } = req.body;
  
  try {
    // validate baby_id
    if (!babyId) {
      return res.status(400).send(createErrorResponse(400, `baby_id is required`)); // 400 Bad Request
    }

    const result = await pool.query(
      'INSERT INTO growth (baby_id, date, height, weight, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [babyId, date, height, weight, notes]
    );

    res.status(201).send(createSuccessResponse(result.rows[0])); // 201 Created
  } catch (err) {
    logger.error(err, `ERROR in POST /baby/:babyId/growth, Error creating growth record`);

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};

