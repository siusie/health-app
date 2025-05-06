// tests/unit/babyProfile/putBabyProfile.test.js
const request = require("supertest");
const express = require("express");
const putBabyProfile = require("../../../src/routes/api/baby/babyProfile/putBabyProfile");
const pool = require("../../../database/db");
const { getUserId } = require("../../../src/utils/userIdHelper");
const {
  checkBabyBelongsToUser,
} = require("../../../src/utils/babyAccessHelper");

// Mock dependencies
jest.mock("../../../database/db");
jest.mock("../../../src/utils/userIdHelper");
jest.mock("../../../src/utils/babyAccessHelper");

describe("PUT /v1/baby/:baby_id", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.put("/v1/baby/:baby_id", putBabyProfile);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockValidBabyData = {
    data: {
      first_name: "John",
      last_name: "Doe",
      gender: "M",
      weight: 3.5,
      birthdate: "2023-01-01",
      height: 50,
    },
  };

  const mockAuthHeader = "Bearer mock-token";
  const mockUserId = 1;

  test("should successfully update baby profile", async () => {
    // Mock dependencies
    getUserId.mockResolvedValue(mockUserId);
    checkBabyBelongsToUser.mockResolvedValue(true);
    pool.query.mockResolvedValue({
      rows: [{ ...mockValidBabyData.data, baby_id: 1 }],
    });

    const response = await request(app)
      .put("/v1/baby/1")
      .set("Authorization", mockAuthHeader)
      .send(mockValidBabyData);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data).toMatchObject(mockValidBabyData.data);
  });

  test("should return 400 when baby_id is missing", async () => {
    const response = await request(app)
      .put("/v1/baby/undefined")
      .set("Authorization", mockAuthHeader)
      .send(mockValidBabyData);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe("Missing baby_id parameter");
  });

  test("should return 400 when baby_id is not a number", async () => {
    const response = await request(app)
      .put("/v1/baby/invalid")
      .set("Authorization", mockAuthHeader)
      .send(mockValidBabyData);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe("Invalid baby_id parameter");
  });

  test("should return 400 when data object is missing", async () => {
    const response = await request(app)
      .put("/v1/baby/1")
      .set("Authorization", mockAuthHeader)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe(
      "Missing required parameters: data object"
    );
    expect(response.body.status).toBe("error");
  });

  test("should return 400 when required fields are missing", async () => {
    const invalidData = {
      data: {
        first_name: "John",
        // missing other required fields
      },
    };

    const response = await request(app)
      .put("/v1/baby/1")
      .set("Authorization", mockAuthHeader)
      .send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
    expect(response.body.error.message).toContain(
      "Missing required parameters: last_name, gender, weight"
    );
  });

  test("should return 401 when authorization header is missing", async () => {
    const response = await request(app)
      .put("/v1/baby/1")
      .send(mockValidBabyData);

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe("No authorization token provided");
  });

  test("should return 403 when baby does not belong to user", async () => {
    getUserId.mockResolvedValue(mockUserId);
    checkBabyBelongsToUser.mockResolvedValue(false);

    const response = await request(app)
      .put("/v1/baby/1")
      .set("Authorization", mockAuthHeader)
      .send(mockValidBabyData);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe(
      "Access denied: Baby does not belong to current user"
    );
  });

  test("should return 404 when baby is not found", async () => {
    getUserId.mockResolvedValue(mockUserId);
    checkBabyBelongsToUser.mockResolvedValue(true);
    pool.query.mockResolvedValue({ rows: [] });

    const response = await request(app)
      .put("/v1/baby/1")
      .set("Authorization", mockAuthHeader)
      .send(mockValidBabyData);

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("error");
    expect(response.body.error.message).toBe("Baby not found");
  });

  test("should return 500 when database query fails", async () => {
    getUserId.mockResolvedValue(mockUserId);
    checkBabyBelongsToUser.mockResolvedValue(true);
    pool.query.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
      .put("/v1/baby/1")
      .set("Authorization", mockAuthHeader)
      .send(mockValidBabyData);

    expect(response.status).toBe(500);
    expect(response.body.status).toBe("error");
    expect(response.body.error.message).toBe(
      "Internal server error while updating baby profile"
    );
  });

  test("should return 404 when user is not found", async () => {
    // Mock getUserId to return null to simulate user not found
    getUserId.mockResolvedValue(null);

    const response = await request(app)
      .put("/v1/baby/1")
      .set("Authorization", mockAuthHeader)
      .send(mockValidBabyData);

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("error");
    expect(response.body.error.message).toBe("User not found");

    // Verify getUserId was called with correct auth header
    expect(getUserId).toHaveBeenCalledWith(mockAuthHeader);
    expect(getUserId).toHaveBeenCalledTimes(1);
  });
});
