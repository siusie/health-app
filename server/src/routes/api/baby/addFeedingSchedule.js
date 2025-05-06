// src/routes/api/baby/addFeedingSchedule.js
const pool = require('../../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const { checkBabyBelongsToUser } = require('../../../utils/babyAccessHelper');
const { getUserId } = require('../../../utils/userIdHelper');

module.exports = async (req, res) => {
  const { id } = req.params;
  const { meal, time, type, amount, issues, notes, date } = req.body;

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

    const addedFeedingSchedules = await pool.query(
      'INSERT INTO feedingschedule (baby_id, meal, time, type, amount, issues, notes, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [id, meal, time, type, amount, issues, notes, date]
    );
    console.log('Added feeding schedules: ', addedFeedingSchedules);
    return res.json(createSuccessResponse(addedFeedingSchedules.rows));
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
