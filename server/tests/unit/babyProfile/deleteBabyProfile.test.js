// tests/unit/babyProfile/deleteBabyProfile.test.js
const request = require("supertest");
const express = require("express");
const passport = require("passport");
const pool = require("../../../database/db");
const { createErrorResponse } = require("../../../src/utils/response");
const { strategy, authenticate } = require("../../../src/auth/jwt-middleware");
const { generateToken } = require("../../../src/utils/jwt");
const {
  checkBabyBelongsToUser,
} = require("../../../src/utils/babyAccessHelper");
const { getUserId } = require("../../../src/utils/userIdHelper");

// Mock dependencies
jest.mock("../../../src/utils/babyAccessHelper", () => ({
  checkBabyBelongsToUser: jest.fn(),
}));

jest.mock("../../../src/utils/userIdHelper", () => ({
  getUserId: jest.fn(),
}));

jest.mock("../../../database/db", () => ({
  query: jest.fn(),
}));

jest.mock("../../../src/utils/response", () => ({
  createErrorResponse: jest.fn(),
}));

const deleteBaby = require("../../../src/routes/api/baby/babyProfile/deleteBabyProfile");
const app = express();
app.use(express.json());
app.use(passport.initialize());
passport.use(strategy());
app.delete("/v1/baby/:baby_id", authenticate(), deleteBaby);

describe("DELETE v1/baby/:baby_id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createErrorResponse.mockImplementation((message) => ({
      success: false,
      message,
    }));
  });

  test("should return 200 and delete the baby profile", async () => {
    const userId = 1;
    getUserId.mockResolvedValue(userId);
    checkBabyBelongsToUser.mockResolvedValue(true);

    pool.query.mockResolvedValueOnce({ rowCount: 1 }); // user_baby deletion
    pool.query.mockResolvedValueOnce({ rowCount: 1 }); // baby deletion

    const user = {
      userId: 1,
      firstName: "Anh",
      lastName: "Vu",
      email: "user1@email.com",
      role: "Parent",
    };
    const token = generateToken(user);

    const res = await request(app)
      .delete("/v1/baby/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(getUserId).toHaveBeenCalledWith(`Bearer ${token}`);
    expect(checkBabyBelongsToUser).toHaveBeenCalledWith("1", userId);
    expect(res.body).toEqual({
      success: true,
      message: "Baby profile deleted successfully",
    });
  });

  test("should return 403 when user is not authorized", async () => {
    const userId = 2;
    getUserId.mockResolvedValue(userId);
    checkBabyBelongsToUser.mockResolvedValue(false);

    const user = {
      userId: 2,
      firstName: "Test",
      lastName: "User",
      email: "user2@email.com",
      role: "Parent",
    };
    const token = generateToken(user);

    const res = await request(app)
      .delete("/v1/baby/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(getUserId).toHaveBeenCalledWith(`Bearer ${token}`);
    expect(checkBabyBelongsToUser).toHaveBeenCalledWith("1", userId);
    expect(createErrorResponse).toHaveBeenCalledWith(
      "Not authorized to delete this baby profile"
    );
  });

  test("should return 401 when missing authorization header", async () => {
    const res = await request(app).delete("/v1/baby/1");

    expect(res.status).toBe(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, "Unauthorized");
  });

  test("should return 500 if there is a database error", async () => {
    const userId = 1;
    getUserId.mockResolvedValue(userId);
    checkBabyBelongsToUser.mockResolvedValue(true);
    pool.query.mockRejectedValue(new Error("Database error"));

    const user = {
      userId: 1,
      firstName: "Anh",
      lastName: "Vu",
      email: "user1@email.com",
      role: "Parent",
    };
    const token = generateToken(user);

    const res = await request(app)
      .delete("/v1/baby/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith("Internal server error");
  });

  test("should return 404 when baby profile does not exist", async () => {
    const userId = 1;
    getUserId.mockResolvedValue(userId);
    checkBabyBelongsToUser.mockResolvedValue(true);

    pool.query.mockResolvedValueOnce({ rowCount: 0 }); // user_baby deletion
    pool.query.mockResolvedValueOnce({ rowCount: 0 }); // baby deletion

    const user = {
      userId: 1,
      firstName: "Anh",
      lastName: "Vu",
      email: "user1@email.com",
      role: "Parent",
    };
    const token = generateToken(user);

    const res = await request(app)
      .delete("/v1/baby/999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith("Baby not found");
  });

  test("should return 400 when user_id is missing", async () => {
    getUserId.mockResolvedValue(null); // Simulate missing user_id

    const user = {
      userId: 1,
      firstName: "Anh",
      lastName: "Vu",
      email: "user1@email.com",
      role: "Parent",
    };
    const token = generateToken(user);

    const res = await request(app)
      .delete("/v1/baby/1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(createErrorResponse).toHaveBeenCalledWith(
      "Missing required parameters"
    );
  });

  test("should return 400 when baby_id is missing", async () => {
    const userId = 1;
    getUserId.mockResolvedValue(userId);

    const user = {
      userId: 1,
      firstName: "Anh",
      lastName: "Vu",
      email: "user1@email.com",
      role: "Parent",
    };
    const token = generateToken(user);

    const res = await request(app)
      .delete("/v1/baby/invalid") // Missing baby_id in URL
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(createErrorResponse).toHaveBeenCalledWith("Invalid baby ID format");
  });
});
