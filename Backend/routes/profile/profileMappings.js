const express = require('express');
const {
  getProfileMappings,
  getProfileMapping,
  createProfileMapping,
  updateProfileMapping,
  deleteProfileMapping,
  getProfileMappingsByEnquiry,
  getProfileMappingsByProfile,
  runProfileMapping,
  toggleProfileMappingStatus
} = require('../../controllers/profile/profileMapping');

const ProfileMapping = require('../../models/profile/ProfileMapping');

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
    advancedResults(ProfileMapping, [
      { path: 'enquiry_id', select: 'enquiry_id name email subject' },
      { path: 'created_by', select: 'name email' }
    ]),
    getProfileMappings
  )
  .post(protect, createProfileMapping);

router
  .route('/:id')
  .get(protect, getProfileMapping)
  .put(protect, updateProfileMapping)
  .delete(protect, deleteProfileMapping);

// Run profile mapping and toggle status routes
router
  .route('/:id/run')
  .post(protect, runProfileMapping);

router
  .route('/:id/status')
  .patch(protect, toggleProfileMappingStatus);

// Enquiry and profile routes
router
  .route('/enquiry/:enquiryId')
  .get(protect, getProfileMappingsByEnquiry);

router
  .route('/profile/:profileType/:profileId')
  .get(protect, getProfileMappingsByProfile);

module.exports = router;
