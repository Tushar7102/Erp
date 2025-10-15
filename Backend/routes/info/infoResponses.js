const express = require('express');
const {
  getInfoResponses,
  getInfoResponse,
  createInfoResponse,
  updateInfoResponse,
  deleteInfoResponse,
  getResponsesByProfile,
  getResponsesByType,
  getPendingApprovalResponses,
  approveResponse,
  rejectResponse,
  markResponseAsFinal,
  getResponseStatistics,
  getResponseQualityMetrics
} = require('../../controllers/info/infoResponses');

const InfoResponse = require('../../models/info/InfoResponse');

const router = express.Router({ mergeParams: true });

// Bring in middleware
const { protect, authorize } = require('../../middleware/auth');
const advancedResults = require('../../middleware/advancedResults');

// Set up routes
router
  .route('/')
  .get(
    protect,
    advancedResults(InfoResponse, [
      { path: 'info_profile', select: 'info_id title status' },
      { path: 'response_type', select: 'type_name type_category' },
      { path: 'created_by', select: 'name email' },
      { path: 'approved_by', select: 'name email' },
      { path: 'updated_by', select: 'name email' }
    ]),
    getInfoResponses
  )
  .post(protect, createInfoResponse);

router
  .route('/:id')
  .get(protect, getInfoResponse)
  .put(protect, updateInfoResponse)
  .delete(protect, authorize('admin', 'manager'), deleteInfoResponse);

// Responses by profile
router
  .route('/profile/:profileId')
  .get(protect, getResponsesByProfile);

// Responses by type
router
  .route('/type/:typeId')
  .get(protect, getResponsesByType);

// Pending approval responses
router
  .route('/pending-approval')
  .get(protect, authorize('admin', 'manager'), getPendingApprovalResponses);

// Approve response
router
  .route('/:id/approve')
  .put(protect, authorize('admin', 'manager'), approveResponse);

// Reject response
router
  .route('/:id/reject')
  .put(protect, authorize('admin', 'manager'), rejectResponse);

// Mark response as final
router
  .route('/:id/mark-final')
  .put(protect, authorize('admin', 'manager'), markResponseAsFinal);

// Response statistics
router
  .route('/statistics')
  .get(protect, getResponseStatistics);

// Quality metrics
router
  .route('/quality-metrics')
  .get(protect, getResponseQualityMetrics);

module.exports = router;