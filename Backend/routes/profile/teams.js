const express = require('express');
const {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  getUserTeams,
  getTeamsByDepartment,
  getTeamsByType,
  assignTeamToProfile,
  getTeamAssignments,
  unassignTeamFromProfile
} = require('../../controllers/profile/teams');

const Team = require('../../models/profile/Team');

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
    advancedResults(Team, [
      { path: 'created_by', select: 'name email' },
      { path: 'member_count' }
    ]),
    getTeams
  )
  .post(protect, authorize('admin', 'manager'), createTeam);

router
  .route('/:id')
  .get(protect, getTeam)
  .put(protect, authorize('admin', 'manager'), updateTeam)
  .delete(protect, authorize('admin', 'manager'), deleteTeam);

// Team members routes
router
  .route('/:id/members')
  .get(protect, getTeamMembers)
  .post(protect, authorize('admin', 'manager'), addTeamMember);

router
  .route('/members/:id')
  .put(protect, authorize('admin', 'manager'), updateTeamMember)
  .delete(protect, authorize('admin', 'manager'), removeTeamMember);

// Team assignment routes
router
  .route('/assign')
  .post(protect, authorize('admin', 'manager', 'team_lead'), assignTeamToProfile);

router
  .route('/:id/assignments')
  .get(protect, getTeamAssignments);

router
  .route('/assign/:profileType/:profileId')
  .delete(protect, authorize('admin', 'manager', 'team_lead'), unassignTeamFromProfile);

// User teams route
router
  .route('/user/:userId')
  .get(protect, getUserTeams);

// Department and type routes
router
  .route('/department/:department')
  .get(protect, getTeamsByDepartment);

router
  .route('/type/:type')
  .get(protect, getTeamsByType);

module.exports = router;
