// src/routes/api/medicalProfessional/getAllMedicalProfessional.js

const logger = require('../../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../utils/response');
const pool = require('../../../../database/db');

module.exports.getAllMedicalProfessional = async function (req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE role=$1', [
      'Medical Professional',
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json(createErrorResponse('No medical professionals found'));
    }
    return res
      .status(200)
      .json(createSuccessResponse({ medicalProfessional: rows }));
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json(createErrorResponse('Error fetching medical professionals'));
  }
};
