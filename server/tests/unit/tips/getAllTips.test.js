// tests/unit/[tips]/getAllTips.test.js
// Tests the GET /tips route

const request = require('supertest');
const express = require('express');
const pool = require('../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../src/utils/response');

// app properly handles the route
const app = express();
app.use(express.json());
const getAllTips = require('../../../src/routes/api/tips/getAllTips');
app.get('/v1/tips', getAllTips); // GET /tips

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

// Test GET /tips
describe('GET /tips', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and an array of curated tips if multiple exist', async () => {
    const mockTips = [
      {
        tip_id: 1,
        category: 'SLEEP',
        target_gender: 'All',
        min_age: 0,
        max_age: 3,
        tip_text: 'Establish a consistent sleep routine even in the early weeks.',
        notification_frequency: 'Weekly',
        created_at: '2025-02-16T00:00:00Z',
      },
    ];

    pool.query.mockResolvedValueOnce({ rows: mockTips });

    // Fix: Mock `createSuccessResponse` to match actual implementation
    createSuccessResponse.mockReturnValue({ status: 'ok', data: mockTips });

    const res = await request(app).get('/v1/tips');

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM CuratedTips');

    // Fix: Expect correct response format
    expect(res.body).toEqual({
      status: 'ok',
      data: mockTips,
    });
  });

  test('should return 404 if no curated tips are found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    createErrorResponse.mockReturnValue({ error: 'Not found curated tips' });

    const res = await request(app).get('/v1/tips');

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, 'Not found curated tips');
    expect(res.body).toEqual({ error: 'Not found curated tips' });
  });

  test('should return 500 if there is a database error', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));
    createErrorResponse.mockReturnValue({ error: 'Internal server error' });

    const res = await request(app).get('/v1/tips');

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
    expect(res.body).toEqual({ error: 'Internal server error' });
  });
});
