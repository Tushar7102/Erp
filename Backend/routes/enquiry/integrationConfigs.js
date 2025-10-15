const express = require('express');
const {
  getIntegrationConfigs,
  getIntegrationConfigById,
  createIntegrationConfig,
  updateIntegrationConfig,
  deleteIntegrationConfig,
  testConnection,
  enableIntegration,
  disableIntegration,
  getIntegrationLogs,
  syncData,
  getAvailableIntegrations,
  exportIntegrationConfigs
} = require('../../controllers/enquiry/integrationConfigs');

const router = express.Router();

const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

// Get all integration configs with filters
router.get('/', authorize('Admin', 'Sales Head'), getIntegrationConfigs);

// Create new integration config
router.post('/', authorize('Admin'), createIntegrationConfig);

// Get available integrations
router.get('/available', authorize('Admin'), getAvailableIntegrations);

// Export integration configs
router.get('/export', authorize('Admin'), exportIntegrationConfigs);

// Test connection for integration
router.post('/:id/test', authorize('Admin'), testConnection);

// Enable integration
router.put('/:id/enable', authorize('Admin'), enableIntegration);

// Disable integration
router.put('/:id/disable', authorize('Admin'), disableIntegration);

// Sync data for integration
router.post('/:id/sync', authorize('Admin'), syncData);

// Get integration logs
router.get('/:id/logs', authorize('Admin'), getIntegrationLogs);

// Routes for specific integration config
router.route('/:id')
  .get(authorize('Admin', 'Sales Head'), getIntegrationConfigById)
  .put(authorize('Admin'), updateIntegrationConfig)
  .delete(authorize('Admin'), deleteIntegrationConfig);

module.exports = router;
