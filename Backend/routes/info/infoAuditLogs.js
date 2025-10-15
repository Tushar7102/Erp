const express = require('express');
const {
  getInfoAuditLogs,
  getInfoAuditLog,
  createInfoAuditLog,
  getAuditLogsByEntity,
  getAuditLogsByUser,
  getAuditLogsByAction,
  getHighRiskAuditLogs,
  getAuditStatistics,
  getAuditTimeline,
  getComplianceReport,
  exportAuditLogs,
  cleanupOldAuditLogs
} = require('../../controllers/info/infoAuditLogs');

const InfoAuditLog = require('../../models/info/InfoAuditLog');

const router = express.Router({ mergeParams: true });

// Bring in middleware
const { protect, authorize } = require('../../middleware/auth');
const advancedResults = require('../../middleware/advancedResults');

// Set up routes
router
  .route('/')
  .get(
    protect,
    authorize('admin', 'manager'),
    advancedResults(InfoAuditLog, [
      { path: 'user_id', select: 'name email' },
      { path: 'created_by', select: 'name email' }
    ]),
    getInfoAuditLogs
  )
  .post(protect, createInfoAuditLog);

router
  .route('/:id')
  .get(protect, authorize('admin', 'manager'), getInfoAuditLog);

// Audit logs by entity
router
  .route('/entity/:entityType/:entityId')
  .get(protect, authorize('admin', 'manager'), getAuditLogsByEntity);

// Audit logs by user
router
  .route('/user/:userId')
  .get(protect, authorize('admin', 'manager'), getAuditLogsByUser);

// Audit logs by action type
router
  .route('/action/:actionType')
  .get(protect, authorize('admin', 'manager'), getAuditLogsByAction);

// High risk audit logs
router
  .route('/high-risk')
  .get(protect, authorize('admin'), getHighRiskAuditLogs);

// Statistics
router
  .route('/statistics')
  .get(protect, authorize('admin', 'manager'), getAuditStatistics);

// Timeline
router
  .route('/timeline')
  .get(protect, authorize('admin', 'manager'), getAuditTimeline);

// Compliance report
router
  .route('/compliance-report')
  .get(protect, authorize('admin'), getComplianceReport);

// Export audit logs
router
  .route('/export')
  .get(protect, authorize('admin'), exportAuditLogs);

// Cleanup old audit logs
router
  .route('/cleanup')
  .delete(protect, authorize('admin'), cleanupOldAuditLogs);

module.exports = router;