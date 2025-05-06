// src/routes/api/getFeedingSchedules.js
const pool = require('../../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const { getUserId } = require('../../../utils/userIdHelper');
const { checkBabyBelongsToUser } = require('../../../utils/babyAccessHelper');

// GET /baby/:baby_id/getFeedingSchedules
module.exports = async (req, res) => {
  try {
    const { id } = req.params; // baby_id

    // Input validation
    if (!id) {
      return res.status(400).json(createErrorResponse(400, 'Baby ID is required'));
    }

    // Validate if id is a valid number
    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json(createErrorResponse(400, 'Invalid baby ID format'));
    }

    // Decode the token to get the user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error('No authorization header found');
      return createErrorResponse(res, 401, 'No authorization token provided');
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return createErrorResponse(res, 404, 'User not found');
    }

    // {CHECK OWNERSHIP of BABY}
    // Verify user has access to this baby
    const hasBabyAccess = await checkBabyBelongsToUser(id, userId);
    if (!hasBabyAccess) {
      return res
        .status(403)
        .json(createErrorResponse(403, 'Access denied: Baby does not belong to current user'));
    }

    // If authorized, proceed with getting feeding schedules
    const feedingSchedules = await pool.query(
      `SELECT feeding_schedule_id, baby_id, amount, type, issues, notes, meal, TO_CHAR(date, 'YYYY-MM-DD') AS date, time
       FROM feedingschedule WHERE baby_id = $1`,
      [id]
    );

    // Check if any schedules were found
    if (feedingSchedules.rowCount === 0) {
      return res
        .status(404)
        .json(createErrorResponse(404, `No feeding schedules found for baby ID: ${id}`));
    }

    return res.json(createSuccessResponse(feedingSchedules.rows));
  } catch (error) {
    console.error('Database query error:', error);

    // Check for specific database errors
    if (error.code === '23503') {
      // Foreign key violation
      return res.status(404).json(createErrorResponse(404, 'Referenced baby does not exist'));
    }

    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
