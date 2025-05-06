/**
 * File: tests/unit/baby/stool/putStool.test.js
 * Unit tests for PUT /v1/baby/:babyId/stool/:stoolId
 */

const { updateStoolEntry } = require('../../../../src/routes/api/baby/stool/putStool');
const { createSuccessResponse, createErrorResponse } = require('../../../../src/utils/response');
const pool = require('../../../../database/db');
const jwt = require('jsonwebtoken');
const { checkBabyBelongsToUser } = require('../../../../src/utils/babyAccessHelper');

// Mocks for dependencies
jest.mock('../../../../database/db');
jest.mock('../../../../src/utils/response');
jest.mock('jsonwebtoken');
jest.mock('../../../../src/utils/babyAccessHelper');

describe('Direct Invocation Tests for updateStoolEntry', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: { babyId: "1", stoolId: "10" },
      headers: {},
      body: { color: "blue", consistency: "firm", notes: "updated note", timestamp: "2025-03-01T12:00:00Z" }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
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

  // Covers missing authorization header.
  test('returns 401 if authorization header is missing', async () => {
    await updateStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, "No authorization token provided");
  });

  // Covers missing token after "Bearer".
  test('returns 401 if token is missing after "Bearer"', async () => {
    req.headers.authorization = "Bearer ";
    await updateStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, "Invalid token format");
  });

  // Covers jwt.decode returning null.
  test('returns 401 if jwt.decode returns null', async () => {
    req.headers.authorization = "Bearer sometoken";
    jwt.decode.mockReturnValue(null);
    await updateStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, "Invalid token format");
  });

  // Covers decoded token missing the email property.
  test('returns 401 if decoded token lacks email property', async () => {
    req.headers.authorization = "Bearer sometoken";
    jwt.decode.mockReturnValue({ sub: "123" });
    await updateStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, "Invalid token format");
  });

  // Invalid stoolId format.
  test('returns 400 if stoolId is invalid format', async () => {
    req.params.stoolId = "xyz"; // Invalid stoolId
    await updateStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(createErrorResponse).toHaveBeenCalledWith(400, "Invalid stoolId format");
  });

  // User not found.
  test('returns 404 if user is not found', async () => {
    req.headers.authorization = "Bearer validtoken";
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    // Simulate user lookup returning no rows.
    pool.query.mockResolvedValueOnce({ rows: [] });
    await updateStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, "User not found");
  });

  // User lacks ownership
  test('returns 403 if user lacks ownership', async () => {
    req.headers.authorization = "Bearer validtoken";
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    // User lookup returns user_id 1
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });
    // Mock checkBabyBelongsToUser to return false
    checkBabyBelongsToUser.mockResolvedValueOnce(false);
    
    await updateStoolEntry(req, res);
    expect(checkBabyBelongsToUser).toHaveBeenCalledWith(1, 1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(createErrorResponse).toHaveBeenCalledWith(403, "Forbidden");
  });

  // Baby not found
  test('returns 404 if baby not found', async () => {
    req.headers.authorization = "Bearer validtoken";
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    // User lookup returns user_id 1
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });
    // Mock checkBabyBelongsToUser to return true
    checkBabyBelongsToUser.mockResolvedValueOnce(true);
    // Baby existence check returns empty
    pool.query.mockResolvedValueOnce({ rows: [] });
    
    await updateStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, "Baby not found");
  });

  // Stool entry not found
  test('returns 404 if stool entry not found', async () => {
    req.headers.authorization = "Bearer validtoken";
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    // User lookup returns user_id 1
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });
    // Mock checkBabyBelongsToUser to return true
    checkBabyBelongsToUser.mockResolvedValueOnce(true);
    // Baby existence check passes
    pool.query.mockResolvedValueOnce({ rows: [{ baby_id: 1 }] });
    // Stool entry check returns empty
    pool.query.mockResolvedValueOnce({ rows: [] });
    
    await updateStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, "Stool entry not found");
  });

  // Successful update
  test('returns 200 on successful update', async () => {
    req.headers.authorization = "Bearer validtoken";
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    // User lookup returns user_id 1
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });
    // Mock checkBabyBelongsToUser to return true
    checkBabyBelongsToUser.mockResolvedValueOnce(true);
    // Baby existence check passes
    pool.query.mockResolvedValueOnce({ rows: [{ baby_id: 1 }] });
    // Stool entry check passes
    pool.query.mockResolvedValueOnce({ rows: [{ stool_id: 10, baby_id: 1 }] });
    // Update operation returns updated entry
    const updatedStool = {
      stool_id: 10,
      baby_id: 1,
      color: "blue",
      consistency: "firm",
      notes: "updated note",
      timestamp: "2025-03-01T12:00:00Z"
    };
    pool.query.mockResolvedValueOnce({ rows: [updatedStool] });
    createSuccessResponse.mockReturnValue(updatedStool);
    
    await updateStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(createSuccessResponse).toHaveBeenCalledWith(updatedStool);
  });

  // Database error
  test('returns 500 on database error', async () => {
    req.headers.authorization = "Bearer validtoken";
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    // User lookup returns user_id 1
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });
    // Mock checkBabyBelongsToUser to return true
    checkBabyBelongsToUser.mockResolvedValueOnce(true);
    // Baby existence check passes
    pool.query.mockResolvedValueOnce({ rows: [{ baby_id: 1 }] });
    // Stool entry check passes
    pool.query.mockResolvedValueOnce({ rows: [{ stool_id: 10, baby_id: 1 }] });
    // Update operation throws error
    pool.query.mockRejectedValueOnce(new Error("Database error"));
    createErrorResponse.mockReturnValue({ error: 'Internal server error' });
    
    await updateStoolEntry(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, "Internal server error");
  });
});