// src/routes/api/forum/replies/putReply.js
const pool = require('../../../../../database/db');
const { createErrorResponse } = require('../../../../utils/response');
const logger = require('../../../../utils/logger');
const { getUserId } = require('../../../../utils/userIdHelper');

// PUT /v1/forum/replies/:reply_id
// Edit a reply to a forum post
module.exports = async (req, res) => {
  const { reply_id } = req.params;
  const { content } = req.body;

  try {
    // Validate request body
    if (!content) {
      return createErrorResponse(res, 400, 'Title and content are required');
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

    // Begin transaction
    try {
      await pool.query('BEGIN');

      // Check if reply exists and belongs to user
      const checkReply = await pool.query(
        `SELECT r.user_id, r.post_id 
         FROM forumreply r
         JOIN forumpost p ON r.post_id = p.post_id
         WHERE r.reply_id = $1`,
        [reply_id]
      );

      if (checkReply.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({
          status: 'error',
          message: 'Reply not found',
        });
      }

      if (checkReply.rows[0].deleted_at) {
        await pool.query('ROLLBACK');
        return res.status(400).json({
          status: 'error',
          message: 'Cannot edit reply on a deleted post',
        });
      }

      if (Number(checkReply.rows[0].user_id) !== Number(userId)) {
        await pool.query('ROLLBACK');
        return res.status(403).json({
          status: 'error',
          message: 'You can only edit your own replies',
        });
      }

      // Update the reply
      const result = await pool.query(
        `UPDATE forumreply
         SET content = $1, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE reply_id = $2 
         RETURNING reply_id, post_id, user_id, content, created_at, updated_at`,
        [content, reply_id]
      );

      await pool.query('COMMIT');

      res.json({
        status: 'success',
        message: 'Reply updated successfully',
        data: result.rows[0],
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating reply:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};
