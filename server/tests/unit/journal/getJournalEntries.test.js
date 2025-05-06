// tests/unit/journal/getJournalEntries.test.js
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../src/utils/response");
const { getUserId } = require("../../../src/utils/userIdHelper");
const pool = require("../../../database/db");
const getJournalEntries = require("../../../src/routes/api/journal/getJournalEntries");

// Mock dependencies
jest.mock("../../../src/utils/userIdHelper");
jest.mock("../../../database/db");
jest.mock("../../../src/utils/logger");

describe("GET /v1/journal", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      headers: {
        authorization: "Bearer token",
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return 401 if no authorization header", async () => {
    mockReq.headers = {};
    await getJournalEntries(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "No authorization token provided",
    });
  });

  test("should return 404 if no journal entries found", async () => {
    getUserId.mockResolvedValue(1);
    pool.query.mockResolvedValue({ rows: [] });

    await getJournalEntries(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      createErrorResponse("No journal entries found. Try to create one")
    );
  });

  test("should return journal entries successfully", async () => {
    const mockEntries = [
      { id: 1, content: "Test entry 1" },
      { id: 2, content: "Test entry 2" },
    ];
    getUserId.mockResolvedValue(1);
    pool.query.mockResolvedValue({ rows: mockEntries });

    await getJournalEntries(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      createSuccessResponse(mockEntries)
    );
  });

  test("should return 500 on database error", async () => {
    getUserId.mockResolvedValue(1);
    pool.query.mockRejectedValue(new Error("Database error"));

    await getJournalEntries(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      createErrorResponse("Internal server error")
    );
  });
});
