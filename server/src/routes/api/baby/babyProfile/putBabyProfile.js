// src/routes/api/baby/babyProfile/putBabyProfile.js

const pool = require("../../../../../database/db");
const { getUserId } = require("../../../../utils/userIdHelper");
const {
  checkBabyBelongsToUser,
} = require("../../../../utils/babyAccessHelper");

// PUT /v1/baby/:baby_id
// Update baby profile information
module.exports = async (req, res) => {
  try {
    const { baby_id } = req.params;

    // Validate baby_id parameter
    if (!baby_id || baby_id === "undefined") {
      return res.status(400).json({
        status: "error",
        error: {
          message: "Missing baby_id parameter",
        },
      });
    }

    // Validate if baby_id is a number
    if (isNaN(baby_id)) {
      return res.status(400).json({
        status: "error",
        error: {
          message: "Invalid baby_id parameter",
        },
      });
    }

    // Check if data object exists
    if (!req.body.data) {
      return res.status(400).json({
        status: "error",
        error: {
          message: "Missing required parameters: data object",
        },
      });
    }

    const { first_name, last_name, gender, weight, birthdate, height} = req.body.data;

    // Validate all required fields
    const requiredFields = { first_name, last_name, gender, weight, birthdate, height };
    // Check if any required field is missing
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
    // If there are missing fields, return an error response
    if (missingFields.length > 0) {
      return res.status(400).json({
        status: "error",
        error: {
          message: `Missing required parameters: ${missingFields.join(", ")}`,
        },
      });
    }

    // Decode the token to get the user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: "error",
        error: {
          message: "No authorization token provided",
        },
      });
    }

    const user_id = await getUserId(authHeader);
    if (!user_id) {
      return res.status(404).json({
        status: "error",
        error: {
          message: "User not found",
        },
      });
    }
    
   // {CHECK OWNERSHIP of BABY}
    // Verify user has access to this baby 
    const hasBabyAccess = await checkBabyBelongsToUser(baby_id, user_id);
    if (!hasBabyAccess) {
      return res.status(403).json({
        status: "error",
        error: {
          message: "Access denied: Baby does not belong to current user",
        },
      });
    }

    // Update baby information
    const result = await pool.query(
      `UPDATE baby SET first_name = $1, last_name = $2, gender = $3, weight = $4,
      birthdate = $5, height = $6
      WHERE baby_id = $7
      RETURNING * `,
      [first_name, last_name, gender, weight, birthdate, height, baby_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        error: {
          message: "Baby not found",
        },
      });
    }

    return res.json({
      status: "success",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: {
        message: "Internal server error while updating baby profile",
      },
    });
  }
};
