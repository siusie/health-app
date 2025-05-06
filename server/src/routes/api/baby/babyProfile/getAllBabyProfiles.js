// src/routes/api/baby/babyProfile/getAllBabyProfiles.js
const pool = require("../../../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../../utils/response");
const { getUserId } = require("../../../../utils/userIdHelper");

// GET /v1/babies
// Get all baby profiles for a user
module.exports = async (req, res) => {
  try {
    // Decode the token to get the user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json(createErrorResponse(401, "No authorization token provided"));
    }
    const user_id = await getUserId(authHeader); // Get user ID from the token
    console.log(user_id);
    if (!user_id) {
      return res.status(401).json(createErrorResponse("Invalid user ID"));
    }

    // {CHECK OWNERSHIP of BABY}
    // Verify user has access to this baby: DONE

    const babyProfiles = await pool.query(
      `SELECT b.* FROM baby b
      JOIN user_baby ub ON b.baby_id = ub.baby_id
      JOIN users u ON u.user_id = ub.user_id
      WHERE u.user_id = $1
      ORDER BY b.baby_id ASC`,
      [parseInt(user_id, 10)] // Convert string to number
    );

    if (babyProfiles.rows.length === 0) {
      return res
        .status(404)
        .json(createErrorResponse("No baby profiles found for this user"));
    }

    return res.json(createSuccessResponse({ babies: babyProfiles.rows }));
  } catch (error) {
    return res.status(500).json(createErrorResponse("Internal server error"));
  }
};
