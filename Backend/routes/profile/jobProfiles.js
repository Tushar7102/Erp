const express = require('express');
const {
  getJobProfiles,
  getJobProfile,
  createJobProfile,
  updateJobProfile,
  deleteJobProfile,
  addInterviewRound,
  updateInterviewRound,
  deleteInterviewRound,
  addApplicant,
  updateApplicant,
  deleteApplicant,
  addNote,
  deleteNote,
  assignHiringManager,
  assignTeam,
  changeJobStatus,
  getJobsByStatus,
  getJobsByDepartment,
  getHiringManagerJobs,
  getTeamJobs,
  searchJobs
} = require('../../controllers/profile/jobProfiles');

const JobProfile = require('../../models/profile/JobProfile');

// Include other resource routers
const router = express.Router({ mergeParams: true });

// Bring in middleware
const { protect, authorize, checkPermission } = require('../../middleware/auth');
const advancedResults = require('../../middleware/advancedResults');

// Set up routes
router
  .route('/')
  .get(
    protect,
    checkPermission('read', 'job_profiles'),
    advancedResults(JobProfile, [
      { path: 'hiring_manager', select: 'name email' },
      { path: 'assigned_team', select: 'name team_id' },
      { path: 'created_by', select: 'name email' }
    ]),
    getJobProfiles
  )
  .post(protect, checkPermission('create', 'job_profiles'), createJobProfile);

router
  .route('/:id')
  .get(protect, checkPermission('read', 'job_profiles'), getJobProfile)
  .put(protect, checkPermission('update', 'job_profiles'), updateJobProfile)
  .delete(
    protect,
    authorize('Admin', 'Manager'),
    checkPermission('delete', 'job_profiles'),
    deleteJobProfile
  );

// Interview rounds routes
router
  .route('/:id/interview-rounds')
  .post(protect, checkPermission('update', 'job_profiles'), addInterviewRound);

router
  .route('/:id/interview-rounds/:roundId')
  .put(protect, checkPermission('update', 'job_profiles'), updateInterviewRound)
  .delete(protect, checkPermission('update', 'job_profiles'), deleteInterviewRound);

// Applicant routes
router
  .route('/:id/applicants')
  .post(protect, checkPermission('update', 'job_profiles'), addApplicant);

router
  .route('/:id/applicants/:applicantId')
  .put(protect, checkPermission('update', 'job_profiles'), updateApplicant)
  .delete(protect, checkPermission('update', 'job_profiles'), deleteApplicant);

// Notes routes
router
  .route('/:id/notes')
  .post(protect, checkPermission('update', 'job_profiles'), addNote);

router
  .route('/:id/notes/:noteId')
  .delete(protect, checkPermission('update', 'job_profiles'), deleteNote);

// Assignment routes
router
  .route('/:id/assign-manager')
  .put(
    protect,
    authorize('Admin', 'Manager'),
    checkPermission('update', 'job_profiles'),
    assignHiringManager
  );

router
  .route('/:id/assign-team')
  .put(
    protect,
    authorize('Admin', 'Manager'),
    checkPermission('update', 'job_profiles'),
    assignTeam
  );

// Status change route
router
  .route('/:id/status')
  .put(
    protect,
    authorize('Admin', 'Manager'),
    checkPermission('update', 'job_profiles'),
    changeJobStatus
  );

// Filter routes
router
  .route('/status/:status')
  .get(
    protect, 
    authorize('Admin', 'Manager', 'User'), 
    checkPermission('read', 'JobProfile'),
    getJobsByStatus
  );

router
  .route('/department/:department')
  .get(
    protect, 
    authorize('Admin', 'Manager', 'User'), 
    checkPermission('read', 'JobProfile'),
    getJobsByDepartment
  );

// Search route
router
  .route('/search')
  .get(
    protect, 
    authorize('Admin', 'Manager', 'User'), 
    checkPermission('read', 'JobProfile'),
    searchJobs
  );

// Manager specific routes
router
  .route('/hiring-manager/:managerId')
  .get(
    protect, 
    authorize('Admin', 'Manager', 'User'), 
    checkPermission('read', 'JobProfile'),
    getHiringManagerJobs
  );

// Team specific routes
router
  .route('/team/:teamId')
  .get(
    protect, 
    authorize('Admin', 'Manager', 'User'), 
    checkPermission('read', 'JobProfile'),
    getTeamJobs
  );

module.exports = router;
