// src/routes/api/baby/deleteFeedingSchedule.js
const pool = require('../../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const { checkBabyBelongsToUser } = require('../../../utils/babyAccessHelper');
const { getUserId } = require('../../../utils/userIdHelper');

module.exports = async (req, res) => {
  const { id, mealId } = req.params;

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
    const hasAccess = await checkBabyBelongsToUser(id, user_id);
    if (!hasAccess) {
      return res
        .status(403)
        .json(createErrorResponse('Not authorized to access this baby profile'));
    }

    const deletedFeedingSchedules = await pool.query(
      'DELETE FROM feedingschedule WHERE feeding_schedule_id = $1 RETURNING *',
      [mealId]
    );
    console.log('Deleted feeding schedules: ', deletedFeedingSchedules);
    return res.json(createSuccessResponse(deletedFeedingSchedules.rows));
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
