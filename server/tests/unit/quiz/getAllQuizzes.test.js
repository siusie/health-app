// tests/unit/[quiz]/getAllQuizzes.test.js
// Tests the GET /quiz route 

// NOTE-: =>[NO AUTHENTICATION] REQUIRED FOR THIS ROUTE

const request = require('supertest');
const express = require('express');
const pool = require('../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../src/utils/response');

// app properly handles the route
const getAllQuizzes = require('../../../src/routes/api/quiz/getAllQuizzes');
const app = express();
app.use(express.json());
app.get('/v1/quiz', getAllQuizzes); // GET /quiz

// mock the database and response functions
jest.mock('../../../database/db');
jest.mock('../../../src/utils/response');

// Test GET /quiz
describe('GET /quiz', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
  });

  it('should return 200 and 5 quizzes when category is ALL', async () => {
    req.query.category = 'ALL';
    const mockRows = [
      { question_id: 1, category: 'SLEEP', question_text: 'Q1', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_option: 'A' },
      { question_id: 2, category: 'HYGIENE', question_text: 'Q2', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_option: 'B' },
      { question_id: 3, category: 'EMOTIONAL DEVELOPMENT', question_text: 'Q3', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_option: 'C' },
      { question_id: 4, category: 'PHYSICAL ACTIVITIES', question_text: 'Q4', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_option: 'D' },
      { question_id: 5, category: 'LANGUAGE DEVELOPMENT', question_text: 'Q5', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_option: 'A' }
    ];

    pool.query.mockResolvedValueOnce({ rows: mockRows });

    await getAllQuizzes(req, res);

    expect(pool.query).toHaveBeenCalledWith(
      `SELECT question_id, category, question_text,
        option_a, option_b, option_c, option_d,
        correct_option
         FROM QuizQuestions 
         ORDER BY random() 
         LIMIT 5`
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(createSuccessResponse({ dataQuiz: mockRows }));
  });

  it('should return 200 and quizzes for specific category', async () => {
    req.query.category = 'SLEEP';
    const mockRows = [
      { question_id: 1, category: 'SLEEP', question_text: 'How long should kids sleep?', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_option: 'C' }
    ];

    pool.query.mockResolvedValueOnce({ rows: mockRows });

    await getAllQuizzes(req, res);

    expect(pool.query).toHaveBeenCalledWith(
      `SELECT question_id, category, question_text,
        option_a, option_b, option_c, option_d,
        correct_option
         FROM QuizQuestions
         WHERE category = $1
         ORDER BY random()
         LIMIT 5`,
      ['SLEEP']
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(createSuccessResponse({ dataQuiz: mockRows }));
  });

  it('should return 404 when no quizzes found', async () => {
    req.query.category = 'ALL';
    pool.query.mockResolvedValueOnce({ rows: [] });

    await getAllQuizzes(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(createErrorResponse(404, 'No quiz found'));
  });

  it('should return 500 when database query fails', async () => {
    req.query.category = 'ALL';
    pool.query.mockRejectedValueOnce(new Error('DB connection error'));

    await getAllQuizzes(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(createErrorResponse(500, 'Internal server error'));
  });
});