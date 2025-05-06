// server/src/routes/api/careServices/index.js
const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const provider_pool = require('../../../../database/childcare_db');
const main_pool = require('../../../../database/db');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  try {
    // 1) Check authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.warn('No authorization header found');
      return res.status(401).json(createErrorResponse(401, 'No authorization token provided'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      logger.warn('No token after "Bearer"');
      return res.status(401).json(createErrorResponse(401, 'Invalid token format'));
    }

    // 2) Decode or verify the token
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.email) {
      logger.warn('No email found in token payload', { decoded });
      return res.status(401).json(createErrorResponse(401, 'Invalid token format'));
    }

    // 3) Lookup user if needed - use main_pool for users table
    const userResult = await main_pool.query('SELECT user_id FROM users WHERE email = $1', [
      decoded.email,
    ]);
    if (userResult.rows.length === 0) {
      logger.warn(`User not found in DB for email=${decoded.email}`);
      return res.status(404).json(createErrorResponse(404, 'User not found'));
    }

    // 4) Query child_providers with DISTINCT ON - use provider_pool for child_providers table
    const result = await provider_pool.query(`
      SELECT DISTINCT ON (name, rating, hourly_rate, experience, title, description)
            id,
            provider_type,
            location,
            REGEXP_REPLACE(location, '^(.*)\\s+([A-Z0-9]+)$', '\\2') AS postal_code,
            REGEXP_REPLACE(location, '\\s+[A-Z0-9]+$', '') AS location,
            name,
            rating,
            reviews_count,
            experience,
            age,
            hourly_rate,
            title,
            description AS bio,
            premium AS is_premium,
            profile_url,
            profile_image,
            verification_count AS verification,
            hired_count
      FROM child_providers
      ORDER BY name, rating, hourly_rate, experience, title, description, id
    `);
    // 5) Return the distinct rows
    return res.status(200).json(createSuccessResponse({ providers: result.rows }));
  } catch (error) {
    logger.error(error, 'ERROR in GET /careServices');
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};