const express = require('express');
const {
  getSlaRules,
  getSlaRule,
  createSlaRule,
  updateSlaRule,
  deleteSlaRule,
  getActiveSlaRules,
  getDefaultSlaRule,
  setDefaultSlaRule,
  getSlaRulesByType,
  calculateSla,
  getSlaPerformance,
  toggleSlaRuleStatus
} = require('../../controllers/info/infoSlaRules');

const InfoSlaRule = require('../../models/info/InfoSlaRule');

const router = express.Router({ mergeParams: true });

// Bring in middleware
const { protect, authorize } = require('../../middleware/auth');
const advancedResults = require('../../middleware/advancedResults');

// Set up routes
router
  .route('/')
  .get(
    protect,
    advancedResults(InfoSlaRule, [
      { path: 'applicable_info_types', select: 'type_name type_category' },
      { path: 'applicable_statuses', select: 'status_name status_category' },
      { path: 'created_by', select: 'name email' },
      { path: 'updated_by', select: 'name email' }
    ]),
    getSlaRules
  )
  .post(protect, authorize('admin', 'manager'), createSlaRule);

router
  .route('/:id')
  .get(protect, getSlaRule)
  .put(protect, authorize('admin', 'manager'), updateSlaRule)
  .delete(protect, authorize('admin'), deleteSlaRule);

// Active SLA rules
router
  .route('/active')
  .get(protect, getActiveSlaRules);

// Default SLA rule
router
  .route('/default')
  .get(protect, getDefaultSlaRule);

router
  .route('/:id/set-default')
  .put(protect, authorize('admin', 'manager'), setDefaultSlaRule);

// SLA rules by type
router
  .route('/type/:typeId')
  .get(protect, getSlaRulesByType);

// Calculate SLA for profile
router
  .route('/calculate/:profileId')
  .get(protect, calculateSla);

// Performance metrics
router
  .route('/performance')
  .get(protect, getSlaPerformance);

// Toggle active state
router
  .route('/:id/toggle-active')
  .put(protect, authorize('admin', 'manager'), toggleSlaRuleStatus);

module.exports = router;