const express = require('express');
const {
  getAutomationTriggers,
  getAutomationTrigger,
  createAutomationTrigger,
  updateAutomationTrigger,
  deleteAutomationTrigger,
  activateAutomationTrigger,
  deactivateAutomationTrigger,
  getAutomationTriggersByType,
  getAutomationTriggersByEvent,
  executeAutomationTrigger,
  getAutomationTriggerAnalytics,
  testAutomationTrigger
} = require('../../controllers/enquiry/automationTriggers');

const router = express.Router();

const { protect, authorize } = require('../../middleware/auth');
const auditLogger = require('../../middleware/auditLogger');

// All routes require authentication
router.use(protect);

// Public routes (for authenticated users)
router.route('/')
  .get(getAutomationTriggers)
  .post(authorize('admin'), auditLogger({ entityType: 'AutomationTrigger', action: 'CREATE' }), createAutomationTrigger);

router.route('/type/:type')
  .get(getAutomationTriggersByType);

router.route('/event/:event')
  .get(getAutomationTriggersByEvent);

router.route('/:id')
  .get(getAutomationTrigger)
  .put(authorize('admin'), auditLogger({ entityType: 'AutomationTrigger', action: 'UPDATE' }), updateAutomationTrigger)
  .delete(authorize('admin'), auditLogger({ entityType: 'AutomationTrigger', action: 'DELETE' }), deleteAutomationTrigger);

router.route('/:id/activate')
  .patch(authorize('admin'), auditLogger({ entityType: 'AutomationTrigger', action: 'UPDATE' }), activateAutomationTrigger);

router.route('/:id/deactivate')
  .patch(authorize('admin'), auditLogger({ entityType: 'AutomationTrigger', action: 'UPDATE' }), deactivateAutomationTrigger);

router.route('/:id/execute')
  .post(authorize('admin'), executeAutomationTrigger);

router.route('/:id/analytics')
  .get(getAutomationTriggerAnalytics);

router.route('/:id/test')
  .post(authorize('admin'), testAutomationTrigger);

module.exports = router;
