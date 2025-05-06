// server/src/routes/api/growth/deleteGrowth.js
// Route for DELETE /baby/:babyId/growth/:growthId

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');

// DELETE /baby/:babyId/growth/:growthId - Delete a Growth record by growthId
module.exports.deleteGrowthById = async (req, res) => {
  const { growthId } = req.params;

  try {
    const result = await pool.query('DELETE FROM growth WHERE growth_id = $1', [growthId]);

    if (result.rowCount > 0) {
      res.status(200).json(createSuccessResponse()); // 200 OK
    } else {
      res.status(404).send(createErrorResponse(404, `Growth record not found`)); // 404 Not Found
    }
  } catch (err) {
    logger.error(
      err,
      `ERROR in DELETE /baby/:babyId/growth/:growthId, Error deleting growth record with id ${growthId}`
    );

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};

