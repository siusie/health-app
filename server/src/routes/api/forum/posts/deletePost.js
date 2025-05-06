// src/routes/api/forum/posts/deletePost.js
const pool = require('../../../../../database/db');
const logger = require('../../../../utils/logger');
const { getUserId } = require('../../../../utils/userIdHelper');
const { createSuccessResponse, createErrorResponse } = require('../../../../utils/response');

// DELETE /v1/forum/posts/:post_id
// Delete a post and its associated replies
module.exports = async (req, res) => {
  let client;
  try {
    const { post_id } = req.params;

    // Validate post_id
    if (!post_id || isNaN(post_id)) {
      return createErrorResponse(res, 400, 'Invalid post ID provided');
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

    // Check if post exists and user owns it
    const postResult = await client.query('SELECT user_id FROM forumpost WHERE post_id = $1', [
      post_id,
    ]);

    if (postResult.rows.length === 0) {
      logger.warn(`Post not found with ID: ${post_id}`);
      await client.query('ROLLBACK');
      return createErrorResponse(res, 404, 'Post not found');
    }

    // Check if user owns the post
    if (Number(postResult.rows[0].user_id) !== Number(userId)) {
      logger.warn(`Unauthorized deletion attempt for post ${post_id} by user ${userId}`);
      await client.query('ROLLBACK');
      return createErrorResponse(res, 403, 'User not authorized to delete this post');
    }

    // Delete associated replies first
    const replyResult = await client.query(
      'DELETE FROM forumreply WHERE post_id = $1 RETURNING reply_id',
      [post_id]
    );

    // Delete the post
    await client.query('DELETE FROM forumpost WHERE post_id = $1', [post_id]);

    await client.query('COMMIT');
    logger.info(`Successfully deleted post ${post_id} and ${replyResult.rowCount} replies`);

    res.json(createSuccessResponse('Forum post deleted successfully'));
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch((rollbackError) => {
        logger.error(`Rollback failed: ${rollbackError.message}`);
      });
    }

    logger.error(`Error deleting post: ${err.message}`);
    logger.error(err.stack);

    return createErrorResponse(res, 500, 'Server error while deleting post');
  } finally {
    if (client) {
      client.release();
    }
  }
};
