// src/auth/ownershipCheck.js
// middleware to check if the user is the owner of a forum post or reply before allowing modifications.
const { getUserId } = require('../utils/userIdHelper');
const pool = require('../../database/db');
const logger = require('../utils/logger');

async function checkPostOwnership(req, res, next) {
  try {
    const userId = await getUserId(req.headers.authorization);
    const postId = req.params.post_id;

    const result = await pool.query('SELECT user_id FROM forumpost WHERE post_id = $1', [postId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (Number(result.rows[0].user_id) !== Number(userId)) {
      return res.status(403).json({ message: 'Not authorized to modify this post' });
    }

    next();
  } catch (error) {
    logger.error(`Error checking post ownership: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
}

async function checkReplyOwnership(req, res, next) {
  try {
    const userId = await getUserId(req.headers.authorization);
    const replyId = req.params.reply_id;

    const result = await pool.query('SELECT user_id FROM forumreply WHERE reply_id = $1', [
      replyId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    if (Number(result.rows[0].user_id) !== Number(userId)) {
      return res.status(403).json({ message: 'Not authorized to modify this reply' });
    }

    next();
  } catch (error) {
    logger.error(`Error checking reply ownership: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  checkPostOwnership,
  checkReplyOwnership,
};
