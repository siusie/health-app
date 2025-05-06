/**
 * File: tests/unit/export/getExportCSV.test.js
 * Unit tests for GET /export/csv
 */

const getExportCSV = require("../../../src/routes/api/export/getExportCSV");
const { createSuccessResponse, createErrorResponse } = require("../../../src/utils/response");
const pool = require("../../../database/db");
const { getUserId } = require("../../../src/utils/userIdHelper");

// Mock dependencies
jest.mock("../../../database/db");
jest.mock("../../../src/utils/response");
jest.mock("../../../src/utils/userIdHelper");

// Suppress console.log from DB connection
jest.spyOn(console, "log").mockImplementation(() => { }); 

describe("getExportCSV endpoint", () => {
  let req, res;

  beforeEach(() => {
    req = {
      headers: {},
      query: {
        startDate: "2023-01-01",
        endDate: "2023-01-31",
        babyInfo: "true",
        growthRecords: "true",
        milestones: "true",
        feedingSchedule: "true",
        stoolRecords: "true",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    jest.restoreAllMocks();
  });

  test("should return 401 if no authorization header provided", async () => {
    await getExportCSV(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, "No authorization token provided");
  });

  test("should return 401 if Invalid token", async () => {
    req.headers.authorization = "Bearer invalidtoken";
    getUserId.mockResolvedValue(null);
    await getExportCSV(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(createErrorResponse).toHaveBeenCalledWith(401, "Invalid user ID");
  });

  test("should return 404 if no baby found", async () => {
    req.headers.authorization = "Bearer validtoken";
    getUserId.mockResolvedValue("1");
    // First pool.query call for baby profiles returns empty array.
    pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] });

    await getExportCSV(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(createErrorResponse).toHaveBeenCalledWith(404, "No baby profiles found for this user");
  });

  test("should use default dates when none provided", async () => {
    // Remove startDate and endDate from query.
    delete req.query.startDate;
    delete req.query.endDate;
    req.headers.authorization = "Bearer validtoken";
    getUserId.mockResolvedValue("1");
  
    // 1. Mock user creation date query:
    pool.query.mockResolvedValueOnce({ rows: [{ created_at: "2022-12-15" }] });
    // 2. Check baby existence returns count > 0.
    pool.query.mockResolvedValueOnce({ rows: [{ count: "1" }] });
    // 3. Query baby profiles returns one baby.
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          baby_id: 1,
          first_name: "Emma",
          last_name: "Smith",
          birthdate: "2020-01-01",
          gender: "F",
          weight: 3.2,
          created_at: "2020-01-01T00:00:00Z",
        },
      ],
    });
    // 4. Growth check returns count 0.
    pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] });
    // 5. Milestones check returns count 0.
    pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] });
    // 6. Feeding check returns count 0.
    pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] });
    // 7. Stool check returns count 0.
    pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] });
    // 8. Insert export record returns a row.
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          document_id: 1,
          file_name:
            "ExportedBabyData_Info_Growth_Milestones_Feeding_Stool_from2022-12-15_to" +
            new Date().toISOString().split("T")[0] +
            ".csv",
          file_format: "CSV",
          created_at: "2023-01-31",
        },
      ],
    });
  
    await getExportCSV(req, res);
    // Verify that CSV headers were set.
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv");
    expect(res.send).toHaveBeenCalled();
  });
  
test("should generate CSV with data in each section", async () => {
  req.headers.authorization = "Bearer validtoken";
  getUserId.mockResolvedValue("1");

  // 1. Baby profiles query returns one baby.
  pool.query.mockResolvedValueOnce({
    rows: [
      {
        baby_id: 1,
        first_name: "John",
        last_name: "Doe",
        birthdate: "2020-02-02",
        gender: "M",
        weight: 3.5,
        created_at: "2020-02-02T00:00:00Z",
      },
    ],
  });
  // 2. Check baby existence returns count > 0.
  pool.query.mockResolvedValueOnce({ rows: [{ count: "1" }] });
  // 3. For Growth: check returns count "1"
  pool.query.mockResolvedValueOnce({ rows: [{ count: "1" }] });
  //    Growth data query returns data.
  pool.query.mockResolvedValueOnce({
    rows: [{ growth_id: 101, date: "2023-01-10", weight: 3.6, height: 50, notes: "Good progress" }],
  });
  // 4. For Milestones: check returns count "1"
  pool.query.mockResolvedValueOnce({ rows: [{ count: "1" }] });
  //    Milestones data query returns data.
  pool.query.mockResolvedValueOnce({
    rows: [{ milestone_id: 201, date: "2023-01-12", title: "First Smile", details: "Smiled for the first time" }],
  });
  // 5. For Feeding: check returns count "1"
  pool.query.mockResolvedValueOnce({ rows: [{ count: "1" }] });
  //    Feeding data query returns data.
  pool.query.mockResolvedValueOnce({
    rows: [{ feeding_schedule_id: 301, date: "2023-01-15", time: "08:00:00", meal: "Breakfast", amount: 5, type: "Formula", issues: "", notes: "" }],
  });
  // 6. For Stool: check returns count "1"
  pool.query.mockResolvedValueOnce({ rows: [{ count: "1" }] });
  //    Stool data query returns data.
  pool.query.mockResolvedValueOnce({
    rows: [{ stool_id: 401, timestamp: "2023-01-20", color: "Brown", consistency: "Firm", notes: "" }],
  });
  // 7. Insert export record returns a row.
  pool.query.mockResolvedValueOnce({
    rows: [
      {
        document_id: 1,
        file_name: "ExportedBabyData_Info_Growth_Milestones_Feeding_Stool_from2023-01-01_to2023-01-31.csv",
        file_format: "CSV",
        created_at: "2023-01-31",
      },
    ],
  });

  await getExportCSV(req, res);
  // Verify that CSV content includes expected section headers.
  const sentContent = res.send.mock.calls[0][0];
  expect(sentContent).toMatch(/Baby Information/);
  expect(sentContent).toMatch(/Growth Records/);
  expect(sentContent).toMatch(/Milestones/);
  expect(sentContent).toMatch(/Feeding Schedule/);
  expect(sentContent).toMatch(/Stool Records/);
});


  test("should return 500 on database error", async () => {
    req.headers.authorization = "Bearer validtoken";
    getUserId.mockResolvedValue("1");
    pool.query.mockRejectedValue(new Error("DB error"));
    await getExportCSV(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(createErrorResponse).toHaveBeenCalledWith(500, "Internal server error");
  });
});