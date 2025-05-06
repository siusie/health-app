// tests/unit/forum/deletePost.test.js
const deleteReply = require("../../../src/routes/api/forum/replies/deleteReply");
const pool = require("../../../database/db");
const { getUserId } = require("../../../src/utils/userIdHelper");
const jwt = require("jsonwebtoken");
const logger = require("../../../src/utils/logger");
const {
  createErrorResponse,
  createSuccessResponse,
} = require("../../../src/utils/response");

// Mock the required modules
jest.mock("../../../database/db");
jest.mock("../../../src/utils/logger");
jest.mock("../../../src/utils/userIdHelper");
jest.mock("jsonwebtoken");
jest.mock("../../../src/utils/response");

describe("DELETE v1/forum/replies/:reply_id", () => {
  let req;
  let res;
  let mockClient;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock request and response
    req = {
      params: { reply_id: "123" },
      headers: { authorization: "Bearer mock-token" },
    };
    res = {
      json: jest.fn(),
    };

    // Setup mock client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    // Setup pool connect mock
    pool.connect.mockResolvedValue(mockClient);

    // Setup default successful responses
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    getUserId.mockResolvedValue(1);
    createSuccessResponse.mockReturnValue({ success: true });
    createErrorResponse.mockImplementation((res, code, message) => {
      res.statusCode = code;
      return { error: message };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully delete a reply", async () => {
    // Mock reply exists and belongs to user
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ user_id: 1 }] }) // Check reply ownership
      .mockResolvedValueOnce({}) // DELETE
      .mockResolvedValueOnce({}); // COMMIT

    await deleteReply(req, res);

    // Verify all query calls were made in the correct order
    expect(mockClient.query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(mockClient.query).toHaveBeenNthCalledWith(
      2,
      "SELECT user_id FROM forumreply WHERE reply_id = $1",
      ["123"]
    );
    expect(mockClient.query).toHaveBeenNthCalledWith(
      3,
      "DELETE FROM forumreply WHERE reply_id = $1",
      ["123"]
    );
    expect(mockClient.query).toHaveBeenNthCalledWith(4, "COMMIT");

    expect(createSuccessResponse).toHaveBeenCalledWith(
      "Forum reply deleted successfully"
    );
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("should return 400 for invalid reply_id", async () => {
    req.params.reply_id = "invalid";
    await deleteReply(req, res);

    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      400,
      "Invalid reply ID provided"
    );
    expect(mockClient.query).not.toHaveBeenCalled();
  });

  it("should return 401 when no authorization header is present", async () => {
    req.headers.authorization = undefined;
    await deleteReply(req, res);

    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      401,
      "No authorization token provided"
    );
  });

  it("should return 404 when user is not found", async () => {
    getUserId.mockResolvedValue(null);
    await deleteReply(req, res);

    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      404,
      "User not found"
    );
  });

  it("should return 404 when reply does not exist", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // No reply found
      .mockResolvedValueOnce({}); // ROLLBACK

    await deleteReply(req, res);

    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      404,
      "Reply not found"
    );
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
  });

  it("should return 403 when user does not own the reply", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ user_id: 2 }] }) // Different user_id
      .mockResolvedValueOnce({}); // ROLLBACK

    await deleteReply(req, res);

    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      403,
      "User not authorized to delete this reply"
    );
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
  });

  it("should handle database errors properly", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockRejectedValueOnce(new Error("Database error")) // Query fails
      .mockResolvedValueOnce({}); // ROLLBACK

    await deleteReply(req, res);

    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      500,
      "Server error while deleting reply"
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
