// src/auth/index.js

// Prefer Amazon Cognito
if (process.env.AUTH_METHOD === 'cognito') {
  module.exports = require('./cognito');
}
// Also allow for an .htpasswd file to be used, but not in production
else if (process.env.AUTH_METHOD === 'postgres') {
  module.exports = require('./jwt-middleware');
}
// In all other cases, we need to stop now and fix our config
else {
  throw new Error('missing env vars: no authorization configuration found');
}
