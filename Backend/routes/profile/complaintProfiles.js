const express = require('express');
const {
  getComplaintProfiles,
  getComplaintProfile,
  createComplaintProfile,
  updateComplaintProfile,
  deleteComplaintProfile,
  addActivityLog,
  addNote,
  deleteNote,
  addAttachment,
  deleteAttachment,
  assignComplaint,
  changeComplaintStatus,
  addCustomerFeedback,
  getComplaintsByStatus,
  getComplaintsBySeverity,
  getCustomerComplaints,
  getTeamComplaints,
  getUserComplaints,
  getOverdueComplaints,
  searchComplaints
} = require('../../controllers/profile/complaintProfiles');

const ComplaintProfile = require('../../models/profile/ComplaintProfile');

// Include other resource routers
const router = express.Router({ mergeParams: true });

// Bring in middleware
const { protect, authorize } = require('../../middleware/auth');
const advancedResults = require('../../middleware/advancedResults');

// Set up routes
router
  .route('/')
  .get(
    protect,
    advancedResults(ComplaintProfile, [
      { path: 'customer', select: 'name email phone company_name' },
      { path: 'assigned_team', select: 'name team_id' },
      { path: 'assigned_user', select: 'name email' },
      { path: 'created_by', select: 'name email' }
    ]),
    getComplaintProfiles
  )
  .post(protect, createComplaintProfile);

router
  .route('/:id')
  .get(protect, getComplaintProfile)
  .put(protect, updateComplaintProfile)
  .delete(protect, authorize('admin', 'manager'), deleteComplaintProfile);

// Activity log route
router
  .route('/:id/activity-log')
  .post(protect, addActivityLog);

// Notes routes
router
  .route('/:id/notes')
  .post(protect, addNote);

router
  .route('/:id/notes/:noteId')
  .delete(protect, deleteNote);

// Attachment routes
router
  .route('/:id/attachments')
  .post(protect, addAttachment);

router
  .route('/:id/attachments/:attachmentId')
  .delete(protect, deleteAttachment);

// Assignment routes
router
  .route('/:id/assign')
  .put(protect, authorize('admin', 'manager'), assignComplaint);

// Status change route
router
  .route('/:id/status')
  .put(protect, changeComplaintStatus);

// Customer feedback route
router
  .route('/:id/customer-feedback')
  .post(protect, addCustomerFeedback);

// Filter routes
router
  .route('/status/:status')
  .get(protect, getComplaintsByStatus);

router
  .route('/severity/:severity')
  .get(protect, getComplaintsBySeverity);

router
  .route('/customer/:customerId')
  .get(protect, getCustomerComplaints);

router
  .route('/team/:teamId')
  .get(protect, getTeamComplaints);

router
  .route('/user/:userId')
  .get(protect, getUserComplaints);

router
  .route('/overdue')
  .get(protect, getOverdueComplaints);

// Search route
router
  .route('/search')
  .get(protect, searchComplaints);

module.exports = router;
