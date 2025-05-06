// tests/unit/forum/addReply.test.js
const addReply = require("../../../src/routes/api/forum/replies/addReply");
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

describe("POST v1/forum/posts/:post_id/reply", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: { content: "Test reply content" },
      params: { post_id: 1 },
      headers: { authorization: "Bearer fake-token" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test("should successfully create a reply", async () => {
    const mockUser = { email: "test@example.com" };
    const mockUserId = 1;
    const mockReply = {
      reply_id: 1,
      user_id: mockUserId,
      post_id: 1,
      content: req.body.content,
      created_at: new Date(),
    };

    jwt.decode.mockReturnValue(mockUser);
    getUserId.mockResolvedValue(mockUserId);
    pool.query.mockImplementation((query) => {
      if (query.includes("SELECT")) {
        return { rows: [{ post_id: 1 }] };
      }
      return { rows: [mockReply] };
    });
    await addReply(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "ok",
      data: mockReply,
    });
  }, 10000);

  test("should return 401 when no authorization header is present", async () => {
    req.headers = {};
    await addReply(req, res);
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
    await addReply(req, res);
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
    await addReply(req, res);
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
    await addReply(req, res);
    expect(logger.error).toHaveBeenCalledWith(
      "Error creating reply: Database error"
    );
    expect(createErrorResponse).toHaveBeenCalledWith(
      res,
      500,
      "Error creating reply"
    );
  });
});
