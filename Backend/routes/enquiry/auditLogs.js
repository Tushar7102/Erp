const express = require('express');
const {
  getAuditLogs,
  getAuditLogById,
  createAuditLog,
  getUserActivity,
  getEntityHistory,
  getSystemActivitySummary,
  getAuditAnalytics,
  getMostActiveUsers,
  getSecurityEvents,
  getFailedLoginAttempts,
  exportAuditLogs,
  archiveOldLogs,
  deleteAuditLog,
  getModelActivityLogs
} = require('../../controllers/enquiry/auditLogs');

const router = express.Router();

const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

// Get all audit logs (Admin only)
router.get('/', authorize('Admin'), getAuditLogs);

// Create new audit log
router.post('/', createAuditLog);

// Get audit analytics (Admin only)
router.get('/analytics', authorize('Admin'), getAuditAnalytics);

// Get system activity summary (Admin only)
router.get('/system/activity-summary', authorize('Admin'), getSystemActivitySummary);

// Get most active users (Admin only)
router.get('/analytics/active-users', authorize('Admin'), getMostActiveUsers);

// Get security events (Admin only)
router.get('/security/events', authorize('Admin'), getSecurityEvents);

// Get failed login attempts (Admin only)
router.get('/security/failed-logins', authorize('Admin'), getFailedLoginAttempts);

// Export audit logs (Admin only)
router.get('/export', authorize('Admin'), exportAuditLogs);

// Archive old logs (Admin only)
router.post('/archive', authorize('Admin'), archiveOldLogs);

// Get model-specific audit logs
router.get('/models/:model_name', getModelActivityLogs);

// Get user activity
router.get('/user/:user_id/activity', getUserActivity);

// Get entity history
router.get('/entity/:entity_type/:entity_id/history', getEntityHistory);

// Routes for specific audit log
router.route('/:id')
  .get(authorize('Admin'), getAuditLogById)
  .delete(authorize('Admin'), deleteAuditLog);

module.exports = router;
