const { getUser } = require('../../../src/routes/api/user/getUser');
const pool = require('../../../database/db');
const { getUserId } = require('../../../src/utils/userIdHelper');

// Mock the required dependencies
jest.mock('../../../database/db');
jest.mock('../../../src/utils/userIdHelper');

describe('getUser', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Reset mocks before each test
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return 401 if no authorization header is present', async () => {
    await getUser(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      error: {
        code: 401,
        message: 'No authorization token provided',
      },
    });
  });

  test('should return 404 if user ID is not found', async () => {
    mockReq.headers.authorization = 'Bearer token';
    getUserId.mockResolvedValue(null);

    await getUser(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      error: {
        code: 404,
        message: 'User not found',
      },
    });
  });

  test('should return 404 if user profile is not found', async () => {
    mockReq.headers.authorization = 'Bearer token';
    getUserId.mockResolvedValue('123');
    pool.query.mockResolvedValue({ rows: [] });

    await getUser(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      error: {
        code: 404,
        message: 'User profile not found',
      },
    });
  });

  test('should return user profile if found', async () => {
    const mockUser = {
      user_id: '123',
      username: 'testuser',
      email: 'test@example.com',
    };

    mockReq.headers.authorization = 'Bearer token';
    getUserId.mockResolvedValue('123');
    pool.query.mockResolvedValue({ rows: [mockUser] });

    await getUser(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'ok',
      ...mockUser,
    });
  });

  test('should return 500 if database query fails', async () => {
    mockReq.headers.authorization = 'Bearer token';
    getUserId.mockResolvedValue('123');
    pool.query.mockRejectedValue(new Error('Database error'));

    await getUser(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      error: {
        code: 500,
        message: 'Internal server error',
      },
    });
  });
});
