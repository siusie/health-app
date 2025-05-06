// src/routes/api/medicalProfessional/getAssignedBabiesByDoctorId.js

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');

// module.exports.getAssignedBabiesByDoctorId = async function (req, res) {
//   try {
//     const doctorId = req.params.doctor_id;
//     const query = `SELECT * FROM doctor_baby WHERE doctor_id = $1`;
//     const result = await pool.query(query, [doctorId]);
//     if (result.rows.length === 0) {
//       return res.status(404).json(createErrorResponse('No assigned babies found for this doctor'));
//     }
//     const babyIds = result.rows.map((row) => row.baby_id);

//     // Query to get baby details along with parent information
//     const babyInfos = await pool.query(
//       `SELECT
//         b.baby_id,
//         b.first_name AS baby_first_name,
//         b.last_name AS baby_last_name,
//         b.gender,
//         b.weight,
//         b.height,
//         b.birthdate,
//         u.user_id AS parent_id,
//         u.first_name AS parent_first_name,
//         u.last_name AS parent_last_name
//        FROM baby b
//        INNER JOIN user_baby ub ON b.baby_id = ub.baby_id
//        INNER JOIN users u ON ub.user_id = u.user_id
//        WHERE b.baby_id = ANY($1::int[])`,
//       [babyIds]
//     );

//     if (babyInfos.rows.length === 0) {
//       return res.status(404).json(createErrorResponse('No baby information found'));
//     }

//     return res.status(200).json(
//       createSuccessResponse({
//         babies: babyInfos.rows.map((row) => ({
//           baby_id: row.baby_id,
//           baby_name: `${row.baby_first_name} ${row.baby_last_name}`,
//           gender: row.gender,
//           weight: row.weight,
//           height: row.height,
//           birthdate: row.birthdate,
//           parent_id: row.parent_id,
//           parent_name: `${row.parent_first_name} ${row.parent_last_name}`,
//         })),
//       })
//     );
//   } catch (error) {
//     logger.error(error);
//     return res.status(500).json(createErrorResponse('Error fetching assigned babies'));
//   }
// };

module.exports.getAssignedBabiesByDoctorId = async function (req, res) {
  try {
    const doctorId = req.params.doctor_id;

    // Query to get baby details along with parent information
    const babyInfos = await pool.query(
      `SELECT
        b.baby_id,
        b.first_name AS baby_first_name,
        b.last_name AS baby_last_name,
        b.gender,
        b.weight,
        b.height,
        b.birthdate,
        u.user_id AS parent_id,
        u.first_name AS parent_first_name,
        u.last_name AS parent_last_name
       FROM baby b
       INNER JOIN user_baby ub ON b.baby_id = ub.baby_id
       INNER JOIN users u ON ub.user_id = u.user_id
       INNER JOIN doctor_baby db ON b.baby_id = db.baby_id
       WHERE db.doctor_id = $1`,
      [doctorId]
    );

    if (babyInfos.rows.length === 0) {
      return res.status(404).json(createErrorResponse('No baby information found'));
    }

    // Group babies by parent
    const parents = babyInfos.rows.reduce((acc, row) => {
      const parentId = row.parent_id;
      if (!acc[parentId]) {
        acc[parentId] = {
          parent_id: parentId,
          parent_name: `${row.parent_first_name} ${row.parent_last_name}`,
          babies: [],
        };
      }
      acc[parentId].babies.push({
        baby_id: row.baby_id,
        baby_name: `${row.baby_first_name} ${row.baby_last_name}`,
        gender: row.gender,
        weight: row.weight,
        height: row.height,
        birthdate: row.birthdate,
      });
      return acc;
    }, {});

    // Convert the grouped object into an array
    const parentList = Object.values(parents);

    return res.status(200).json(createSuccessResponse({ parents: parentList }));
  } catch (error) {
    logger.error(error);
    return res.status(500).json(createErrorResponse('Error fetching assigned babies'));
  }
};
