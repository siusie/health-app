// server/src/routes/api/profilePicture/uploadProfilePicture.js
const { optimizeImage } = require('../../../utils/imageProcessing');
const { createImageUploadHandler } = require('../../../utils/uploadHandler');
const pool = require('../../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const { getUserId } = require('../../../utils/userIdHelper');
const { checkBabyBelongsToUser } = require('../../../utils/babyAccessHelper');
const logger = require('../../../utils/logger');

// Create the upload handler
const uploadHandler = createImageUploadHandler({
  maxSize: 5 * 1024 * 1024, // 5MB
  fieldName: 'profilePicture'
});

// POST /v1/profile-picture/upload
// Upload a profile picture with support for multiple image formats
module.exports = [
  // First middleware: Handle the upload with validation
  uploadHandler,
  
  // Second middleware: Process the uploaded image and save to database
  async (req, res) => {
    try {
      const { entityType, entityId } = req.body;
      
      // Log all request information for debugging
      logger.info('Upload attempt details', { 
        entityType, 
        entityId, 
        hasFile: !!req.file,
        contentType: req.get('Content-Type'),
        bodyKeys: Object.keys(req.body)
      });
      
      // Validate parameters
      if (!entityType || !['user', 'baby'].includes(entityType)) {
        return res.status(400).json(createErrorResponse(400, 'Invalid entity type. Must be "user" or "baby".'));
      }
      
      if (!entityId) {
        return res.status(400).json(createErrorResponse(400, 'Entity ID is required.'));
      }
      
      if (!req.file) {
        return res.status(400).json(createErrorResponse(400, 'No file uploaded.'));
      }
      
      // Get the authenticated user ID
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json(createErrorResponse(401, 'No authorization token provided'));
      }
      
      const userId = await getUserId(authHeader);
      
      // Log user ID information for debugging
      logger.info('Authorization check details', {
        userId,
        entityId,
        entityType,
        userIdType: typeof userId,
        entityIdType: typeof entityId
      });
      
      // Verify authorization - with improved type handling
      if (entityType === 'baby') {
        const hasAccess = await checkBabyBelongsToUser(entityId, userId);
        if (!hasAccess) {
          return res.status(403).json(createErrorResponse(403, 'Not authorized to modify this baby profile'));
        }
      } else if (entityType === 'user') {
        // Convert both to strings to ensure consistent comparison
        const parsedUserId = String(userId);
        const parsedEntityId = String(entityId);
        
        if (parsedUserId !== parsedEntityId) {
          logger.warn(`Authorization failed: userId (${parsedUserId}) !== entityId (${parsedEntityId})`);
          return res.status(403).json(createErrorResponse(403, 'Not authorized to modify this user profile'));
        }
      }
            
      // Optimize the image for storage
      const originalFile = req.file;
      logger.info(`Processing ${originalFile.originalname} (${originalFile.mimetype}, ${originalFile.size} bytes)`);
      
      const optimizedImage = await optimizeImage(
        originalFile.buffer, 
        originalFile.mimetype,
        originalFile.originalname
      );
      
      logger.info(`Optimized to ${optimizedImage.mimeType}, ${optimizedImage.fileSize} bytes, ${optimizedImage.width}x${optimizedImage.height}`);
      
      // Begin transaction
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Check if there's an existing profile image
        const existingImage = await client.query(
          'SELECT image_id FROM profile_images WHERE entity_type = $1 AND entity_id = $2',
          [entityType, entityId]
        );
        
        let imageId;
        
        if (existingImage.rows.length > 0) {
          // Update existing image
          const result = await client.query(
            `UPDATE profile_images 
             SET image_data = $1, mime_type = $2, original_filename = $3, file_size = $4, 
                 width = $5, height = $6, is_animated = $7, created_at = CURRENT_TIMESTAMP
             WHERE entity_type = $8 AND entity_id = $9
             RETURNING image_id`,
            [
              optimizedImage.buffer,
              optimizedImage.mimeType,
              originalFile.originalname,
              optimizedImage.fileSize,
              optimizedImage.width,
              optimizedImage.height,
              optimizedImage.isAnimated || false,
              entityType,
              entityId
            ]
          );
          imageId = result.rows[0].image_id;
        } else {
          // Insert new image
          const result = await client.query(
            `INSERT INTO profile_images
             (entity_type, entity_id, image_data, mime_type, original_filename, file_size, width, height, is_animated)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING image_id`,
            [
              entityType,
              entityId,
              optimizedImage.buffer,
              optimizedImage.mimeType,
              originalFile.originalname,
              optimizedImage.fileSize,
              optimizedImage.width,
              optimizedImage.height,
              optimizedImage.isAnimated || false
            ]
          );
          imageId = result.rows[0].image_id;
        }
        
        // Update the profile_picture_url in the respective table
        // Add a cache-busting parameter to force refresh of the image
        const profileUrl = `/v1/profile-picture/${entityType}/${entityId}?v=${Date.now()}`;
        
        if (entityType === 'user') {
          await client.query(
            'UPDATE users SET profile_picture_url = $1 WHERE user_id = $2',
            [profileUrl, entityId]
          );
        } else {
          await client.query(
            'UPDATE baby SET profile_picture_url = $1 WHERE baby_id = $2',
            [profileUrl, entityId]
          );
        }
        
        await client.query('COMMIT');
        
        return res.json(createSuccessResponse({
          message: 'Profile picture uploaded successfully',
          profileUrl,
          originalFormat: originalFile.mimetype,
          optimizedFormat: optimizedImage.mimeType,
          dimensions: `${optimizedImage.width}x${optimizedImage.height}`,
          originalSize: originalFile.size,
          optimizedSize: optimizedImage.fileSize,
          compressionRatio: (originalFile.size / optimizedImage.fileSize).toFixed(2)
        }));
      } catch (error) {
        await client.query('ROLLBACK');
        logger.error({ error }, 'Error in profile picture upload transaction');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error({ error }, 'Profile picture upload error');
      return res.status(500).json(createErrorResponse(500, error.message || 'Internal server error'));
    }
  }
];