// server/src/routes/api/quiz/getAllQuizzes.js
// Route for GET /quiz

// NOTE-: =>[NO AUTHENTICATION] REQUIRED FOR THIS ROUTE (everyone can access)

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');

// GET /quiz
// {req} has [req.query.category] : for quiz category
// ==>{res} as json { dataQuiz: [...] }
module.exports = async (req, res) => {
  try {
    let { category } = req.query;
    if (!category) {
      category = 'ALL';
    }
    logger.info(category, `Category for quiz:`);

    // Select 5 random questions for the chosen category + SEND CORRECT ANSWERS
    let result;
    if (category === 'ALL') {
      result = await pool.query(
        `SELECT question_id, category, question_text,
        option_a, option_b, option_c, option_d,
        correct_option
         FROM QuizQuestions 
         ORDER BY random() 
         LIMIT 5`
      );
    } else {
      result = await pool.query(
        `SELECT question_id, category, question_text,
        option_a, option_b, option_c, option_d,
        correct_option
         FROM QuizQuestions
         WHERE category = $1
         ORDER BY random()
         LIMIT 5`,
        [category]
      );
    }

    if (result.rows.length > 0) {
      // return ALL ROWS

      logger.info(result.rows, `Fetched quizzes:`);

      res.status(200).send(createSuccessResponse({ dataQuiz: result.rows }));
    } else {
      res.status(404).send(createErrorResponse(404, 'No quiz found'));
    }
  } catch (err) {
    logger.error(err, `ERROR in getAllQuizzes(), Error fetching all quizzes: `);
    res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
