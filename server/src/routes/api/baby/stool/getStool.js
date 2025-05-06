// server/src/routes/api/baby/stool/getStool.js
// Route for GET /baby/:babyId/stool
// Get all stool records for a specific baby

const logger = require('../../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../../utils/response');
const pool = require('../../../../../database/db');
const jwt = require('jsonwebtoken');
const { checkBabyBelongsToUser } = require('../../../../utils/babyAccessHelper');

module.exports.getStoolEntries = async (req, res) => {
  const { babyId } = req.params;
  logger.info(`Fetching stool entries for babyId: ${babyId}`);

  // Validate babyId format: Ensure it contains only digits and is a positive number.
  // This prevents partially numeric values (e.g., "3absc") from being accepted.
  const numericBabyId = parseInt(babyId, 10);
  logger.info(`Parsed babyId=${babyId} to numericBabyId=${numericBabyId}`);
  if (!/^\d+$/.test(babyId) || Number.isNaN(numericBabyId) || numericBabyId < 1) {
    logger.info(`Invalid babyId format: ${babyId}`);
    return res.status(400).json(createErrorResponse(400, 'Invalid babyId format'));
  }

  try {
    // Decode JWT token from Authorization header to extract user's email.
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.warn('No authorization header found');
      return res.status(401).json(createErrorResponse(401, 'No authorization token provided'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      logger.warn('No token after "Bearer"');
      return res.status(401).json(createErrorResponse(401, 'Invalid token format'));
    }

    const decoded = jwt.decode(token);
    if (!decoded || !decoded.email) {
      logger.warn('No email found in token payload', { decoded });
      return res.status(401).json(createErrorResponse(401, 'Invalid token format'));
    }

    const userEmail = decoded.email;
    logger.info(`Decoded userEmail=${userEmail} from token`);

    // Look up user_id from users table by email.
    const userResult = await pool.query('SELECT user_id FROM users WHERE email = $1', [userEmail]);
    if (userResult.rows.length === 0) {
      logger.warn(`User not found in DB for email=${userEmail}`);
      return res.status(404).json(createErrorResponse(404, 'User not found'));
    }

    const userId = userResult.rows[0].user_id;
    logger.info(`Got user_id=${userId} from token`);

   // {CHECK OWNERSHIP of BABY}
    // Verify user has access to this baby 
    // Check user ownership in user_baby table to ensure the user is authorized.
    const hasBabyAccess = await checkBabyBelongsToUser(numericBabyId, userId);
    if (!hasBabyAccess) {
      logger.info(`User ${userId} not authorized for babyId=${numericBabyId}`);
      return res.status(403).json(createErrorResponse(403, 'Forbidden'));
    }

    // Fetch stool entries for the authorized baby, ordered by timestamp descending.
    // Explicitly handle timestamps in UTC to avoid timezone issues
    const stoolResult = await pool.query(
      `SELECT 
        stool_id, 
        baby_id, 
        color, 
        consistency, 
        notes, 
        timestamp AT TIME ZONE 'UTC' as timestamp
       FROM stool_entries 
       WHERE baby_id = $1 
       ORDER BY timestamp DESC`,
      [numericBabyId]
    );

    if (stoolResult.rows.length === 0) {
      logger.info(`No stool entries found for babyId: ${numericBabyId}`);
      return res.status(404).json(createErrorResponse(404, 'No stool records found'));
    }

    logger.info(`Found ${stoolResult.rows.length} stool entries for babyId=${numericBabyId}`);
    return res.status(200).json(createSuccessResponse(stoolResult.rows));

  } catch (error) {
    logger.error(error, `ERROR in GET /baby/${babyId}/stool`);
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};