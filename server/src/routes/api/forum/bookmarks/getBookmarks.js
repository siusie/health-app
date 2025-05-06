// src/routes/api/forum/bookmarks/getBookmarks.js
const pool = require('../../../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../../utils/response');
const logger = require('../../../../utils/logger');
const { getUserId } = require('../../../../utils/userIdHelper');

// GET /v1/forum/bookmarks
// Get all bookmarked posts for a user
module.exports = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    logger.debug('In getBookmarks - Auth header:', authHeader);

    const userId = await getUserId(authHeader);
    logger.debug('User ID:', userId);

    if (!userId) {
      logger.error('User ID not found for token');
      return createErrorResponse(res, 404, 'User not found');
    }

    const userExists = await pool.query('SELECT user_id FROM users WHERE user_id = $1', [userId]);

    if (userExists.rows.length === 0) {
      logger.error(`User ${userId} not found in database`);
      return createErrorResponse(res, 404, 'User not found in database');
    }

    const bookmarks = await pool.query(
      `SELECT p.*,
        (SELECT COUNT(*) FROM forumreply WHERE post_id = p.post_id) as reply_count
       FROM forumpost p 
       JOIN bookmarks b ON p.post_id = b.post_id 
       JOIN users u ON p.user_id = u.user_id 
       WHERE b.user_id = $1 
       ORDER BY p.created_at DESC`,
      [userId]
    );

    return createSuccessResponse(res, 200, 'Bookmarks retrieved successfully', bookmarks.rows);
  } catch (error) {
    logger.error(`Error fetching bookmarks: ${error.message}`);
    return createErrorResponse(res, 500, 'Error fetching bookmarks');
  }
};
