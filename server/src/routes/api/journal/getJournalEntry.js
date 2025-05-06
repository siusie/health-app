// src/routes/api/journal/getJournalEntry.js
const logger = require("../../../utils/logger");
const pool = require("../../../../database/db");
const { getUserId } = require("../../../utils/userIdHelper");

// GET /v1/journal/:id
// Get a specific journal entry by ID
module.exports = async (req, res) => {
  try {
    // Validate authorization header
    if (!req.headers.authorization) {
      return res.status(401).json({
        error: "No authorization token provided",
      });
    }

    const userId = await getUserId(req.headers.authorization);
    const entryId = req.params.id;

    // Validate entry ID
    if (!entryId) {
      return res.status(400).json({
        status: "error",
        error: {
          code: "Journal entry ID is required",
          message: undefined,
        },
      });
    }

    const query =
      "SELECT * FROM journalentry WHERE entry_id = $1 AND user_id = $2";
    const { rows } = await pool.query(query, [entryId, userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        status: "error",
        error: {
          code: "Journal entry not found",
          message: undefined,
        },
      });
    }

    // Add status field to the response
    const response = {
      ...rows[0],
      status: "ok",
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error retrieving journal entry:", error);
    res.status(500).json({
      status: "error",
      error: {
        code: "Internal server error",
        message: undefined,
      },
    });
  }
};
