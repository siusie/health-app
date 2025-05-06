/**
 * File: tests/unit/baby/reminders/putReminder.test.js
 * Unit tests for PUT /v1/baby/:babyId/reminders/:reminderId
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
  const { updateReminder } = require('../../../../src/routes/api/baby/reminders/putReminder');
  const { createSuccessResponse, createErrorResponse } = require('../../../../src/utils/response');
  const pool = require('../../../../database/db');
  const { getUserId } = require('../../../../src/utils/userIdHelper');
  const { checkBabyBelongsToUser } = require('../../../../src/utils/babyAccessHelper');
  const logger = require('../../../../src/utils/logger');

  describe('updateReminder direct invocation', () => {
    let req, res;

    beforeEach(() => {
      req = {
        params: {
          babyId: '1',
          reminderId: '10'
        },
        headers: {
          authorization: 'Bearer sometoken'
        },
        body: {
          title: 'Updated Feeding',
          time: '11:00',
          date: '2025-03-16',
          notes: 'Updated morning feed',
          isActive: false
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
      await updateReminder(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(createErrorResponse).toHaveBeenCalledWith(400, 'Invalid babyId format');
    });

    test('returns 400 for babyId less than 1', async () => {
      req.params.babyId = '0';
      await updateReminder(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(createErrorResponse).toHaveBeenCalledWith(400, 'Invalid babyId format');
    });

    // Validation tests for reminderId
    test('returns 400 for non-numeric reminderId', async () => {
      req.params.reminderId = 'xyz';
      await updateReminder(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(createErrorResponse).toHaveBeenCalledWith(400, 'Invalid reminderId format');
    });

    test('returns 400 for reminderId less than 1', async () => {
      req.params.reminderId = '0';
      await updateReminder(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(createErrorResponse).toHaveBeenCalledWith(400, 'Invalid reminderId format');
    });

    // Authorization tests
    test('returns 401 if no authorization header is provided', async () => {
      delete req.headers.authorization;
      await updateReminder(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(createErrorResponse).toHaveBeenCalledWith(401, 'No authorization token provided');
    });

    // User lookup tests
    test('returns 404 if user is not found', async () => {
      getUserId.mockResolvedValueOnce(null);

      await updateReminder(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(createErrorResponse).toHaveBeenCalledWith(404, 'User not found');
    });

    // Access check test
    test('returns 403 if user does not have access to the baby', async () => {
      checkBabyBelongsToUser.mockResolvedValueOnce(false);

      await updateReminder(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(createErrorResponse).toHaveBeenCalledWith(403, 'Access denied: Baby does not belong to current user');
    });

    // Reminder existence tests
    test('returns 404 if reminder does not exist for the baby', async () => {
      // Simulate reminder check returning no rows
      pool.query.mockResolvedValueOnce({ rows: [] });

      await updateReminder(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(createErrorResponse).toHaveBeenCalledWith(404, 'Reminder not found');
    });

    // Successful update tests
    test('returns 200 with updated reminder (all fields)', async () => {
      // Simulate reminder existence check
      pool.query.mockResolvedValueOnce({ rows: [{ reminder_id: 10, baby_id: 1 }] })
                .mockResolvedValueOnce({ rows: [
          {
            reminder_id: 10,
            baby_id: 1,
            title: 'Updated Feeding',
            time: '11:00',
            date: '2025-03-16',
            notes: 'Updated morning feed',
            is_active: false,
            next_reminder: null,
            reminder_in: null
          }
        ]});

      await updateReminder(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(createSuccessResponse).toHaveBeenCalledWith(expect.objectContaining({
        reminder_id: 10,
        title: 'Updated Feeding',
        time: '11:00',
        date: '2025-03-16',
        notes: 'Updated morning feed',
        is_active: false
      }));
    });

    test('returns 200 with updated reminder (partial update)', async () => {
      // Use only partial update fields
      req.body = {
        title: 'Updated Feeding'
      };

      // Simulate reminder existence check and update
      pool.query.mockResolvedValueOnce({ rows: [{ reminder_id: 10, baby_id: 1 }] })
                .mockResolvedValueOnce({ rows: [
          {
            reminder_id: 10,
            baby_id: 1,
            title: 'Updated Feeding',
            time: '10:00', // original time preserved
            date: '2025-03-15', // original date preserved
            notes: null,
            is_active: true
          }
        ]});

      await updateReminder(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(createSuccessResponse).toHaveBeenCalledWith(expect.objectContaining({
        reminder_id: 10,
        title: 'Updated Feeding',
        time: '10:00',
        date: '2025-03-15'
      }));
    });

    // Verify COALESCE usage in update query
    test('verifies COALESCE usage for partial updates', async () => {
      // Use minimal update
      req.body = {
        title: 'Updated Feeding'
      };

      // Mock reminder existence check first
      pool.query.mockResolvedValueOnce({ rows: [{ reminder_id: 10, baby_id: 1 }] });

      // Create a mock query to check parameters for the second call
      const mockUpdateQuery = jest.fn().mockResolvedValue({ rows: [{}] });

      // Override the pool.query for the second call
      pool.query.mockImplementationOnce((query, params) => {
        return mockUpdateQuery(query, params);
      });

      await updateReminder(req, res);

      // The implementation uses undefined instead of null for missing values
      // So we need to update our test to match that
      expect(mockUpdateQuery).toHaveBeenCalledWith(
        expect.stringContaining('COALESCE($1, title)'),
        expect.arrayContaining([
          'Updated Feeding', // title
          undefined,         // time (COALESCE with existing)
          undefined,         // date (COALESCE with existing)
          undefined,         // notes (COALESCE with existing)
          undefined,         // is_active (COALESCE with existing)
          undefined,         // next_reminder (COALESCE with existing)
          undefined,         // reminder_in (COALESCE with existing)
          10,                // reminder_id
          1                  // baby_id
        ])
      );
    });

    test('returns 500 on database error', async () => {
      // Simulate reminder check but database error on update
      pool.query.mockResolvedValueOnce({ rows: [{ reminder_id: 10, baby_id: 1 }] })
                .mockRejectedValueOnce(new Error('Database connection failed'));

      await updateReminder(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
    });
  });
