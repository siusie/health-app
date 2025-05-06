// src/routes/api/addSchedules.js
const pool = require("../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../utils/response");

module.exports = async (req, res) => {
  const { date, time, meal, amount, type, issues, notes } = req.body;

  try {
    const newSchedule = await pool.query(
      "INSERT INTO feedingschedule (date, time, meal, amount, type, issues, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [date, time, meal, amount, type, issues, notes]
    );

    return res.json(createSuccessResponse(newSchedule.rows[0]));
  } catch (error) {
    console.error("Database query error:", error);
    return res
      .status(500)
      .json(createErrorResponse(500, "Internal server error"));
  }
};
