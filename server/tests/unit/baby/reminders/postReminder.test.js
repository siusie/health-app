/**
 * File: tests/unit/baby/reminders/postReminder.test.js
 * Unit tests for POST /v1/baby/:babyId/reminders
 */

// Mock all dependencies BEFORE importing the module under test
jest.mock('../../../../database/db', () => ({
  query: jest.fn()
}));

jest.mock('../../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

jest.mock('../../../../src/utils/response', () => ({
  createSuccessResponse: jest.fn(data => data),
  createErrorResponse: jest.fn((code, message) => ({ error: { code, message } }))
}));

jest.mock('../../../../src/utils/userIdHelper', () => ({
  getUserId: jest.fn()
}));

jest.mock('../../../../src/utils/babyAccessHelper', () => ({
  checkBabyBelongsToUser: jest.fn()
}));

jest.mock('jsonwebtoken');

// Now import the module under test and mocked dependencies
const { createReminder } = require('../../../../src/routes/api/baby/reminders/postReminder');
const { createSuccessResponse, createErrorResponse } = require('../../../../src/utils/response');
const pool = require('../../../../database/db');
const { getUserId } = require('../../../../src/utils/userIdHelper');
const { checkBabyBelongsToUser } = require('../../../../src/utils/babyAccessHelper');
const logger = require('../../../../src/utils/logger');

describe('createReminder direct invocation', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { babyId: '1' },
      headers: {
        authorization: 'Bearer sometoken'
      },
      body: {
        title: 'Feeding',
        time: '10:00',
        date: '2025-03-15',
        notes: 'Morning feed',
        isActive: true,
        nextReminder: false
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Clear all mocks
    jest.clearAllMocks();

    // Default mock implementations
    getUserId.mockResolvedValue(1);
    checkBabyBelongsToUser.mockResolvedValue(true);
    pool.query.mockResolvedValue({ rows: [{
      reminder_id: 100,
      baby_id: 1,
      title: 'Feeding',
      time: '10:00',
      date: '2025-03-15',
      notes: 'Morning feed',
      is_active: true,
      next_reminder: false,
      reminder_in: null
    }]});
  });

  // Validation Tests
  test('returns 400 for non-numeric babyId', async () => {
    req.params.babyId = 'abc';
    await createReminder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(createErrorResponse).toHaveBeenCalledWith(400, 'Invalid babyId format');
  });

  test('returns 400 for babyId less than 1', async () => {
    req.params.babyId = '0';
    await createReminder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(createErrorResponse).toHaveBeenCalledWith(400, 'Invalid babyId format');
  });

  // Required field validation
  test('returns 400 if title is missing', async () => {
    delete req.body.title;
    await createReminder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(createErrorResponse).toHaveBeenCalledWith(400, 'Missing required reminder data (title, time, date)');
  });

  test('returns 400 if time is missing', async () => {
    delete req.body.time;
    await createReminder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(createErrorResponse).toHaveBeenCalledWith(400, 'Missing required reminder data (title, time, date)');
  });

  test('returns 400 if date is missing', async () => {
    delete req.body.date;
    await createReminder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(createErrorResponse).toHaveBeenCalledWith(400, 'Missing required reminder data (title, time, date)');
  });

  // Authorization tests
  test('returns 401 if no authorization header is provided', async () => {
    delete req.headers.authorization;
    await createReminder(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, 'No authorization token provided');
  });

  // User and access tests
  test('returns 404 if user is not found', async () => {
    getUserId.mockResolvedValueOnce(null);

    await createReminder(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, 'User not found');
  });

  // Access check test
  test('returns 403 if user does not have access to the baby', async () => {
    checkBabyBelongsToUser.mockResolvedValueOnce(false);

    await createReminder(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(createErrorResponse).toHaveBeenCalledWith(403, 'Access denied: Baby does not belong to current user');
  });

  // Successful creation tests
  test('returns 201 with full reminder details', async () => {
    // Simulate successful reminder creation
    const createdReminder = {
      reminder_id: 100,
      baby_id: 1,
      title: 'Feeding',
      time: '10:00',
      date: '2025-03-15',
      notes: 'Morning feed',
      is_active: true,
      next_reminder: false,
      reminder_in: null
    };
    pool.query.mockResolvedValueOnce({ rows: [createdReminder] });

    await createReminder(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(createSuccessResponse).toHaveBeenCalledWith(createdReminder);
  });

  test('returns 201 with minimal required fields', async () => {
    // Use only required fields
    req.body = {
      title: 'Feeding',
      time: '10:00',
      date: '2025-03-15'
    };

    // Simulate successful reminder creation
    const createdReminder = {
      reminder_id: 100,
      baby_id: 1,
      title: 'Feeding',
      time: '10:00',
      date: '2025-03-15',
      notes: null,
      is_active: true,
      next_reminder: false,
      reminder_in: null
    };
    pool.query.mockResolvedValueOnce({ rows: [createdReminder] });

    await createReminder(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(createSuccessResponse).toHaveBeenCalledWith(createdReminder);
  });

  // Verify default value handling
  test('verifies default values for optional fields', async () => {
    // Spy on query to check parameters
    const mockQuery = jest.fn().mockResolvedValue({ rows: [{}] });
    pool.query = mockQuery;

    await createReminder(req, res);

    // Verify query parameters include correct defaults
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO reminders'),
      expect.arrayContaining([
        1,                  // baby_id
        'Feeding',          // title
        '10:00',            // time
        '2025-03-15',       // date
        'Morning feed',     // notes
        true,               // is_active
        false,              // next_reminder
        null                // reminder_in
      ])
    );
  });

  // Database error handling
  test('returns 500 on database error', async () => {
    // Simulate database error
    pool.query.mockRejectedValueOnce(new Error('Database connection failed'));

    await createReminder(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
  });
});