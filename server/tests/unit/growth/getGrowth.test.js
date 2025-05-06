const { getAllGrowth } = require("../../../src/routes/api/growth/getGrowth");
const pool = require("../../../database/db");
const { getUserId } = require("../../../src/utils/userIdHelper");
const {
  checkBabyBelongsToUser,
} = require("../../../src/utils/babyAccessHelper");
const logger = require("../../../src/utils/logger");

// Mock the dependencies
jest.mock("../../../database/db");
jest.mock("../../../src/utils/userIdHelper");
jest.mock("../../../src/utils/babyAccessHelper");
jest.mock("../../../src/utils/logger");

describe("getAllGrowth", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock request object
    mockReq = {
      params: {
        babyId: "1",
      },
      headers: {
        authorization: "Bearer token123",
      },
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
  });

  test("should return growth records successfully", async () => {
    // Mock successful database response
    const mockGrowthRecords = [
      { id: 1, baby_id: 1, weight: 3.5, height: 50, head_circumference: 35 },
    ];
    pool.query.mockResolvedValueOnce({ rows: mockGrowthRecords });
    getUserId.mockResolvedValueOnce("user123");
    checkBabyBelongsToUser.mockResolvedValueOnce(true);

    await getAllGrowth(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.send).toHaveBeenCalledWith(
      expect.objectContaining({
        data: mockGrowthRecords,
      })
    );
  });

  test("should return 400 for missing baby ID", async () => {
    mockReq.params.babyId = undefined;

    await getAllGrowth(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        error: expect.objectContaining({
          code: 400,
          message: expect.any(String),
        }),
      })
    );
  });

  test("should return 400 for invalid baby ID format", async () => {
    mockReq.params.babyId = "invalid";

    await getAllGrowth(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        error: expect.objectContaining({
          code: 400,
          message: expect.any(String),
        }),
      })
    );
  });

  test("should return 401 for missing authorization header", async () => {
    // Clear the authorization header
    mockReq.headers.authorization = undefined;

    await getAllGrowth(mockReq, mockRes);

    // Check that createErrorResponse was called correctly
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      // Changed from send to json
      expect.objectContaining({
        status: "error",
        error: expect.objectContaining({
          code: 401,
          message: "No authorization token provided",
        }),
      })
    );
  });

  test("should return 403 when user does not have access to baby", async () => {
    getUserId.mockResolvedValueOnce("user123");
    checkBabyBelongsToUser.mockResolvedValueOnce(false);

    await getAllGrowth(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        error: expect.objectContaining({
          code: 403,
          message: expect.any(String),
        }),
      })
    );
  });

  test("should return 404 when no growth records found", async () => {
    getUserId.mockResolvedValueOnce("user123");
    checkBabyBelongsToUser.mockResolvedValueOnce(true);
    pool.query.mockResolvedValueOnce({ rows: [] });

    await getAllGrowth(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        error: expect.objectContaining({
          code: 404,
          message: expect.any(String),
        }),
      })
    );
  });

  test("should return 500 on database error", async () => {
    getUserId.mockResolvedValueOnce("user123");
    checkBabyBelongsToUser.mockResolvedValueOnce(true);
    pool.query.mockRejectedValueOnce(new Error("Database error"));

    await getAllGrowth(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        error: expect.objectContaining({
          code: 500,
          message: expect.any(String),
        }),
      })
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
