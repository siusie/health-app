// src/routes/api/forum/replies/deleteReply.js
const pool = require('../../../../../database/db');
const logger = require('../../../../utils/logger');
const { getUserId } = require('../../../../utils/userIdHelper');
const { createSuccessResponse, createErrorResponse } = require('../../../../utils/response');
const jwt = require('jsonwebtoken');

// DELETE /v1/forum/replies/:reply_id
// Delete a reply from a forum post
module.exports = async (req, res) => {
  let client;
  try {
    const { reply_id } = req.params;

    // Validate reply_id
    if (!reply_id || isNaN(reply_id)) {
      return createErrorResponse(res, 400, 'Invalid reply ID provided');
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

    client = await pool.connect();
    await client.query('BEGIN'); // Start transaction

    // Check if reply exists and user owns it
    const replyResult = await client.query('SELECT user_id FROM forumreply WHERE reply_id = $1', [
      reply_id,
    ]);

    if (replyResult.rows.length === 0) {
      logger.warn(`Reply not found with ID: ${reply_id}`);
      await client.query('ROLLBACK');
      return createErrorResponse(res, 404, 'Reply not found');
    }

    // Check if user owns the reply
    if (Number(replyResult.rows[0].user_id) !== Number(userId)) {
      logger.warn(`Unauthorized deletion attempt for reply ${reply_id} by user ${userId}`);
      await client.query('ROLLBACK');
      return createErrorResponse(res, 403, 'User not authorized to delete this reply');
    }

    // Delete the reply
    await client.query('DELETE FROM forumreply WHERE reply_id = $1', [reply_id]);

    await client.query('COMMIT');
    logger.info(`Successfully deleted reply ${reply_id}`);

    res.json(createSuccessResponse('Forum reply deleted successfully'));
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch((rollbackError) => {
        logger.error(`Rollback failed: ${rollbackError.message}`);
      });
    }

    logger.error(`Error deleting reply: ${err.message}`);
    logger.error(err.stack);

    return createErrorResponse(res, 500, 'Server error while deleting reply');
  } finally {
    if (client) {
      client.release();
    }
  }
};
