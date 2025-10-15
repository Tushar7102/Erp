const express = require('express');
const {
  getProjectProfiles,
  getProjectProfile,
  createProjectProfile,
  updateProjectProfile,
  deleteProjectProfile,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  addNote,
  deleteNote,
  addDocument,
  deleteDocument,
  assignProject,
  changeProjectStatus,
  getProjectsByStatus,
  getCustomerProjects,
  getTeamProjects,
  getManagerProjects,
  searchProjects
} = require('../../controllers/profile/projectProfiles');

const ProjectProfile = require('../../models/profile/ProjectProfile');

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
    advancedResults(ProjectProfile, [
      { path: 'customer', select: 'name email phone company_name' },
      { path: 'assigned_team', select: 'name team_id' },
      { path: 'project_manager', select: 'name email' },
      { path: 'created_by', select: 'name email' }
    ]),
    getProjectProfiles
  )
  .post(protect, createProjectProfile);

router
  .route('/:id')
  .get(protect, getProjectProfile)
  .put(protect, updateProjectProfile)
  .delete(protect, authorize('admin', 'manager'), deleteProjectProfile);

// Milestone routes
router
  .route('/:id/milestones')
  .post(protect, addMilestone);

router
  .route('/:id/milestones/:milestoneId')
  .put(protect, updateMilestone)
  .delete(protect, deleteMilestone);

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
  .put(protect, authorize('admin', 'manager'), assignProject);

// Status change route
router
  .route('/:id/status')
  .put(protect, changeProjectStatus);

// Filter routes
router
  .route('/status/:status')
  .get(protect, getProjectsByStatus);

router
  .route('/customer/:customerId')
  .get(protect, getCustomerProjects);

// Team and manager routes
router
  .route('/team/:teamId')
  .get(protect, getTeamProjects);

router
  .route('/manager/:userId')
  .get(protect, getManagerProjects);

// Search route
router
  .route('/search')
  .get(protect, searchProjects);

module.exports = router;
