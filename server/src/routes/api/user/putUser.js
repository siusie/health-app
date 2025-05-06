// src/routes/api/users/put.js
// All PUT /users routes

const logger = require('../../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../utils/response');
const pool = require('../../../../database/db');

/**
 * ROUTE: PUT /user/:id
 * Update an existing user with new data
 */
module.exports.updateUserById = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, role, created_at } = req.body;

  try {
    const updatedUser = await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2, email = $3, role = $4, created_at = $5 WHERE user_id = $6 RETURNING *',
      [first_name, last_name, email, role, created_at, id]
    );

    return res.status(200).json(createSuccessResponse(updatedUser.rows[0]));
  } catch (err) {
    logger.error(
      err,
      `ERROR in PUT /users/:id, Error updating user with id ${req.params.id}`
    );

    return res
      .status(500)
      .json(createErrorResponse(500, 'Internal server error'));
  }
};
