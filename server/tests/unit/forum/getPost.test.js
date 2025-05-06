// tests/unit/forum/getPost.test.js
const getPost = require("../../../src/routes/api/forum/posts/getPost");
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

describe("GET v1/forum/posts/:post_id", () => {
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

  test("should successfully fetch a post with its replies", async () => {
    const mockUser = { email: "test@example.com" };
    const mockUserId = 1;
    const mockPost = {
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
    };

    jwt.decode.mockReturnValue(mockUser);
    getUserId.mockResolvedValue(mockUserId);
    pool.query.mockResolvedValue({ rows: [mockPost] });

    await getPost(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "ok",
      data: mockPost,
    });
  });

  test("should return 401 when no authorization header is present", async () => {
    req.headers = {};
    await getPost(req, res);
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
    await getPost(req, res);
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      404,
      "User not found"
    );
  });

  test("should return 404 when post does not exist", async () => {
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    getUserId.mockResolvedValue(1);
    pool.query.mockResolvedValue({ rows: [] });
    await getPost(req, res);
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      404,
      "Post not found"
    );
  });

  test("should return 500 when database error occurs", async () => {
    const errorMessage = "Database error";
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    getUserId.mockResolvedValue(1);
    pool.query.mockRejectedValue(new Error(errorMessage));
    await getPost(req, res);
    expect(logger.error).toHaveBeenCalledWith(
      `Error fetching post: ${errorMessage}`
    );
    expect(createErrorResponse).toHaveBeenCalledWith(res, 500, errorMessage);
  });
});
