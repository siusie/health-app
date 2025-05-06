// src/routes/api/baby/babyProfile/addBaby.js
const pool = require('../../../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../../utils/response');
const { getUserId } = require('../../../../utils/userIdHelper');
const logger = require('../../../../utils/logger');

// POST /v1/baby
// Add a new baby profile
module.exports = async (req, res) => {
  try {
    const { first_name, last_name, gender, weight, birthdate, height } = req.body;

    // Decode the token to get the user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json(createErrorResponse(401, 'No authorization token provided'));
    }
    const user_id = await getUserId(authHeader); // Get user ID from the token

    const newBaby = await pool.query(
      `INSERT INTO Baby (first_name, last_name, gender, weight, birthdate, height) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING * `,
      [first_name, last_name, gender, weight, birthdate, height]
    );

    await pool.query('INSERT INTO user_baby (user_id, baby_id) VALUES ($1, $2)', [
      user_id,
      newBaby.rows[0].baby_id,
    ]);

    return res.json(createSuccessResponse(newBaby.rows[0]));
  } catch (error) {
    logger.error(`Error adding baby profile: ${error.message}`);
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
