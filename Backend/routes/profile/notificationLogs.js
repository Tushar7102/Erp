const express = require('express');
const {
  getNotificationLogs,
  getNotificationLogById,
  createNotificationLog,
  updateNotificationLog,
  deleteNotificationLog,
  markAsRead,
  markAsDelivered,
  markAsFailed,
  getUserNotifications,
  getUnreadNotifications,
  bulkMarkAsRead,
  bulkDelete,
  getNotificationAnalytics,
  exportNotificationLogs
} = require('../../controllers/profile/notificationLogs');

const router = express.Router();

const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

// Get all notification logs with filters
router.get('/', getNotificationLogs);

// Create new notification log
router.post('/', authorize('Admin', 'Sales Head'), createNotificationLog);

// Get notification analytics
router.get('/analytics', authorize('Admin', 'Sales Head'), getNotificationAnalytics);

// Export notification logs
router.get('/export', authorize('Admin', 'Sales Head'), exportNotificationLogs);

// Get user notifications
router.get('/user/:user_id', getUserNotifications);

// Get unread notifications for current user
router.get('/unread', getUnreadNotifications);

// Bulk operations
router.put('/bulk/mark-read', bulkMarkAsRead);
router.delete('/bulk/delete', bulkDelete);

// Mark notification as read
router.put('/:id/read', markAsRead);

// Mark notification as delivered
router.put('/:id/delivered', authorize('Admin', 'Sales Head'), markAsDelivered);

// Mark notification as failed
router.put('/:id/failed', authorize('Admin', 'Sales Head'), markAsFailed);

// Routes for specific notification log
router.route('/:id')
  .get(getNotificationLogById)
  .put(authorize('Admin', 'Sales Head'), updateNotificationLog)
  .delete(authorize('Admin'), deleteNotificationLog);

module.exports = router;
