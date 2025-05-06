// tests/unit/forum/addPost.test.js
const addPost = require("../../../src/routes/api/forum/posts/addPost");
const pool = require("../../../database/db");
const jwt = require("jsonwebtoken");
const logger = require("../../../src/utils/logger");
const { getUserId } = require("../../../src/utils/userIdHelper");
const {
  createErrorResponse,
  createSuccessResponse,
} = require("../../../src/utils/response");

jest.mock("../../../database/db");
jest.mock("jsonwebtoken");
jest.mock("../../../src/utils/logger");
jest.mock("../../../src/utils/userIdHelper");
jest.mock("../../../src/utils/response");

describe("POST v1/forum/posts/add", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {
        title: "Test Post Title",
        content: "Test Post Content",
      },
      headers: { authorization: "Bearer fake-token" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test("should successfully create a post", async () => {
    const mockUser = { email: "test@example.com" };
    const mockUserId = 1;
    const mockPost = {
      post_id: 1,
      user_id: mockUserId,
      title: req.body.title,
      content: req.body.content,
      created_at: new Date(),
      updated_at: new Date(),
    };

    jwt.decode.mockReturnValue(mockUser);
    getUserId.mockResolvedValue(mockUserId);
    pool.query.mockResolvedValue({ rows: [mockPost] });
    createSuccessResponse.mockReturnValue({
      status: "success",
      data: mockPost,
    });

    await addPost(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      "Post created successfully",
      mockPost
    );
  });

  test("should return 401 when no authorization header is present", async () => {
    req.headers = {};
    await addPost(req, res);
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
    await addPost(req, res);
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      404,
      "User not found"
    );
  });

  test("should return 400 when title is missing", async () => {
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    getUserId.mockResolvedValue(1);
    req.body = { content: "Test Content" };
    await addPost(req, res);
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      400,
      "Title and content are required"
    );
  });

  test("should return 400 when content is missing", async () => {
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    getUserId.mockResolvedValue(1);
    req.body = { title: "Test Title" };
    await addPost(req, res);
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      400,
      "Title and content are required"
    );
  });

  test("should return 500 when database error occurs", async () => {
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    getUserId.mockResolvedValue(1);
    pool.query.mockRejectedValue(new Error("Database error"));
    await addPost(req, res);
    expect(logger.error).toHaveBeenCalledWith(
      "Error creating post: Database error"
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(createErrorResponse).toHaveBeenCalledWith("Error creating post");
  });
});
