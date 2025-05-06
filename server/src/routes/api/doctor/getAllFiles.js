// src/routes/api/doctor/getAllFiles.js
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');
const { getUserId } = require('../../../utils/userIdHelper');

// Doctor get all files sent by parents
module.exports.getAllFiles = async (req, res) => {
  try {
    const { doctorId } = req.params;
    // Decode the token to get the user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json(createErrorResponse(401, 'No authorization token provided'));
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return res.status(404).json(createErrorResponse(404, 'User not found'));
    }

    // Query the database for files sent by all parents
    const result = await pool.query(
      `SELECT document_id, filename, mimetype, file_data, baby_id, uploaded_by, shared_with, is_from_doctor, created_at
         FROM sharing_health_documents_baby_doctor
         WHERE is_from_doctor = false AND shared_with = $1
         ORDER BY created_at DESC`,
      [doctorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse(404, 'Files not found in database'));
    }

    // Map the result to include uploaded_by and baby_id explicitly
    const files = result.rows.map((file) => ({
      document_id: file.document_id,
      filename: file.filename,
      mimetype: file.mimetype,
      file_data: file.file_data,
      baby_id: file.baby_id,
      uploaded_by: file.uploaded_by,
      shared_with: file.shared_with,
      is_from_doctor: file.is_from_doctor,
      created_at: file.created_at,
    }));

    return res.status(200).json(createSuccessResponse({ files }));
  } catch (error) {
    console.error('Error getting files from all parents:', error); // Log the actual error
    return res.status(500).json(createErrorResponse(500, error));
  }
};
