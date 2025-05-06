// tests/unit/journal/deleteJournalEntry.test.js
const request = require("supertest");
const express = require("express");
const deleteJournalEntry = require("../../../src/routes/api/journal/deleteJournalEntry");
const pool = require("../../../database/db");
const { getUserId } = require("../../../src/utils/userIdHelper");

const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../src/utils/response");

// Mock dependencies
jest.mock("../../../database/db");
jest.mock("../../../src/utils/logger");
jest.mock("../../../src/utils/userIdHelper");
jest.mock("../../../src/utils/response");

// Setup express app for testing
const app = express();
app.delete("/v1/journal/:id", deleteJournalEntry);

describe("DELETE /v1/journal/:id", () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock client with proper ROLLBACK support
    mockClient = {
      query: jest.fn().mockImplementation((query) => {
        if (query === "ROLLBACK") {
          return Promise.resolve({});
        }
        return Promise.resolve({ rows: [] });
      }),
      release: jest.fn(),
    };

    // Setup default mocks
    pool.connect.mockResolvedValue(mockClient);
    getUserId.mockResolvedValue(1);
    createSuccessResponse.mockImplementation((message) => ({
      success: true,
      message,
    }));
    createErrorResponse.mockImplementation((res, code, message) => {
      res.status(code).json({ success: false, message });
    });
  });

  describe("Success case", () => {
    test("should successfully delete journal entry", async () => {
      // Mock successful database responses
      mockClient.query.mockImplementation((query, params) => {
        if (query === "BEGIN") return Promise.resolve({});
        if (query.includes("SELECT"))
          return Promise.resolve({ rows: [{ user_id: 1 }] });
        if (query.includes("DELETE")) return Promise.resolve({});
        if (query === "COMMIT") return Promise.resolve({});
        return Promise.resolve({});
      });

      const response = await request(app)
        .delete("/v1/journal/1")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Journal entry deleted successfully",
      });
    });
  });

  describe("Error cases", () => {
    test("should return 400 for invalid entry ID", async () => {
      const response = await request(app)
        .delete("/v1/journal/invalid")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "Invalid entry ID provided",
      });
    });

    test("should return 401 for missing authorization header", async () => {
      const response = await request(app).delete("/v1/journal/1");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: "No authorization token provided",
      });
    });

    test("should return 404 when user not found", async () => {
      getUserId.mockResolvedValue(null);

      const response = await request(app)
        .delete("/v1/journal/1")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: "User not found",
      });
    });

    test("should return 404 when journal entry not found", async () => {
      mockClient.query.mockImplementation((query, params) => {
        if (query === "BEGIN") return Promise.resolve({});
        if (query.includes("SELECT")) return Promise.resolve({ rows: [] });
        if (query === "ROLLBACK") return Promise.resolve({});
        return Promise.resolve({});
      });

      const response = await request(app)
        .delete("/v1/journal/1")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: "Journal entry not found",
      });
    });

    test("should return 403 for unauthorized deletion attempt", async () => {
      mockClient.query.mockImplementation((query, params) => {
        if (query === "BEGIN") return Promise.resolve({});
        if (query.includes("SELECT"))
          return Promise.resolve({ rows: [{ user_id: 2 }] });
        if (query === "ROLLBACK") return Promise.resolve({});
        return Promise.resolve({});
      });

      const response = await request(app)
        .delete("/v1/journal/1")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        message: "You can only delete your own journal entries",
      });
    });

    test("should return 500 for database error", async () => {
      mockClient.query.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .delete("/v1/journal/1")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: "Server error while deleting journal entry",
      });
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
