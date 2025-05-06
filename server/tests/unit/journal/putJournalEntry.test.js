// tests/unit/journal/putJournalEntry.test.js
const putJournalEntry = require('../../../src/routes/api/journal/putJournalEntry');
const pool = require('../../../database/db');
const jwt = require('jsonwebtoken');
const { getUserId } = require('../../../src/utils/userIdHelper');

jest.mock('../../../database/db');
jest.mock('jsonwebtoken');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/userIdHelper');
jest.mock('../../../src/utils/response');

describe('PUT /v1/journal/:id', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      params: { id: '1' },
      body: { title: 'Test Title', text: 'Test Content' },
      headers: { authorization: 'Bearer validtoken' },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  test('should return 400 for invalid entry_id', async () => {
    mockReq.params.id = 'invalid';
    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Invalid entry ID provided',
      })
    );
  });

  test('should return 400 for missing title or content', async () => {
    mockReq.body = { title: '' };
    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Title and text are required',
      })
    );
  });

  test('should return 401 for missing authorization header', async () => {
    mockReq.headers = {};
    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'No authorization token provided',
      })
    );
  });

  test('should return 404 when user not found', async () => {
    jwt.decode = jest.fn().mockReturnValue({ email: 'test@example.com' });
    getUserId.mockResolvedValue(null);
    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'User not found',
      })
    );
  });

  test('should return 404 when journal entry not found', async () => {
    jwt.decode = jest.fn().mockReturnValue({ email: 'test@example.com' });
    getUserId.mockResolvedValue(1);
    pool.query.mockResolvedValueOnce({ rows: [] });

    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Journal entry not found',
      })
    );
  });

  test('should return 403 when user is not the author', async () => {
    jwt.decode = jest.fn().mockReturnValue({ email: 'test@example.com' });
    getUserId.mockResolvedValue(1);
    pool.query.mockResolvedValueOnce({
      rows: [{ user_id: 2 }],
    });

    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'You can only edit your own journal entries',
      })
    );
  });

  test('should successfully update journal entry', async () => {
    jwt.decode = jest.fn().mockReturnValue({ email: 'test@example.com' });
    getUserId.mockResolvedValue(1);

    const mockDate = new Date('2025-02-27T14:59:17.683Z');
    const mockUpdatedEntry = {
      entry_id: 18,
      title: 'test2',
      text: 'hello4',
      updated_at: mockDate,
      image: null,
    };

    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] }).mockResolvedValueOnce({
      rows: [mockUpdatedEntry],
    });

    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'ok',
      data: mockUpdatedEntry,
    });
  });

  test('should handle database errors', async () => {
    jwt.decode = jest.fn().mockReturnValue({ email: 'test@example.com' });
    getUserId.mockResolvedValue(1);
    pool.query.mockRejectedValue(new Error('Database error'));

    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Database error',
      })
    );
  });

  test('should validate invalid tags format', async () => {
    jwt.decode = jest.fn().mockReturnValue({ email: 'test@example.com' });
    getUserId.mockResolvedValue(1);

    mockReq.body = {
      title: 'Test Title',
      text: 'Test Content',
      tags: 'invalid-tags-format', // Not an array
    };

    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid tags format',
    });
  });

  test('should validate maximum number of tags', async () => {
    jwt.decode = jest.fn().mockReturnValue({ email: 'test@example.com' });
    getUserId.mockResolvedValue(1);

    mockReq.body = {
      title: 'Test Title',
      text: 'Test Content',
      tags: Array(11).fill('tag'), // 11 tags exceeds maximum of 10
    };

    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Maximum 10 tags allowed',
    });
  });

  test('should validate tag length', async () => {
    jwt.decode = jest.fn().mockReturnValue({ email: 'test@example.com' });
    getUserId.mockResolvedValue(1);

    mockReq.body = {
      title: 'Test Title',
      text: 'Test Content',
      tags: ['normal', 'a'.repeat(31)], // Tag exceeds 30 characters
    };

    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Tags must be strings of 30 characters or less',
    });
  });

  // Update the successful update test to include tags
  test('should successfully update journal entry with tags', async () => {
    jwt.decode = jest.fn().mockReturnValue({ email: 'test@example.com' });
    getUserId.mockResolvedValue(1);

    const mockDate = new Date('2025-02-27T14:59:17.683Z');
    const mockUpdatedEntry = {
      entry_id: 18,
      title: 'test2',
      text: 'hello4',
      updated_at: mockDate,
      image: null,
      tags: ['tag1', 'tag2'],
    };

    mockReq.body = {
      title: 'test2',
      text: 'hello4',
      tags: ['tag1', 'tag2'],
    };

    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] }).mockResolvedValueOnce({
      rows: [mockUpdatedEntry],
    });

    await putJournalEntry(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'ok',
      data: mockUpdatedEntry,
    });

    // Verify the SQL query includes tags
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('title = $1, text = $2, tags = $3'),
      expect.arrayContaining(['test2', 'hello4', ['tag1', 'tag2']])
    );
  });
});
