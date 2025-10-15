const express = require('express');
const {
  getInfoProfiles,
  getInfoProfile,
  createInfoProfile,
  updateInfoProfile,
  deleteInfoProfile,
  addResponseDetails,
  addCustomerFeedback,
  addNote,
  deleteNote,
  addDocument,
  deleteDocument,
  assignInfoRequest,
  changeInfoRequestStatus,
  getInfoRequestsByStatus,
  getInfoRequestsByPriority,
  getCustomerInfoRequests,
  getTeamInfoRequests,
  getUserInfoRequests,
  getOverdueInfoRequests,
  searchInfoRequests
} = require('../../controllers/profile/infoProfiles');

const InfoProfile = require('../../models/profile/InfoProfile');

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
    advancedResults(InfoProfile, [
      { path: 'customer', select: 'full_name company_name customer_id' },
      { path: 'assigned_team', select: 'name team_id' },
      { path: 'assigned_to', select: 'name email' },
      { path: 'created_by', select: 'name email' }
    ]),
    getInfoProfiles
  )
  .post(protect, createInfoProfile);

router
  .route('/:id')
  .get(protect, getInfoProfile)
  .put(protect, updateInfoProfile)
  .delete(protect, authorize('admin', 'manager'), deleteInfoProfile);

// Response routes
router
  .route('/:id/response')
  .put(protect, addResponseDetails);

// Feedback routes
router
  .route('/:id/feedback')
  .put(protect, addCustomerFeedback);

// Notes routes
router
  .route('/:id/notes')
  .post(protect, addNote);

router
  .route('/:id/notes/:noteId')
  .delete(protect, deleteNote);

// Document routes
router
  .route('/:id/documents')
  .post(protect, addDocument);

router
  .route('/:id/documents/:documentId')
  .delete(protect, deleteDocument);

// Assignment route
router
  .route('/:id/assign')
  .put(protect, authorize('admin', 'manager'), assignInfoRequest);

// Status change route
router
  .route('/:id/status')
  .put(protect, authorize('admin', 'manager'), changeInfoRequestStatus);

// Filter routes
router
  .route('/status/:status')
  .get(protect, getInfoRequestsByStatus);

router
  .route('/priority/:priority')
  .get(protect, getInfoRequestsByPriority);

router
  .route('/overdue')
  .get(protect, getOverdueInfoRequests);

// Search route
router
  .route('/search')
  .get(protect, searchInfoRequests);

module.exports = router;
