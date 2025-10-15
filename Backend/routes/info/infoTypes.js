const express = require('express');
const {
  getInfoTypes,
  getInfoType,
  createInfoType,
  updateInfoType,
  deleteInfoType,
  getTypesByCategory,
  getActiveTypes,
  getDefaultType,
  setDefaultType,
  getTypesByChannel,
  getTypeStatistics,
  bulkUpdateTypeOrder,
  toggleTypeActive,
  getTypeWorkflow,
  getTypesWithSla,
  updateTypeSlaRule,
  getTypePerformance
} = require('../../controllers/info/infoTypes');

const InfoType = require('../../models/info/InfoType');

const router = express.Router({ mergeParams: true });

// Bring in middleware
const { protect, authorize } = require('../../middleware/auth');
const advancedResults = require('../../middleware/advancedResults');

// Set up routes
router
  .route('/')
  .get(
    protect,
    advancedResults(InfoType, [
      { path: 'default_sla_rule', select: 'rule_name response_time_hours' },
      { path: 'created_by', select: 'name email' },
      { path: 'updated_by', select: 'name email' }
    ]),
    getInfoTypes
  )
  .post(protect, authorize('admin', 'manager'), createInfoType);

router
  .route('/:id')
  .get(protect, getInfoType)
  .put(protect, authorize('admin', 'manager'), updateInfoType)
  .delete(protect, authorize('admin'), deleteInfoType);

// Types by category
router
  .route('/category/:category')
  .get(protect, getTypesByCategory);

// Active types
router
  .route('/active')
  .get(protect, getActiveTypes);

// Default type
router
  .route('/default')
  .get(protect, getDefaultType);

router
  .route('/:id/set-default')
  .put(protect, authorize('admin', 'manager'), setDefaultType);

// Types by request channel
router
  .route('/channel/:channel')
  .get(protect, getTypesByChannel);

// Types with SLA rules
router
  .route('/with-sla')
  .get(protect, getTypesWithSla);

// Statistics
router
  .route('/statistics')
  .get(protect, getTypeStatistics);

// Workflow
router
  .route('/workflow')
  .get(protect, getTypeWorkflow);

// Performance metrics
router
  .route('/:id/performance')
  .get(protect, getTypePerformance);

// Bulk operations
router
  .route('/bulk-order')
  .put(protect, authorize('admin', 'manager'), bulkUpdateTypeOrder);

// Toggle active state
router
  .route('/:id/toggle-active')
  .put(protect, authorize('admin', 'manager'), toggleTypeActive);

// Update SLA rule
router
  .route('/:id/sla-rule')
  .put(protect, authorize('admin', 'manager'), updateTypeSlaRule);

module.exports = router;