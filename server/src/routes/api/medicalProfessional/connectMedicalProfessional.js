// src/routes/api/medicalProfessional/connectMedicalProfessional.js

const logger = require('../../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../utils/response');
const pool = require('../../../../database/db');

module.exports.connectMedicalProfessional = async function (req, res) {
  const { doctor_id, baby_id } = req.body;

  if (!doctor_id || !baby_id) {
    return res
      .status(400)
      .json(createErrorResponse('Missing doctor_id or baby_id'));
  }

  try {
    const result = await pool.query(
      'INSERT INTO doctor_baby (doctor_id, baby_id) VALUES ($1, $2) RETURNING *',
      [doctor_id, baby_id]
    );

    if (result.rowCount === 0) {
      return res
        .status(500)
        .json(createErrorResponse('Failed to connect doctor to baby'));
    }

    return res
      .status(200)
      .json(createSuccessResponse('Doctor and baby are connected'));
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json(createErrorResponse('Error connecting to medical professionals'));
  }
};
