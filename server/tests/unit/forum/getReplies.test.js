// tests/unit/forum/getReplies.test.js
const getReplies = require("../../../src/routes/api/forum/replies/getReplies");
const pool = require("../../../database/db");
const jwt = require("jsonwebtoken");
const logger = require("../../../src/utils/logger");
const { getUserId } = require("../../../src/utils/userIdHelper");
const { createErrorResponse } = require("../../../src/utils/response");

jest.mock("../../../database/db");
jest.mock("jsonwebtoken");
jest.mock("../../../src/utils/logger");
jest.mock("../../../src/utils/userIdHelper");
jest.mock("../../../src/utils/response");

describe("GET v1/forum/posts/:post_id/replies", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { post_id: 1 },
      headers: { authorization: "Bearer fake-token" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test("should successfully fetch replies for a post", async () => {
    const mockUser = { email: "test@example.com" };
    const mockUserId = 1;
    const mockReplies = [
      {
        reply_id: 1,
        post_id: 1,
        user_id: mockUserId,
        content: "Test Reply 1",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        reply_id: 2,
        post_id: 1,
        user_id: mockUserId,
        content: "Test Reply 2",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    jwt.decode.mockReturnValue(mockUser);
    getUserId.mockResolvedValue(mockUserId);
    pool.query.mockImplementation((query) => {
      if (query.includes("SELECT post_id FROM forumpost")) {
        return { rows: [{ post_id: 1 }] };
      }
      return { rows: mockReplies };
    });

    await getReplies(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "ok",
      data: mockReplies,
    });
  });

  test("should return 401 when no authorization header is present", async () => {
    req.headers = {};
    await getReplies(req, res);
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      401,
      "No authorization token provided"
    );
    expect(logger.error).toHaveBeenCalledWith("No authorization header found");
  });

  test("should return 404 when user is not found", async () => {
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    getUserId.mockResolvedValue(null);
    await getReplies(req, res);
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      404,
      "User not found"
    );
  });

  test("should return 404 when post does not exist", async () => {
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    getUserId.mockResolvedValue(1);
    pool.query.mockResolvedValueOnce({ rows: [] });
    await getReplies(req, res);
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      404,
      "Post not found"
    );
  });

  test("should return 500 when database error occurs", async () => {
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    getUserId.mockResolvedValue(1);
    pool.query.mockRejectedValue(new Error("Database error"));
    await getReplies(req, res);
    expect(logger.error).toHaveBeenCalledWith(
      "Error fetching replies: Database error"
    );
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      500,
      "Error fetching replies"
    );
  });
});
