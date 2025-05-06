// src/routes/api/journal/getJournalEntry.js
const logger = require("../../../utils/logger");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../utils/response");
const pool = require("../../../../database/db");
const { getUserId } = require("../../../utils/userIdHelper");

// GET /v1/journal
// Get all journal entries for a user
module.exports = async (req, res) => {
  try {
    // Validate authorization header
    if (!req.headers.authorization) {
      return res.status(401).json({
        error: "No authorization token provided",
      });
    }
    const userId = await getUserId(req.headers.authorization);

    const query = "SELECT * FROM journalentry WHERE user_id = $1";
    const { rows } = await pool.query(query, [userId]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json(
          createErrorResponse("No journal entries found. Try to create one")
        );
    }

    res.status(200).json(createSuccessResponse(rows));
  } catch (error) {
    logger.error("Error retrieving journal entries:", error);
    res.status(500).json(createErrorResponse("Internal server error"));
  }
};
