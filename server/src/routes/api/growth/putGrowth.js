// server/src/routes/api/growth/putGrowth.js
// Route for PUT /baby/[:babyId]/growth/[:growthId]

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');

// PUT /baby/:babyId/growth/[:growthId] - Update a Growth record by [:growthId]
module.exports.updateGrowthById = async (req, res) => {
  const { growthId } = req.params;
  const { date, height, weight, notes } = req.body;

  logger.info(
    `In PUT /baby/:babyId/growth/:growthId, Updating growth record with growthId ${growthId}`
  );
  logger.info(`date: ${date}, height: ${height}, weight: ${weight}, notes: ${notes}`);

  try {
    const result = await pool.query(
      'UPDATE growth SET date = $1, height = $2, weight = $3, notes = $4 WHERE growth_id = $5 RETURNING *',
      [date, height, weight, notes, growthId]
    );
    if (result.rows.length > 0) {
      res.status(200).send(createSuccessResponse(result.rows[0])); // 200 OK
    } else {
      res.status(404).send(createErrorResponse(404, `Growth record not found`)); // 404 Not Found
    }
  } catch (err) {
    logger.error(
      err,
      `ERROR in PUT /baby/:babyId/growth/:growthId, Error updating growth record with id ${growthId}`
    );

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};

