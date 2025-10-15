const express = require('express');
const {
  getInfoActions,
  getInfoAction,
  createInfoAction,
  updateInfoAction,
  deleteInfoAction,
  getActionsByProfile,
  getActionsByType,
  getPendingActions,
  getOverdueActions,
  completeAction,
  assignAction,
  getActionStatistics
} = require('../../controllers/info/infoActions');

const InfoAction = require('../../models/info/InfoAction');

const router = express.Router({ mergeParams: true });

// Bring in middleware
const { protect, authorize } = require('../../middleware/auth');
const advancedResults = require('../../middleware/advancedResults');

// Set up routes
router
  .route('/')
  .get(
    protect,
    advancedResults(InfoAction, [
      { path: 'info_profile', select: 'info_id title status' },
      { path: 'action_type', select: 'type_name type_category' },
      { path: 'assigned_to', select: 'name email' },
      { path: 'created_by', select: 'name email' },
      { path: 'updated_by', select: 'name email' }
    ]),
    getInfoActions
  )
  .post(protect, createInfoAction);

router
  .route('/:id')
  .get(protect, getInfoAction)
  .put(protect, updateInfoAction)
  .delete(protect, authorize('admin', 'manager'), deleteInfoAction);

// Actions by profile
router
  .route('/profile/:profileId')
  .get(protect, getActionsByProfile);

// Actions by type
router
  .route('/type/:typeId')
  .get(protect, getActionsByType);

// Pending actions
router
  .route('/pending')
  .get(protect, getPendingActions);

// Overdue actions
router
  .route('/overdue')
  .get(protect, getOverdueActions);

// Complete action
router
  .route('/:id/complete')
  .put(protect, completeAction);

// Assign action
router
  .route('/:id/assign')
  .put(protect, authorize('admin', 'manager'), assignAction);

// Statistics
router
  .route('/statistics')
  .get(protect, getActionStatistics);

module.exports = router;