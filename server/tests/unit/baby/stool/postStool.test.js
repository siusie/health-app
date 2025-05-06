/**
 * File: tests/unit/baby/stool/postStool.test.js
 * Unit tests for POST /v1/baby/:babyId/stool
 */

const { createStoolEntry } = require('../../../../src/routes/api/baby/stool/postStool');
const { createSuccessResponse, createErrorResponse } = require('../../../../src/utils/response');
const pool = require('../../../../database/db');
const jwt = require('jsonwebtoken');
const { checkBabyBelongsToUser } = require('../../../../src/utils/babyAccessHelper');

// Mocks for dependencies to isolate unit tests from external resources.
jest.mock('../../../../database/db');
jest.mock('../../../../src/utils/response');
jest.mock('jsonwebtoken');
jest.mock('../../../../src/utils/babyAccessHelper');

describe("createStoolEntry - Direct Invocation Tests", () => {
  let req, res;

  beforeEach(() => {
    // Initialize a default request and response object before each test.
    req = {
      params: { babyId: "1" },
      headers: {},
      body: { color: 'yellow', consistency: 'soft', notes: 'sample note', timestamp: '2025-02-10T10:30:00Z' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    // Clear all mocks to ensure tests are isolated.
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Add this to address the graceful exit issue
  afterAll(async () => {
    // Allow any background promises to resolve
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  // 1) Validate babyId format: non-numeric input should yield a 400 response.
  test("returns 400 for non-numeric babyId", async () => {
    req.params.babyId = "abc";
    await createStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(createErrorResponse).toHaveBeenCalledWith(400, 'Invalid babyId format');
  });

  // 2) Validate babyId format: numeric value less than 1 should yield a 400 response.
  test("returns 400 for babyId less than 1", async () => {
    req.params.babyId = "0";
    await createStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(createErrorResponse).toHaveBeenCalledWith(400, 'Invalid babyId format');
  });

  // 3) Missing authorization header should result in a 401 response.
  test("returns 401 if no authorization header is provided", async () => {
    await createStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, 'No authorization token provided');
  });

  // 4) When the Bearer scheme is used without a token, a 401 should be returned.
  test("returns 401 if token is missing after 'Bearer'", async () => {
    req.headers.authorization = "Bearer "; // Empty token scenario
    await createStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, 'Invalid token format');
  });

  // 5) If jwt.decode returns null (invalid token payload), the endpoint should return a 401.
  test("returns 401 if jwt.decode returns null", async () => {
    req.headers.authorization = "Bearer sometoken";
    jwt.decode.mockReturnValue(null);
    await createStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, 'Invalid token format');
  });

  // 6) A decoded token lacking the email property should trigger a 401 response.
  test("returns 401 if decoded token lacks an email property", async () => {
    req.headers.authorization = "Bearer sometoken";
    jwt.decode.mockReturnValue({ sub: "123" });
    await createStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, 'Invalid token format');
  });

  // 7) If the user lookup query returns no user, the endpoint should return a 404.
  test("returns 404 if user is not found", async () => {
    req.headers.authorization = "Bearer validtoken";
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    // Simulate user lookup failure.
    pool.query.mockResolvedValueOnce({ rows: [] });
    await createStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, 'User not found');
  });

  // 8) If the baby does not exist in the database, a 404 should be returned.
  test("returns 404 if baby is not found", async () => {
    req.headers.authorization = "Bearer validtoken";
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    // First query simulates valid user lookup.
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });
    // Second query (baby existence check) returns no rows.
    pool.query.mockResolvedValueOnce({ rows: [] });
    await createStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, 'Baby not found');
  });

  // 9) If the required stool fields are missing, return 400
  test("returns 400 if required stool fields are missing", async () => {
    req.headers.authorization = "Bearer validtoken";
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    // Simulate missing 'consistency' field.
    req.body = { color: 'yellow' };
    
    // Valid user lookup.
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });
    // Baby check passes.
    pool.query.mockResolvedValueOnce({ rows: [{ baby_id: 1 }] });
    
    await createStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(createErrorResponse).toHaveBeenCalledWith(400, 'Missing required stool data (color, consistency)');
  });

  // 10) If the user is not authorized for the baby, return 403.
  test("returns 403 if user is not authorized for the baby", async () => {
    req.headers.authorization = "Bearer validtoken";
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    // Valid user lookup.
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });
    // Baby check passes.
    pool.query.mockResolvedValueOnce({ rows: [{ baby_id: 1 }] });
    // Mock checkBabyBelongsToUser to return false
    checkBabyBelongsToUser.mockResolvedValueOnce(false);
    
    await createStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(createErrorResponse).toHaveBeenCalledWith(403, 'Forbidden');
  });

  // 11) On successful insertion, return 201.
  test("returns 201 on successful creation", async () => {
    req.headers.authorization = "Bearer validtoken";
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    // Valid user lookup.
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });
    // Baby existence check.
    pool.query.mockResolvedValueOnce({ rows: [{ baby_id: 1 }] });
    // Mock checkBabyBelongsToUser to return true
    checkBabyBelongsToUser.mockResolvedValueOnce(true);
    
    // Insertion query returns the new stool entry.
    const newStoolEntry = {
      stool_id: 100,
      baby_id: 1,
      color: 'yellow',
      consistency: 'soft',
      notes: 'sample note',
      timestamp: '2025-02-10T10:30:00Z'
    };
    pool.query.mockResolvedValueOnce({ rows: [newStoolEntry] });
    createSuccessResponse.mockReturnValue(newStoolEntry);
    
    await createStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(createSuccessResponse).toHaveBeenCalledWith(newStoolEntry);
  });

  // 12) If a database error occurs during insertion, return 500.
  test("returns 500 on DB error during insertion", async () => {
    req.headers.authorization = "Bearer validtoken";
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    // Valid user lookup.
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });
    // Baby check.
    pool.query.mockResolvedValueOnce({ rows: [{ baby_id: 1 }] });
    // Mock checkBabyBelongsToUser to return true
    checkBabyBelongsToUser.mockResolvedValueOnce(true);
    
    // Simulate a database error during insertion.
    pool.query.mockRejectedValueOnce(new Error("Database error"));
    createErrorResponse.mockReturnValue({ error: 'Internal server error' });
    
    await createStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, 'Internal server error');
  });
});