// tests/unit/growth/putGrowth.test.js
// Tests the PUT /baby/:babyId/growth/:growthId route

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
  updateGrowthById,
} = require('../../../src/routes/api/growth/putGrowth');
const app = express();
app.use(express.json());
app.use(passport.initialize());
passport.use(strategy());
app.put('/v1/baby/:babyId/growth/:growthId', authenticate(), updateGrowthById); // PUT /baby/:babyId/growth/:growthId

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

// Test PUT /baby/:babyId/growth/:growthId
describe('PUT /baby/:babyId/growth/:growthId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and update the growth record', async () => {
    const updatedGrowthRecord = {
      date: '2025-01-02',
      height: 52,
      weight: 3.8,
      notes: 'Updated growth record',
    };

    pool.query.mockResolvedValueOnce({ rows: [updatedGrowthRecord] });
    createSuccessResponse.mockReturnValue(updatedGrowthRecord);

    const user = {
      userId: 1,
      firstName: 'Anh',
      lastName: 'Vu',
      email: 'user1@email.com',
      role: 'Parent',
    };
    const token = generateToken(user);

    const res = await request(app)
      .put('/v1/baby/1/growth/1')
      .set('Authorization', `Bearer ${token}`) // Include the token in the Authorization header
      .send(updatedGrowthRecord);

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE growth SET date = $1, height = $2, weight = $3, notes = $4 WHERE growth_id = $5 RETURNING *',
      ['2025-01-02', 52, 3.8, 'Updated growth record', '1']
    );
    expect(res.body).toEqual(updatedGrowthRecord);
  });

  test('should return 404 if the growth record is not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
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
      .put('/v1/baby/1/growth/999')
      .set('Authorization', `Bearer ${token}`) // Include the token in the Authorization header
      .send({
        date: '2025-01-02',
        height: 52,
        weight: 3.8,
        notes: 'Updated growth record',
      });

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith(
      404,
      'Growth record not found'
    );
  });

  test("should return 500 if database query fails", async () => {
    const testError = new Error("Database error");
    pool.query.mockRejectedValueOnce(testError);
    createErrorResponse.mockReturnValue({ error: "Internal server error" });

    const user = {
      userId: 1,
      firstName: "Anh",
      lastName: "Vu",
      email: "user1@email.com",
      role: "Parent",
    };
    const token = generateToken(user);

    const updatedGrowthRecord = {
      date: "2025-01-02",
      height: 52,
      weight: 3.8,
      notes: "Updated growth record",
    };

    const res = await request(app)
      .put("/v1/baby/1/growth/1")
      .set("Authorization", `Bearer ${token}`)
      .send(updatedGrowthRecord);

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(
      500,
      "Internal server error"
    );
    expect(pool.query).toHaveBeenCalledWith(
      "UPDATE growth SET date = $1, height = $2, weight = $3, notes = $4 WHERE growth_id = $5 RETURNING *",
      ["2025-01-02", 52, 3.8, "Updated growth record", "1"]
    );
  });
});
