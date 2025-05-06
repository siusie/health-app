// tests/unit/[tips]/putTipsNotificationSettings.test.js
// Tests the PUT /tips/notification route

const request = require('supertest');
const express = require('express');
const pool = require('../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../src/utils/response');

const putTipsNotificationSettings = require('../../../src/routes/api/tips/tipsNotification/putTipsNotificationSettings');
const { getUserId } = require('../../../src/utils/userIdHelper');

// app properly handles the route
const app = express();
app.use(express.json());
app.put('/v1/tips/notification', putTipsNotificationSettings);

// mock the functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');
jest.mock('../../../src/utils/userIdHelper');

// Test PUT /tips/notification
describe('PUT /tips/notification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 when updating notification settings', async () => {
    getUserId.mockResolvedValue('123');
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: '123', notification_frequency: 'Daily', opt_in: true }] });
    
    const res = await request(app)
        .put('/v1/tips/notification')
        .set('Authorization', 'Bearer mocktoken')
        .send({ notification_frequency: 'Daily', opt_in: true });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user_id', '123');
});

test('should return 401 if no authorization token is provided', async () => {
    const res = await request(app)
        .put('/v1/tips/notification')
        .send({ notification_frequency: 'Daily', opt_in: true });
    
    expect(res.status).toBe(401);
    expect(res.body).toEqual("");
});

test('should return 400 if notification_frequency is missing', async () => {
    getUserId.mockResolvedValue('123');
    
    const res = await request(app)
        .put('/v1/tips/notification')
        .set('Authorization', 'Bearer mocktoken')
        .send({ opt_in: true });
    
    expect(res.status).toBe(400);
    expect(res.body).toEqual("");
});

test('should return 400 if opt_in is missing', async () => {
    getUserId.mockResolvedValue('123');
    
    const res = await request(app)
        .put('/v1/tips/notification')
        .set('Authorization', 'Bearer mocktoken')
        .send({ notification_frequency: 'Daily' });
    
    expect(res.status).toBe(400);
    expect(res.body).toEqual("");
});

test('should return 500 on server error', async () => {
    getUserId.mockRejectedValue(new Error('Database error'));
    
    const res = await request(app)
        .put('/v1/tips/notification')
        .set('Authorization', 'Bearer mocktoken')
        .send({ notification_frequency: 'Daily', opt_in: true });
    
    expect(res.status).toBe(500);
    expect(res.body).toEqual("");
});
});
