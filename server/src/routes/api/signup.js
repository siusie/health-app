// src/routes/api/signup.js

const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../utils/response');
const validatePassword = require('../../utils/validatePassword');
const pool = require('../../../database/db');

module.exports = async (req, res) => {
  const { firstName, lastName, email, role } = req.body;
  try {
    const newUser = await pool.query(
      'INSERT INTO users (first_name, last_name, email, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [firstName, lastName, email, role]
    );

    // Return the newly created user from the database
    return res.json(createSuccessResponse(newUser.rows[0]));
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json(createErrorResponse(500, 'Internal server error'));
  }
};
