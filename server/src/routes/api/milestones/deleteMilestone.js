// server/src/routes/api/milestones/deleteMilestone.js

const logger = require("../../../utils/logger");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../utils/response");
const pool = require("../../../../database/db");

// DELETE /v1/baby/:baby_id/milestones/:milestone_id
// Delete a Milestone record by milestone_id
module.exports.deleteMilestoneById = async (req, res) => {
  const { milestone_id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM milestones WHERE milestone_id = $1",
      [milestone_id]
    );

    if (result.rowCount > 0) {
      res.status(200).send(createSuccessResponse()); // 200 OK
    } else {
      res
        .status(404)
        .send(createErrorResponse(404, `Milestone record not found`)); // 404 Not Found
    }
  } catch (err) {
    logger.error(err, `Error deleting milestone`);

    res.status(500).send(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};

