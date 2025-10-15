const express = require('express');
const {
  getStatusTypes,
  getStatusType,
  createStatusType,
  updateStatusType,
  deleteStatusType,
  toggleStatusTypeStatus,
  getStatusTypesByCategory,
  getActiveStatusTypes
} = require('../../controllers/enquiry/statusTypes');

// const StatusType = require('../models/StatusType'); // Commented out - StatusType model not found

const router = express.Router();

const { protect, authorize } = require('../../middleware/auth');
const advancedResults = require('../../middleware/advancedResults');
const auditLogger = require('../../middleware/auditLogger');

// Routes with advanced results middleware
router
  .route('/')
  .get(
    protect,
    /* advancedResults(StatusType), */ // Commented out - StatusType model not found
    getStatusTypes
  )
  .post(
    protect,
    authorize('Admin', 'Sales Head'),
    auditLogger({ entityType: 'StatusType', action: 'CREATE' }),
    createStatusType
  );

router
  .route('/active')
  .get(
    protect,
    getActiveStatusTypes
  );

router
  .route('/category/:category')
  .get(
    protect,
    getStatusTypesByCategory
  );

router
  .route('/:id')
  .get(
    protect,
    getStatusType
  )
  .put(
    protect,
    authorize('Admin', 'Sales Head'),
    auditLogger({ entityType: 'StatusType', action: 'UPDATE' }),
    updateStatusType
  )
  .delete(
    protect,
    authorize('Admin'),
    auditLogger({ entityType: 'StatusType', action: 'DELETE' }),
    deleteStatusType
  );

router
  .route('/:id/toggle-status')
  .put(
    protect,
    authorize('Admin', 'Sales Head'),
    auditLogger({ entityType: 'StatusType', action: 'UPDATE' }),
    toggleStatusTypeStatus
  );

module.exports = router;
