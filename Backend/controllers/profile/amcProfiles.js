const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const AmcProfile = require('../../models/profile/AmcProfile');
const CustomerMaster = require('../../models/profile/CustomerMaster');
const Team = require('../../models/profile/Team');
const User = require('../../models/profile/User');
const UserActivityLog = require('../../models/profile/UserActivityLog');
const path = require('path');
const fs = require('fs');

// @desc    Get all AMC profiles
// @route   GET /api/v1/amc-profiles
// @access  Private
exports.getAmcProfiles = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single AMC profile
// @route   GET /api/v1/amc-profiles/:id
// @access  Private
exports.getAmcProfile = asyncHandler(async (req, res, next) => {
  const amcProfile = await AmcProfile.findById(req.params.id)
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'related_product',
      select: 'name product_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_technicians',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    })
    .populate({
      path: 'documents.uploaded_by',
      select: 'name email'
    })
    .populate({
      path: 'service_history.performed_by',
      select: 'name email'
    })
    .populate({
      path: 'notes.created_by',
      select: 'name email'
    });

  if (!amcProfile) {
    return next(
      new ErrorResponse(`AMC profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Log the view activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'view',
    entity_type: 'amc_profile',
    entity_id: amcProfile._id,
    description: `Viewed AMC profile ${amcProfile.amc_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: amcProfile
  });
});

// @desc    Create new AMC profile
// @route   POST /api/v1/amc-profiles
// @access  Private
exports.createAmcProfile = asyncHandler(async (req, res, next) => {
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

  // Check if assigned_team exists
  if (req.body.assigned_team) {
    const team = await Team.findById(req.body.assigned_team);
    if (!team) {
      return next(
        new ErrorResponse(`Team not found with id of ${req.body.assigned_team}`, 404)
      );
    }
  }

  // Check if assigned_technicians exist
  if (req.body.assigned_technicians && req.body.assigned_technicians.length > 0) {
    for (const techId of req.body.assigned_technicians) {
      const technician = await User.findById(techId);
      if (!technician) {
        return next(
          new ErrorResponse(`User not found with id of ${techId}`, 404)
        );
      }
    }
  }

  const amcProfile = await AmcProfile.create(req.body);

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'create',
    entity_type: 'amc_profile',
    entity_id: amcProfile._id,
    description: `Created AMC profile ${amcProfile.amc_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: amcProfile
  });
});

// @desc    Update AMC profile
// @route   PUT /api/v1/amc-profiles/:id
// @access  Private
exports.updateAmcProfile = asyncHandler(async (req, res, next) => {
  let amcProfile = await AmcProfile.findById(req.params.id);

  if (!amcProfile) {
    return next(
      new ErrorResponse(`AMC profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...amcProfile.toObject() };

  // Check if customer exists if being updated
  if (req.body.customer) {
    const customer = await CustomerMaster.findById(req.body.customer);
    if (!customer) {
      return next(
        new ErrorResponse(`Customer not found with id of ${req.body.customer}`, 404)
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

  // Check if assigned_technicians exist if being updated
  if (req.body.assigned_technicians && req.body.assigned_technicians.length > 0) {
    for (const techId of req.body.assigned_technicians) {
      const technician = await User.findById(techId);
      if (!technician) {
        return next(
          new ErrorResponse(`User not found with id of ${techId}`, 404)
        );
      }
    }
  }

  amcProfile = await AmcProfile.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'amc_profile',
    entity_id: amcProfile._id,
    description: `Updated AMC profile ${amcProfile.amc_id}`,
    previous_state: previousState,
    new_state: amcProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: amcProfile
  });
});

// @desc    Delete AMC profile
// @route   DELETE /api/v1/amc-profiles/:id
// @access  Private/Admin
exports.deleteAmcProfile = asyncHandler(async (req, res, next) => {
  const amcProfile = await AmcProfile.findById(req.params.id);

  if (!amcProfile) {
    return next(
      new ErrorResponse(`AMC profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store the profile data for activity log
  const deletedProfile = { ...amcProfile.toObject() };

  // Delete all documents associated with this profile
  if (amcProfile.documents && amcProfile.documents.length > 0) {
    amcProfile.documents.forEach(doc => {
      const filePath = `${process.env.FILE_UPLOAD_PATH}${doc.file_path}`;
      fs.unlink(filePath, err => {
        if (err && err.code !== 'ENOENT') {
          console.error(`Error deleting file: ${filePath}`, err);
        }
      });
    });
  }

  await amcProfile.remove();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'amc_profile',
    entity_id: amcProfile._id,
    description: `Deleted AMC profile ${amcProfile.amc_id}`,
    previous_state: deletedProfile,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add service record to AMC
// @route   POST /api/v1/amc-profiles/:id/service-history
// @access  Private
exports.addServiceRecord = asyncHandler(async (req, res, next) => {
  const amcProfile = await AmcProfile.findById(req.params.id);

  if (!amcProfile) {
    return next(
      new ErrorResponse(`AMC profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Add user to service record
  req.body.performed_by = req.user.id;
  req.body.service_date = req.body.service_date || Date.now();

  // Add service record to AMC
  amcProfile.service_history.push(req.body);

  await amcProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'amc_profile',
    entity_id: amcProfile._id,
    description: `Added service record to AMC ${amcProfile.amc_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: amcProfile.service_history[amcProfile.service_history.length - 1]
  });
});

// @desc    Update service record
// @route   PUT /api/v1/amc-profiles/:id/service-history/:recordId
// @access  Private
exports.updateServiceRecord = asyncHandler(async (req, res, next) => {
  const amcProfile = await AmcProfile.findById(req.params.id);

  if (!amcProfile) {
    return next(
      new ErrorResponse(`AMC profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the service record
  const serviceRecord = amcProfile.service_history.id(req.params.recordId);

  if (!serviceRecord) {
    return next(
      new ErrorResponse(`Service record not found with id of ${req.params.recordId}`, 404)
    );
  }

  // Update the service record fields
  Object.keys(req.body).forEach(key => {
    if (key !== 'performed_by') { // Don't allow changing the performer
      serviceRecord[key] = req.body[key];
    }
  });

  await amcProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'amc_profile',
    entity_id: amcProfile._id,
    description: `Updated service record in AMC ${amcProfile.amc_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: serviceRecord
  });
});

// @desc    Delete service record
// @route   DELETE /api/v1/amc-profiles/:id/service-history/:recordId
// @access  Private
exports.deleteServiceRecord = asyncHandler(async (req, res, next) => {
  const amcProfile = await AmcProfile.findById(req.params.id);

  if (!amcProfile) {
    return next(
      new ErrorResponse(`AMC profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the service record
  const serviceRecord = amcProfile.service_history.id(req.params.recordId);

  if (!serviceRecord) {
    return next(
      new ErrorResponse(`Service record not found with id of ${req.params.recordId}`, 404)
    );
  }

  // Remove the service record
  serviceRecord.remove();

  await amcProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'amc_profile',
    entity_id: amcProfile._id,
    description: `Deleted service record from AMC ${amcProfile.amc_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add note to AMC
// @route   POST /api/v1/amc-profiles/:id/notes
// @access  Private
exports.addNote = asyncHandler(async (req, res, next) => {
  const amcProfile = await AmcProfile.findById(req.params.id);

  if (!amcProfile) {
    return next(
      new ErrorResponse(`AMC profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Add user to note
  req.body.created_by = req.user.id;

  // Add note to AMC
  amcProfile.notes.push(req.body);

  await amcProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'amc_profile',
    entity_id: amcProfile._id,
    description: `Added note to AMC ${amcProfile.amc_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: amcProfile.notes[amcProfile.notes.length - 1]
  });
});

// @desc    Delete note
// @route   DELETE /api/v1/amc-profiles/:id/notes/:noteId
// @access  Private
exports.deleteNote = asyncHandler(async (req, res, next) => {
  const amcProfile = await AmcProfile.findById(req.params.id);

  if (!amcProfile) {
    return next(
      new ErrorResponse(`AMC profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the note
  const note = amcProfile.notes.id(req.params.noteId);

  if (!note) {
    return next(
      new ErrorResponse(`Note not found with id of ${req.params.noteId}`, 404)
    );
  }

  // Remove the note
  note.remove();

  await amcProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'amc_profile',
    entity_id: amcProfile._id,
    description: `Deleted note from AMC ${amcProfile.amc_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add document to AMC
// @route   POST /api/v1/amc-profiles/:id/documents
// @access  Private
exports.addDocument = asyncHandler(async (req, res, next) => {
  const amcProfile = await AmcProfile.findById(req.params.id);

  if (!amcProfile) {
    return next(
      new ErrorResponse(`AMC profile not found with id of ${req.params.id}`, 404)
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
  file.name = `${amcProfile.amc_id}_${Date.now()}${path.parse(file.name).ext}`;

  // Upload file to server
  file.mv(`${process.env.FILE_UPLOAD_PATH}/amc/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    // Add document to AMC
    amcProfile.documents.push({
      name: req.body.name || file.name,
      file_path: `/uploads/amc/${file.name}`,
      document_type: req.body.document_type || 'other',
      uploaded_by: req.user.id
    });

    await amcProfile.save();

    // Log the activity
    await UserActivityLog.create({
      user_id: req.user.id,
      action_type: 'update',
      entity_type: 'amc_profile',
      entity_id: amcProfile._id,
      description: `Added document to AMC ${amcProfile.amc_id}`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      data: amcProfile.documents[amcProfile.documents.length - 1]
    });
  });
});

// @desc    Delete document
// @route   DELETE /api/v1/amc-profiles/:id/documents/:documentId
// @access  Private
exports.deleteDocument = asyncHandler(async (req, res, next) => {
  const amcProfile = await AmcProfile.findById(req.params.id);

  if (!amcProfile) {
    return next(
      new ErrorResponse(`AMC profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the document
  const document = amcProfile.documents.id(req.params.documentId);

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

  await amcProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'amc_profile',
    entity_id: amcProfile._id,
    description: `Deleted document from AMC ${amcProfile.amc_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Assign AMC to team or technicians
// @route   PUT /api/v1/amc-profiles/:id/assign
// @access  Private
exports.assignAmc = asyncHandler(async (req, res, next) => {
  let amcProfile = await AmcProfile.findById(req.params.id);

  if (!amcProfile) {
    return next(
      new ErrorResponse(`AMC profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...amcProfile.toObject() };

  // Check if team exists if assigned_team is provided
  if (req.body.assigned_team) {
    const team = await Team.findById(req.body.assigned_team);
    if (!team) {
      return next(
        new ErrorResponse(`Team not found with id of ${req.body.assigned_team}`, 404)
      );
    }
  }

  // Check if technicians exist if assigned_technicians is provided
  if (req.body.assigned_technicians && req.body.assigned_technicians.length > 0) {
    for (const techId of req.body.assigned_technicians) {
      const technician = await User.findById(techId);
      if (!technician) {
        return next(
          new ErrorResponse(`User not found with id of ${techId}`, 404)
        );
      }
    }
  }

  // Update assignment fields
  const updateData = {};
  if (req.body.assigned_team) updateData.assigned_team = req.body.assigned_team;
  if (req.body.assigned_technicians) updateData.assigned_technicians = req.body.assigned_technicians;

  amcProfile = await AmcProfile.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'assign',
    entity_type: 'amc_profile',
    entity_id: amcProfile._id,
    description: `Assigned AMC ${amcProfile.amc_id}`,
    previous_state: previousState,
    new_state: amcProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: amcProfile
  });
});

// @desc    Change AMC status
// @route   PUT /api/v1/amc-profiles/:id/status
// @access  Private
exports.changeAmcStatus = asyncHandler(async (req, res, next) => {
  let amcProfile = await AmcProfile.findById(req.params.id);

  if (!amcProfile) {
    return next(
      new ErrorResponse(`AMC profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...amcProfile.toObject() };
  const previousStatus = amcProfile.status;

  // Validate status
  const validStatuses = ['active', 'pending', 'expired', 'cancelled', 'renewed'];
  if (!validStatuses.includes(req.body.status)) {
    return next(
      new ErrorResponse(`Invalid status: ${req.body.status}`, 400)
    );
  }

  // Update status
  amcProfile = await AmcProfile.findByIdAndUpdate(
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
    entity_type: 'amc_profile',
    entity_id: amcProfile._id,
    description: `Changed AMC ${amcProfile.amc_id} status from ${previousStatus} to ${amcProfile.status}`,
    previous_state: previousState,
    new_state: amcProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: amcProfile
  });
});

// @desc    Get AMCs by status
// @route   GET /api/v1/amc-profiles/status/:status
// @access  Private
exports.getAmcsByStatus = asyncHandler(async (req, res, next) => {
  // Validate status
  const validStatuses = ['active', 'pending', 'expired', 'cancelled', 'renewed'];
  if (!validStatuses.includes(req.params.status)) {
    return next(
      new ErrorResponse(`Invalid status: ${req.params.status}`, 400)
    );
  }

  const amcs = await AmcProfile.find({ status: req.params.status })
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'related_product',
      select: 'name product_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_technicians',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: amcs.length,
    data: amcs
  });
});

// @desc    Get AMCs by customer
// @route   GET /api/v1/customers/:customerId/amcs
// @access  Private
exports.getCustomerAmcs = asyncHandler(async (req, res, next) => {
  const customer = await CustomerMaster.findById(req.params.customerId);

  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${req.params.customerId}`, 404)
    );
  }

  const amcs = await AmcProfile.find({ customer: customer._id })
    .populate({
      path: 'related_product',
      select: 'name product_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_technicians',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: amcs.length,
    data: amcs
  });
});

// @desc    Get AMCs assigned to team
// @route   GET /api/v1/teams/:teamId/amcs
// @access  Private
exports.getTeamAmcs = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.teamId);

  if (!team) {
    return next(
      new ErrorResponse(`Team not found with id of ${req.params.teamId}`, 404)
    );
  }

  const amcs = await AmcProfile.find({ assigned_team: team._id })
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'related_product',
      select: 'name product_id'
    })
    .populate({
      path: 'assigned_technicians',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: amcs.length,
    data: amcs
  });
});

// @desc    Get AMCs assigned to technician
// @route   GET /api/v1/users/:userId/technician-amcs
// @access  Private
exports.getTechnicianAmcs = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.userId}`, 404)
    );
  }

  const amcs = await AmcProfile.find({ assigned_technicians: user._id })
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'related_product',
      select: 'name product_id'
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
    count: amcs.length,
    data: amcs
  });
});

// @desc    Get expiring AMCs
// @route   GET /api/v1/amc-profiles/expiring/:days
// @access  Private
exports.getExpiringAmcs = asyncHandler(async (req, res, next) => {
  const days = parseInt(req.params.days) || 30;
  
  // Calculate the date 'days' from now
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  // Find AMCs that expire between now and the calculated date
  const amcs = await AmcProfile.find({
    end_date: { $gte: new Date(), $lte: expiryDate },
    status: 'active'
  })
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'related_product',
      select: 'name product_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_technicians',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: amcs.length,
    data: amcs
  });
});

// @desc    Search AMCs
// @route   GET /api/v1/amc-profiles/search
// @access  Private
exports.searchAmcs = asyncHandler(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new ErrorResponse('Please provide a search query', 400));
  }

  // Create search query
  const searchQuery = {
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { amc_id: { $regex: query, $options: 'i' } },
      { amc_type: { $regex: query, $options: 'i' } },
      { terms_and_conditions: { $regex: query, $options: 'i' } }
    ]
  };

  const amcs = await AmcProfile.find(searchQuery)
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'related_product',
      select: 'name product_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_technicians',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: amcs.length,
    data: amcs
  });
});
