// src/routes/api/forum/post/getAllForumReplies.js
const pool = require('../../../../../database/db');
const { createErrorResponse } = require('../../../../utils/response');
const logger = require('../../../../utils/logger');
const { getUserId } = require('../../../../utils/userIdHelper');

// GET /v1/forum/posts/:post_id/replies
// Get all replies for a post
module.exports = async (req, res) => {
  try {
    const { post_id } = req.params;

    // Validate post_id format
    if (!post_id || !Number.isInteger(Number(post_id)) || Number(post_id) <= 0) {
      return res
        .status(400)
        .json(createErrorResponse(400, 'Invalid post ID format. Must be a positive integer'));
    }

    // Validate authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error('No authorization header found');
      return createErrorResponse(res, 401, 'No authorization token provided');
    }

    // Get user_id using the helper function
    const userId = await getUserId(authHeader);
    if (!userId) {
      return createErrorResponse(res, 404, 'User not found');
    }

    // Verify post exists
    const postExists = await pool.query('SELECT post_id FROM forumpost WHERE post_id = $1', [
      post_id,
    ]);

    if (postExists.rows.length === 0) {
      return createErrorResponse(res, 404, 'Post not found');
    }

    // Get replies with user information
    // the is_owner flag checks if the user is the owner of the reply
    // Note that the is_owner flag is only used to display/hide UI elements and do not prevent unauthorized actions (`ownershipCheck.js` is used for that)
    // is_owner in GET endpoints = "Should I show edit buttons?"
    // ownershipCheck middleware = "Should I allow this modification?"
    const repliesQuery = `
      SELECT 
        r.reply_id,
        r.user_id,
        r.content,
        r.created_at,
        r.updated_at,
        CONCAT(u.first_name, ' ', LEFT(u.last_name, 1), '.') as author,
        (r.user_id = $2) as is_owner
      FROM forumreply r
      LEFT JOIN users u ON r.user_id = u.user_id
      WHERE r.post_id = $1
      ORDER BY r.created_at ASC
    `;
    const result = await pool.query(repliesQuery, [post_id, userId]);

    return res.status(200).json({
      status: 'ok',
      data: result.rows,
    });
  } catch (error) {
    logger.error(`Error fetching replies: ${error.message}`);
    return createErrorResponse(res, 500, 'Error fetching replies');
  }
};
