// tests/unit/milestones/getAllMilestones.test.js
const getAllMilestones = require('../../../src/routes/api/milestones/getAllMilestones');
const pool = require('../../../database/db');
const { getUserId } = require('../../../src/utils/userIdHelper');
const logger = require('../../../src/utils/logger');

jest.mock('../../../src/utils/userIdHelper');
jest.mock('../../../database/db');
jest.mock('../../../src/utils/logger');

describe('GET /v1/milestones', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test('should return milestones successfully with formatted names', async () => {
    mockReq.headers.authorization = 'Bearer token';
    mockReq.query = {};
    const mockUserId = '123';
    const mockMilestones = [
      {
        milestone_id: 1,
        baby_id: 1,
        title: 'First steps',
        first_name: 'John',
        last_name: 'Doe',
      },
      {
        milestone_id: 2,
        baby_id: 1,
        title: 'First words',
        first_name: null,
        last_name: null,
      },
    ];

    // Simpler mock setup
    getUserId.mockResolvedValue(mockUserId);
    pool.query.mockResolvedValue({ rows: mockMilestones });

    await getAllMilestones(mockReq, mockRes);

    // Verify getUserId was called correctly
    expect(getUserId).toHaveBeenCalledWith('Bearer token');

    // Verify pool.query was called with correct parameters
    const expectedQuery = `SELECT 
             m.milestone_id,
             m.baby_id,
             TO_CHAR(m.date, 'YYYY-MM-DD') AS date, -- Format the date as YYYY-MM-DD
             m.title,
             m.details,
             b.first_name,
             b.last_name 
           FROM milestones m
           LEFT JOIN user_baby ub ON m.baby_id = ub.baby_id
           LEFT JOIN baby b ON m.baby_id = b.baby_id
           WHERE ub.user_id = $1 ORDER BY m.date DESC`;

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringMatching(/SELECT.*m\.milestone_id.*FROM milestones.*ORDER BY m\.date DESC/s),
      [mockUserId]
    );

    // Verify response
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'ok',
      data: expect.arrayContaining([
        expect.objectContaining({
          milestone_id: 1,
          baby_id: 1,
          title: 'First steps',
        }),
      ]),
    });
  });

  test('should handle database errors', async () => {
    mockReq.headers.authorization = 'Bearer token';
    const mockUserId = '123';

    getUserId.mockResolvedValue(mockUserId);
    pool.query.mockRejectedValue(new Error('Database error'));

    await getAllMilestones(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      error: {
        code: 500,
        message: 'Internal server error',
      },
    });
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error getting milestones'));
  });

  test('should return empty array when no milestones exist', async () => {
    mockReq.headers.authorization = 'Bearer token';
    mockReq.query = {};
    const mockUserId = '123';

    getUserId.mockImplementation(async (token) => {
      return mockUserId;
    });

    pool.query.mockImplementation(async (query, params) => {
      return { rows: [] };
    });

    try {
      await getAllMilestones(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'ok',
        data: [],
      });
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });

  test('should return 401 when no authorization header is provided', async () => {
    // Don't set authorization header
    await getAllMilestones(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      error: {
        code: 401,
        message: 'No authorization token provided',
      },
    });
  });

  test('should return 404 when user is not found', async () => {
    mockReq.headers.authorization = 'Bearer invalid-token';

    // Mock getUserId to return null to simulate user not found
    getUserId.mockResolvedValue(null);

    await getAllMilestones(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      error: {
        code: 404,
        message: 'User not found',
      },
    });
    expect(pool.query).not.toHaveBeenCalled();
  });
});
