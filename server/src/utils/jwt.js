const jwt = require('jsonwebtoken');
const secret = 'jwt_secret_key';

const generateToken = (user) => {
  const payload = {
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, secret, { expiresIn: '1h' });
};

const verifyToken = (token) => {
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken,
};
