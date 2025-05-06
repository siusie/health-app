// tests/unit/[coupons]/getAllCoupons.test.js
// Tests the GET /coupons route

// NOTE-: =>[NO AUTHENTICATION] REQUIRED FOR THIS ROUTE

const request = require('supertest');
const express = require('express');
const pool = require('../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../src/utils/response');

// app properly handles the route
const getAllCoupons = require('../../../src/routes/api/coupons/getAllCoupons');
const app = express();
app.use(express.json());
app.get('/v1/coupons', getAllCoupons); // GET /coupons

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

// Test GET /coupons
describe('GET /coupons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 and an array of coupons records if multiple exist', async () => {
    const mockCoupons = [
      {
        coupon_id: 1,
        store_name: 'Enfamil Family Beginnings',
        product_name: 'Baby Formula',
        discount_description: 'Get up to $400 in FREE gifts from Enfamil.',
        discount_code: 'ENFAMIL400',
        expiration_date: '2025-04-10',
        is_online: true,
        city: 'Toronto',
        image_url: 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_140945.jpeg',
        brands: 'Enfamil®',
        store: null,
        is_featured: true,
        discount_amount: 400.0,
        discount_symbol: '$',
        label: '$400.00 off',
      },
      {
        coupon_id: 2,
        store_name: 'Rite Aid',
        product_name: 'Pampers Cruisers 360 Diapers',
        discount_description: 'Save $3.00 on ONE Box Pampers Cruisers 360 Diapers.',
        discount_code: 'PAMPERS3',
        expiration_date: '2025-05-15',
        is_online: false,
        city: 'Toronto',
        image_url: 'https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_706944.jpeg',
        brands: 'Pampers®',
        store: 'Rite Aid',
        is_featured: false,
        discount_amount: 3.0,
        discount_symbol: '$',
        label: '$3.00 off',
      },
    ];

    pool.query.mockResolvedValueOnce({ rows: mockCoupons });

    // Fix: Mock `createSuccessResponse` to match actual implementation
    createSuccessResponse.mockReturnValue({ status: 'ok', data: mockCoupons });

    const res = await request(app).get('/v1/coupons');

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM coupons');

    // Fix: Expect correct response format
    expect(res.body).toEqual({
      status: 'ok',
      data: mockCoupons,
    });
  });

  test('should return 404 if no coupons are found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    createErrorResponse.mockReturnValue({ error: 'No coupons found' });

    const res = await request(app).get('/v1/coupons');

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, 'No coupons found');
    expect(res.body).toEqual({ error: 'No coupons found' });
  });

  test('should return 500 if there is a database error', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));
    createErrorResponse.mockReturnValue({ error: 'Internal server error' });

    const res = await request(app).get('/v1/coupons');

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
    expect(res.body).toEqual({ error: 'Internal server error' });
  });
});
