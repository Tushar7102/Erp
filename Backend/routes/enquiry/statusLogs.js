const express = require('express');
const {
  getStatusLogs,
  getStatusLogById,
  createStatusLog,
  updateStatusLog,
  deleteStatusLog,
  getEnquiryStatusHistory,
  getStatusAnalytics,
  getStatusTransitions,
  getStatusDuration,
  exportStatusLogs
} = require('../../controllers/enquiry/statusLogs');

const router = express.Router();

const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

// Get all status logs with filters
router.get('/', getStatusLogs);

// Create new status log
router.post('/', authorize('Admin', 'Sales Head', 'Telecaller'), createStatusLog);

// Get status analytics
router.get('/analytics', authorize('Admin', 'Sales Head'), getStatusAnalytics);

// Get status transitions
router.get('/transitions', authorize('Admin', 'Sales Head'), getStatusTransitions);

// Export status logs
router.get('/export', authorize('Admin', 'Sales Head'), exportStatusLogs);

// Get enquiry status history
router.get('/enquiry/:enquiry_id', getEnquiryStatusHistory);

// Get status duration for enquiry
router.get('/enquiry/:enquiry_id/duration', getStatusDuration);

// Routes for specific status log
router.route('/:id')
  .get(getStatusLogById)
  .put(authorize('Admin', 'Sales Head'), updateStatusLog)
  .delete(authorize('Admin'), deleteStatusLog);

module.exports = router;
