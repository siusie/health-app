// src/routes/api/milestones/getAllMilestones.js
const pool = require('../../../../database/db');
const logger = require('../../../utils/logger');
const { getUserId } = require('../../../utils/userIdHelper');

// First, get the user ID from the authorization header
// GET /v1/milestones
// Get all milestones for the current user
module.exports = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 401,
          message: 'No authorization token provided',
        },
      });
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 404,
          message: 'User not found',
        },
      });
    }

    let query = `SELECT 
         m.milestone_id,
         m.baby_id,
         TO_CHAR(m.date, 'YYYY-MM-DD') AS date, -- Format the date as YYYY-MM-DD
         m.title,
         m.details,
         b.first_name,
         b.last_name 
       FROM milestones m
       LEFT JOIN user_baby ub ON m.baby_id = ub.baby_id
       LEFT JOIN baby b ON m.baby_id = b.baby_id
       WHERE ub.user_id = $1`;

    // Check if the query parameter is provided. If today parameter is true, add date filter for today
    const { today } = req.query;
    if (today === 'true') {
      query += ` AND DATE(m.date) = CURRENT_DATE`;
    }

    // Order by date
    query += ` ORDER BY m.date DESC`;

    // Get all milestones for babies that belong to the user
    const milestones = await pool.query(query, [userId]);

    // Return empty array for no milestones
    if (!milestones.rows) {
      milestones.rows = [];
    }

    const formattedMilestones = milestones.rows.map((milestone) => ({
      ...milestone,
      first_name: milestone.first_name || 'Unknown',
      last_name: milestone.last_name || '',
    }));

    return res.json({
      status: 'ok',
      data: formattedMilestones,
    });
  } catch (error) {
    logger.error(`Error getting milestones: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      error: {
        code: 500,
        message: 'Internal server error',
      },
    });
  }
};
