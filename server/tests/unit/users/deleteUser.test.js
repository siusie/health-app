// tests/unit/users/deleteUsers.test.js
// Tests the DELETE /users/:id route

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
const { deleteUserById } = require('../../../src/routes/api/user/deleteUser');
const app = express();
app.use(express.json());
app.use(passport.initialize());
passport.use(strategy());
app.delete('/v1/user/:id', authenticate(), deleteUserById); // DELETE /users/:id

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

describe('DELETE /user/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and delete the old user', async () => {
    const user = {
      userId: 1,
      firstName: 'Anh',
      lastName: 'Vu',
      email: 'user1@email.com',
      role: 'Parent',
    };
    const token = generateToken(user);

    pool.query
      .mockResolvedValueOnce({ rows: [{ baby_id: '1' }] }) // Mock user_baby query
      .mockResolvedValueOnce({}) // Mock baby query
      .mockResolvedValueOnce({ rowCount: 1 }); // Mock user deletion query

    createSuccessResponse.mockReturnValue({
      message: 'User and related entries deleted successfully',
    });

    const res = await request(app)
      .delete('/v1/user/1')
      .set('Authorization', `Bearer ${token}`); // Include the token in the Authorization header

    expect(pool.query).toHaveBeenCalledTimes(3);
    expect(pool.query).toHaveBeenCalledWith(
      'DELETE FROM user_baby WHERE user_id = $1 RETURNING baby_id',
      ['1']
    );
    expect(pool.query).toHaveBeenCalledWith(
      'DELETE FROM baby WHERE baby_id = ANY($1)',
      [['1']]
    );
    expect(pool.query).toHaveBeenCalledWith(
      'DELETE FROM users WHERE user_id = $1',
      ['1']
    );

    expect(res.status).toBe(200);
    expect(createSuccessResponse).toHaveBeenCalledWith({
      message: 'User and related entries deleted successfully',
    });
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
      .delete('/v1/user/1')
      .set('Authorization', `Bearer ${token}`); // Include the token in the Authorization header

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(
      500,
      'Internal server error'
    );
  });
});
