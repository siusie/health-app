// src/routes/api/user/getUser.js
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');
const { getUserId } = require('../../../utils/userIdHelper');

/**
 * route: GET /user/:id
 * GET an existing user
 */
module.exports.getUser = async (req, res) => {
  try {
    // Decode the token to get the user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json(createErrorResponse(401, 'No authorization token provided'));
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return res.status(404).json(createErrorResponse(404, 'User not found'));
    }

    // Get the user's profile from the database
    const profile = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);

    // Check if profile exists and has data
    if (!profile || !profile.rows || profile.rows.length === 0) {
      return res.status(404).json(createErrorResponse(404, 'User profile not found'));
    }

    return res.json(createSuccessResponse(profile.rows[0]));
  } catch (error) {
    //console.error("Database query error:", error);
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
