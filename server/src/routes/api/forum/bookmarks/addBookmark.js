// src/routes/api/forum/bookmarks/addBookmark.js
const pool = require('../../../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../../utils/response');
const logger = require('../../../../utils/logger');
const { getUserId } = require('../../../../utils/userIdHelper');

// POST /v1/forum/bookmarks/:postId
// Toggle bookmark status for a post
module.exports = async (req, res) => {
  try {
    const { postId } = req.params;
    const authHeader = req.headers.authorization;

    logger.debug('Adding bookmark:', {
      postId,
      hasAuthHeader: !!authHeader,
      url: req.url,
      method: req.method,
    });

    const userId = await getUserId(authHeader);
    if (!userId) {
      logger.error('Failed to get user ID from token');
      return createErrorResponse(res, 404, 'User not found');
    }

    logger.debug('User authenticated:', { userId });

    // Check if bookmark already exists
    const existingBookmark = await pool.query(
      'SELECT * FROM bookmarks WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );

    logger.debug('Existing bookmark check:', {
      exists: existingBookmark.rows.length > 0,
      userId,
      postId,
      rowCount: existingBookmark.rowCount,
    });

    if (existingBookmark.rows.length > 0) {
      logger.info('Removing existing bookmark:', {
        bookmarkId: existingBookmark.rows[0].id,
        userId,
        postId,
      });

      await pool.query('DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2', [
        userId,
        postId,
      ]);
      return createSuccessResponse(res, 200, 'Bookmark removed', { bookmarked: false });
    }

    // Add new bookmark
    const result = await pool.query(
      'INSERT INTO bookmarks (user_id, post_id) VALUES ($1, $2) RETURNING *',
      [userId, postId]
    );

    logger.info('Bookmark added successfully:', {
      bookmarkId: result.rows[0].id,
      userId,
      postId,
      timestamp: result.rows[0].created_at,
    });

    return createSuccessResponse(res, 201, 'Bookmark added', {
      bookmarked: true,
      bookmarkId: result.rows[0].id,
    });
  } catch (error) {
    logger.error('Error managing bookmark:', {
      error: error.message,
      stack: error.stack,
      postId: req.params.postId,
    });
    return createErrorResponse(res, 500, 'Error managing bookmark');
  }
};
