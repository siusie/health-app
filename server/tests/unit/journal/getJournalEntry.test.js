// tests/unit/journal/getJournalEntry.test.js
const getJournalEntry = require("../../../src/routes/api/journal/getJournalEntry");
const pool = require("../../../database/db");
const { getUserId } = require("../../../src/utils/userIdHelper");

// Mock the required modules
jest.mock("../../../database/db");
jest.mock("../../../src/utils/userIdHelper");
jest.mock("../../../src/utils/logger");

describe("GET /v1/journal/:id", () => {
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    // Reset mocks before each test
    mockRequest = {
      params: { id: "123" },
      headers: { authorization: "Bearer token" },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    getUserId.mockReset();
    pool.query.mockReset();
  });

  test("should return 401 if no authorization header", async () => {
    mockRequest.headers = {};
    await getJournalEntry(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "No authorization token provided",
    });
  });

  test("should return 400 if no entry ID provided", async () => {
    mockRequest.params = {};
    getUserId.mockResolvedValue("user123");

    await getJournalEntry(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: "error",
      error: {
        code: "Journal entry ID is required",
        message: undefined,
      },
    });
  });

  test("should return 404 if journal entry not found", async () => {
    getUserId.mockResolvedValue("user123");
    pool.query.mockResolvedValue({ rows: [] });

    await getJournalEntry(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: "error",
      error: {
        code: "Journal entry not found",
        message: undefined,
      },
    });
  });

  test("should return journal entry if found", async () => {
    const mockEntry = {
      id: "123",
      user_id: "user123",
      title: "Test Entry",
      content: "Test Content",
    };

    getUserId.mockResolvedValue("user123");
    pool.query.mockResolvedValue({ rows: [mockEntry] });

    await getJournalEntry(mockRequest, mockResponse);

    expect(pool.query).toHaveBeenCalledWith(
      "SELECT * FROM journalentry WHERE entry_id = $1 AND user_id = $2",
      ["123", "user123"]
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      ...mockEntry,
      status: "ok",
    });
  });

  test("should return 500 on database error", async () => {
    getUserId.mockResolvedValue("user123");
    pool.query.mockRejectedValue(new Error("Database error"));

    await getJournalEntry(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: "error",
      error: {
        code: "Internal server error",
        message: undefined,
      },
    });
  });
});
