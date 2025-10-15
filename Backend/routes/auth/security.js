const express = require('express');
const {
  getSecurityRules,
  getSecurityRule,
  createSecurityRule,
  updateSecurityRule,
  deleteSecurityRule,
  getSecurityAlerts,
  getActiveAlerts,
  resolveAlert,
  getSecurityLogs,
  getSecurityStats,
  testSecurityRule,
  toggleRuleStatus
} = require('../../controllers/auth/security');

const SecurityRule = require('../../models/auth/SecurityRule');
const SecurityAlert = require('../../models/auth/SecurityAlert');
const SecurityLog = require('../../models/auth/SecurityLog');

const router = express.Router();

const { protect, authorize } = require('../../middleware/auth');
const advancedResults = require('../../middleware/advancedResults');

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

// Security Rules routes
router
  .route('/rules')
  .get(
    advancedResults(SecurityRule, [
      { path: 'created_by', select: 'name email' },
      { path: 'updated_by', select: 'name email' },
      { path: 'applicable_roles', select: 'name' },
      { path: 'exclude_roles', select: 'name' }
    ]),
    getSecurityRules
  )
  .post(createSecurityRule);

router
  .route('/rules/:id')
  .get(getSecurityRule)
  .put(updateSecurityRule)
  .delete(deleteSecurityRule);

router
  .route('/rules/:id/test')
  .post(testSecurityRule);

router
  .route('/rules/:id/toggle')
  .put(toggleRuleStatus);

// Security Alerts routes
router
  .route('/alerts')
  .get(
    advancedResults(SecurityAlert, [
      { path: 'rule', select: 'name type priority' },
      { path: 'user_affected', select: 'name email' },
      { path: 'resolved_by', select: 'name email' }
    ]),
    getSecurityAlerts
  );

router
  .route('/alerts/active')
  .get(getActiveAlerts);

router
  .route('/alerts/:id/resolve')
  .put(resolveAlert);

// Security Logs routes
router
  .route('/logs')
  .get(
    advancedResults(SecurityLog, [
      { path: 'related_rule', select: 'name type' },
      { path: 'related_alert', select: 'title severity' },
      { path: 'user', select: 'name email' }
    ]),
    getSecurityLogs
  );

// Security Stats route
router
  .route('/stats')
  .get(getSecurityStats);

module.exports = router;