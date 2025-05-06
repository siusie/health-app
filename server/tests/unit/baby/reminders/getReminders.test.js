/**
 * File: tests/unit/baby/reminders/getReminders.test.js
 * Unit tests for GET /v1/baby/:babyId/reminders
 */

// Mock all dependencies BEFORE importing the module under test
jest.mock('../../../../database/db', () => ({
  query: jest.fn(),
})); 

jest.mock('../../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
})); 

jest.mock('../../../../src/utils/response', () => ({
  createSuccessResponse: jest.fn((data) => data),
  createErrorResponse: jest.fn((code, message) => ({ error: { code, message } })),
})); 

jest.mock('../../../../src/utils/userIdHelper', () => ({
  getUserId: jest.fn(),
})); 

jest.mock('../../../../src/utils/babyAccessHelper', () => ({
  checkBabyBelongsToUser: jest.fn(),
})); 

jest.mock('jsonwebtoken');

// Now import the module under test and mocked dependencies
const { getReminders } = require('../../../../src/routes/api/baby/reminders/getReminders');
const { createSuccessResponse, createErrorResponse } = require('../../../../src/utils/response');
const pool = require('../../../../database/db');
const { getUserId } = require('../../../../src/utils/userIdHelper');
const { checkBabyBelongsToUser } = require('../../../../src/utils/babyAccessHelper');

describe('getReminders direct invocation', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { babyId: '1' },
      headers: {
        authorization: 'Bearer sometoken',
      },
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Clear all mocks
    jest.clearAllMocks();

    // Default mock implementations
    getUserId.mockResolvedValue(1);
    checkBabyBelongsToUser.mockResolvedValue(true);
    pool.query.mockResolvedValue({ rows: [] }); // Default mock for database queries
  });  

  // Invalid babyId format tests
  test('returns 400 for non-numeric babyId', async () => {
    req.params.babyId = 'abc';
    await getReminders(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(createErrorResponse).toHaveBeenCalledWith(400, 'Invalid babyId format');
  });

  test('returns 400 for babyId less than 1', async () => {
    req.params.babyId = '0';
    await getReminders(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(createErrorResponse).toHaveBeenCalledWith(400, 'Invalid babyId format');
  }); 

  // Authorization tests
  test('returns 401 if no authorization header is provided', async () => {
    delete req.headers.authorization;
    await getReminders(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, 'No authorization token provided');
  }); 

  // User lookup and ID extraction tests
  test('returns 404 if user is not found', async () => {
    getUserId.mockResolvedValueOnce(null); 

    await getReminders(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, 'User not found');
  }); 

  // Access check test
  test('returns 403 if user does not have access to the baby', async () => {
    checkBabyBelongsToUser.mockResolvedValueOnce(false); 

    await getReminders(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(createErrorResponse).toHaveBeenCalledWith(
      403,
      'Access denied: Baby does not belong to current user'
    );
  }); 

  test('returns 200 with empty array when no reminders found', async () => {
    // Simulate no reminders found
    pool.query.mockResolvedValueOnce({ rows: [] }); 

    await getReminders(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(createSuccessResponse).toHaveBeenCalledWith([]);
  }); 

  test('returns 200 with reminders when found', async () => {
    // Simulate reminders found
    const mockReminders = [
      {
        reminder_id: 1,
        baby_id: 1,
        title: 'Feeding',
        time: '10:00',
        date: '2025-03-15',
        notes: 'Morning feed',
      },
      {
        reminder_id: 2,
        baby_id: 1,
        title: 'Nap',
        time: '13:00',
        date: '2025-03-15',
        notes: 'Afternoon nap',
      },
    ];
    pool.query.mockResolvedValueOnce({ rows: mockReminders }); 

    await getReminders(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(createSuccessResponse).toHaveBeenCalledWith(mockReminders);
  }); 

  test('returns 500 on database error', async () => {
    // Simulate database error
    pool.query.mockRejectedValueOnce(new Error('Database connection failed')); 

    await getReminders(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
  }); 

  // Verify query ordering
  test('verifies reminders are ordered by date and time', async () => {
    // Create a mock query to check parameters 
    pool.query.mockImplementationOnce((query, params) => {
      expect(query).toContain('ORDER BY date DESC, time ASC');
      expect(params).toEqual([1]);
      return Promise.resolve({ rows: [] });
    });

    await getReminders(req, res);
    expect(pool.query).toHaveBeenCalled(); 
  });
});
