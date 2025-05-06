// src/utils/babyAccessHelper.js
const pool = require("../../database/db");
/**
 * Checks if a baby belongs to a specific user
 * @param {number} babyId - The ID of the baby
 * @param {number} userId - The ID of the user
 * @returns {Promise<boolean>} True if the baby belongs to the user, false otherwise
 */
const checkBabyBelongsToUser = async (babyId, userId) => {
  try {
    const babyCheck = await pool.query(
      "SELECT baby_id FROM user_baby WHERE baby_id = $1 AND user_id = $2",
      [babyId, userId]
    );
    return babyCheck.rowCount > 0;
  } catch (error) {
    console.error("Error checking baby ownership:", error);
    return false;
  }
};

module.exports = {
  checkBabyBelongsToUser,
};
