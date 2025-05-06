const EventEmitter = require('events');
const { getUserId } = require('../../../src/utils/userIdHelper');
const pool = require('../../../database/db');
const addJournalEntry = require('../../../src/routes/api/journal/addJournalEntry');

// Mock dependencies
jest.mock('../../../src/utils/userIdHelper');
jest.mock('../../../database/db');
jest.mock('../../../src/utils/logger');

let mockFormidableError = null;

/* Mock the formidable module
formidable exports a class called IncomingForm which is used to parse form data.
We mock the IncomingForm class and its parse method.
The parse method is called with the request object and a callback function.
The callback function is called with the error, fields, and files.
We can set the mockFormidableError variable to simulate an error in the form parsing.
The fields object contains the form data fields.
We convert the fields object to an array of key-value pairs and then convert it back to an object.
This is done to simulate the structure of the fields object returned by formidable.
The fields object is then passed to the callback function.
If mockFormidableError is set, we call the callback function with the error.
Otherwise, we call the callback function with null error and the fields object.
This allows us to test the behavior of the addJournalEntry function when form parsing fails.
We reset the mockFormidableError variable after the test to ensure it doesn't affect other tests.
*/
jest.mock('formidable', () => ({
  IncomingForm: jest.fn().mockImplementation(() => ({
    parse: jest.fn().mockImplementation((req, cb) => {
      if (mockFormidableError) {
        cb(mockFormidableError, null, null);
        return;
      }
      // Convert the body to the format that formidable would return
      const fields = Object.entries(req.body).reduce((acc, [key, value]) => {
        acc[key] = [value]; // formidable returns array of values
        return acc;
      }, {});
      // Call the callback immediately to simulate synchronous behavior in tests
      process.nextTick(() => cb(null, fields, {}));
    }),
  })),
}));

// Helper function to create response promise
const createResponsePromise = (res) => {
  return new Promise((resolve) => {
    res.json = jest.fn().mockImplementation((data) => {
      resolve(data);
      return res;
    });
  });
};

describe('POST /v1/journal', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = Object.assign(new EventEmitter(), {
      body: {},
      headers: {
        'content-type': 'multipart/form-data',
        'content-length': '1000',
        authorization: 'Bearer fake-token',
      },
    });

    // The mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
  });

  it('should create a journal entry successfully', async () => {
    const mockUserId = 1;
    const mockEntry = {
      title: 'Test Entry',
      text: 'Test content',
      date: '2025-02-26',
    };
    const mockResult = {
      rows: [
        {
          id: 1,
          user_id: mockUserId,
          ...mockEntry,
        },
      ],
    };

    getUserId.mockResolvedValue(mockUserId);
    pool.query.mockResolvedValueOnce(mockResult);

    req.body = mockEntry;

    // Create a promise that resolves when the response is sent
    const responsePromise = createResponsePromise(res);

    addJournalEntry(req, res);
    await responsePromise; // Wait for the response

    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO journalentry (user_id, title, text, date, tags) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [mockUserId, mockEntry.title, mockEntry.text, expect.any(String), []] // Empty array for no tags
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockResult.rows[0]);
  });

  it('should validate title length', async () => {
    const mockEntry = {
      title: 'a'.repeat(256),
      text: 'Test content',
      date: '2025-02-26',
    };

    getUserId.mockResolvedValue(1);
    req.body = mockEntry;

    const responsePromise = createResponsePromise(res);
    addJournalEntry(req, res);
    await responsePromise;

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: ['Title must be 255 characters or less'],
    });
  });

  it('should return 401 when user is not authenticated', async () => {
    req.body = {
      title: 'Test Entry',
      text: 'Test content',
      date: '2025-02-26',
    };

    getUserId.mockResolvedValue(null);

    const responsePromise = createResponsePromise(res);
    addJournalEntry(req, res);
    await responsePromise;

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User not authenticated',
    });
  });

  it('should handle database errors', async () => {
    const mockUserId = 1;
    getUserId.mockResolvedValue(mockUserId);
    pool.query.mockRejectedValueOnce(new Error('Database error'));

    req.body = {
      title: 'Test Entry',
      text: 'Test content',
      date: '2025-02-26',
    };

    const responsePromise = createResponsePromise(res);
    addJournalEntry(req, res);
    await responsePromise;

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
  });

  it('should handle duplicate entries', async () => {
    const mockUserId = 1;
    getUserId.mockReturnValue(mockUserId);
    const error = new Error('Duplicate entry');
    error.code = '23505';
    pool.query.mockRejectedValueOnce(error);

    req.body = {
      title: 'Test Entry',
      text: 'Test content',
      date: '2025-02-26',
    };

    const responsePromise = createResponsePromise(res);
    addJournalEntry(req, res);
    await responsePromise;

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Duplicate entry',
    });
  });

  it('should handle form parsing errors', async () => {
    // Set the mock error before the test
    mockFormidableError = new Error('Form parsing failed');
    mockFormidableError.code = 'FORM_ERROR';

    const responsePromise = createResponsePromise(res);
    addJournalEntry(req, res);
    await responsePromise;

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error processing form data',
    });

    // Reset the mock error after the test
    mockFormidableError = null;
  });

  it('should validate missing required fields', async () => {
    req.body = {
      // Missing title, text, and date
    };

    getUserId.mockReturnValue(1);
    const responsePromise = createResponsePromise(res);
    addJournalEntry(req, res);
    await responsePromise;

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: expect.arrayContaining([
        'Title is required',
        'Text content is required',
        'Date is required',
      ]),
    });
  });

  it('should validate invalid date format', async () => {
    req.body = {
      title: 'Test Entry',
      text: 'Test content',
      date: 'invalid-date',
    };

    getUserId.mockReturnValue(1);
    const responsePromise = createResponsePromise(res);
    addJournalEntry(req, res);
    await responsePromise;

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: ['Invalid date format'],
    });
  });

  it('should handle database query with no results', async () => {
    req.body = {
      title: 'Test Entry',
      text: 'Test content',
      date: '2025-02-26',
    };

    getUserId.mockReturnValue(1);
    pool.query.mockResolvedValue({ rows: [] });

    const responsePromise = createResponsePromise(res);
    addJournalEntry(req, res);
    await responsePromise;

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to create journal entry',
    });
  });

  it('should validate text length', async () => {
    const mockEntry = {
      title: 'Test Entry',
      text: 'a'.repeat(10001), // Exceeds MAX_TEXT_LENGTH of 10000
      date: '2025-02-26',
    };

    getUserId.mockReturnValue(1);
    req.body = mockEntry;

    const responsePromise = createResponsePromise(res);
    addJournalEntry(req, res);
    await responsePromise;

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: ['Text must be 10000 characters or less'],
    });
  });

  it('should return 401 when no authorization header is present', async () => {
    const mockEntry = {
      title: 'Test Entry',
      text: 'Test content',
      date: '2025-02-26',
    };

    // Remove authorization header
    req.headers = {
      'content-type': 'multipart/form-data',
      'content-length': '1000',
    };

    req.body = mockEntry;

    const responsePromise = createResponsePromise(res);
    addJournalEntry(req, res);
    await responsePromise;

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No authorization token provided',
    });
  });

  it('should handle invalid tags format', async () => {
    const mockEntry = {
      title: 'Test Entry',
      text: 'Test content',
      date: '2025-02-26',
      tags: 'invalid-tags-format', // Send invalid tags format
    };

    // Mock successful user authentication
    getUserId.mockResolvedValue(1);

    // Don't mock pool.query since we should fail validation before DB query
    req.body = mockEntry;

    const responsePromise = createResponsePromise(res);
    addJournalEntry(req, res);
    await responsePromise;

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: ['Invalid tags format'],
    });

    // Verify that pool.query was not called since validation failed
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('should validate maximum number of tags', async () => {
    req.body = {
      title: 'Test Entry',
      text: 'Test content',
      date: '2025-02-26',
      tags: JSON.stringify(Array(11).fill('tag')), // 11 tags exceeds maximum of 10
    };

    getUserId.mockReturnValue(1);
    const responsePromise = createResponsePromise(res);
    addJournalEntry(req, res);
    await responsePromise;

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: ['Maximum 10 tags allowed'],
    });
  });

  it('should validate tag length', async () => {
    req.body = {
      title: 'Test Entry',
      text: 'Test content',
      date: '2025-02-26',
      tags: JSON.stringify(['normal', 'a'.repeat(31)]), // Tag exceeds 30 characters
    };

    getUserId.mockReturnValue(1);
    const responsePromise = createResponsePromise(res);
    addJournalEntry(req, res);
    await responsePromise;

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: ['Tags must be strings of 30 characters or less'],
    });
  });

  it('should successfully create entry with valid tags', async () => {
    const mockUserId = 1;
    const mockEntry = {
      title: 'Test Entry',
      text: 'Test content',
      date: '2025-02-26',
      tags: JSON.stringify(['tag1', 'tag2']),
    };
    const mockResult = {
      rows: [
        {
          id: 1,
          user_id: mockUserId,
          ...mockEntry,
          tags: ['tag1', 'tag2'],
        },
      ],
    };

    getUserId.mockResolvedValue(mockUserId);
    pool.query.mockResolvedValueOnce(mockResult);

    req.body = mockEntry;

    const responsePromise = createResponsePromise(res);
    addJournalEntry(req, res);
    await responsePromise;

    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO journalentry (user_id, title, text, date, tags) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [mockUserId, mockEntry.title, mockEntry.text, expect.any(String), ['tag1', 'tag2']]
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockResult.rows[0]);
  });
});
