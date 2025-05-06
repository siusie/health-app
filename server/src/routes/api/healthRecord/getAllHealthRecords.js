// server/src/routes/api/healthRecord/getAllHealthRecord.js

const logger = require('../../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../utils/response');
const pool = require('../../../../database/db');

// GET /doctor/:doctorId/healthRecords - Get health records from assigned baby to a doctor
module.exports.getAllHealthRecords = async (req, res) => {
  const doctorId = req.params.doctorId;

  try {
    // Fetch all assinged babies to the doctor
    const result1 = await pool.query(
      `SELECT * FROM doctor_baby WHERE doctor_id = $1`,
      [doctorId]
    );
    const babies = result1.rows;
    if (babies.length === 0) {
      return res
        .status(404)
        .json(createErrorResponse('No babies assigned to this doctor'));
    }
    const babyIds = babies.map((baby) => baby.baby_id);

    const result2 = await pool.query(
      `SELECT * FROM healthrecord WHERE baby_id = ANY($1::int[])`,
      [babyIds]
    );
    const healthRecords = result2.rows;

    const result3 = await pool.query(
      `SELECT baby_id, first_name, last_name FROM baby WHERE baby_id = ANY($1::int[])`,
      [babyIds]
    );
    const babyNames = result3.rows;

    // Combine baby names with their health records
    const combinedData = healthRecords.map((record) => {
      const baby = babyNames.find((baby) => baby.baby_id === record.baby_id);
      return {
        ...record,
        first_name: baby.first_name,
        last_name: baby.last_name,
      };
    });
    return res.status(200).json(createSuccessResponse({ combinedData }));
  } catch (err) {
    logger.error(
      err,
      `ERROR in GET /healthRecord, Error fetching health records`
    );

    res
      .status(500)
      .send(
        createErrorResponse(
          500,
          `ERROR in GET /healthRecord, Error fetching health records`
        )
      );
  }
};
