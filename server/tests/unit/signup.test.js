const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const signupRoute = require('../../src/routes/api/signup');
const pool = require('../../database/db');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../src/utils/response');

jest.mock('../../database/db');
jest.mock('../../src/utils/response');

const app = express();
app.use(bodyParser.json());
app.post('/signup', signupRoute);

describe('POST /signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and create a new user', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          role: 'Parent',
        },
      ],
    });

    const res = await request(app).post('/signup').send({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      role: 'Parent',
    });

    expect(res.status).toBe(200);
    expect(createSuccessResponse).toHaveBeenCalledWith({
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      role: 'Parent',
    });
  });

  test('should return 500 if there is a server error', async () => {
    pool.query.mockRejectedValueOnce(new Error('Server error'));
    const res = await request(app).post('/signup').send({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'Password1@',
      confirmPassword: 'Password1@',
      role: 'Parent',
    });

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(
      500,
      'Internal server error'
    );
  });
});
