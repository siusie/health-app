// server/src/routes/api/milestones/postMilestone.js

const logger = require("../../../utils/logger");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../utils/response");
const pool = require("../../../../database/db");

// POST /v1/baby/:baby_id/milestones
// Create a new milestone
module.exports.createMilestone = async (req, res) => {
  const { date, title, details } = req.body;
  const baby_id = req.params.baby_id;

  try {
    const result = await pool.query(
      "INSERT INTO milestones (baby_id, date, title, details) VALUES ($1, $2, $3, $4) RETURNING *",
      [baby_id, date, title, details]
    );

    res.status(201).send(createSuccessResponse(result.rows[0])); // 201 Created
  } catch (err) {
    logger.error(err, `ERROR in POST /milestones, Error creating milestone`);

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};

