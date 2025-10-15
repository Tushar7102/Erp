const express = require('express');
const {
  getCallLogs,
  getCallLogById,
  createCallLog,
  updateCallLog,
  deleteCallLog,
  startCall,
  endCall,
  addCallFeedback,
  getEnquiryCallHistory,
  getUserCallHistory,
  getCallAnalytics,
  exportCallLogs
} = require('../../controllers/enquiry/callLogs');

const router = express.Router();

const { protect, authorize } = require('../../middleware/auth');
const auditLogger = require('../../middleware/auditLogger');

router.use(protect);

// Get all call logs with filters
router.get('/', getCallLogs);

// Create new call log
router.post('/', authorize('Admin', 'Sales Head', 'Telecaller'), auditLogger({ entityType: 'CallLog', action: 'CREATE' }), createCallLog);

// Start a call
router.post('/start', authorize('Telecaller'), auditLogger({ entityType: 'CallLog', action: 'CREATE' }), startCall);

// End a call
router.put('/end/:id', authorize('Telecaller'), auditLogger({ entityType: 'CallLog', action: 'UPDATE' }), endCall);

// Get call analytics
router.get('/analytics', authorize('Admin', 'Sales Head'), getCallAnalytics);

// Export call logs
router.get('/export', authorize('Admin', 'Sales Head'), auditLogger({ entityType: 'CallLog', action: 'EXPORT' }), exportCallLogs);

// Get enquiry call history
router.get('/enquiry/:enquiry_id', getEnquiryCallHistory);

// Get user call history
router.get('/user/:user_id', getUserCallHistory);

// Add call feedback
router.post('/:id/feedback', authorize('Telecaller'), auditLogger({ entityType: 'CallLog', action: 'UPDATE' }), addCallFeedback);

// Routes for specific call log
router.route('/:id')
  .get(getCallLogById)
  .put(authorize('Admin', 'Sales Head', 'Telecaller'), auditLogger({ entityType: 'CallLog', action: 'UPDATE' }), updateCallLog)
  .delete(authorize('Admin'), auditLogger({ entityType: 'CallLog', action: 'DELETE' }), deleteCallLog);

module.exports = router;
