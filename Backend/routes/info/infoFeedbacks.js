const express = require('express');
const {
  getInfoFeedbacks,
  getInfoFeedback,
  createInfoFeedback,
  updateInfoFeedback,
  deleteInfoFeedback,
  getFeedbacksByProfile,
  getFeedbacksByType,
  getPendingReviewFeedbacks,
  reviewFeedback,
  getFeedbackStatistics,
  getSatisfactionTrends,
  getFeedbackResponseAnalysis,
  provideFeedbackResponse
} = require('../../controllers/info/infoFeedbacks');

const InfoFeedback = require('../../models/info/InfoFeedback');

const router = express.Router({ mergeParams: true });

// Bring in middleware
const { protect, authorize } = require('../../middleware/auth');
const advancedResults = require('../../middleware/advancedResults');

// Set up routes
router
  .route('/')
  .get(
    protect,
    advancedResults(InfoFeedback, [
      { path: 'info_profile', select: 'info_id title status' },
      { path: 'feedback_type', select: 'type_name type_category' },
      { path: 'assigned_to', select: 'name email' },
      { path: 'created_by', select: 'name email' },
      { path: 'updated_by', select: 'name email' }
    ]),
    getInfoFeedbacks
  )
  .post(protect, createInfoFeedback);

router
  .route('/:id')
  .get(protect, getInfoFeedback)
  .put(protect, updateInfoFeedback)
  .delete(protect, authorize('admin', 'manager'), deleteInfoFeedback);

// Feedbacks by profile
router
  .route('/profile/:profileId')
  .get(protect, getFeedbacksByProfile);

// Feedbacks by type
router
  .route('/type/:typeId')
  .get(protect, getFeedbacksByType);

// Pending review feedbacks
router
  .route('/pending-review')
  .get(protect, authorize('admin', 'manager'), getPendingReviewFeedbacks);

// Review feedback
router
  .route('/:id/review')
  .put(protect, authorize('admin', 'manager'), reviewFeedback);

// Provide response to feedback
router
  .route('/:id/respond')
  .put(protect, provideFeedbackResponse);

// Feedback statistics
router
  .route('/statistics')
  .get(protect, getFeedbackStatistics);

// Satisfaction trends
router
  .route('/satisfaction-trends')
  .get(protect, getSatisfactionTrends);

// Response analysis
router
  .route('/response-analysis')
  .get(protect, getFeedbackResponseAnalysis);

module.exports = router;