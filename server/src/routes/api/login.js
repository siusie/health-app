// src/routes/api/login.js

const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../utils/response');

const pool = require('../../../database/db');
const { generateToken } = require('../../utils/jwt');
const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const cognito = new AWS.CognitoIdentityServiceProvider();

module.exports = async (req, res) => {
  const { email, password } = req.body;

  if (process.env.AUTH_METHOD === 'cognito') {
    logger.info('Using AWS Cognito for authentication');
    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.AWS_COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };

    try {
      const result = await cognito.initiateAuth(params).promise();
      const { AccessToken, IdToken, RefreshToken } =
        result.AuthenticationResult;

      // After login, check whether the user exists in both tables
      const resultDb = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      const authResult = await pool.query(
        'SELECT * FROM authentication WHERE email = $1',
        [email]
      );

      const user = resultDb.rows[0];
      const authUser = authResult.rows[0];

      // Only create authentication record if it doesn't exist
      if (!authUser) {
        await pool.query(
          'INSERT INTO authentication (email, password) VALUES ($1, $2)',
          [email, password]
        );
      }

      if (!user) {
        return res.json(
          createSuccessResponse({
            success: true,
            message: 'Login successfully, please complete your registration',
            redirect: '/register',
            accessToken: AccessToken,
            token: IdToken,
            refreshToken: RefreshToken,
          })
        );
      }

      return res.json(
        createSuccessResponse({
          success: true,
          userId: user.user_id,
          userRole: user.role,
          message: 'Login successfully',
          accessToken: AccessToken,
          token: IdToken,
          refreshToken: RefreshToken,
        })
      );
    } catch (error) {
      if (error.code === 'UserNotFoundException') {
        return res
          .status(401)
          .json(createErrorResponse(401, "User doesn't exist"));
      } else if (error.code === 'NotAuthorizedException') {
        return res
          .status(401)
          .json(createErrorResponse(401, 'Invalid credentials'));
      } else {
        logger.error(error);
        return res
          .status(500)
          .json(createErrorResponse(500, 'Internal server error'));
      }
    }
  } else if (process.env.AUTH_METHOD === 'postgres') {
    try {
      const result = await pool.query(
        'SELECT * FROM authentication WHERE email = $1',
        [email]
      );

      const user = result.rows[0];

      if (!user) {
        return res
          .status(401)
          .json(createErrorResponse(401, "User doesn't exist"));
      }

      if (user && password == user.password.trim()) {
        const token = generateToken(user);

        return res.json(
          createSuccessResponse({
            success: true,
            token,
            message: 'Login successfully',
          })
        );
      } else {
        return res
          .status(401)
          .json(createErrorResponse(401, 'Invalid credentials'));
      }
    } catch (error) {
      logger.error(error);
      return res
        .status(500)
        .json(createErrorResponse(500, 'Internal server error'));
    }
  } else {
    return res
      .status(500)
      .json(createErrorResponse(500, 'Invalid authentication method'));
  }
};
