// tests/unit/milestones/putMilestone.test.js
// Tests PUT /v1/baby/:baby_id/milestones/:milestone_id

const request = require("supertest");
const express = require("express");
const passport = require("passport");
const pool = require("../../../database/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../src/utils/response");
const { strategy, authenticate } = require("../../../src/auth/jwt-middleware");
const { generateToken } = require("../../../src/utils/jwt");

// app properly handles the route
const {
  updateMilestoneById,
} = require("../../../src/routes/api/milestones/putMilestone");
const app = express();
app.use(express.json());
app.use(passport.initialize());
passport.use(strategy());
app.put(
  "/v1/baby/:baby_id/milestones/:milestone_id",
  authenticate(),
  updateMilestoneById
);

// mock the database and response functions
jest.mock("../../../database/db");
jest.mock("../../../src/utils/response");

describe("PUT /v1/baby/:baby_id/milestones/:milestone_id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 200 and update the milestone record", async () => {
    const updatedMilestone = {
      date: "2025-02-20",
      title: "First Walk",
      details: "Baby walked for the first time.",
    };

    pool.query.mockResolvedValueOnce({ rows: [updatedMilestone] });
    createSuccessResponse.mockReturnValue(updatedMilestone);

    const user = {
      userId: 1,
      firstName: "Anh",
      lastName: "Vu",
      email: "user1@email.com",
      role: "Parent",
    };
    const token = generateToken(user);

    const res = await request(app)
      .put("/v1/baby/1/milestones/1")
      .set("Authorization", `Bearer ${token}`) // Include the token in the Authorization header
      .send(updatedMilestone);

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(
      "UPDATE milestones SET date = $1, title = $2, details = $3 WHERE milestone_id = $4 RETURNING *",
      ["2025-02-20", "First Walk", "Baby walked for the first time.", "1"]
    );
    expect(res.body).toEqual(updatedMilestone);
  });

  test("should return 404 if the milestone record is not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    createErrorResponse.mockReturnValue({
      error: "Milestone record not found",
    });

    const user = {
      userId: 1,
      firstName: "Anh",
      lastName: "Vu",
      email: "user1@email.com",
      role: "Parent",
    };
    const token = generateToken(user);

    const res = await request(app)
      .put("/v1/baby/1/milestones/1000")
      .set("Authorization", `Bearer ${token}`) // Include the token in the Authorization header
      .send({
        date: "2025-02-20",
        title: "First Walk",
        details: "Baby walked for the first time.",
      });

    expect(res.status).toBe(404);
    expect(createErrorResponse).toHaveBeenCalledWith(
      404,
      "Milestone record not found"
    );
  });

  test("should return 500 if there is an internal server error", async () => {
    pool.query.mockRejectedValueOnce(new Error("Database error"));
    createErrorResponse.mockReturnValue({ error: "Internal server error" });

    const user = {
      userId: 1,
      firstName: "Anh",
      lastName: "Vu",
      email: "user1@email.com",
      role: "Parent",
    };
    const token = generateToken(user);

    const res = await request(app)
      .put("/v1/baby/1/milestones/1")
      .set("Authorization", `Bearer ${token}`) // Include the token in the Authorization header
      .send({
        date: "2025-02-20",
        title: "First Walk",
        details: "Baby walked for the first time.",
      });

    expect(res.status).toBe(500);
    expect(createErrorResponse).toHaveBeenCalledWith(
      500,
      "Internal server error"
    );
  });
});
