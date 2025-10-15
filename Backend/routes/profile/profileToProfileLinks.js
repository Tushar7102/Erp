const express = require('express');
const {
  getProfileToProfileLinks,
  getProfileToProfileLink,
  createProfileToProfileLink,
  updateProfileToProfileLink,
  deleteProfileToProfileLink,
  getProfileToProfileLinksBySource,
  getProfileToProfileLinksByTarget,
  getAllRelatedProfiles
} = require('../../controllers/profile/profileToProfileLinks');

const ProfileToProfileLinks = require('../../models/profile/ProfileToProfileLinks');

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
    advancedResults(ProfileToProfileLinks, [
      { path: 'created_by', select: 'name email' }
    ]),
    getProfileToProfileLinks
  )
  .post(protect, createProfileToProfileLink);

router
  .route('/:id')
  .get(protect, getProfileToProfileLink)
  .put(protect, updateProfileToProfileLink)
  .delete(protect, deleteProfileToProfileLink);

// Source and target routes
router
  .route('/source/:sourceType/:sourceId')
  .get(protect, getProfileToProfileLinksBySource);

router
  .route('/target/:targetType/:targetId')
  .get(protect, getProfileToProfileLinksByTarget);

// Get all related profiles
router
  .route('/related/:profileType/:profileId')
  .get(protect, getAllRelatedProfiles);

module.exports = router;
