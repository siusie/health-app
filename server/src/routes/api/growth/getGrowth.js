// server/src/routes/api/growth/getGrowth.js
// Route for GET /baby/:babyId/growth
// Get all Growth records for a specific [:babyId]

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');
const { getUserId } = require('../../../utils/userIdHelper');
const { checkBabyBelongsToUser } = require('../../../utils/babyAccessHelper');

// GET /baby/:babyId/growth - Get multiple Growth records by[:babyId]
module.exports.getAllGrowth = async (req, res) => {
  const babyId = req.params.babyId;

  try {
    // Input validation
    if (!babyId) {
      return res.status(400).json(createErrorResponse(400, 'Baby ID is required'));
    }

    // Validate if id is a valid number
    if (isNaN(babyId) || parseInt(babyId) <= 0) {
      return res.status(400).json(createErrorResponse(400, 'Invalid baby ID format'));
    }

    // Decode the token to get the user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error('No authorization header found');
      return res.status(401).json(createErrorResponse(401, 'No authorization token provided'));
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return createErrorResponse(res, 404, 'User not found');
    }

    // {CHECK OWNERSHIP of BABY}
    // Verify user has access to this baby
    // Check baby ownership using the utility function
    const hasBabyAccess = await checkBabyBelongsToUser(babyId, userId);
    if (!hasBabyAccess) {
      return res
        .status(403)
        .json(createErrorResponse(403, 'Access denied: Baby does not belong to current user'));
    }

    const result = await pool.query(
      `SELECT growth_id, baby_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, height, weight, notes
       FROM growth WHERE baby_id = $1`,
      [babyId]
    );

    if (result.rows.length > 0) {
      res.status(200).send(createSuccessResponse({ data: result.rows })); // 200 OK with multiple records
    } else {
      res
        .status(404)
        .send(createErrorResponse(404, `No growth records found for [babyId] ${babyId}`)); // 404 Not Found
    }
  } catch (err) {
    logger.error(
      err,
      `ERROR in GET /baby/:babyId/growth, Error fetching growth records for [babyId] ${babyId}`
    );

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};
