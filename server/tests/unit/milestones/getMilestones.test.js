// tests/unit/milestones/getMilestones.test.js
// Tests GET /v1/baby/:baby_id/milestones

const {
  getMilestoneByBabyId,
} = require("../../../src/routes/api/milestones/getMilestones");
const { getUserId } = require("../../../src/utils/userIdHelper");
const {
  checkBabyBelongsToUser,
} = require("../../../src/utils/babyAccessHelper");
const pool = require("../../../database/db");
const logger = require("../../../src/utils/logger");

// Mock the dependencies
jest.mock("../../../src/utils/userIdHelper");
jest.mock("../../../src/utils/babyAccessHelper");
jest.mock("../../../database/db");
jest.mock("../../../src/utils/logger");

describe("GET /v1/baby/:baby_id/milestones", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Reset mocks before each test
    mockReq = {
      params: {},
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return 400 when baby_id is missing", async () => {
    await getMilestoneByBabyId(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: "error",
      error: {
        code: 400,
        message: "Baby ID is required",
      },
    });
  });

  test("should return 400 when baby_id is invalid", async () => {
    mockReq.params.baby_id = "invalid";

    await getMilestoneByBabyId(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: "error",
      error: {
        code: 400,
        message: "Invalid baby ID format",
      },
    });
  });

  test("should return 401 for missing authorization header", async () => {
    // Set valid baby_id but no authorization header
    mockReq.params.baby_id = "1";
    mockReq.headers.authorization = undefined;

    await getMilestoneByBabyId(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: "error",
      error: {
        code: 401,
        message: "No authorization token provided",
      },
    });
  });

  test("should return 404 when user is not found", async () => {
    // Setup request with valid baby_id and auth header
    mockReq.params.baby_id = "1";
    mockReq.headers.authorization = "Bearer token";

    // Mock getUserId to return null, simulating user not found
    getUserId.mockResolvedValue(null);

    // Ensure other dependencies don't interfere
    checkBabyBelongsToUser.mockResolvedValue(false);

    await getMilestoneByBabyId(mockReq, mockRes);

    // Verify response
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: "error",
      error: {
        code: 404,
        message: "User not found",
      },
    });

    // Verify getUserId was called
    expect(getUserId).toHaveBeenCalledWith(mockReq.headers.authorization);

    // Verify checkBabyBelongsToUser was not called
    expect(checkBabyBelongsToUser).not.toHaveBeenCalled();
  });

  test("should return 403 when user does not have access to baby", async () => {
    mockReq.params.baby_id = "1";
    mockReq.headers.authorization = "Bearer token";
    getUserId.mockResolvedValue("user123");
    checkBabyBelongsToUser.mockResolvedValue(false);

    await getMilestoneByBabyId(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
  });

  test("should return 200 and milestones when found", async () => {
    mockReq.params.baby_id = "1";
    mockReq.headers.authorization = "Bearer token";
    getUserId.mockResolvedValue("user123");
    checkBabyBelongsToUser.mockResolvedValue(true);

    const mockMilestones = [{ id: 1, baby_id: 1, milestone: "First steps" }];
    pool.query.mockResolvedValue({ rows: mockMilestones });

    await getMilestoneByBabyId(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.send).toHaveBeenCalledWith({
      status: "ok",
      data: mockMilestones,
    });
  });

  test("should return 404 when no milestones found", async () => {
    mockReq.params.baby_id = "1";
    mockReq.headers.authorization = "Bearer token";
    getUserId.mockResolvedValue("user123");
    checkBabyBelongsToUser.mockResolvedValue(true);
    pool.query.mockResolvedValue({ rows: [] });

    await getMilestoneByBabyId(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: "error",
      error: {
        code: 404,
        message: "No milestones found for this baby",
      },
    });
  });

  test("should return 500 when database query fails", async () => {
    mockReq.params.baby_id = "1";
    mockReq.headers.authorization = "Bearer token";
    getUserId.mockResolvedValue("user123");
    checkBabyBelongsToUser.mockResolvedValue(true);
    pool.query.mockRejectedValue(new Error("Database error"));

    await getMilestoneByBabyId(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(logger.error).toHaveBeenCalled();
  });
});
