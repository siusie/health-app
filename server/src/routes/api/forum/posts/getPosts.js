// src/routes/api/forum/posts/getPosts.js
const pool = require('../../../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../../utils/response');
const jwt = require('jsonwebtoken');
const logger = require('../../../../utils/logger');

module.exports = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error('No authorization header found');
      return createErrorResponse(res, 401, 'No authorization token provided');
    }

    const token = authHeader.split(' ')[1]; // Remove 'Bearer' prefix

    // Decode the JWT token
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.email) {
      logger.error('No email found in token payload');
      return createErrorResponse(res, 401, 'Invalid token format');
    }

    const email = decoded.email;
    logger.info(`Fetching user details for email: ${email}`);

    // Query to get user details from the database using email
    const result = await pool.query(
      `SELECT user_id
      FROM users
      WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      logger.error(`User not found for email: ${email}`);
      return createErrorResponse(res, 404, 'User not found');
    }

    // Get all posts and replies
    // WITH clause is used to create temporary result sets that can be referenced in the main query
    // In this case, we are creating two temporary result sets: PostData and ReplyData
    // PostData contains the post details along with the user details and reply count
    // ReplyData contains the reply details along with the user details
    const posts = await pool.query(
      `WITH PostData AS (
        SELECT 
          p.post_id,
          p.user_id,
          CONCAT(u.first_name, ' ', LEFT(u.last_name, 1), '.') as display_name,
          p.title,
          p.content,
          p.category,
          p.created_at,
          p.updated_at,
          COUNT(DISTINCT r.reply_id) as reply_count
        FROM forumpost p
        LEFT JOIN forumreply r ON p.post_id = r.post_id
        LEFT JOIN users u ON p.user_id = u.user_id
        GROUP BY p.post_id, p.user_id, u.first_name, u.last_name, p.title, p.content, p.category, p.created_at, p.updated_at
        ORDER BY p.created_at DESC
      ),
      ReplyData AS (
        SELECT 
          r.reply_id,
          r.post_id,
          r.user_id,
          u.first_name,
          LEFT(u.last_name, 1) as last_initial,
          r.content,
          r.created_at,
          r.updated_at
        FROM forumreply r
        JOIN users u ON r.user_id = u.user_id
        WHERE r.post_id IN (SELECT post_id FROM PostData)
      )
      SELECT 
        p.post_id,
        p.user_id,
        p.display_name,
        p.title,
        p.content,
        p.category,
        p.created_at,
        p.updated_at,
        p.reply_count,
        COALESCE(
          json_agg(
            json_build_object(
              'reply_id', r.reply_id,
              'user_id', r.user_id,
              'author', CONCAT(r.first_name, ' ', r.last_initial, '.'),
              'content', r.content,
              'created_at', r.created_at,
              'updated_at', r.updated_at
            )
          ) FILTER (WHERE r.reply_id IS NOT NULL),
          '[]'
        ) as replies
      FROM PostData p
      LEFT JOIN ReplyData r ON p.post_id = r.post_id
      GROUP BY p.post_id, p.user_id, p.display_name, p.title, p.content, p.category, p.created_at, p.updated_at, p.reply_count`
    );

    return res.status(200).json({
      status: 'ok',
      data: posts.rows,
    });
  } catch (error) {
    logger.error(`Error fetching posts: ${error.message}`);
    return res.status(500).json(createErrorResponse(error.message));
  }
};
