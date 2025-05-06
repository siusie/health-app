// src/routes/api/baby/babyProfile/deleteBabyProfile.js
const pool = require("../../../../../database/db");
const { createErrorResponse } = require("../../../../utils/response");
const {
  checkBabyBelongsToUser,
} = require("../../../../utils/babyAccessHelper");
const { getUserId } = require("../../../../utils/userIdHelper");

// DELETE /v1/baby/:baby_id
// Delete a baby profile
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
    const { baby_id } = req.params; // Get baby ID from the URL

    // Validate user and baby IDs
    if (!user_id || !baby_id) {
      return res
        .status(400)
        .json(createErrorResponse("Missing required parameters"));
    }

    // Validate baby_id format
    const babyIdNum = parseInt(baby_id);
    if (isNaN(babyIdNum) || babyIdNum <= 0) {
      return res
        .status(400)
        .json(createErrorResponse("Invalid baby ID format"));
    }

    // {CHECK OWNERSHIP of BABY}
    // Verify user has access to this baby using the helper function
    const hasAccess = await checkBabyBelongsToUser(baby_id, user_id);
    if (!hasAccess) {
      return res
        .status(403)
        .json(
          createErrorResponse("Not authorized to delete this baby profile")
        );
    }

    // Delete the entry from the user_baby bridge table
    const userBabyResult = await pool.query(
      "DELETE FROM user_baby WHERE user_id = $1 AND baby_id = $2",
      [user_id, baby_id]
    );

    // Delete the baby profile
    const babyResult = await pool.query("DELETE FROM baby WHERE baby_id = $1", [
      baby_id,
    ]);

    // Check if either query affected no rows
    if (userBabyResult.rowCount === 0 || babyResult.rowCount === 0) {
      return res.status(404).json(createErrorResponse("Baby not found"));
    }

    return res.status(200).json({
      success: true,
      message: "Baby profile deleted successfully",
    });
  } catch (error) {
    return res.status(500).json(createErrorResponse("Internal server error"));
  }
};
