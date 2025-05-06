// server/tests/unit/babyProfile/addBabyProfile.test.js
const request = require("supertest");
const express = require("express");
const pool = require("../../../database/db");
const { getUserId } = require("../../../src/utils/userIdHelper");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../src/utils/response");

// Mock dependencies
jest.mock("../../../database/db");
jest.mock("../../../src/utils/userIdHelper");
jest.mock("../../../src/utils/response");

const app = express();
app.use(express.json());
const addBabyProfile = require("../../../src/routes/api/baby/babyProfile/addBabyProfile");
app.post("/v1/baby", addBabyProfile);

describe("POST /v1/baby", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should successfully add a new baby", async () => {
    const mockBabyData = {
      first_name: "John",
      last_name: "Doe",
      gender: "male",
      weight: "3.5",
      birthdate: "2023-01-01",
      height: "50",
    };

    const mockUserId = 1;
    getUserId.mockResolvedValue(mockUserId);

    const mockNewBaby = {
      rows: [
        {
          baby_id: 1,
          ...mockBabyData,
          created_at: new Date().toISOString(),
        },
      ],
    };

    pool.query
      .mockResolvedValueOnce(mockNewBaby) // First query for baby insertion
      .mockResolvedValueOnce({ rows: [] }); // Second query for user_baby insertion

    createSuccessResponse.mockImplementation((data) => ({
      status: "success",
      data,
    }));

    const res = await request(app)
      .post("/v1/baby")
      .set("Authorization", "Bearer mock-token")
      .send(mockBabyData);

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(createSuccessResponse).toHaveBeenCalledWith(mockNewBaby.rows[0]);
  });

  test("should return 401 when no authorization header is provided", async () => {
    const mockBabyData = {
      first_name: "John",
      last_name: "Doe",
      gender: "male",
      weight: "3.5",
      birthdate: "2023-01-01",
      height: "50",
    };

    createErrorResponse.mockImplementation((status, message) => ({
      status: "error",
      error: { message },
    }));

    const res = await request(app).post("/v1/baby").send(mockBabyData);

    expect(res.status).toBe(401);
    expect(createErrorResponse).toHaveBeenCalledWith(
      401,
      "No authorization token provided"
    );
  });

  test("should return 500 when database operation fails", async () => {
    const mockBabyData = {
      first_name: "John",
      last_name: "Doe",
      gender: "male",
      weight: "3.5",
      birthdate: "2023-01-01",
      height: "50",
    };

    getUserId.mockResolvedValue(1);
    pool.query.mockRejectedValue(new Error("Database error"));

    createErrorResponse.mockImplementation((status, message) => ({
      status: "error",
      error: { message },
    }));

    const res = await request(app)
      .post("/v1/baby")
      .set("Authorization", "Bearer mock-token")
      .send(mockBabyData);

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(
      500,
      "Internal server error"
    );
  });
});
