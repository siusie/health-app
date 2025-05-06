const express = require('express');
const cors = require('cors');
const authenticate = require('./auth');
const passport = require('passport');
const { createErrorResponse } = require('./utils/response');

const mainRouter = require('./routes'); // Import the API router

const logger = require('./utils/logger');
const pino = require('pino-http')({
  logger,
});

const app = express();
app.use(pino);

const allowedOrigins = [
  'http://localhost:3000',
  'https://team-06-prj-666-winter-2025.vercel.app',
];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Set up our passport authentication middleware
passport.use(authenticate.strategy());
app.use(passport.initialize());

// Define our routes
// The second parameter passed to app.use is the middleware function or the module containing middelware
// functions
app.use('/', mainRouter); // Mount the main router

app.use((req, res) => {
  res.status(404).json(
    createErrorResponse({
      error: {
        message: 'not found',
        code: 404,
      },
    })
  );
});

module.exports = app;
