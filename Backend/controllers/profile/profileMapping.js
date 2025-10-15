const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const ProfileMapping = require('../../models/profile/ProfileMapping');
const Enquiry = require('../../models/enquiry/Enquiry');
const UserActivityLog = require('../../models/profile/UserActivityLog');

// Helper function to get the model based on profile type
const getModelByProfileType = (profileType) => {
  try {
    switch (profileType.toLowerCase()) {
      case 'lead':
        return require('../../models/profile/Lead');
      case 'customer':
        return require('../../models/profile/Customer');
      case 'project':
        return require('../../models/profile/Project');
      case 'product':
        return require('../../models/profile/Product');
      case 'amc':
        return require('../../models/profile/AMC');
      case 'complaint':
        return require('../../models/profile/Complaint');
      case 'info':
        return require('../../models/profile/Info');
      // Temporarily comment out Job model since it doesn't exist
      // case 'job':
      //   return require('../../models/profile/Job');
      case 'site_visit':
        return require('../../models/profile/SiteVisit');
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error loading model for profile type ${profileType}: ${error.message}`);
    return null;
  }
};

// Helper function to apply transformation to a value
const applyTransformation = (value, transformation) => {
  if (!value) return value;
  
  switch (transformation) {
    case 'uppercase':
      return typeof value === 'string' ? value.toUpperCase() : value;
    case 'lowercase':
      return typeof value === 'string' ? value.toLowerCase() : value;
    case 'capitalize':
      return typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : value;
    case 'trim':
      return typeof value === 'string' ? value.trim() : value;
    case 'number':
      return !isNaN(value) ? Number(value) : value;
    case 'string':
      return String(value);
    case 'boolean':
      return Boolean(value);
    case 'date':
      return value instanceof Date ? value : new Date(value);
    default:
      return value;
  }
};

// @desc    Get all profile mappings
// @route   GET /api/v1/profile-mappings
// @access  Private
exports.getProfileMappings = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single profile mapping
// @route   GET /api/v1/profile-mappings/:id
// @access  Private
exports.getProfileMapping = asyncHandler(async (req, res, next) => {
  const profileMapping = await ProfileMapping.findById(req.params.id)
    .populate({
      path: 'enquiry_id',
      select: 'name mobile email enquiry_id'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  if (!profileMapping) {
    return next(
      new ErrorResponse(`Profile mapping not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: profileMapping
  });
});

// @desc    Create new profile mapping
// @route   POST /api/v1/profile-mappings
// @access  Private
exports.createProfileMapping = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.created_by = req.user.id;

  // Validate that enquiry_id is provided
  if (!req.body.enquiry_id) {
    return next(
      new ErrorResponse('Enquiry ID is required for profile mapping', 400)
    );
  }

  // Check if enquiry exists
  const enquiry = await Enquiry.findById(req.body.enquiry_id);
  if (!enquiry) {
    return next(
      new ErrorResponse(`Enquiry not found with id of ${req.body.enquiry_id}`, 404)
    );
  }

  // Set the correct profile_type_ref based on profile_type
  const profileTypeRefMap = {
    'project': 'ProjectProfile',
    'product': 'ProductProfile',
    'amc': 'AmcProfile',
    'complaint': 'ComplaintProfile',
    'info': 'InfoProfile',
    'job': 'JobProfile',
    'site_visit': 'SiteVisitSchedule'
  };

  req.body.profile_type_ref = profileTypeRefMap[req.body.profile_type];

  if (!req.body.profile_type_ref) {
    return next(
      new ErrorResponse(`Invalid profile type: ${req.body.profile_type}`, 400)
    );
  }

  const profileMapping = await ProfileMapping.create(req.body);

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'create',
    entity_type: 'profile_mapping',
    entity_id: profileMapping._id,
    description: `Created profile mapping from enquiry ${enquiry.enquiry_id} to ${req.body.profile_type} profile`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: profileMapping
  });
});

// @desc    Update profile mapping
// @route   PUT /api/v1/profile-mappings/:id
// @access  Private
exports.updateProfileMapping = asyncHandler(async (req, res, next) => {
  let profileMapping = await ProfileMapping.findById(req.params.id);

  if (!profileMapping) {
    return next(
      new ErrorResponse(`Profile mapping not found with id of ${req.params.id}`, 404)
    );
  }

  // If profile_type is being updated, update profile_type_ref as well
  if (req.body.profile_type) {
    const profileTypeRefMap = {
      'project': 'ProjectProfile',
      'product': 'ProductProfile',
      'amc': 'AmcProfile',
      'complaint': 'ComplaintProfile',
      'info': 'InfoProfile',
      'job': 'JobProfile',
      'site_visit': 'SiteVisitSchedule'
    };

    req.body.profile_type_ref = profileTypeRefMap[req.body.profile_type];

    if (!req.body.profile_type_ref) {
      return next(
        new ErrorResponse(`Invalid profile type: ${req.body.profile_type}`, 400)
      );
    }
  }

  // Store previous state for activity log
  const previousState = { ...profileMapping.toObject() };

  profileMapping = await ProfileMapping.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'profile_mapping',
    entity_id: profileMapping._id,
    description: `Updated profile mapping ${profileMapping.mapping_id}`,
    previous_state: previousState,
    new_state: profileMapping.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: profileMapping
  });
});

// @desc    Delete profile mapping
// @route   DELETE /api/v1/profile-mappings/:id
// @access  Private
exports.deleteProfileMapping = asyncHandler(async (req, res, next) => {
  const profileMapping = await ProfileMapping.findById(req.params.id);

  if (!profileMapping) {
    return next(
      new ErrorResponse(`Profile mapping not found with id of ${req.params.id}`, 404)
    );
  }

  // Store the mapping data for activity log
  const deletedMapping = { ...profileMapping.toObject() };

  await ProfileMapping.deleteOne({ _id: req.params.id });

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'profile_mapping',
    entity_id: profileMapping._id,
    description: `Deleted profile mapping ${profileMapping.mapping_id}`,
    previous_state: deletedMapping,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get profile mappings by enquiry
// @route   GET /api/v1/enquiries/:enquiryId/profile-mappings
// @access  Private
exports.getProfileMappingsByEnquiry = asyncHandler(async (req, res, next) => {
  const profileMappings = await ProfileMapping.find({ enquiry_id: req.params.enquiryId })
    .populate({
      path: 'profile_id',
      select: 'name description status'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: profileMappings.length,
    data: profileMappings
  });
});

// @desc    Get profile mappings by profile
// @route   GET /api/v1/profile-mappings/profile/:profileType/:profileId
// @access  Private
exports.getProfileMappingsByProfile = asyncHandler(async (req, res, next) => {
  const { profileType, profileId } = req.params;

  // Validate profile type
  const validProfileTypes = ['project', 'product', 'amc', 'complaint', 'info', 'job', 'site_visit'];
  if (!validProfileTypes.includes(profileType)) {
    return next(
      new ErrorResponse(`Invalid profile type: ${profileType}`, 400)
    );
  }

  const profileMappings = await ProfileMapping.find({
    profile_type: profileType,
    profile_id: profileId
  })
    .populate({
      path: 'enquiry_id',
      select: 'name mobile email enquiry_id'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: profileMappings.length,
    data: profileMappings
  });
});

// @desc    Run a profile mapping rule
// @route   POST /api/v1/profile-mappings/:id/run
// @access  Private
exports.runProfileMapping = asyncHandler(async (req, res, next) => {
  const profileMapping = await ProfileMapping.findById(req.params.id)
    .populate({
      path: 'enquiry_id',
      select: 'name mobile email enquiry_id'
    });

  if (!profileMapping) {
    return next(
      new ErrorResponse(`Profile mapping not found with id of ${req.params.id}`, 404)
    );
  }

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'other',
    entity_type: 'profile_mapping',
    entity_id: profileMapping._id,
    description: `Executed profile mapping ${profileMapping.mapping_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  // Execute the actual mapping logic
  try {
    // Get the source profile data based on profile type and ID
    const sourceProfileModel = getModelByProfileType(profileMapping.profile_type);
    if (!sourceProfileModel) {
      // Update last_run to show attempt was made
      profileMapping.last_run = Date.now();
      await profileMapping.save();
      return next(new ErrorResponse(`Source profile type model not found: ${profileMapping.profile_type}. The model may not exist in the system.`, 400));
    }
    
    const sourceProfile = await sourceProfileModel.findById(profileMapping.profile_id);
    if (!sourceProfile) {
      // Update last_run to show attempt was made
      profileMapping.last_run = Date.now();
      await profileMapping.save();
      return next(new ErrorResponse(`Source profile not found with id: ${profileMapping.profile_id}`, 404));
    }
    
    // Get or create the target profile based on target profile type
    const targetProfileType = profileMapping.profile_type_ref || profileMapping.target_profile;
    const targetProfileModel = getModelByProfileType(targetProfileType);
    if (!targetProfileModel) {
      // Update last_run to show attempt was made
      profileMapping.last_run = Date.now();
      await profileMapping.save();
      return next(new ErrorResponse(`Target profile type model not found: ${targetProfileType}. The model may not exist in the system.`, 400));
    }
    
    // Create a new target profile or find existing one
    let targetProfile = await targetProfileModel.findOne({ 
      source_profile_id: profileMapping.profile_id,
      source_profile_type: profileMapping.profile_type
    });
    
    // If target profile doesn't exist, create a new one
    if (!targetProfile) {
      targetProfile = new targetProfileModel({
        source_profile_id: profileMapping.profile_id,
        source_profile_type: profileMapping.profile_type,
        created_by: req.user.id
      });
    }
    
    // Apply field mappings
    if (profileMapping.field_mappings && profileMapping.field_mappings.length > 0) {
      profileMapping.field_mappings.forEach(mapping => {
        let sourceValue = sourceProfile[mapping.source_field];
        
        // Apply transformation if specified
        if (mapping.transformation) {
          sourceValue = applyTransformation(sourceValue, mapping.transformation);
        }
        
        // Set the value in target profile
        targetProfile[mapping.target_field] = sourceValue;
      });
    }
    
    // Save the target profile
    await targetProfile.save();
    
    // Update conversion details
    profileMapping.last_run = Date.now();
    profileMapping.conversion_count = (profileMapping.conversion_count || 0) + 1;
    profileMapping.last_converted_id = targetProfile._id;
    
    await profileMapping.save();
  } catch (error) {
    console.error('Error executing profile mapping:', error);
    return next(new ErrorResponse(`Error executing profile mapping: ${error.message}`, 500));
  }

  res.status(200).json({
    success: true,
    message: `Profile mapping ${profileMapping.mapping_id} executed successfully`,
    data: profileMapping
  });
});

// @desc    Toggle profile mapping status (active/inactive)
// @route   PATCH /api/v1/profile-mappings/:id/status
// @access  Private
exports.toggleProfileMappingStatus = asyncHandler(async (req, res, next) => {
  const { is_active } = req.body;

  if (is_active === undefined) {
    return next(
      new ErrorResponse('Please provide is_active status', 400)
    );
  }

  let profileMapping = await ProfileMapping.findById(req.params.id);

  if (!profileMapping) {
    return next(
      new ErrorResponse(`Profile mapping not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...profileMapping.toObject() };

  // Update status
  profileMapping.is_active = is_active;
  await profileMapping.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'profile_mapping',
    entity_id: profileMapping._id,
    description: `${is_active ? 'Activated' : 'Deactivated'} profile mapping ${profileMapping.mapping_id}`,
    previous_state: previousState,
    new_state: profileMapping.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: profileMapping
  });
});
