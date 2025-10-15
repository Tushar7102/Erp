const express = require('express');
const {
  getSourceChannels,
  getSourceChannel,
  createSourceChannel,
  updateSourceChannel,
  deleteSourceChannel,
  toggleSourceChannelStatus,
  updateCredentials,
  updateWebhookUrl,
  updateFieldMapping,
  getChannelsBySourceType,
  getChannelsByChannelType,
  getActiveChannels
} = require('../../controllers/enquiry/sourceChannels');

// const SourceChannel = require('../models/SourceChannel'); // Commented out - SourceChannel model not found

const router = express.Router();

const { protect, authorize, checkPermission } = require('../../middleware/auth');
const advancedResults = require('../../middleware/advancedResults');

// All routes below this line are protected and require authentication
router.use(protect);

// Routes restricted to Admin role
// Allow Telecaller and Sales Head to access source-channels (for dynamic dropdowns)
router.use(authorize('Admin', 'Sales Head', 'Telecaller'));

// Source Channels routes
router
  .route('/')
  .get(/* advancedResults(SourceChannel), */ getSourceChannels) // Commented out - SourceChannel model not found
  .post(checkPermission('source_channel_create'), createSourceChannel);

router
  .route('/:id')
  .get(checkPermission('source_channel_read'), getSourceChannel)
  .put(checkPermission('source_channel_update'), updateSourceChannel)
  .delete(checkPermission('source_channel_delete'), deleteSourceChannel);

router
  .route('/:id/status')
  .put(checkPermission('source_channel_update'), toggleSourceChannelStatus);

router
  .route('/:id/api-credentials')
  .put(checkPermission('source_channel_update'), updateCredentials);

router
  .route('/:id/webhook-url')
  .put(checkPermission('source_channel_update'), updateWebhookUrl);

router
  .route('/:id/field-mapping')
  .put(checkPermission('source_channel_update'), updateFieldMapping);

router
  .route('/source-type/:type')
  .get(checkPermission('source_channel_read'), getChannelsBySourceType);

router
  .route('/channel-type/:type')
  .get(checkPermission('source_channel_read'), getChannelsByChannelType);

router
  .route('/active')
  .get(checkPermission('source_channel_read'), getActiveChannels);

module.exports = router;
