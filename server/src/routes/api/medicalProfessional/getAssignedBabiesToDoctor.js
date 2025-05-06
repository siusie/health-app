// src/routes/api/medicalProfessional/getAssignedBabiesToDoctor.js
const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');

module.exports.getAssignedBabiesToDoctor = async function (req, res) {
  try {
    const doctorId = req.params.doctor_id;
    const query = `SELECT * FROM doctor_baby WHERE doctor_id = $1`;
    const result = await pool.query(query, [doctorId]);
    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('No assigned babies found for this doctor'));
    }
    const babyIds = result.rows.map((row) => row.baby_id);

    // Query to get baby details
    const babyInfos = await pool.query(
      `SELECT
        b.baby_id,
        b.first_name,
        b.last_name,
        b.gender,
        b.weight,
        b.height,
        b.birthdate
       FROM baby b
       INNER JOIN doctor_baby db ON b.baby_id = db.baby_id
       WHERE b.baby_id = ANY($1::int[])`,
      [babyIds]
    );

    if (babyInfos.rows.length === 0) {
      return res.status(404).json(createErrorResponse('No baby information found'));
    }

    return res.status(200).json(
      createSuccessResponse({
        babies: babyInfos.rows.map((row) => ({
          baby_id: row.baby_id,
          baby_name: `${row.first_name} ${row.last_name}`,
          gender: row.gender,
          weight: row.weight,
          height: row.height,
          birthdate: row.birthdate,
        })),
      })
    );
  } catch (error) {
    logger.error(error);
    return res.status(500).json(createErrorResponse('Error fetching assigned babies'));
  }
};
