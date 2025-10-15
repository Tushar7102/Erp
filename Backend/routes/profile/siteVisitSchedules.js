const express = require('express');
const {
  getSiteVisitSchedules,
  getSiteVisitSchedule,
  createSiteVisitSchedule,
  updateSiteVisitSchedule,
  deleteSiteVisitSchedule,
  updateVisitReport,
  updateChecklist,
  addNote,
  deleteNote,
  addAttachment,
  deleteAttachment,
  addCustomerFeedback,
  assignSiteVisit,
  changeSiteVisitStatus,
  getSiteVisitsByStatus,
  getCustomerSiteVisits,
  getTeamSiteVisits,
  getTechnicianSiteVisits,
  getUpcomingSiteVisits,
  searchSiteVisits
} = require('../../controllers/profile/siteVisitSchedules');

const SiteVisitSchedule = require('../../models/profile/SiteVisitSchedule');

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
    advancedResults(SiteVisitSchedule, [
      { path: 'customer', select: 'full_name company_name customer_id' },
      { path: 'assigned_team', select: 'name team_id' },
      { path: 'assigned_technicians', select: 'name email' },
      { path: 'created_by', select: 'name email' }
    ]),
    getSiteVisitSchedules
  )
  .post(protect, createSiteVisitSchedule);

router
  .route('/:id')
  .get(protect, getSiteVisitSchedule)
  .put(protect, updateSiteVisitSchedule)
  .delete(protect, authorize('admin', 'manager'), deleteSiteVisitSchedule);

// Visit report routes
router
  .route('/:id/report')
  .put(protect, updateVisitReport);

// Checklist routes
router
  .route('/:id/checklist')
  .put(protect, updateChecklist);

// Notes routes
router
  .route('/:id/notes')
  .post(protect, addNote);

router
  .route('/:id/notes/:noteId')
  .delete(protect, deleteNote);

// Attachment routes
router
  .route('/:id/attachments')
  .post(protect, addAttachment);

router
  .route('/:id/attachments/:attachmentId')
  .delete(protect, deleteAttachment);

// Feedback route
router
  .route('/:id/feedback')
  .post(protect, addCustomerFeedback);

// Assignment route
router
  .route('/:id/assign')
  .put(protect, authorize('admin', 'manager'), assignSiteVisit);

// Status change route
router
  .route('/:id/status')
  .put(protect, authorize('admin', 'manager'), changeSiteVisitStatus);

// Filter routes
router
  .route('/status/:status')
  .get(protect, getSiteVisitsByStatus);

router
  .route('/upcoming/:days')
  .get(protect, getUpcomingSiteVisits);

// Search route
router
  .route('/search')
  .get(protect, searchSiteVisits);

module.exports = router;
