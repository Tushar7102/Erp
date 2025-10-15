const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const ComplaintProfile = require('../../models/profile/ComplaintProfile');
const CustomerMaster = require('../../models/profile/CustomerMaster');
const ProjectProfile = require('../../models/profile/ProjectProfile');
const ProductProfile = require('../../models/profile/ProductProfile');
const AmcProfile = require('../../models/profile/AmcProfile');
const Team = require('../../models/profile/Team');
const User = require('../../models/profile/User');
const UserActivityLog = require('../../models/profile/UserActivityLog');
const path = require('path');
const fs = require('fs');

// @desc    Get all complaint profiles
// @route   GET /api/v1/complaint-profiles
// @access  Private
exports.getComplaintProfiles = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single complaint profile
// @route   GET /api/v1/complaint-profiles/:id
// @access  Private
exports.getComplaintProfile = asyncHandler(async (req, res, next) => {
  const complaintProfile = await ComplaintProfile.findById(req.params.id)
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
      path: 'activity_log.performed_by',
      select: 'name email'
    })
    .populate({
      path: 'notes.created_by',
      select: 'name email'
    });

  if (!complaintProfile) {
    return next(
      new ErrorResponse(`Complaint profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Log the view activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'view',
    entity_type: 'complaint_profile',
    entity_id: complaintProfile._id,
    description: `Viewed complaint profile ${complaintProfile.complaint_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: complaintProfile
  });
});

// @desc    Create new complaint profile
// @route   POST /api/v1/complaint-profiles
// @access  Private
exports.createComplaintProfile = asyncHandler(async (req, res, next) => {
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

  // Set reported_date to now if not provided
  if (!req.body.reported_date) {
    req.body.reported_date = Date.now();
  }

  // Add initial activity log entry
  if (!req.body.activity_log) {
    req.body.activity_log = [];
  }
  
  req.body.activity_log.push({
    action: 'created',
    performed_by: req.user.id,
    timestamp: Date.now(),
    details: 'Complaint created'
  });

  const complaintProfile = await ComplaintProfile.create(req.body);

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'create',
    entity_type: 'complaint_profile',
    entity_id: complaintProfile._id,
    description: `Created complaint profile ${complaintProfile.complaint_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: complaintProfile
  });
});

// @desc    Update complaint profile
// @route   PUT /api/v1/complaint-profiles/:id
// @access  Private
exports.updateComplaintProfile = asyncHandler(async (req, res, next) => {
  let complaintProfile = await ComplaintProfile.findById(req.params.id);

  if (!complaintProfile) {
    return next(
      new ErrorResponse(`Complaint profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...complaintProfile.toObject() };

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

  // Don't allow direct modification of activity_log through update
  delete req.body.activity_log;

  // Add activity log entry for update
  const updateActivityLog = {
    action: 'updated',
    performed_by: req.user.id,
    timestamp: Date.now(),
    details: 'Complaint details updated'
  };

  complaintProfile = await ComplaintProfile.findByIdAndUpdate(
    req.params.id,
    { 
      ...req.body,
      $push: { activity_log: updateActivityLog }
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
    entity_type: 'complaint_profile',
    entity_id: complaintProfile._id,
    description: `Updated complaint profile ${complaintProfile.complaint_id}`,
    previous_state: previousState,
    new_state: complaintProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: complaintProfile
  });
});

// @desc    Delete complaint profile
// @route   DELETE /api/v1/complaint-profiles/:id
// @access  Private/Admin
exports.deleteComplaintProfile = asyncHandler(async (req, res, next) => {
  const complaintProfile = await ComplaintProfile.findById(req.params.id);

  if (!complaintProfile) {
    return next(
      new ErrorResponse(`Complaint profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store the profile data for activity log
  const deletedProfile = { ...complaintProfile.toObject() };

  // Delete all attachments associated with this profile
  if (complaintProfile.attachments && complaintProfile.attachments.length > 0) {
    complaintProfile.attachments.forEach(attachment => {
      const filePath = `${process.env.FILE_UPLOAD_PATH}${attachment.file_path}`;
      fs.unlink(filePath, err => {
        if (err && err.code !== 'ENOENT') {
          console.error(`Error deleting file: ${filePath}`, err);
        }
      });
    });
  }

  await complaintProfile.remove();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'complaint_profile',
    entity_id: complaintProfile._id,
    description: `Deleted complaint profile ${complaintProfile.complaint_id}`,
    previous_state: deletedProfile,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add activity log entry
// @route   POST /api/v1/complaint-profiles/:id/activity
// @access  Private
exports.addActivityLog = asyncHandler(async (req, res, next) => {
  const complaintProfile = await ComplaintProfile.findById(req.params.id);

  if (!complaintProfile) {
    return next(
      new ErrorResponse(`Complaint profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Add user to activity log
  req.body.performed_by = req.user.id;
  req.body.timestamp = Date.now();

  // Add activity log to complaint
  complaintProfile.activity_log.push(req.body);

  await complaintProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'complaint_profile',
    entity_id: complaintProfile._id,
    description: `Added activity log to complaint ${complaintProfile.complaint_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: complaintProfile.activity_log[complaintProfile.activity_log.length - 1]
  });
});

// @desc    Add note to complaint
// @route   POST /api/v1/complaint-profiles/:id/notes
// @access  Private
exports.addNote = asyncHandler(async (req, res, next) => {
  const complaintProfile = await ComplaintProfile.findById(req.params.id);

  if (!complaintProfile) {
    return next(
      new ErrorResponse(`Complaint profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Add user to note
  req.body.created_by = req.user.id;

  // Add note to complaint
  complaintProfile.notes.push(req.body);

  // Add activity log entry for adding note
  complaintProfile.activity_log.push({
    action: 'note_added',
    performed_by: req.user.id,
    timestamp: Date.now(),
    details: 'Added note to complaint'
  });

  await complaintProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'complaint_profile',
    entity_id: complaintProfile._id,
    description: `Added note to complaint ${complaintProfile.complaint_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: complaintProfile.notes[complaintProfile.notes.length - 1]
  });
});

// @desc    Delete note
// @route   DELETE /api/v1/complaint-profiles/:id/notes/:noteId
// @access  Private
exports.deleteNote = asyncHandler(async (req, res, next) => {
  const complaintProfile = await ComplaintProfile.findById(req.params.id);

  if (!complaintProfile) {
    return next(
      new ErrorResponse(`Complaint profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the note
  const note = complaintProfile.notes.id(req.params.noteId);

  if (!note) {
    return next(
      new ErrorResponse(`Note not found with id of ${req.params.noteId}`, 404)
    );
  }

  // Remove the note
  note.remove();

  // Add activity log entry for deleting note
  complaintProfile.activity_log.push({
    action: 'note_deleted',
    performed_by: req.user.id,
    timestamp: Date.now(),
    details: 'Deleted note from complaint'
  });

  await complaintProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'complaint_profile',
    entity_id: complaintProfile._id,
    description: `Deleted note from complaint ${complaintProfile.complaint_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add attachment to complaint
// @route   POST /api/v1/complaint-profiles/:id/attachments
// @access  Private
exports.addAttachment = asyncHandler(async (req, res, next) => {
  const complaintProfile = await ComplaintProfile.findById(req.params.id);

  if (!complaintProfile) {
    return next(
      new ErrorResponse(`Complaint profile not found with id of ${req.params.id}`, 404)
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
  file.name = `${complaintProfile.complaint_id}_${Date.now()}${path.parse(file.name).ext}`;

  // Upload file to server
  file.mv(`${process.env.FILE_UPLOAD_PATH}/complaints/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    // Add attachment to complaint
    complaintProfile.attachments.push({
      name: req.body.name || file.name,
      file_path: `/uploads/complaints/${file.name}`,
      file_type: path.extname(file.name).toLowerCase().substring(1),
      uploaded_by: req.user.id
    });

    // Add activity log entry for adding attachment
    complaintProfile.activity_log.push({
      action: 'attachment_added',
      performed_by: req.user.id,
      timestamp: Date.now(),
      details: `Added attachment: ${req.body.name || file.name}`
    });

    await complaintProfile.save();

    // Log the activity
    await UserActivityLog.create({
      user_id: req.user.id,
      action_type: 'update',
      entity_type: 'complaint_profile',
      entity_id: complaintProfile._id,
      description: `Added attachment to complaint ${complaintProfile.complaint_id}`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      data: complaintProfile.attachments[complaintProfile.attachments.length - 1]
    });
  });
});

// @desc    Delete attachment
// @route   DELETE /api/v1/complaint-profiles/:id/attachments/:attachmentId
// @access  Private
exports.deleteAttachment = asyncHandler(async (req, res, next) => {
  const complaintProfile = await ComplaintProfile.findById(req.params.id);

  if (!complaintProfile) {
    return next(
      new ErrorResponse(`Complaint profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the attachment
  const attachment = complaintProfile.attachments.id(req.params.attachmentId);

  if (!attachment) {
    return next(
      new ErrorResponse(`Attachment not found with id of ${req.params.attachmentId}`, 404)
    );
  }

  // Delete file from server
  const filePath = `${process.env.FILE_UPLOAD_PATH}${attachment.file_path}`;
  fs.unlink(filePath, err => {
    if (err && err.code !== 'ENOENT') {
      console.error(err);
      return next(new ErrorResponse(`Problem with file deletion`, 500));
    }
  });

  // Store attachment name for activity log
  const attachmentName = attachment.name;

  // Remove the attachment
  attachment.remove();

  // Add activity log entry for deleting attachment
  complaintProfile.activity_log.push({
    action: 'attachment_deleted',
    performed_by: req.user.id,
    timestamp: Date.now(),
    details: `Deleted attachment: ${attachmentName}`
  });

  await complaintProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'complaint_profile',
    entity_id: complaintProfile._id,
    description: `Deleted attachment from complaint ${complaintProfile.complaint_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Assign complaint to team or user
// @route   PUT /api/v1/complaint-profiles/:id/assign
// @access  Private
exports.assignComplaint = asyncHandler(async (req, res, next) => {
  let complaintProfile = await ComplaintProfile.findById(req.params.id);

  if (!complaintProfile) {
    return next(
      new ErrorResponse(`Complaint profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...complaintProfile.toObject() };
  const previousTeam = complaintProfile.assigned_team ? 
    await Team.findById(complaintProfile.assigned_team) : null;
  const previousAssignee = complaintProfile.assigned_to ? 
    await User.findById(complaintProfile.assigned_to) : null;

  // Check if team exists if assigned_team is provided
  let newTeam = null;
  if (req.body.assigned_team) {
    newTeam = await Team.findById(req.body.assigned_team);
    if (!newTeam) {
      return next(
        new ErrorResponse(`Team not found with id of ${req.body.assigned_team}`, 404)
      );
    }
  }

  // Check if user exists if assigned_to is provided
  let newAssignee = null;
  if (req.body.assigned_to) {
    newAssignee = await User.findById(req.body.assigned_to);
    if (!newAssignee) {
      return next(
        new ErrorResponse(`User not found with id of ${req.body.assigned_to}`, 404)
      );
    }
  }

  // Update assignment fields
  const updateData = {};
  if (req.body.assigned_team) updateData.assigned_team = req.body.assigned_team;
  if (req.body.assigned_to) updateData.assigned_to = req.body.assigned_to;

  // Create activity log entry for assignment
  let assignmentDetails = 'Complaint reassigned';
  if (newTeam && (!previousTeam || previousTeam._id.toString() !== newTeam._id.toString())) {
    assignmentDetails = `Assigned to team: ${newTeam.name}`;
  }
  if (newAssignee && (!previousAssignee || previousAssignee._id.toString() !== newAssignee._id.toString())) {
    assignmentDetails = assignmentDetails === 'Complaint reassigned' ? 
      `Assigned to user: ${newAssignee.name}` : 
      `${assignmentDetails} and user: ${newAssignee.name}`;
  }

  const assignActivityLog = {
    action: 'assigned',
    performed_by: req.user.id,
    timestamp: Date.now(),
    details: assignmentDetails
  };

  complaintProfile = await ComplaintProfile.findByIdAndUpdate(
    req.params.id,
    { 
      ...updateData,
      $push: { activity_log: assignActivityLog }
    },
    {
      new: true,
      runValidators: true
    }
  );

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'assign',
    entity_type: 'complaint_profile',
    entity_id: complaintProfile._id,
    description: `Assigned complaint ${complaintProfile.complaint_id}`,
    previous_state: previousState,
    new_state: complaintProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: complaintProfile
  });
});

// @desc    Change complaint status
// @route   PUT /api/v1/complaint-profiles/:id/status
// @access  Private
exports.changeComplaintStatus = asyncHandler(async (req, res, next) => {
  let complaintProfile = await ComplaintProfile.findById(req.params.id);

  if (!complaintProfile) {
    return next(
      new ErrorResponse(`Complaint profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...complaintProfile.toObject() };
  const previousStatus = complaintProfile.status;

  // Validate status
  const validStatuses = ['new', 'assigned', 'in_progress', 'on_hold', 'resolved', 'closed', 'reopened'];
  if (!validStatuses.includes(req.body.status)) {
    return next(
      new ErrorResponse(`Invalid status: ${req.body.status}`, 400)
    );
  }

  // If status is changing to resolved, require resolution details
  if (req.body.status === 'resolved' && previousStatus !== 'resolved') {
    if (!req.body.resolution || !req.body.resolution_type) {
      return next(
        new ErrorResponse('Resolution details are required when resolving a complaint', 400)
      );
    }
    // Set actual_resolution_date to now if not provided
    if (!req.body.actual_resolution_date) {
      req.body.actual_resolution_date = Date.now();
    }
  }

  // Create activity log entry for status change
  const statusActivityLog = {
    action: 'status_changed',
    performed_by: req.user.id,
    timestamp: Date.now(),
    details: `Status changed from ${previousStatus} to ${req.body.status}`
  };

  // Update fields
  const updateData = { status: req.body.status };
  if (req.body.resolution) updateData.resolution = req.body.resolution;
  if (req.body.resolution_type) updateData.resolution_type = req.body.resolution_type;
  if (req.body.actual_resolution_date) updateData.actual_resolution_date = req.body.actual_resolution_date;

  complaintProfile = await ComplaintProfile.findByIdAndUpdate(
    req.params.id,
    { 
      ...updateData,
      $push: { activity_log: statusActivityLog }
    },
    {
      new: true,
      runValidators: true
    }
  );

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'status_change',
    entity_type: 'complaint_profile',
    entity_id: complaintProfile._id,
    description: `Changed complaint ${complaintProfile.complaint_id} status from ${previousStatus} to ${complaintProfile.status}`,
    previous_state: previousState,
    new_state: complaintProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: complaintProfile
  });
});

// @desc    Add customer feedback
// @route   POST /api/v1/complaint-profiles/:id/feedback
// @access  Private
exports.addCustomerFeedback = asyncHandler(async (req, res, next) => {
  let complaintProfile = await ComplaintProfile.findById(req.params.id);

  if (!complaintProfile) {
    return next(
      new ErrorResponse(`Complaint profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Validate feedback data
  if (!req.body.rating || req.body.rating < 1 || req.body.rating > 5) {
    return next(
      new ErrorResponse('Please provide a valid rating between 1 and 5', 400)
    );
  }

  // Create feedback object
  const feedback = {
    rating: req.body.rating,
    comments: req.body.comments || '',
    submitted_at: Date.now()
  };

  // Create activity log entry for feedback
  const feedbackActivityLog = {
    action: 'feedback_added',
    performed_by: req.user.id,
    timestamp: Date.now(),
    details: `Customer feedback added with rating: ${feedback.rating}/5`
  };

  complaintProfile = await ComplaintProfile.findByIdAndUpdate(
    req.params.id,
    { 
      customer_feedback: feedback,
      $push: { activity_log: feedbackActivityLog }
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
    entity_type: 'complaint_profile',
    entity_id: complaintProfile._id,
    description: `Added customer feedback to complaint ${complaintProfile.complaint_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: complaintProfile.customer_feedback
  });
});

// @desc    Get complaints by status
// @route   GET /api/v1/complaint-profiles/status/:status
// @access  Private
exports.getComplaintsByStatus = asyncHandler(async (req, res, next) => {
  // Validate status
  const validStatuses = ['new', 'assigned', 'in_progress', 'on_hold', 'resolved', 'closed', 'reopened'];
  if (!validStatuses.includes(req.params.status)) {
    return next(
      new ErrorResponse(`Invalid status: ${req.params.status}`, 400)
    );
  }

  const complaints = await ComplaintProfile.find({ status: req.params.status })
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
    count: complaints.length,
    data: complaints
  });
});

// @desc    Get complaints by severity
// @route   GET /api/v1/complaint-profiles/severity/:severity
// @access  Private
exports.getComplaintsBySeverity = asyncHandler(async (req, res, next) => {
  // Validate severity
  const validSeverities = ['low', 'medium', 'high', 'critical'];
  if (!validSeverities.includes(req.params.severity)) {
    return next(
      new ErrorResponse(`Invalid severity: ${req.params.severity}`, 400)
    );
  }

  const complaints = await ComplaintProfile.find({ severity: req.params.severity })
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
    count: complaints.length,
    data: complaints
  });
});

// @desc    Get complaints by customer
// @route   GET /api/v1/customers/:customerId/complaints
// @access  Private
exports.getCustomerComplaints = asyncHandler(async (req, res, next) => {
  const customer = await CustomerMaster.findById(req.params.customerId);

  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${req.params.customerId}`, 404)
    );
  }

  const complaints = await ComplaintProfile.find({ customer: customer._id })
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
    count: complaints.length,
    data: complaints
  });
});

// @desc    Get complaints assigned to team
// @route   GET /api/v1/teams/:teamId/complaints
// @access  Private
exports.getTeamComplaints = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.teamId);

  if (!team) {
    return next(
      new ErrorResponse(`Team not found with id of ${req.params.teamId}`, 404)
    );
  }

  const complaints = await ComplaintProfile.find({ assigned_team: team._id })
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
    count: complaints.length,
    data: complaints
  });
});

// @desc    Get complaints assigned to user
// @route   GET /api/v1/users/:userId/assigned-complaints
// @access  Private
exports.getUserComplaints = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.userId}`, 404)
    );
  }

  const complaints = await ComplaintProfile.find({ assigned_to: user._id })
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
    count: complaints.length,
    data: complaints
  });
});

// @desc    Get overdue complaints
// @route   GET /api/v1/complaint-profiles/overdue
// @access  Private
exports.getOverdueComplaints = asyncHandler(async (req, res, next) => {
  // Find complaints where expected_resolution_date is in the past and status is not resolved or closed
  const complaints = await ComplaintProfile.find({
    expected_resolution_date: { $lt: new Date() },
    status: { $nin: ['resolved', 'closed'] }
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
    count: complaints.length,
    data: complaints
  });
});

// @desc    Search complaints
// @route   GET /api/v1/complaint-profiles/search
// @access  Private
exports.searchComplaints = asyncHandler(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new ErrorResponse('Please provide a search query', 400));
  }

  // Create search query
  const searchQuery = {
    $or: [
      { subject: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { complaint_id: { $regex: query, $options: 'i' } },
      { complaint_type: { $regex: query, $options: 'i' } },
      { resolution: { $regex: query, $options: 'i' } }
    ]
  };

  const complaints = await ComplaintProfile.find(searchQuery)
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
    count: complaints.length,
    data: complaints
  });
});
