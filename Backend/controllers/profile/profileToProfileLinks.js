const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const ProfileToProfileLinks = require('../../models/profile/ProfileToProfileLinks');
const UserActivityLog = require('../../models/profile/UserActivityLog');

// @desc    Get all profile-to-profile links
// @route   GET /api/profile-to-profile-links
// @access  Private
exports.getProfileToProfileLinks = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single profile-to-profile link
// @route   GET /api/profile-to-profile-links/:id
// @access  Private
exports.getProfileToProfileLink = asyncHandler(async (req, res, next) => {
  const profileToProfileLink = await ProfileToProfileLinks.findById(req.params.id)
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  if (!profileToProfileLink) {
    return next(
      new ErrorResponse(`Profile-to-profile link not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: profileToProfileLink
  });
});

// @desc    Create new profile-to-profile link
// @route   POST /api/profile-to-profile-links
// @access  Private
exports.createProfileToProfileLink = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.created_by = req.user.id;

  // Set the correct source_profile_type_ref and target_profile_type_ref based on source_profile_type and target_profile_type
  const profileTypeRefMap = {
    'project': 'ProjectProfile',
    'product': 'ProductProfile',
    'amc': 'AmcProfile',
    'complaint': 'ComplaintProfile',
    'info': 'InfoProfile',
    'job': 'JobProfile',
    'site_visit': 'SiteVisitSchedule'
  };

  req.body.source_profile_type_ref = profileTypeRefMap[req.body.source_profile_type];
  req.body.target_profile_type_ref = profileTypeRefMap[req.body.target_profile_type];

  if (!req.body.source_profile_type_ref) {
    return next(
      new ErrorResponse(`Invalid source profile type: ${req.body.source_profile_type}`, 400)
    );
  }

  if (!req.body.target_profile_type_ref) {
    return next(
      new ErrorResponse(`Invalid target profile type: ${req.body.target_profile_type}`, 400)
    );
  }

  // Check if the link already exists
  const existingLink = await ProfileToProfileLinks.findOne({
    source_profile_type: req.body.source_profile_type,
    source_profile_id: req.body.source_profile_id,
    target_profile_type: req.body.target_profile_type,
    target_profile_id: req.body.target_profile_id
  });

  if (existingLink) {
    return next(
      new ErrorResponse('This profile-to-profile link already exists', 400)
    );
  }

  const profileToProfileLink = await ProfileToProfileLinks.create(req.body);

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'create',
    entity_type: 'profile_link',
    entity_id: profileToProfileLink._id,
    description: `Created profile-to-profile link from ${req.body.source_profile_type} to ${req.body.target_profile_type}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: profileToProfileLink
  });
});

// @desc    Update profile-to-profile link
// @route   PUT /api/profile-to-profile-links/:id
// @access  Private
exports.updateProfileToProfileLink = asyncHandler(async (req, res, next) => {
  let profileToProfileLink = await ProfileToProfileLinks.findById(req.params.id);

  if (!profileToProfileLink) {
    return next(
      new ErrorResponse(`Profile-to-profile link not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is the creator of the link or an admin
  if (
    profileToProfileLink.created_by.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this profile-to-profile link`,
        401
      )
    );
  }

  // If updating profile types, set the correct refs
  if (req.body.source_profile_type) {
    const profileTypeRefMap = {
      'project': 'ProjectProfile',
      'product': 'ProductProfile',
      'amc': 'AmcProfile',
      'complaint': 'ComplaintProfile',
      'info': 'InfoProfile',
      'job': 'JobProfile',
      'site_visit': 'SiteVisitSchedule'
    };

    req.body.source_profile_type_ref = profileTypeRefMap[req.body.source_profile_type];

    if (!req.body.source_profile_type_ref) {
      return next(
        new ErrorResponse(`Invalid source profile type: ${req.body.source_profile_type}`, 400)
      );
    }
  }

  if (req.body.target_profile_type) {
    const profileTypeRefMap = {
      'project': 'ProjectProfile',
      'product': 'ProductProfile',
      'amc': 'AmcProfile',
      'complaint': 'ComplaintProfile',
      'info': 'InfoProfile',
      'job': 'JobProfile',
      'site_visit': 'SiteVisitSchedule'
    };

    req.body.target_profile_type_ref = profileTypeRefMap[req.body.target_profile_type];

    if (!req.body.target_profile_type_ref) {
      return next(
        new ErrorResponse(`Invalid target profile type: ${req.body.target_profile_type}`, 400)
      );
    }
  }

  profileToProfileLink = await ProfileToProfileLinks.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'profile_link',
    entity_id: profileToProfileLink._id,
    description: `Updated profile-to-profile link from ${profileToProfileLink.source_profile_type} to ${profileToProfileLink.target_profile_type}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: profileToProfileLink
  });
});

// @desc    Delete profile-to-profile link
// @route   DELETE /api/profile-to-profile-links/:id
// @access  Private
exports.deleteProfileToProfileLink = asyncHandler(async (req, res, next) => {
  const profileToProfileLink = await ProfileToProfileLinks.findById(req.params.id);

  if (!profileToProfileLink) {
    return next(
      new ErrorResponse(`Profile-to-profile link not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is the creator of the link or an admin
  if (
    profileToProfileLink.created_by.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this profile-to-profile link`,
        401
      )
    );
  }

  await profileToProfileLink.remove();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'profile_link',
    entity_id: req.params.id,
    description: `Deleted profile-to-profile link from ${profileToProfileLink.source_profile_type} to ${profileToProfileLink.target_profile_type}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get profile-to-profile links by source profile
// @route   GET /api/profile-to-profile-links/source/:sourceType/:sourceId
// @access  Private
exports.getProfileToProfileLinksBySource = asyncHandler(async (req, res, next) => {
  const { sourceType, sourceId } = req.params;

  const profileTypeRefMap = {
    'project': 'ProjectProfile',
    'product': 'ProductProfile',
    'amc': 'AmcProfile',
    'complaint': 'ComplaintProfile',
    'info': 'InfoProfile',
    'job': 'JobProfile',
    'site_visit': 'SiteVisitSchedule'
  };

  const sourceTypeRef = profileTypeRefMap[sourceType];

  if (!sourceTypeRef) {
    return next(
      new ErrorResponse(`Invalid source profile type: ${sourceType}`, 400)
    );
  }

  const links = await ProfileToProfileLinks.find({
    source_profile_type: sourceType,
    source_profile_id: sourceId
  }).populate({
    path: 'created_by',
    select: 'name email'
  });

  res.status(200).json({
    success: true,
    count: links.length,
    data: links
  });
});

// @desc    Get profile-to-profile links by target profile
// @route   GET /api/profile-to-profile-links/target/:targetType/:targetId
// @access  Private
exports.getProfileToProfileLinksByTarget = asyncHandler(async (req, res, next) => {
  const { targetType, targetId } = req.params;

  const profileTypeRefMap = {
    'project': 'ProjectProfile',
    'product': 'ProductProfile',
    'amc': 'AmcProfile',
    'complaint': 'ComplaintProfile',
    'info': 'InfoProfile',
    'job': 'JobProfile',
    'site_visit': 'SiteVisitSchedule'
  };

  const targetTypeRef = profileTypeRefMap[targetType];

  if (!targetTypeRef) {
    return next(
      new ErrorResponse(`Invalid target profile type: ${targetType}`, 400)
    );
  }

  const links = await ProfileToProfileLinks.find({
    target_profile_type: targetType,
    target_profile_id: targetId
  }).populate({
    path: 'created_by',
    select: 'name email'
  });

  res.status(200).json({
    success: true,
    count: links.length,
    data: links
  });
});

// @desc    Get all related profiles (both source and target)
// @route   GET /api/profile-to-profile-links/related/:profileType/:profileId
// @access  Private
exports.getAllRelatedProfiles = asyncHandler(async (req, res, next) => {
  const { profileType, profileId } = req.params;

  const profileTypeRefMap = {
    'project': 'ProjectProfile',
    'product': 'ProductProfile',
    'amc': 'AmcProfile',
    'complaint': 'ComplaintProfile',
    'info': 'InfoProfile',
    'job': 'JobProfile',
    'site_visit': 'SiteVisitSchedule'
  };

  const profileTypeRef = profileTypeRefMap[profileType];

  if (!profileTypeRef) {
    return next(
      new ErrorResponse(`Invalid profile type: ${profileType}`, 400)
    );
  }

  // Find links where the profile is either source or target
  const sourceLinks = await ProfileToProfileLinks.find({
    source_profile_type: profileType,
    source_profile_id: profileId
  }).populate({
    path: 'created_by',
    select: 'name email'
  });

  const targetLinks = await ProfileToProfileLinks.find({
    target_profile_type: profileType,
    target_profile_id: profileId
  }).populate({
    path: 'created_by',
    select: 'name email'
  });

  // Combine the results
  const links = [...sourceLinks, ...targetLinks];

  res.status(200).json({
    success: true,
    count: links.length,
    data: links
  });
});
