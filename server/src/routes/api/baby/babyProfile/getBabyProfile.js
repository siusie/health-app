// src/routes/api/baby/babyProfile/getBabyProfile.js
const pool = require("../../../../../database/db");
const { createErrorResponse } = require("../../../../utils/response");
const { getUserId } = require("../../../../utils/userIdHelper");
const {
  checkBabyBelongsToUser,
} = require("../../../../utils/babyAccessHelper");

// GET /v1/baby/:baby_id/profile
// Get a baby's profile
module.exports = async (req, res) => {
  try {
    const { baby_id } = req.params;

    // Validate baby_id parameter
    if (!baby_id || baby_id === "undefined") {
      return res
        .status(400)
        .json(createErrorResponse(400, "Missing baby_id parameter"));
    }

    // Validate if baby_id is a number
    if (isNaN(baby_id)) {
      return res
        .status(400)
        .json(createErrorResponse(400, "Invalid baby_id parameter"));
    }

    // Decode the token to get the user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json(createErrorResponse(401, "No authorization token provided"));
    }

    const user_id = await getUserId(authHeader);
    if (!user_id) {
      return res.status(404).json({
        status: "error",
        error: {
          code: 404,
          message: "User not found",
        },
      });
    }

   // {CHECK OWNERSHIP of BABY}
    // Verify user has access to this baby
    const hasBabyAccess = await checkBabyBelongsToUser(baby_id, user_id);
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

    const babyProfile = await pool.query(
      `SELECT first_name, last_name, gender, weight, height, birthdate
       FROM baby WHERE baby_id = $1`,
      [baby_id]
    );

    if (babyProfile.rows.length === 0) {
      return res
        .status(404)
        .json(createErrorResponse(404, "Baby profile not found"));
    }

    return res.status(200).json({
      status: "ok",
      data: babyProfile.rows[0],
    });
  } catch (error) {
    return res
      .status(500)
      .json(createErrorResponse(500, "Internal server error"));
  }
};
