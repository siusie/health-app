// tests/unit/babyProfile/getAllBabyProfiles.test.js
const request = require("supertest");
const express = require("express");
const pool = require("../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../src/utils/response");
const { getUserId } = require("../../../src/utils/userIdHelper");

// Mock dependencies
jest.mock("../../../database/db");
jest.mock("../../../src/utils/response");
jest.mock("../../../src/utils/userIdHelper");

const getAllBabyProfiles = require("../../../src/routes/api/baby/babyProfile/getAllBabyProfiles");

const app = express();
app.use(express.json());
app.get("/v1/babies", getAllBabyProfiles);

describe("GET /v1/user/babyProfiles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 200 and baby profiles when valid token is provided", async () => {
    const mockBabies = [
      {
        baby_id: 1,
        first_name: "John",
        last_name: "Doe",
        date_of_birth: "2023-01-01",
      },
      {
        baby_id: 2,
        first_name: "Jane",
        last_name: "Doe",
        date_of_birth: "2023-02-01",
      },
    ];

    getUserId.mockResolvedValue("1");
    pool.query.mockResolvedValue({ rows: mockBabies });
    createSuccessResponse.mockImplementation((data) => data);

    const res = await request(app)
      .get("/v1/babies")
      .set("Authorization", "Bearer valid-token");

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT b.* FROM baby b"),
      [1]
    );
    expect(createSuccessResponse).toHaveBeenCalledWith({ babies: mockBabies });
  });

  test("should return 401 when no authorization header is provided", async () => {
    const res = await request(app).get("/v1/babies");

    expect(res.status).toBe(401);
    expect(createErrorResponse).toHaveBeenCalledWith(
      401,
      "No authorization token provided"
    );
  });

  test("should return 401 when invalid user ID is extracted from token", async () => {
    getUserId.mockResolvedValue(null);

    const res = await request(app)
      .get("/v1/babies")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(createErrorResponse).toHaveBeenCalledWith("Invalid user ID");
  });

  test("should return 404 when no baby profiles are found", async () => {
    getUserId.mockResolvedValue("1");
    pool.query.mockResolvedValue({ rows: [] });

    const res = await request(app)
      .get("/v1/babies")
      .set("Authorization", "Bearer valid-token");

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith(
      "No baby profiles found for this user"
    );
  });

  test("should return 500 when database query fails", async () => {
    getUserId.mockResolvedValue("1");
    pool.query.mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get("/v1/babies")
      .set("Authorization", "Bearer valid-token");

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith("Internal server error");
  });

  test("should return 500 when getUserId throws an error", async () => {
    getUserId.mockRejectedValue(new Error("Token verification failed"));

    const res = await request(app)
      .get("/v1/babies")
      .set("Authorization", "Bearer valid-token");

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith("Internal server error");
  });
});
