// server/src/routes/api/milestones/getMilestones.js

const logger = require('../../../utils/logger');
const { createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');
const { getUserId } = require('../../../utils/userIdHelper');
const { checkBabyBelongsToUser } = require('../../../utils/babyAccessHelper'); 

// GET /v1/baby/:baby_id/milestones
// Get all milestones for a baby
module.exports.getMilestoneByBabyId = async (req, res) => {
  const { baby_id } = req.params;
  
  try {
    // Input validation
    if (!baby_id) {
      return res.status(400).json(createErrorResponse(400, 'Baby ID is required'));
    }

    // Validate if id is a valid number
    if (isNaN(baby_id) || parseInt(baby_id) <= 0) {
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
      return res.status(404).json({
        status: 'error',
        error: {
          code: 404,
          message: 'User not found',
        },
      });
    }

    // {CHECK OWNERSHIP of BABY}
    // Verify user has access to this baby
    // Check baby ownership using the utility function
    const hasBabyAccess = await checkBabyBelongsToUser(baby_id, userId);
    if (!hasBabyAccess) {
      return res
        .status(403)
        .json(createErrorResponse(403, 'Access denied: Baby does not belong to current user'));
    }

    const result = await pool.query(
      `SELECT 
        milestone_id,
        baby_id,
        TO_CHAR(date, 'YYYY-MM-DD') AS date, -- Format the date as YYYY-MM-DD
        title,
        details FROM milestones WHERE baby_id = $1`, 
      [baby_id]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 404,
          message: 'No milestones found for this baby',
        },
      });
    }

    return res.status(200).send({
      status: 'ok',
      data: result.rows, // Send the array as a 'data' property
    });
  } catch (err) {
    logger.error(err, `Error fetching milestones`);

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};
