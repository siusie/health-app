// src/routes/api/users/delete.js
/**
 * ROUTE: DELETE /user/:id
 * DELETE a user by userId
 */

const logger = require('../../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../utils/response');
const pool = require('../../../../database/db');

const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const cognito = new AWS.CognitoIdentityServiceProvider();

module.exports.deleteUserById = async function (req, res) {
  const { id } = req.params;

  try {
    if (process.env.AUTH_METHOD === 'cognito') {
      // GET Cognito User name from Cognito
      const userResult = await pool.query(
        'SELECT email FROM users WHERE user_id = $1',
        [id]
      );
      if (userResult.rows.length === 0) {
        throw new Error('User not found in Postgres Database');
      }

      const email = userResult.rows[0].email;

      const cognitoUser = await cognito
        .adminGetUser({
          UserPoolId: process.env.AWS_COGNITO_POOL_ID,
          Username: email,
        })
        .promise();

      const cognitoUsername = cognitoUser.Username;

      // DELETE entries from user_baby table
      const userBabyResult = await pool.query(
        'DELETE FROM user_baby WHERE user_id = $1 RETURNING baby_id',
        [id]
      );

      // Extract baby_id from the deleted entries
      const babyIds = userBabyResult.rows.map((row) => row.baby_id);
      // DELETE entries from babies table
      if (babyIds.length > 0) {
        await pool.query('DELETE FROM baby WHERE baby_id = ANY($1)', [babyIds]);
      }

      // DELETE user from users table
      await pool.query('DELETE FROM users WHERE user_id = $1', [id]);

      // DELETE user from cognito
      await cognito
        .adminDeleteUser({
          UserPoolId: process.env.AWS_COGNITO_POOL_ID,
          Username: cognitoUsername,
        })
        .promise();

      return res.status(200).json(
        createSuccessResponse({
          message: 'User and related entries deleted successfully',
        })
      ); // 200 OK
    } else if (process.env.AUTH_METHOD === 'postgres') {
      // DELETE entries from user_baby table
      const userBabyResult = await pool.query(
        'DELETE FROM user_baby WHERE user_id = $1 RETURNING baby_id',
        [id]
      );

      // Extract baby_id from the deleted entries
      const babyIds = userBabyResult.rows.map((row) => row.baby_id);

      // DELETE entries from babies table
      if (babyIds.length > 0) {
        await pool.query('DELETE FROM baby WHERE baby_id = ANY($1)', [babyIds]);
      }

      // DELETE user from users table
      await pool.query('DELETE FROM users WHERE user_id = $1', [id]);

      return res.status(200).json(
        createSuccessResponse({
          message: 'User and related entries deleted successfully',
        })
      ); // 200 OK
    }
  } catch (err) {
    logger.error(
      err,
      `ERROR in DELETE /users/:id, Error deleting user with id ${req.params.id}`
    );

    return res
      .status(500)
      .json(createErrorResponse(500, `Internal server error`)); // 500 Internal Server Error
  }
};
