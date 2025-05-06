// src/utils/userIdHelper.js
const pool = require("../../database/db");
const logger = require("./logger");
const jwt = require("jsonwebtoken");

/**
 * Retrieves a user's ID from the database using their email address
 *
 * @param {string} authHeader - The authorization header containing the JWT token
 * @returns {Promise<number|null>} The user's ID if found, null if not found or invalid token
 * @throws {Error} If there's a database error during the query
 */
async function getUserId(authHeader) {
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.email) {
      logger.error("No email found in token payload");
      return null;
    }

    const email = decoded.email;

    const result = await pool.query(
      `SELECT user_id
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      logger.error(`User not found for email: ${email}`);
      return null;
    }

    return result.rows[0].user_id; // return the user ID
  } catch (error) {
    logger.error(`Error retrieving user ID: ${error.message}`);
    throw error;
  }
}

module.exports = {
  getUserId,
};
