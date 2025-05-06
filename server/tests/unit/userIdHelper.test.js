const pool = require("../../database/db");
const logger = require("../../src/utils/logger");
const { getUserId } = require("../../src/utils/userIdHelper");
const jwt = require("jsonwebtoken");

jest.mock("../../database/db");
jest.mock("../../src/utils/logger");
jest.mock("jsonwebtoken");

describe("getUserId", () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return user ID when valid token and email exists", async () => {
    // Mock JWT decode
    jwt.decode.mockReturnValue({ email: "test@example.com" });

    // Mock database query response
    pool.query.mockResolvedValue({
      rows: [{ user_id: 123 }],
    });

    const authHeader = "Bearer fake.jwt.token";
    const result = await getUserId(authHeader);

    expect(result).toBe(123);
    expect(jwt.decode).toHaveBeenCalledWith("fake.jwt.token");
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [
      "test@example.com",
    ]);
  });

  test("should return null when user email not found in database", async () => {
    jwt.decode.mockReturnValue({ email: "nonexistent@example.com" });
    pool.query.mockResolvedValue({ rows: [] });

    const authHeader = "Bearer fake.jwt.token";
    const result = await getUserId(authHeader);

    expect(result).toBeNull();
  });

  test("should return null when token is invalid", async () => {
    jwt.decode.mockReturnValue(null);

    const authHeader = "Bearer invalid.token";
    const result = await getUserId(authHeader);

    expect(result).toBeNull();
  });

  test("should throw error when database query fails", async () => {
    jwt.decode.mockReturnValue({ email: "test@example.com" });
    const dbError = new Error("Database connection failed");
    pool.query.mockRejectedValue(dbError);

    const authHeader = "Bearer fake.jwt.token";
    await expect(getUserId(authHeader)).rejects.toThrow(dbError);
  });

  test("should return null when token payload has no email", async () => {
    jwt.decode.mockReturnValue({ someOtherField: "value" });

    const authHeader = "Bearer fake.jwt.token";
    const result = await getUserId(authHeader);

    expect(result).toBeNull();
  });
});
