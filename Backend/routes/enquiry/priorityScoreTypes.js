const express = require('express');
const {
  getPriorityScoreTypes,
  getPriorityScoreType,
  createPriorityScoreType,
  updatePriorityScoreType,
  deletePriorityScoreType,
  togglePriorityScoreTypeStatus,
  getActivePriorityScoreTypes,
  calculatePriorityScore
} = require('../../controllers/enquiry/priorityScoreTypes');

const PriorityScoreType = require('../../models/enquiry/PriorityScoreType');

const router = express.Router();

const { protect, authorize } = require('../../middleware/auth');
const advancedResults = require('../../middleware/advancedResults');

// Routes with advanced results middleware
router
  .route('/')
  .get(
    protect,
    advancedResults(PriorityScoreType),
    getPriorityScoreTypes
  )
  .post(
    protect,
    authorize('Admin', 'Sales Head'),
    createPriorityScoreType
  );

router
  .route('/active')
  .get(
    protect,
    getActivePriorityScoreTypes
  );

router
  .route('/calculate-score')
  .post(
    protect,
    calculatePriorityScore
  );

router
  .route('/:id')
  .get(
    protect,
    getPriorityScoreType
  )
  .put(
    protect,
    authorize('Admin', 'Sales Head'),
    updatePriorityScoreType
  )
  .delete(
    protect,
    authorize('Admin'),
    deletePriorityScoreType
  );

router
  .route('/:id/toggle-status')
  .put(
    protect,
    authorize('Admin', 'Sales Head'),
    togglePriorityScoreTypeStatus
  );

module.exports = router;
