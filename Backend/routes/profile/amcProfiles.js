const express = require('express');
const {
  getAmcProfiles,
  getAmcProfile,
  createAmcProfile,
  updateAmcProfile,
  deleteAmcProfile,
  addServiceRecord,
  updateServiceRecord,
  deleteServiceRecord,
  addNote,
  deleteNote,
  addDocument,
  deleteDocument,
  assignAmc,
  changeAmcStatus,
  getAmcsByStatus,
  getCustomerAmcs,
  getTeamAmcs,
  getTechnicianAmcs,
  getExpiringAmcs,
  searchAmcs
} = require('../../controllers/profile/amcProfiles');

const AmcProfile = require('../../models/profile/AmcProfile');

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
    advancedResults(AmcProfile, [
      { path: 'customer', select: 'name email phone company_name' },
      { path: 'assigned_team', select: 'name team_id' },
      { path: 'assigned_technician', select: 'name email' },
      { path: 'created_by', select: 'name email' }
    ]),
    getAmcProfiles
  )
  .post(protect, createAmcProfile);

router
  .route('/:id')
  .get(protect, getAmcProfile)
  .put(protect, updateAmcProfile)
  .delete(protect, authorize('admin', 'manager'), deleteAmcProfile);

// Service record routes
router
  .route('/:id/service-records')
  .post(protect, addServiceRecord);

router
  .route('/:id/service-records/:recordId')
  .put(protect, updateServiceRecord)
  .delete(protect, deleteServiceRecord);

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

// Assignment routes
router
  .route('/:id/assign')
  .put(protect, authorize('admin', 'manager'), assignAmc);

// Status change route
router
  .route('/:id/status')
  .put(protect, changeAmcStatus);

// Filter routes
router
  .route('/status/:status')
  .get(protect, getAmcsByStatus);

router
  .route('/customer/:customerId')
  .get(protect, getCustomerAmcs);

router
  .route('/team/:teamId')
  .get(protect, getTeamAmcs);

router
  .route('/technician/:userId')
  .get(protect, getTechnicianAmcs);

router
  .route('/expiring')
  .get(protect, getExpiringAmcs);

// Search route
router
  .route('/search')
  .get(protect, searchAmcs);

module.exports = router;
