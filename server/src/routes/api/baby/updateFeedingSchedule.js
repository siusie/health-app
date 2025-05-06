// src/routes/api/updateFeedingSchedule.js
const pool = require('../../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const { checkBabyBelongsToUser } = require('../../../utils/babyAccessHelper');
const { getUserId } = require('../../../utils/userIdHelper');

module.exports = async (req, res) => {
  const { babyId, mealId } = req.params;
  const { meal, time, type, amount, issues, notes } = req.body;

  try {
    // Decode the token to get the user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        error: {
          message: 'No authorization token provided',
        },
      });
    }

    const user_id = await getUserId(authHeader);
    if (!user_id) {
      return res.status(404).json({
        status: 'error',
        error: {
          message: 'User not found',
        },
      });
    }

    // {CHECK OWNERSHIP of BABY}
    // Verify user has access to this baby
    const hasAccess = await checkBabyBelongsToUser(babyId, user_id);
    if (!hasAccess) {
      return res
        .status(403)
        .json(createErrorResponse('Not authorized to access this baby profile'));
    }

    const updatedFeedingSchedules = await pool.query(
      'UPDATE feedingschedule SET meal = $1, time = $2, type = $3, amount = $4, issues = $5, notes = $6 WHERE feeding_schedule_id = $7 RETURNING *',
      [meal, time, type, amount, issues, notes, mealId]
    );
    console.log('Updated feeding schedules: ', updatedFeedingSchedules);
    return res.json(createSuccessResponse(updatedFeedingSchedules.rows));
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
