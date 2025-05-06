// server/src/routes/api/baby/getLatestFeed.js
const pool = require('../../../../database/db');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../utils/response');
const { getUserId } = require('../../../utils/userIdHelper');
const { checkBabyBelongsToUser } = require('../../../utils/babyAccessHelper');
const logger = require('../../../utils/logger');

// GET /v1/baby/:id/getLatestFeed
module.exports = async (req, res) => {
  try {
    const { id } = req.params; // baby_id

    // Input validation
    if (!id) {
      return res
        .status(400)
        .json(createErrorResponse(400, "Baby ID is required"));
    }

    // Validate if id is a valid number
    if (isNaN(id) || parseInt(id) <= 0) {
      return res
        .status(400)
        .json(createErrorResponse(400, "Invalid baby ID format"));
    }

    // Decode the token to get the user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error("No authorization header found");
      return res.status(401).json(createErrorResponse(401, "No authorization token provided"));
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return res.status(404).json(createErrorResponse(404, "User not found"));
    }

   // {CHECK OWNERSHIP of BABY}
    // Verify user has access to this baby
    const hasBabyAccess = await checkBabyBelongsToUser(id, userId);
    if (!hasBabyAccess) {
      return res
        .status(403)
        .json(
          createErrorResponse(
            403,
            "Access denied: Baby does not belong to current user"
          )
        );
    }

    // Get the latest feed for this baby
    const latestFeedQuery = `
      SELECT *
      FROM feedingschedule
      WHERE baby_id = $1
      ORDER BY 
        date DESC, 
        CASE 
          WHEN time LIKE '% PM' THEN 1 
          ELSE 0 
        END DESC,
        SUBSTRING(time, 1, POSITION(':' IN time))::integer DESC, 
        SUBSTRING(time, POSITION(':' IN time) + 1, 2)::integer DESC
      LIMIT 1
    `;

    const latestFeed = await pool.query(latestFeedQuery, [id]);

    // If no feeds found, return empty
    if (latestFeed.rowCount === 0) {
      return res.json(createSuccessResponse(null));
    }

    return res.json(createSuccessResponse(latestFeed.rows[0]));
  } catch (error) {
    logger.error("Error in getLatestFeed:", error);
    return res
      .status(500)
      .json(createErrorResponse(500, "Internal server error"));
  }
};