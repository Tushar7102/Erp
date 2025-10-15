const express = require('express');
const {
  getInfoStatuses,
  getInfoStatus,
  createInfoStatus,
  updateInfoStatus,
  deleteInfoStatus,
  getStatusesByCategory,
  getActiveStatuses,
  getDefaultStatus,
  setDefaultStatus,
  getStatusesBySlaImpact,
  getStatusStatistics,
  bulkUpdateStatusOrder,
  toggleStatusActive,
  getStatusWorkflow,
  validateStatusTransition
} = require('../../controllers/info/infoStatuses');

const InfoStatus = require('../../models/info/InfoStatus');

const router = express.Router({ mergeParams: true });

// Bring in middleware
const { protect, authorize } = require('../../middleware/auth');
const advancedResults = require('../../middleware/advancedResults');

// Set up routes
router
  .route('/')
  .get(
    protect,
    advancedResults(InfoStatus, [
      { path: 'created_by', select: 'name email' },
      { path: 'updated_by', select: 'name email' }
    ]),
    getInfoStatuses
  )
  .post(protect, authorize('admin', 'manager'), createInfoStatus);

router
  .route('/:id')
  .get(protect, getInfoStatus)
  .put(protect, authorize('admin', 'manager'), updateInfoStatus)
  .delete(protect, authorize('admin'), deleteInfoStatus);

// Statuses by category
router
  .route('/category/:category')
  .get(protect, getStatusesByCategory);

// Active statuses
router
  .route('/active')
  .get(protect, getActiveStatuses);

// Default status
router
  .route('/default')
  .get(protect, getDefaultStatus);

router
  .route('/:id/set-default')
  .put(protect, authorize('admin', 'manager'), setDefaultStatus);

// Statuses by SLA impact
router
  .route('/sla-impact/:impact')
  .get(protect, getStatusesBySlaImpact);

// Statistics
router
  .route('/statistics')
  .get(protect, getStatusStatistics);

// Workflow
router
  .route('/workflow')
  .get(protect, getStatusWorkflow);

// Bulk operations
router
  .route('/bulk-order')
  .put(protect, authorize('admin', 'manager'), bulkUpdateStatusOrder);

// Toggle active state
router
  .route('/:id/toggle-active')
  .put(protect, authorize('admin', 'manager'), toggleStatusActive);

// Validate status transition
router
  .route('/validate-transition')
  .post(protect, validateStatusTransition);

module.exports = router;