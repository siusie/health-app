// tests/unit/forum/deletePost.test.js
const deletePost = require("../../../src/routes/api/forum/posts/deletePost");
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

describe("DELETE v1/forum/posts/:post_id", () => {
  let req;
  let res;
  let mockClient;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock client methods with Promise.resolve()
    mockClient = {
      query: jest.fn().mockImplementation(() => Promise.resolve()),
      release: jest.fn(),
    };

    // Mock pool connect
    pool.connect.mockResolvedValue(mockClient);

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock request object with default valid values
    req = {
      params: { post_id: "123" },
      headers: { authorization: "Bearer valid-token" },
    };

    // Default JWT decode response
    jwt.decode.mockReturnValue({ email: "test@example.com" });

    // Default getUserId response
    getUserId.mockResolvedValue(1);

    // Mock the response helpers
    createErrorResponse.mockImplementation((res, code, message) => {
      res.status(code);
      res.json({
        success: false,
        error: message,
      });
    });

    createSuccessResponse.mockImplementation((data) => ({
      success: true,
      data: data,
    }));
  });

  describe("Input Validation", () => {
    test("should return 400 when post_id is invalid", async () => {
      req.params.post_id = "invalid";
      await deletePost(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid post ID provided",
      });
      expect(logger.error).not.toHaveBeenCalled();
    });

    test("should return 401 when authorization header is missing", async () => {
      req.headers = {};
      await deletePost(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "No authorization token provided",
      });
      expect(logger.error).toHaveBeenCalledWith(
        "No authorization header found"
      );
    });
  });

  describe("Authorization Checks", () => {
    test("should return 404 when user is not found", async () => {
      getUserId.mockResolvedValue(null);
      await deletePost(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "User not found",
      });
    });

    test("should return 404 when post does not exist", async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // SELECT returns empty result
        .mockResolvedValueOnce({}); // ROLLBACK

      await deletePost(req, res);

      expect(mockClient.query.mock.calls).toEqual([
        ["BEGIN"],
        ["SELECT user_id FROM forumpost WHERE post_id = $1", ["123"]],
        ["ROLLBACK"],
      ]);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Post not found",
      });
    });

    test("should return 403 when user is not authorized to delete post", async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ user_id: 2 }] }) // SELECT returns different user
        .mockResolvedValueOnce({}); // ROLLBACK

      await deletePost(req, res);

      expect(mockClient.query.mock.calls).toEqual([
        ["BEGIN"],
        ["SELECT user_id FROM forumpost WHERE post_id = $1", ["123"]],
        ["ROLLBACK"],
      ]);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "User not authorized to delete this post",
      });
    });
  });

  describe("Successful Operations", () => {
    test("should successfully delete post and associated replies", async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ user_id: 1 }] }) // SELECT returns matching user
        .mockResolvedValueOnce({ rowCount: 2 }) // DELETE replies
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE post
        .mockResolvedValueOnce({}); // COMMIT

      await deletePost(req, res);

      expect(mockClient.query.mock.calls).toEqual([
        ["BEGIN"],
        ["SELECT user_id FROM forumpost WHERE post_id = $1", ["123"]],
        [
          "DELETE FROM forumreply WHERE post_id = $1 RETURNING reply_id",
          ["123"],
        ],
        ["DELETE FROM forumpost WHERE post_id = $1", ["123"]],
        ["COMMIT"],
      ]);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: "Forum post deleted successfully",
      });
      expect(logger.info).toHaveBeenCalledWith(
        "Successfully deleted post 123 and 2 replies"
      );
    });
  });

  describe("Error Handling", () => {
    test("should handle database errors and rollback transaction", async () => {
      const dbError = new Error("Database error");
      mockClient.query
        .mockRejectedValueOnce(dbError) // First query fails
        .mockImplementation(() => Promise.resolve()); // ROLLBACK succeeds

      await deletePost(req, res);

      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Server error while deleting post",
      });
      expect(logger.error).toHaveBeenCalledWith(
        "Error deleting post: Database error"
      );
      expect(logger.error).toHaveBeenCalledWith(dbError.stack);
    });

    test("should handle rollback errors", async () => {
      const dbError = new Error("Database error");
      const rollbackError = new Error("Rollback failed");

      mockClient.query
        .mockRejectedValueOnce(dbError)
        .mockRejectedValueOnce(rollbackError);

      await deletePost(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        "Rollback failed: Rollback failed"
      );
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Server error while deleting post",
      });
    });
  });
  describe("Post Existence Checks", () => {
    test("should return 404 when post does not exist", async () => {
      // Setup mock implementation for the entire sequence of queries
      mockClient.query.mockImplementation((query, params) => {
        if (query === "BEGIN") {
          return Promise.resolve();
        }
        if (query === "SELECT user_id FROM forumpost WHERE post_id = $1") {
          return Promise.resolve({ rows: [] }); // Empty result for non-existent post
        }
        if (query === "ROLLBACK") {
          return Promise.resolve();
        }
        return Promise.resolve();
      });

      await deletePost(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Post not found",
      });
    });

    test("should properly check post ownership", async () => {
      mockClient.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [{ user_id: 1 }] }) // SELECT returns a post
        .mockResolvedValueOnce({ rowCount: 2 }) // DELETE replies
        .mockResolvedValueOnce() // DELETE post
        .mockResolvedValueOnce(); // COMMIT

      await deletePost(req, res);

      expect(mockClient.query).toHaveBeenNthCalledWith(
        2,
        "SELECT user_id FROM forumpost WHERE post_id = $1",
        ["123"]
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: "Forum post deleted successfully",
      });
    });
  });
});
