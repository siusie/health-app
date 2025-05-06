const request = require("supertest");
const express = require("express");
const getBabyProfile = require("../../../src/routes/api/baby/babyProfile/getBabyProfile");
const pool = require("../../../database/db");
const { getUserId } = require("../../../src/utils/userIdHelper");
const {
  checkBabyBelongsToUser,
} = require("../../../src/utils/babyAccessHelper");

// Mock dependencies
jest.mock("../../../database/db");
jest.mock("../../../src/utils/userIdHelper");
jest.mock("../../../src/utils/babyAccessHelper");

describe("GET /baby/:baby_id", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use("/:baby_id", getBabyProfile);
    jest.clearAllMocks();
  });

  test("should return 400 if baby_id is missing", async () => {
    const response = await request(app).get("/undefined");
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: "error",
      error: {
        code: 400,
        message: "Missing baby_id parameter",
      },
    });
  });

  test("should return 400 if baby_id is not a number", async () => {
    const response = await request(app).get("/abc");
    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
    expect(response.body.error.message).toBe("Invalid baby_id parameter");
  });

  test("should return 401 if authorization header is missing", async () => {
    const response = await request(app).get("/123");
    expect(response.status).toBe(401);
    expect(response.body.status).toBe("error");
    expect(response.body.error.message).toBe("No authorization token provided");
  });

  test("should return 404 if user is not found", async () => {
    getUserId.mockResolvedValue(null);

    const response = await request(app)
      .get("/123")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("error");
    expect(response.body.error.message).toBe("User not found");
  });

  test("should return 403 if baby does not belong to user", async () => {
    getUserId.mockResolvedValue("user123");
    checkBabyBelongsToUser.mockResolvedValue(false);

    const response = await request(app)
      .get("/123")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(403);
    expect(response.body.status).toBe("error");
    expect(response.body.error.message).toBe(
      "Access denied: Baby does not belong to current user"
    );
  });

  test("should return 404 if baby profile not found", async () => {
    getUserId.mockResolvedValue("user123");
    checkBabyBelongsToUser.mockResolvedValue(true);
    pool.query.mockResolvedValue({ rows: [] });

    const response = await request(app)
      .get("/123")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("error");
    expect(response.body.error.message).toBe("Baby profile not found");
  });

  test("should return baby profile on success", async () => {
    const mockBabyProfile = {
      first_name: "Test",
      last_name: "Baby",
      gender: "boy",
      weight: "25",
    };

    getUserId.mockResolvedValue("user123");
    checkBabyBelongsToUser.mockResolvedValue(true);
    pool.query.mockResolvedValue({ rows: [mockBabyProfile] });

    const response = await request(app)
      .get("/123")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.data).toEqual(mockBabyProfile);
  });

  test("should return 500 on internal server error", async () => {
    getUserId.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
      .get("/123")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(500);
    expect(response.body.status).toBe("error");
    expect(response.body.error.message).toBe("Internal server error");
  });
});
