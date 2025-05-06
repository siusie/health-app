const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const logger = require('../utils/logger');
const secret = 'jwt_secret_key';
const jwt = require('jsonwebtoken');

module.exports.strategy = () => {
  return new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      passReqToCallback: true,
    },
    (req, jwtPayload, done) => {
      try {
        // Debug the incoming request headers
        logger.info({ headers: req.headers }, 'Request Headers');
        // Extract token using the correct method
        const tokenExtractor = ExtractJwt.fromAuthHeaderAsBearerToken();
        const token = tokenExtractor(req);

        if (!token) {
          throw new Error('No token provided');
        }

        logger.info({ token }, 'Extracted token from request headers');

        // Verify the token
        const decoded = jwt.verify(token, secret);
        logger.debug(decoded, 'Verified user token');

        // Validate the decoded payload
        if (typeof decoded !== 'object' || !decoded.email) {
          throw new Error('Invalid token payload');
        }

        decoded.email = decoded.email.trim();
        done(null, decoded.email);
      } catch (error) {
        logger.error({ error }, 'Error verifying user token');
        done(null, false); // Call done with `false` to indicate authentication failure
      }
    }
  );
};

const authorize = require('./auth-middleware');
module.exports.authenticate = () => authorize('jwt');
