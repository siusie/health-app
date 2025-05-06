// server/src/routes/api/profilePicture/deleteProfilePicture.js
const pool = require('../../../../database/db');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const { getUserId } = require('../../../utils/userIdHelper');
const { checkBabyBelongsToUser } = require('../../../utils/babyAccessHelper');
const logger = require('../../../utils/logger');

// DELETE /v1/profile-picture/:entityType/:entityId
// Delete a profile picture
module.exports = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    // Validate parameters
    if (!entityType || !['user', 'baby'].includes(entityType)) {
      return res.status(400).json(createErrorResponse(400, 'Invalid entity type'));
    }
    
    if (!entityId || isNaN(parseInt(entityId))) {
      return res.status(400).json(createErrorResponse(400, 'Invalid entity ID'));
    }
    
    // Get the authenticated user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json(createErrorResponse(401, 'No authorization token provided'));
    }
    
    const userId = await getUserId(authHeader);
    
    // Verify authorization
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
          logger.warn(`Delete authorization failed: userId (${parsedUserId}) !== entityId (${parsedEntityId})`);
          return res.status(403).json(createErrorResponse(403, 'Not authorized to modify this user profile'));
        }
    }
    
    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete from profile_images table
      await client.query(
        'DELETE FROM profile_images WHERE entity_type = $1 AND entity_id = $2',
        [entityType, entityId]
      );
      
      // Reset the profile_picture_url in the respective table
      const defaultUrl = entityType === 'user'
        ? '/BlankProfilePictures/BlankUserPicture.avif'
        : '/BlankProfilePictures/BlankBabyPicture.png';
      
      if (entityType === 'user') {
        await client.query(
          'UPDATE users SET profile_picture_url = $1 WHERE user_id = $2',
          [defaultUrl, entityId]
        );
      } else {
        await client.query(
          'UPDATE baby SET profile_picture_url = $1 WHERE baby_id = $2',
          [defaultUrl, entityId]
        );
      }
      
      await client.query('COMMIT');
      
      return res.json(createSuccessResponse({
        message: 'Profile picture deleted successfully',
        defaultImageUrl: defaultUrl
      }));
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error({ error }, 'Error in profile picture deletion transaction');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error({ error }, 'Profile picture deletion error');
    return res.status(500).json(createErrorResponse(500, error.message || 'Internal server error'));
  }
};