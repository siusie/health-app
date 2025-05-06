// tests/unit/forum/getPosts.test.js
const getPosts = require("../../../src/routes/api/forum/posts/getPosts");
const pool = require("../../../database/db");
const jwt = require("jsonwebtoken");
const logger = require("../../../src/utils/logger");
const { createErrorResponse } = require("../../../src/utils/response");

jest.mock("../../../database/db");
jest.mock("jsonwebtoken");
jest.mock("../../../src/utils/logger");
jest.mock("../../../src/utils/response");

describe("GET v1/forum/posts", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      headers: { authorization: "Bearer fake-token" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test("should successfully fetch posts with replies", async () => {
    const mockUser = { email: "test@example.com" };
    const mockUserId = 1;
    const mockPosts = [
      {
        post_id: 1,
        user_id: mockUserId,
        title: "Test Post",
        content: "Test Content",
        created_at: new Date(),
        updated_at: new Date(),
        reply_count: 2,
        replies: [
          {
            reply_id: 1,
            user_id: 2,
            content: "Test Reply 1",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      },
    ];

    jwt.decode.mockReturnValue(mockUser);
    pool.query.mockImplementation((query) => {
      if (query.includes("SELECT user_id")) {
        return { rows: [{ user_id: mockUserId }] };
      }
      return { rows: mockPosts };
    });

    await getPosts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "ok",
      data: mockPosts,
    });
  }, 10000);

  test("should return 401 when no authorization header is present", async () => {
    req.headers = {};
    await getPosts(req, res);
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      401,
      "No authorization token provided"
    );
    expect(logger.error).toHaveBeenCalledWith("No authorization header found");
  });

  test("should return 401 when token is invalid", async () => {
    jwt.decode.mockReturnValue(null);
    await getPosts(req, res);
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      401,
      "Invalid token format"
    );
    expect(logger.error).toHaveBeenCalledWith(
      "No email found in token payload"
    );
  });

  test("should return 404 when user is not found", async () => {
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    pool.query.mockResolvedValueOnce({ rows: [] });
    await getPosts(req, res);
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      404,
      "User not found"
    );
    expect(logger.error).toHaveBeenCalledWith(
      "User not found for email: test@example.com"
    );
  });

  test("should return 500 when database error occurs", async () => {
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    pool.query.mockRejectedValue(new Error("Database error"));
    await getPosts(req, res);
    expect(logger.error).toHaveBeenCalledWith(
      "Error fetching posts: Database error"
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
