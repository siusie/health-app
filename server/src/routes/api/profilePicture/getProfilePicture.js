// server/src/routes/api/profilePicture/getProfilePicture.js
const pool = require('../../../../database/db');
const { createErrorResponse } = require('../../../utils/response');
const logger = require('../../../utils/logger');

// GET /v1/profile-picture/:entityType/:entityId
// Get a profile picture with support for responsive resizing and caching
module.exports = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const requestedSize = parseInt(req.query.size) || 0; // Optional size parameter for responsive images
    
    // Validate parameters
    if (!entityType || !['user', 'baby'].includes(entityType)) {
      return res.status(400).json(createErrorResponse(400, 'Invalid entity type'));
    }
    
    if (!entityId || isNaN(parseInt(entityId))) {
      return res.status(400).json(createErrorResponse(400, 'Invalid entity ID'));
    }
    
    // Query the database for the image
    const result = await pool.query(
      'SELECT image_data, mime_type, width, height, file_size, is_animated, original_filename FROM profile_images WHERE entity_type = $1 AND entity_id = $2',
      [entityType, entityId]
    );
    
    if (result.rows.length === 0) {
      // Return default image if no custom image is found
      const defaultPath = entityType === 'user' 
        ? '/BlankProfilePictures/BlankUserPicture.avif'
        : '/BlankProfilePictures/BlankBabyPicture.png';
        
      // Send a 302 redirect to the default image
      return res.redirect(302, defaultPath);
    }
    
    const { image_data, mime_type, width, height, file_size, is_animated, original_filename } = result.rows[0];
    
    // Generate ETag for conditional requests
    const etag = `"${entityType}-${entityId}-${file_size}"`;
    
    // Check If-None-Match header for conditional requests
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && ifNoneMatch === etag) {
      return res.status(304).end(); // Not Modified
    }
    
    // Set appropriate cache headers based on image type
    const maxAge = is_animated ? 86400 : 2592000; // 1 day for animated GIFs, 30 days for static images
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    res.setHeader('Content-Type', mime_type);
    res.setHeader('ETag', etag);
    
    // Provide image dimensions for client-side optimization
    res.setHeader('X-Image-Width', width || 0);
    res.setHeader('X-Image-Height', height || 0);
    res.setHeader('X-Image-Animated', is_animated || false);
    
    // Add Content-Disposition header for downloads
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(original_filename || 'profile-picture')}"`);
    
    // Handle specific size requests for responsive images
    if (requestedSize > 0 && !is_animated && image_data) {
      try {
        // Only resize if requested size is smaller than original
        if (requestedSize < width) {
          const sharp = require('sharp');
          const resizedImage = await sharp(image_data)
            .resize(requestedSize, null, { 
              fit: 'inside',
              withoutEnlargement: true 
            })
            .toBuffer();
          
          return res.send(resizedImage);
        }
      } catch (resizeError) {
        logger.warn(`Resize failed for ${entityType}/${entityId} to ${requestedSize}px: ${resizeError.message}`);
        // Continue with original image if resize fails
      }
    }
    
    // Send the original image data
    return res.send(image_data);
  } catch (error) {
    logger.error({ error }, 'Error retrieving profile picture');
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};