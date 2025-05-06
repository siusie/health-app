/**
 * File: tests/unit/baby/reminders/deleteReminder.test.js
 * Unit tests for DELETE /v1/baby/:babyId/reminders
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
  const { deleteReminders } = require('../../../../src/routes/api/baby/reminders/deleteReminders');
  const { createSuccessResponse, createErrorResponse } = require('../../../../src/utils/response');
  const pool = require('../../../../database/db');
  const { getUserId } = require('../../../../src/utils/userIdHelper');
  const { checkBabyBelongsToUser } = require('../../../../src/utils/babyAccessHelper');
  const logger = require('../../../../src/utils/logger');

  describe('deleteReminders direct invocation', () => {
    let req, res;

    beforeEach(() => {
      req = {
        params: { babyId: '1' },
        headers: {
          authorization: 'Bearer sometoken'
        },
        body: {
          reminderIds: ['10', '11']
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
    });

    // Validation tests for babyId
    test('returns 400 for non-numeric babyId', async () => {
      req.params.babyId = 'abc';
      await deleteReminders(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(createErrorResponse).toHaveBeenCalledWith(400, 'Invalid babyId format');
    });

    test('returns 400 for babyId less than 1', async () => {
      req.params.babyId = '0';
      await deleteReminders(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(createErrorResponse).toHaveBeenCalledWith(400, 'Invalid babyId format');
    });

    // Reminder ID validation tests
    test('returns 400 if no reminder IDs provided', async () => {
      delete req.body.reminderIds;
      await deleteReminders(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(createErrorResponse).toHaveBeenCalledWith(400, 'Please provide either reminderId or reminderIds array');
    });

    test('returns 400 if reminderIds is an empty array', async () => {
      req.body.reminderIds = [];
      await deleteReminders(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(createErrorResponse).toHaveBeenCalledWith(400, 'No reminder IDs provided for deletion');
    });

    test('returns 400 if reminderIds contains invalid IDs', async () => {
      req.body.reminderIds = ['10', 'abc', '11'];
      await deleteReminders(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(createErrorResponse).toHaveBeenCalledWith(400, 'One or more invalid reminder ID formats');
    });

    // Alternative input method test
    test('supports single reminderId in request body', async () => {
      delete req.body.reminderIds;
      req.body.reminderId = '10';

      // Simulate successful deletion
      pool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ reminder_id: 10 }]
      });

      await deleteReminders(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(createSuccessResponse).toHaveBeenCalledWith({
        message: 'Reminder deleted successfully',
        deletedIds: [10]
      });
    });

    // Authorization tests
    test('returns 401 if no authorization header is provided', async () => {
      delete req.headers.authorization;
      await deleteReminders(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(createErrorResponse).toHaveBeenCalledWith(401, 'No authorization token provided');
    });

    // User lookup tests
    test('returns 404 if user is not found', async () => {
      getUserId.mockResolvedValueOnce(null);

      await deleteReminders(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(createErrorResponse).toHaveBeenCalledWith(404, 'User not found');
    });

    // Access denial test
    test('returns 403 if user does not have access to the baby', async () => {
      checkBabyBelongsToUser.mockResolvedValueOnce(false);

      await deleteReminders(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(createErrorResponse).toHaveBeenCalledWith(403, 'Access denied: Baby does not belong to current user');
    });

    // Bulk deletion tests
    test('returns 200 with multiple reminders deleted', async () => {
      req.body.reminderIds = ['10', '11', '12'];

      // Simulate successful bulk deletion
      pool.query.mockResolvedValueOnce({
        rowCount: 3,
        rows: [
          { reminder_id: 10 },
          { reminder_id: 11 },
          { reminder_id: 12 }
        ]
      });

      await deleteReminders(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(createSuccessResponse).toHaveBeenCalledWith({
        message: '3 reminders deleted successfully',
        deletedIds: [10, 11, 12]
      });
    });

    test('returns 404 if no matching reminders found', async () => {
      // Simulate no reminders deleted
      pool.query.mockResolvedValueOnce({
        rowCount: 0,
        rows: []
      });

      await deleteReminders(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(createErrorResponse).toHaveBeenCalledWith(404, 'No matching reminders found');
    });

    // Query parameter verification tests
    test('verifies query parameters for deletion', async () => {
      // Create a mock query to check parameters
      pool.query.mockImplementationOnce((query, params) => {
        expect(query).toBe('DELETE FROM reminders WHERE reminder_id = ANY($1) AND baby_id = $2 RETURNING reminder_id');
        expect(params).toEqual([[10, 11], 1]);

        return Promise.resolve({
          rowCount: 2,
          rows: [
            { reminder_id: 10 },
            { reminder_id: 11 }
          ]
        });
      });

      await deleteReminders(req, res);
      expect(pool.query).toHaveBeenCalled();
    });

    test('returns 500 on database error', async () => {
      // Simulate database error
      pool.query.mockRejectedValueOnce(new Error('Database connection failed'));

      await deleteReminders(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
    });
  });
