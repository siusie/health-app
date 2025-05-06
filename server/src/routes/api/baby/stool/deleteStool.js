// server/src/routes/api/baby/stool/deleteStool.js
// Route for DELETE /baby/:babyId/stool/:stoolId
// Delete stool entry for a specific baby

const logger = require('../../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../../utils/response');
const pool = require('../../../../../database/db');
const jwt = require('jsonwebtoken');
const { checkBabyBelongsToUser } = require('../../../../utils/babyAccessHelper');

module.exports.deleteStoolEntry = async (req, res) => {
  const { babyId, stoolId } = req.params;

  logger.info(`Deleting stool entry stool_id=${stoolId} for babyId=${babyId}`);

  // Validate babyId format: Ensure it contains only digits and is a positive number.
  // This prevents partially numeric values (e.g., "3absc") from being accepted.
  const numericBabyId = parseInt(babyId, 10);
  logger.info(`Parsed babyId=${babyId} to numericBabyId=${numericBabyId}`);
  if (!/^\d+$/.test(babyId) || Number.isNaN(numericBabyId) || numericBabyId < 1) {
    logger.info(`Invalid babyId format: ${babyId}`);
    return res.status(400).json(createErrorResponse(400, 'Invalid babyId format'));
  }

  // Validate stoolId format: Ensure it contains only digits and is a positive number.
  const numericStoolId = parseInt(stoolId, 10);
  logger.info(`Parsed stoolId=${stoolId} to numericStoolId=${numericStoolId}`);
  if (!/^\d+$/.test(stoolId) || Number.isNaN(numericStoolId) || numericStoolId < 1) {
    logger.info(`Invalid stoolId format: ${stoolId}`);
    return res.status(400).json(createErrorResponse(400, 'Invalid stoolId format'));
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

    // Confirm baby existence.
    const babyExists = await pool.query('SELECT * FROM baby WHERE baby_id = $1', [numericBabyId]);
    if (babyExists.rows.length === 0) {
      logger.info(`No baby found with baby_id=${numericBabyId}`);
      return res.status(404).json(createErrorResponse(404, 'Baby not found'));
    }

    // Confirm stool entry exists for this baby.
    const existingRes = await pool.query(
      'SELECT * FROM stool_entries WHERE stool_id = $1 AND baby_id = $2',
      [numericStoolId, numericBabyId]
    );
    if (existingRes.rows.length === 0) {
      logger.info(`No stool entry found with stool_id=${stoolId} for babyId=${babyId}`);
      return res.status(404).json(createErrorResponse(404, 'Stool entry not found'));
    }

    // Delete the stool entry from the database.
    await pool.query(
      'DELETE FROM stool_entries WHERE stool_id = $1 AND baby_id = $2',
      [numericStoolId, numericBabyId]
    );
    logger.info(`Stool entry stool_id=${stoolId} deleted for babyId=${babyId}`);

    // Return success response indicating deletion.
    return res.status(200).json(createSuccessResponse({ message: 'Stool entry deleted successfully' }));
  } catch (error) {
    logger.error(error, `ERROR in DELETE /baby/${babyId}/stool/${stoolId}`);
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
