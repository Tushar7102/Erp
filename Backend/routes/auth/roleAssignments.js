const express = require('express');
const {
  getRoleAssignments,
  getRoleAssignment,
  createRoleAssignment,
  updateRoleAssignment,
  deleteRoleAssignment,
  deactivateUserAssignment
} = require('../../controllers/auth/roleAssignments');

const router = express.Router();

const { protect, authorize } = require('../../middleware/auth');

// Routes
router
  .route('/')
  .get(protect, getRoleAssignments)
  .post(protect, authorize('admin', 'manager'), createRoleAssignment);

router
  .route('/:id')
  .get(protect, getRoleAssignment)
  .put(protect, authorize('admin', 'manager'), updateRoleAssignment)
  .delete(protect, authorize('admin'), deleteRoleAssignment);

router
  .route('/user/:userId/deactivate')
  .put(protect, authorize('admin', 'manager'), deactivateUserAssignment);

module.exports = router;