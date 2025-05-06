// tests/unit/growth/deleteGrowth.test.js
// Tests the DELETE /baby/:babyId/growth/:growthId route

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
const {
  deleteGrowthById,
} = require('../../../src/routes/api/growth/deleteGrowth');
const app = express();
app.use(express.json());
app.use(passport.initialize());
passport.use(strategy());
app.delete(
  '/v1/baby/:babyId/growth/:growthId',
  authenticate(),
  deleteGrowthById
); // DELETE /baby/:babyId/growth/:growthId

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

// Test DELETE /baby/:babyId/growth/:growthId
describe('DELETE /baby/:babyId/growth/:growthId', () => {
  test('should return 200 and delete the growth record', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });
    createSuccessResponse.mockReturnValue({ success: true });

    const user = {
      userId: 1,
      firstName: 'Anh',
      lastName: 'Vu',
      email: 'user1@email.com',
      role: 'Parent',
    };
    const token = generateToken(user);

    const res = await request(app)
      .delete('/v1/baby/1/growth/1')
      .set('Authorization', `Bearer ${token}`); // Include the token in the Authorization header

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(
      'DELETE FROM growth WHERE growth_id = $1',
      ['1']
    );
    expect(createSuccessResponse).toHaveBeenCalled();
  });

  test('should return 404 if the growth record is not found', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });
    createErrorResponse.mockReturnValue({ error: 'Growth record not found' });

    const user = {
      userId: 1,
      firstName: 'Anh',
      lastName: 'Vu',
      email: 'user1@email.com',
      role: 'Parent',
    };
    const token = generateToken(user);

    const res = await request(app)
      .delete('/v1/baby/1/growth/999')
      .set('Authorization', `Bearer ${token}`); // Include the token in the Authorization header

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith(
      404,
      'Growth record not found'
    );
  });

  test('should return 500 if there is a database error', async () => {
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
      .delete('/v1/baby/1/growth/1')
      .set('Authorization', `Bearer ${token}`); // Include the token in the Authorization header

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(
      500,
      'Internal server error'
    );
  });
});
