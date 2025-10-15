const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const InfoProfile = require('../../models/profile/InfoProfile');
const CustomerMaster = require('../../models/profile/CustomerMaster');
const ProjectProfile = require('../../models/profile/ProjectProfile');
const ProductProfile = require('../../models/profile/ProductProfile');
const AmcProfile = require('../../models/profile/AmcProfile');
const Team = require('../../models/profile/Team');
const User = require('../../models/profile/User');
const UserActivityLog = require('../../models/profile/UserActivityLog');
const path = require('path');
const fs = require('fs');

// @desc    Get all info profiles
// @route   GET /api/v1/info-profiles
// @access  Private
exports.getInfoProfiles = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single info profile
// @route   GET /api/v1/info-profiles/:id
// @access  Private
exports.getInfoProfile = asyncHandler(async (req, res, next) => {
  const infoProfile = await InfoProfile.findById(req.params.id)
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'related_project',
      select: 'title project_id'
    })
    .populate({
      path: 'related_product',
      select: 'name product_id'
    })
    .populate({
      path: 'related_amc',
      select: 'title amc_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_to',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    })
    .populate({
      path: 'response_details.provided_by',
      select: 'name email'
    })
    .populate({
      path: 'customer_feedback.submitted_by',
      select: 'name email'
    })
    .populate({
      path: 'notes.created_by',
      select: 'name email'
    });

  if (!infoProfile) {
    return next(
      new ErrorResponse(`Info profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Log the view activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'view',
    entity_type: 'info_profile',
    entity_id: infoProfile._id,
    description: `Viewed info profile ${infoProfile.info_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoProfile
  });
});

// @desc    Create new info profile
// @route   POST /api/v1/info-profiles
// @access  Private
exports.createInfoProfile = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.created_by = req.user.id;

  // Check if customer exists
  if (req.body.customer) {
    const customer = await CustomerMaster.findById(req.body.customer);
    if (!customer) {
      return next(
        new ErrorResponse(`Customer not found with id of ${req.body.customer}`, 404)
      );
    }
  }

  // Check if related_project exists if provided
  if (req.body.related_project) {
    const project = await ProjectProfile.findById(req.body.related_project);
    if (!project) {
      return next(
        new ErrorResponse(`Project not found with id of ${req.body.related_project}`, 404)
      );
    }
  }

  // Check if related_product exists if provided
  if (req.body.related_product) {
    const product = await ProductProfile.findById(req.body.related_product);
    if (!product) {
      return next(
        new ErrorResponse(`Product not found with id of ${req.body.related_product}`, 404)
      );
    }
  }

  // Check if related_amc exists if provided
  if (req.body.related_amc) {
    const amc = await AmcProfile.findById(req.body.related_amc);
    if (!amc) {
      return next(
        new ErrorResponse(`AMC not found with id of ${req.body.related_amc}`, 404)
      );
    }
  }

  // Check if assigned_team exists if provided
  if (req.body.assigned_team) {
    const team = await Team.findById(req.body.assigned_team);
    if (!team) {
      return next(
        new ErrorResponse(`Team not found with id of ${req.body.assigned_team}`, 404)
      );
    }
  }

  // Check if assigned_to exists if provided
  if (req.body.assigned_to) {
    const user = await User.findById(req.body.assigned_to);
    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.body.assigned_to}`, 404)
      );
    }
  }

  const infoProfile = await InfoProfile.create(req.body);

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'create',
    entity_type: 'info_profile',
    entity_id: infoProfile._id,
    description: `Created info profile ${infoProfile.info_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: infoProfile
  });
});

// @desc    Update info profile
// @route   PUT /api/v1/info-profiles/:id
// @access  Private
exports.updateInfoProfile = asyncHandler(async (req, res, next) => {
  let infoProfile = await InfoProfile.findById(req.params.id);

  if (!infoProfile) {
    return next(
      new ErrorResponse(`Info profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...infoProfile.toObject() };

  // Check if customer exists if being updated
  if (req.body.customer) {
    const customer = await CustomerMaster.findById(req.body.customer);
    if (!customer) {
      return next(
        new ErrorResponse(`Customer not found with id of ${req.body.customer}`, 404)
      );
    }
  }

  // Check if related_project exists if being updated
  if (req.body.related_project) {
    const project = await ProjectProfile.findById(req.body.related_project);
    if (!project) {
      return next(
        new ErrorResponse(`Project not found with id of ${req.body.related_project}`, 404)
      );
    }
  }

  // Check if related_product exists if being updated
  if (req.body.related_product) {
    const product = await ProductProfile.findById(req.body.related_product);
    if (!product) {
      return next(
        new ErrorResponse(`Product not found with id of ${req.body.related_product}`, 404)
      );
    }
  }

  // Check if related_amc exists if being updated
  if (req.body.related_amc) {
    const amc = await AmcProfile.findById(req.body.related_amc);
    if (!amc) {
      return next(
        new ErrorResponse(`AMC not found with id of ${req.body.related_amc}`, 404)
      );
    }
  }

  // Check if assigned_team exists if being updated
  if (req.body.assigned_team) {
    const team = await Team.findById(req.body.assigned_team);
    if (!team) {
      return next(
        new ErrorResponse(`Team not found with id of ${req.body.assigned_team}`, 404)
      );
    }
  }

  // Check if assigned_to exists if being updated
  if (req.body.assigned_to) {
    const user = await User.findById(req.body.assigned_to);
    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.body.assigned_to}`, 404)
      );
    }
  }

  infoProfile = await InfoProfile.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_profile',
    entity_id: infoProfile._id,
    description: `Updated info profile ${infoProfile.info_id}`,
    previous_state: previousState,
    new_state: infoProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoProfile
  });
});

// @desc    Delete info profile
// @route   DELETE /api/v1/info-profiles/:id
// @access  Private/Admin
exports.deleteInfoProfile = asyncHandler(async (req, res, next) => {
  const infoProfile = await InfoProfile.findById(req.params.id);

  if (!infoProfile) {
    return next(
      new ErrorResponse(`Info profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store the profile data for activity log
  const deletedProfile = { ...infoProfile.toObject() };

  // Delete all documents associated with this profile
  if (infoProfile.documents && infoProfile.documents.length > 0) {
    infoProfile.documents.forEach(document => {
      const filePath = `${process.env.FILE_UPLOAD_PATH}${document.file_path}`;
      fs.unlink(filePath, err => {
        if (err && err.code !== 'ENOENT') {
          console.error(`Error deleting file: ${filePath}`, err);
        }
      });
    });
  }

  await infoProfile.remove();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'info_profile',
    entity_id: infoProfile._id,
    description: `Deleted info profile ${infoProfile.info_id}`,
    previous_state: deletedProfile,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add response details
// @route   PUT /api/v1/info-profiles/:id/response
// @access  Private
exports.addResponseDetails = asyncHandler(async (req, res, next) => {
  let infoProfile = await InfoProfile.findById(req.params.id);

  if (!infoProfile) {
    return next(
      new ErrorResponse(`Info profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...infoProfile.toObject() };

  // Validate response data
  if (!req.body.content) {
    return next(
      new ErrorResponse('Please provide response content', 400)
    );
  }

  // Create response details object
  const responseDetails = {
    content: req.body.content,
    provided_by: req.user.id,
    provided_at: Date.now()
  };

  // Update response details and status
  infoProfile = await InfoProfile.findByIdAndUpdate(
    req.params.id,
    { 
      response_details: responseDetails,
      response_date: Date.now(),
      status: 'responded'
    },
    {
      new: true,
      runValidators: true
    }
  );

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_profile',
    entity_id: infoProfile._id,
    description: `Added response to info request ${infoProfile.info_id}`,
    previous_state: previousState,
    new_state: infoProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoProfile.response_details
  });
});

// @desc    Add customer feedback
// @route   PUT /api/v1/info-profiles/:id/feedback
// @access  Private
exports.addCustomerFeedback = asyncHandler(async (req, res, next) => {
  let infoProfile = await InfoProfile.findById(req.params.id);

  if (!infoProfile) {
    return next(
      new ErrorResponse(`Info profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...infoProfile.toObject() };

  // Validate feedback data
  if (req.body.is_satisfied === undefined) {
    return next(
      new ErrorResponse('Please indicate if the customer is satisfied', 400)
    );
  }

  // Create feedback object
  const feedback = {
    is_satisfied: req.body.is_satisfied,
    comments: req.body.comments || '',
    submitted_by: req.user.id,
    submitted_at: Date.now()
  };

  // Update customer feedback and close the request if satisfied
  const updateData = { customer_feedback: feedback };
  if (req.body.is_satisfied) {
    updateData.status = 'closed';
  }

  infoProfile = await InfoProfile.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_profile',
    entity_id: infoProfile._id,
    description: `Added customer feedback to info request ${infoProfile.info_id}`,
    previous_state: previousState,
    new_state: infoProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoProfile.customer_feedback
  });
});

// @desc    Add note to info profile
// @route   POST /api/v1/info-profiles/:id/notes
// @access  Private
exports.addNote = asyncHandler(async (req, res, next) => {
  const infoProfile = await InfoProfile.findById(req.params.id);

  if (!infoProfile) {
    return next(
      new ErrorResponse(`Info profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Add user to note
  req.body.created_by = req.user.id;

  // Add note to info profile
  infoProfile.notes.push(req.body);

  await infoProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_profile',
    entity_id: infoProfile._id,
    description: `Added note to info profile ${infoProfile.info_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoProfile.notes[infoProfile.notes.length - 1]
  });
});

// @desc    Delete note
// @route   DELETE /api/v1/info-profiles/:id/notes/:noteId
// @access  Private
exports.deleteNote = asyncHandler(async (req, res, next) => {
  const infoProfile = await InfoProfile.findById(req.params.id);

  if (!infoProfile) {
    return next(
      new ErrorResponse(`Info profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the note
  const note = infoProfile.notes.id(req.params.noteId);

  if (!note) {
    return next(
      new ErrorResponse(`Note not found with id of ${req.params.noteId}`, 404)
    );
  }

  // Remove the note
  note.remove();

  await infoProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_profile',
    entity_id: infoProfile._id,
    description: `Deleted note from info profile ${infoProfile.info_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add document to info profile
// @route   POST /api/v1/info-profiles/:id/documents
// @access  Private
exports.addDocument = asyncHandler(async (req, res, next) => {
  const infoProfile = await InfoProfile.findById(req.params.id);

  if (!infoProfile) {
    return next(
      new ErrorResponse(`Info profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if file was uploaded
  if (!req.files || !req.files.file) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Make sure the file is an allowed type
  const fileTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
  const extname = fileTypes.test(path.extname(file.name).toLowerCase());

  if (!extname) {
    return next(new ErrorResponse(`Please upload a valid file`, 400));
  }

  // Create custom filename
  file.name = `${infoProfile.info_id}_${Date.now()}${path.parse(file.name).ext}`;

  // Upload file to server
  file.mv(`${process.env.FILE_UPLOAD_PATH}/info-profiles/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    // Add document to info profile
    infoProfile.documents.push({
      name: req.body.name || file.name,
      file_path: `/uploads/info-profiles/${file.name}`,
      file_type: path.extname(file.name).toLowerCase().substring(1),
      uploaded_by: req.user.id
    });

    await infoProfile.save();

    // Log the activity
    await UserActivityLog.create({
      user_id: req.user.id,
      action_type: 'update',
      entity_type: 'info_profile',
      entity_id: infoProfile._id,
      description: `Added document to info profile ${infoProfile.info_id}`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      data: infoProfile.documents[infoProfile.documents.length - 1]
    });
  });
});

// @desc    Delete document
// @route   DELETE /api/v1/info-profiles/:id/documents/:documentId
// @access  Private
exports.deleteDocument = asyncHandler(async (req, res, next) => {
  const infoProfile = await InfoProfile.findById(req.params.id);

  if (!infoProfile) {
    return next(
      new ErrorResponse(`Info profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the document
  const document = infoProfile.documents.id(req.params.documentId);

  if (!document) {
    return next(
      new ErrorResponse(`Document not found with id of ${req.params.documentId}`, 404)
    );
  }

  // Delete file from server
  const filePath = `${process.env.FILE_UPLOAD_PATH}${document.file_path}`;
  fs.unlink(filePath, err => {
    if (err && err.code !== 'ENOENT') {
      console.error(err);
      return next(new ErrorResponse(`Problem with file deletion`, 500));
    }
  });

  // Remove the document
  document.remove();

  await infoProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_profile',
    entity_id: infoProfile._id,
    description: `Deleted document from info profile ${infoProfile.info_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Assign info request to team or user
// @route   PUT /api/v1/info-profiles/:id/assign
// @access  Private
exports.assignInfoRequest = asyncHandler(async (req, res, next) => {
  let infoProfile = await InfoProfile.findById(req.params.id);

  if (!infoProfile) {
    return next(
      new ErrorResponse(`Info profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...infoProfile.toObject() };

  // Check if team exists if assigned_team is provided
  if (req.body.assigned_team) {
    const team = await Team.findById(req.body.assigned_team);
    if (!team) {
      return next(
        new ErrorResponse(`Team not found with id of ${req.body.assigned_team}`, 404)
      );
    }
  }

  // Check if user exists if assigned_to is provided
  if (req.body.assigned_to) {
    const user = await User.findById(req.body.assigned_to);
    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.body.assigned_to}`, 404)
      );
    }
  }

  // Update assignment fields
  const updateData = {};
  if (req.body.assigned_team) updateData.assigned_team = req.body.assigned_team;
  if (req.body.assigned_to) updateData.assigned_to = req.body.assigned_to;

  // If request is being assigned and status is pending, update to in_progress
  if ((req.body.assigned_team || req.body.assigned_to) && infoProfile.status === 'pending') {
    updateData.status = 'in_progress';
  }

  infoProfile = await InfoProfile.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'assign',
    entity_type: 'info_profile',
    entity_id: infoProfile._id,
    description: `Assigned info request ${infoProfile.info_id}`,
    previous_state: previousState,
    new_state: infoProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoProfile
  });
});

// @desc    Change info request status
// @route   PUT /api/v1/info-profiles/:id/status
// @access  Private
exports.changeInfoRequestStatus = asyncHandler(async (req, res, next) => {
  let infoProfile = await InfoProfile.findById(req.params.id);

  if (!infoProfile) {
    return next(
      new ErrorResponse(`Info profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...infoProfile.toObject() };
  const previousStatus = infoProfile.status;

  // Validate status
  const validStatuses = ['pending', 'in_progress', 'responded', 'closed', 'cancelled'];
  if (!validStatuses.includes(req.body.status)) {
    return next(
      new ErrorResponse(`Invalid status: ${req.body.status}`, 400)
    );
  }

  // Update status
  infoProfile = await InfoProfile.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    {
      new: true,
      runValidators: true
    }
  );

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'status_change',
    entity_type: 'info_profile',
    entity_id: infoProfile._id,
    description: `Changed info request ${infoProfile.info_id} status from ${previousStatus} to ${infoProfile.status}`,
    previous_state: previousState,
    new_state: infoProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoProfile
  });
});

// @desc    Get info requests by status
// @route   GET /api/v1/info-profiles/status/:status
// @access  Private
exports.getInfoRequestsByStatus = asyncHandler(async (req, res, next) => {
  // Validate status
  const validStatuses = ['pending', 'in_progress', 'responded', 'closed', 'cancelled'];
  if (!validStatuses.includes(req.params.status)) {
    return next(
      new ErrorResponse(`Invalid status: ${req.params.status}`, 400)
    );
  }

  const infoRequests = await InfoProfile.find({ status: req.params.status })
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_to',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: infoRequests.length,
    data: infoRequests
  });
});

// @desc    Get info requests by priority
// @route   GET /api/v1/info-profiles/priority/:priority
// @access  Private
exports.getInfoRequestsByPriority = asyncHandler(async (req, res, next) => {
  // Validate priority
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (!validPriorities.includes(req.params.priority)) {
    return next(
      new ErrorResponse(`Invalid priority: ${req.params.priority}`, 400)
    );
  }

  const infoRequests = await InfoProfile.find({ priority: req.params.priority })
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_to',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: infoRequests.length,
    data: infoRequests
  });
});

// @desc    Get info requests by customer
// @route   GET /api/v1/customers/:customerId/info-requests
// @access  Private
exports.getCustomerInfoRequests = asyncHandler(async (req, res, next) => {
  const customer = await CustomerMaster.findById(req.params.customerId);

  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${req.params.customerId}`, 404)
    );
  }

  const infoRequests = await InfoProfile.find({ customer: customer._id })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_to',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: infoRequests.length,
    data: infoRequests
  });
});

// @desc    Get info requests assigned to team
// @route   GET /api/v1/teams/:teamId/info-requests
// @access  Private
exports.getTeamInfoRequests = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.teamId);

  if (!team) {
    return next(
      new ErrorResponse(`Team not found with id of ${req.params.teamId}`, 404)
    );
  }

  const infoRequests = await InfoProfile.find({ assigned_team: team._id })
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'assigned_to',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: infoRequests.length,
    data: infoRequests
  });
});

// @desc    Get info requests assigned to user
// @route   GET /api/v1/users/:userId/info-requests
// @access  Private
exports.getUserInfoRequests = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.userId}`, 404)
    );
  }

  const infoRequests = await InfoProfile.find({ assigned_to: user._id })
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: infoRequests.length,
    data: infoRequests
  });
});

// @desc    Get overdue info requests
// @route   GET /api/v1/info-profiles/overdue
// @access  Private
exports.getOverdueInfoRequests = asyncHandler(async (req, res, next) => {
  // Find info requests that are not closed or cancelled and have a request_date older than the response time threshold
  const thresholdDays = 3; // Configurable threshold for response time
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);
  
  const infoRequests = await InfoProfile.find({
    status: { $nin: ['responded', 'closed', 'cancelled'] },
    request_date: { $lt: thresholdDate }
  })
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_to',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: infoRequests.length,
    data: infoRequests
  });
});

// @desc    Search info requests
// @route   GET /api/v1/info-profiles/search
// @access  Private
exports.searchInfoRequests = asyncHandler(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new ErrorResponse('Please provide a search query', 400));
  }

  // Create search query
  const searchQuery = {
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { info_id: { $regex: query, $options: 'i' } },
      { info_type: { $regex: query, $options: 'i' } },
      { 'response_details.content': { $regex: query, $options: 'i' } }
    ]
  };

  const infoRequests = await InfoProfile.find(searchQuery)
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_to',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: infoRequests.length,
    data: infoRequests
  });
});
