// tests/unit/growth/postGrowth.test.js
// Tests the POST /baby/[:babyId]/growth route

const request = require('supertest');
const express = require('express');
const passport = require('passport');

const pool = require('../../../database/db');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../src/utils/response');
const { strategy, authenticate } = require('../../../src/auth/jwt-middleware');
const { generateToken } = require('../../../src/utils/jwt');

// app properly handles the route
const { createGrowth } = require('../../../src/routes/api/growth/postGrowth');
const app = express();
app.use(express.json());
app.use(passport.initialize());
passport.use(strategy());
app.post('/v1/baby/:babyId/growth', authenticate(), createGrowth); // POST /baby/[:babyId]/growth

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

// Test POST /baby/:babyId/growth
describe('POST /baby/:babyId/growth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 201 and create a new growth record', async () => {
    const newGrowthRecord = {
      baby_id: 1,
      date: '2025-01-01',
      height: 50,
      weight: 3.5,
      notes: 'First growth record',
    };

    pool.query.mockResolvedValueOnce({ rows: [newGrowthRecord] });
    createSuccessResponse.mockReturnValue(newGrowthRecord);

    const user = {
      userId: 1,
      firstName: 'Anh',
      lastName: 'Vu',
      email: 'user1@email.com',
      role: 'Parent',
    };
    const token = generateToken(user);

    const res = await request(app)
      .post('/v1/baby/1/growth')
      .set('Authorization', `Bearer ${token}`) // Include the token in the Authorization header
      .send(newGrowthRecord);

    expect(res.status).toBe(201);
    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO growth (baby_id, date, height, weight, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      ['1', '2025-01-01', 50, 3.5, 'First growth record']
    );
    expect(res.body).toEqual(newGrowthRecord);
  });

  test('should return 500 if there is a database error', async () => {
    const newGrowthRecord = {
      baby_id: 1,
      date: '2025-01-01',
      height: 50,
      weight: 3.5,
      notes: 'First growth record',
    };

    pool.query.mockRejectedValueOnce(new Error('Database error'));
    createErrorResponse.mockReturnValue({ error: 'Internal server error' });

    const user = {
      userId: 1,
      firstName: 'Anh',
      lastName: 'Vu',
      email: 'user1@email.com',
      role: 'Parent',
    };
    const token = generateToken(user);

    const res = await request(app)
      .post('/v1/baby/1/growth')
      .set('Authorization', `Bearer ${token}`) // Include the token in the Authorization header
      .send(newGrowthRecord);

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(
      500,
      'Internal server error'
    );
  });
});
