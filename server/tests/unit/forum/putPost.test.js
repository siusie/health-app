// tests/unit/forum/putPost.test.js
const putPost = require("../../../src/routes/api/forum/posts/putPost");
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

describe("PUT V1/forum/posts/:post_id", () => {
  let req;
  let res;
  const mockUserId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { post_id: 1 },
      body: {
        title: "Updated Test Title",
        content: "Updated Test Content",
      },
      headers: { authorization: "Bearer fake-token" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test("should successfully update a post", async () => {
    const mockUser = { email: "test@example.com" };
    const mockUpdatedPost = {
      post_id: 1,
      title: req.body.title,
      content: req.body.content,
      updated_at: new Date(),
    };

    jwt.decode.mockReturnValue(mockUser);
    getUserId.mockResolvedValue(mockUserId);
    pool.query.mockImplementation((query) => {
      if (query.includes("SELECT user_id")) {
        return { rows: [{ user_id: mockUserId }] };
      }
      return { rows: [mockUpdatedPost] };
    });

    await putPost(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "ok",
      data: mockUpdatedPost,
    });
  });

  test("should return 400 when title is missing", async () => {
    req.body = { content: "Test Content" };
    await putPost(req, res);
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      400,
      "Title and content are required"
    );
  });

  test("should return 400 when content is missing", async () => {
    req.body = { title: "Test Title" };
    await putPost(req, res);
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      400,
      "Title and content are required"
    );
  });

  test("should return 401 when no authorization header is present", async () => {
    req.headers = {};
    await putPost(req, res);
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
    await putPost(req, res);
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      404,
      "User not found"
    );
  });

  test("should return 404 when post does not exist", async () => {
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    getUserId.mockResolvedValue(mockUserId);
    pool.query.mockResolvedValueOnce({ rows: [] });
    await putPost(req, res);
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      404,
      "Post not found"
    );
  });

  test("should return 403 when user is not the post author", async () => {
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    getUserId.mockResolvedValue(mockUserId);
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: mockUserId + 1 }] });
    await putPost(req, res);
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      403,
      "You can only edit your own posts"
    );
  });

  test("should return 500 when database error occurs", async () => {
    const errorMessage = "Database error";
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    getUserId.mockResolvedValue(mockUserId);
    pool.query.mockRejectedValue(new Error(errorMessage));
    await putPost(req, res);
    expect(logger.error).toHaveBeenCalledWith(
      `Error updating post: ${errorMessage}`
    );
    expect(createErrorResponse).toHaveBeenCalledWith(res, 500, errorMessage);
  });
});
