// tests/unit/[tips]/getCustomTipsAllBabies.test.js
// for route GET /tips/notification

const request = require('supertest');
const express = require('express');
const pool = require('../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../src/utils/response');

const getCustomTipsAllBabies = require('../../../src/routes/api/tips/tipsNotification/getCustomTipsAllBabies');
const { getUserId } = require('../../../src/utils/userIdHelper');

// app properly handles the route
const app = express();
app.use(express.json());
app.get('/v1/tips/notification', getCustomTipsAllBabies); // GET /tips/notification

// mock the functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');
jest.mock('../../../src/utils/userIdHelper');

// Test GET /tips/notification
describe('GET /tips/notification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 with notification settings and custom tips', async () => {
    getUserId.mockResolvedValue('123');
    
    pool.query.mockImplementation((query, params) => {
        if (query.includes('FROM baby')) {
            return Promise.resolve({ rows: [{ baby_id: 1, birthdate: '2023-01-01', gender: 'Boy' }] });
        } else if (query.includes('FROM TipsNotificationSettings')) {
            return Promise.resolve({ rows: [{ user_id: '123', notification_frequency: 'Daily', opt_in: true }] });
        } else if (query.includes('FROM CuratedTips')) {
            return Promise.resolve({ rows: [{ tip_id: 1, tip_text: 'Baby tip', min_age: 0, max_age: 12, target_gender: 'All' }] });
        }
        return Promise.resolve({ rows: [] });
    });
    
    createSuccessResponse.mockReturnValue({ status: 'ok', data: {} });

    const res = await request(app)
        .get('/v1/tips/notification')
        .set('Authorization', 'Bearer mocktoken');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('notificationSettings');
    expect(res.body).toHaveProperty('babiesTips');
});

test('should return 401 if no authorization token is provided', async () => {
    const res = await request(app).get('/v1/tips/notification');

    expect(res.status).toBe(401);
    expect(res.body).toEqual("");
});

test('should return 404 if no baby profiles are found', async () => {
    getUserId.mockResolvedValue('123');
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
        .get('/v1/tips/notification')
        .set('Authorization', 'Bearer mocktoken');

    expect(res.status).toBe(404);
    expect(res.body).toEqual("");
});

test('should return 500 on server error', async () => {
    getUserId.mockRejectedValue(new Error('Database error'));

    const res = await request(app)
        .get('/v1/tips/notification')
        .set('Authorization', 'Bearer mocktoken');

    expect(res.status).toBe(500);
    expect(res.body).toEqual("");
});
});