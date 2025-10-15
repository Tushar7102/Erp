const express = require('express');
const {
  getInfoAttachments,
  getInfoAttachment,
  createInfoAttachment,
  updateInfoAttachment,
  deleteInfoAttachment,
  getAttachmentsByProfile,
  getAttachmentsByType,
  downloadAttachment,
  getAttachmentStatistics,
  getExpiredAttachments,
  cleanupExpiredAttachments,
  updateAttachmentSecurity,
  getAttachmentVersions
} = require('../../controllers/info/infoAttachments');

const InfoAttachment = require('../../models/info/InfoAttachment');

const router = express.Router({ mergeParams: true });

// Bring in middleware
const { protect, authorize } = require('../../middleware/auth');
const advancedResults = require('../../middleware/advancedResults');

// Set up routes
router
  .route('/')
  .get(
    protect,
    advancedResults(InfoAttachment, [
      { path: 'info_profile', select: 'info_id title status' },
      { path: 'attachment_type', select: 'type_name type_category' },
      { path: 'uploaded_by', select: 'name email' },
      { path: 'updated_by', select: 'name email' }
    ]),
    getInfoAttachments
  )
  .post(protect, createInfoAttachment);

router
  .route('/:id')
  .get(protect, getInfoAttachment)
  .put(protect, updateInfoAttachment)
  .delete(protect, authorize('admin', 'manager'), deleteInfoAttachment);

// Attachments by profile
router
  .route('/profile/:profileId')
  .get(protect, getAttachmentsByProfile);

// Attachments by type
router
  .route('/type/:typeId')
  .get(protect, getAttachmentsByType);

// Download attachment
router
  .route('/:id/download')
  .get(protect, downloadAttachment);

// Statistics
router
  .route('/statistics')
  .get(protect, getAttachmentStatistics);

// Expired attachments
router
  .route('/expired')
  .get(protect, getExpiredAttachments);

// Cleanup expired attachments
router
  .route('/cleanup-expired')
  .delete(protect, authorize('admin'), cleanupExpiredAttachments);

// Update security settings
router
  .route('/:id/security')
  .put(protect, authorize('admin', 'manager'), updateAttachmentSecurity);

// Attachment versions
router
  .route('/:id/versions')
  .get(protect, getAttachmentVersions);

module.exports = router;