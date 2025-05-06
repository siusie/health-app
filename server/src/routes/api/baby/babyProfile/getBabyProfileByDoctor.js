// src/routes/api/baby/babyProfile/getBabyProfileByDoctor.js
const pool = require('../../../../../database/db');
const { createErrorResponse } = require('../../../../utils/response');
const { getUserId } = require('../../../../utils/userIdHelper');
const { checkBabyBelongsToUser } = require('../../../../utils/babyAccessHelper');

// GET /v1/doctor/:doctor_id/baby/:baby_id/profile
// Get a baby's profile assigned to a doctor
module.exports = async (req, res) => {
  try {
    const { doctor_id, baby_id } = req.params;

    // Validate baby_id parameter
    if (!baby_id || baby_id === 'undefined') {
      return res.status(400).json(createErrorResponse(400, 'Missing baby_id parameter'));
    }

    // Validate if baby_id is a number
    if (isNaN(baby_id)) {
      return res.status(400).json(createErrorResponse(400, 'Invalid baby_id parameter'));
    }

    const babyProfile = await pool.query(
      `SELECT first_name, last_name, gender, weight, height, birthdate
       FROM baby WHERE baby_id = $1`,
      [baby_id]
    );

    if (babyProfile.rows.length === 0) {
      return res.status(404).json(createErrorResponse(404, 'Baby profile not found'));
    }

    return res.status(200).json({
      status: 'ok',
      data: babyProfile.rows[0],
    });
  } catch (error) {
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
