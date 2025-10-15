const express = require('express');
const {
  getAutomationRules,
  getAutomationRule,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  toggleAutomationRuleStatus,
  getAutomationRulesByType,
  getActiveAutomationRules,
  testAutomationRule,
  executeAutomationRule
} = require('../../controllers/enquiry/automationRules');

const AutomationRule = require('../../models/enquiry/AutomationRule');

const router = express.Router();

const { protect, authorize } = require('../../middleware/auth');
const advancedResults = require('../../middleware/advancedResults');
const auditLogger = require('../../middleware/auditLogger');

// Routes with advanced results middleware
router
  .route('/')
  .get(
    protect,
    advancedResults(AutomationRule),
    getAutomationRules
  )
  .post(
    protect,
    authorize('Admin', 'Sales Head'),
    auditLogger({ entityType: 'AutomationRule', action: 'CREATE' }),
    createAutomationRule
  );

router
  .route('/active')
  .get(
    protect,
    getActiveAutomationRules
  );

router
  .route('/type/:type')
  .get(
    protect,
    getAutomationRulesByType
  );

router
  .route('/:id')
  .get(
    protect,
    getAutomationRule
  )
  .put(
    protect,
    authorize('Admin', 'Sales Head'),
    auditLogger({ entityType: 'AutomationRule', action: 'UPDATE' }),
    updateAutomationRule
  )
  .delete(
    protect,
    authorize('Admin'),
    auditLogger({ entityType: 'AutomationRule', action: 'DELETE' }),
    deleteAutomationRule
  );

router
  .route('/:id/toggle-status')
  .put(
    protect,
    authorize('Admin', 'Sales Head'),
    toggleAutomationRuleStatus
  );

router
  .route('/:id/test')
  .post(
    protect,
    authorize('Admin', 'Sales Head'),
    testAutomationRule
  );

router
  .route('/:id/execute')
  .post(
    protect,
    authorize('Admin', 'Sales Head'),
    executeAutomationRule
  );

module.exports = router;
