const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const SiteVisitSchedule = require('../../models/profile/SiteVisitSchedule');
const CustomerMaster = require('../../models/profile/CustomerMaster');
const ProjectProfile = require('../../models/profile/ProjectProfile');
const ProductProfile = require('../../models/profile/ProductProfile');
const AmcProfile = require('../../models/profile/AmcProfile');
const ComplaintProfile = require('../../models/profile/ComplaintProfile');
const Team = require('../../models/profile/Team');
const User = require('../../models/profile/User');
const UserActivityLog = require('../../models/profile/UserActivityLog');
const path = require('path');
const fs = require('fs');

// @desc    Get all site visit schedules
// @route   GET /api/v1/site-visits
// @access  Private
exports.getSiteVisitSchedules = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single site visit schedule
// @route   GET /api/v1/site-visits/:id
// @access  Private
exports.getSiteVisitSchedule = asyncHandler(async (req, res, next) => {
  const siteVisitSchedule = await SiteVisitSchedule.findById(req.params.id)
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
      path: 'related_complaint',
      select: 'subject complaint_id'
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
      path: 'customer_feedback.submitted_by',
      select: 'name email'
    })
    .populate({
      path: 'notes.created_by',
      select: 'name email'
    });

  if (!siteVisitSchedule) {
    return next(
      new ErrorResponse(`Site visit schedule not found with id of ${req.params.id}`, 404)
    );
  }

  // Log the view activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'view',
    entity_type: 'site_visit_schedule',
    entity_id: siteVisitSchedule._id,
    description: `Viewed site visit schedule ${siteVisitSchedule.visit_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: siteVisitSchedule
  });
});

// @desc    Create new site visit schedule
// @route   POST /api/v1/site-visits
// @access  Private
exports.createSiteVisitSchedule = asyncHandler(async (req, res, next) => {
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

  // Check if related_complaint exists if provided
  if (req.body.related_complaint) {
    const complaint = await ComplaintProfile.findById(req.body.related_complaint);
    if (!complaint) {
      return next(
        new ErrorResponse(`Complaint not found with id of ${req.body.related_complaint}`, 404)
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

  // Check if assigned_technicians exist if provided
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

  const siteVisitSchedule = await SiteVisitSchedule.create(req.body);

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'create',
    entity_type: 'site_visit_schedule',
    entity_id: siteVisitSchedule._id,
    description: `Created site visit schedule ${siteVisitSchedule.visit_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: siteVisitSchedule
  });
});

// @desc    Update site visit schedule
// @route   PUT /api/v1/site-visits/:id
// @access  Private
exports.updateSiteVisitSchedule = asyncHandler(async (req, res, next) => {
  let siteVisitSchedule = await SiteVisitSchedule.findById(req.params.id);

  if (!siteVisitSchedule) {
    return next(
      new ErrorResponse(`Site visit schedule not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...siteVisitSchedule.toObject() };

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

  // Check if related_complaint exists if being updated
  if (req.body.related_complaint) {
    const complaint = await ComplaintProfile.findById(req.body.related_complaint);
    if (!complaint) {
      return next(
        new ErrorResponse(`Complaint not found with id of ${req.body.related_complaint}`, 404)
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

  siteVisitSchedule = await SiteVisitSchedule.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'site_visit_schedule',
    entity_id: siteVisitSchedule._id,
    description: `Updated site visit schedule ${siteVisitSchedule.visit_id}`,
    previous_state: previousState,
    new_state: siteVisitSchedule.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: siteVisitSchedule
  });
});

// @desc    Delete site visit schedule
// @route   DELETE /api/v1/site-visits/:id
// @access  Private/Admin
exports.deleteSiteVisitSchedule = asyncHandler(async (req, res, next) => {
  const siteVisitSchedule = await SiteVisitSchedule.findById(req.params.id);

  if (!siteVisitSchedule) {
    return next(
      new ErrorResponse(`Site visit schedule not found with id of ${req.params.id}`, 404)
    );
  }

  // Store the schedule data for activity log
  const deletedSchedule = { ...siteVisitSchedule.toObject() };

  // Delete all attachments associated with this schedule
  if (siteVisitSchedule.attachments && siteVisitSchedule.attachments.length > 0) {
    siteVisitSchedule.attachments.forEach(attachment => {
      const filePath = `${process.env.FILE_UPLOAD_PATH}${attachment.file_path}`;
      fs.unlink(filePath, err => {
        if (err && err.code !== 'ENOENT') {
          console.error(`Error deleting file: ${filePath}`, err);
        }
      });
    });
  }

  await siteVisitSchedule.remove();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'site_visit_schedule',
    entity_id: siteVisitSchedule._id,
    description: `Deleted site visit schedule ${siteVisitSchedule.visit_id}`,
    previous_state: deletedSchedule,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Update visit report
// @route   PUT /api/v1/site-visits/:id/report
// @access  Private
exports.updateVisitReport = asyncHandler(async (req, res, next) => {
  let siteVisitSchedule = await SiteVisitSchedule.findById(req.params.id);

  if (!siteVisitSchedule) {
    return next(
      new ErrorResponse(`Site visit schedule not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...siteVisitSchedule.toObject() };

  // Update visit report fields
  const updateData = {};
  
  if (req.body.visit_report) {
    updateData.visit_report = req.body.visit_report;
  }
  
  if (req.body.actual_visit_date) {
    updateData.actual_visit_date = req.body.actual_visit_date;
  }
  
  if (req.body.actual_time_spent) {
    updateData.actual_time_spent = req.body.actual_time_spent;
  }
  
  // If report is being submitted, update status to completed
  if (req.body.visit_report && siteVisitSchedule.status === 'scheduled') {
    updateData.status = 'completed';
  }

  siteVisitSchedule = await SiteVisitSchedule.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'site_visit_schedule',
    entity_id: siteVisitSchedule._id,
    description: `Updated visit report for ${siteVisitSchedule.visit_id}`,
    previous_state: previousState,
    new_state: siteVisitSchedule.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: siteVisitSchedule
  });
});

// @desc    Update checklist
// @route   PUT /api/v1/site-visits/:id/checklist
// @access  Private
exports.updateChecklist = asyncHandler(async (req, res, next) => {
  let siteVisitSchedule = await SiteVisitSchedule.findById(req.params.id);

  if (!siteVisitSchedule) {
    return next(
      new ErrorResponse(`Site visit schedule not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...siteVisitSchedule.toObject() };

  // Update checklist
  siteVisitSchedule = await SiteVisitSchedule.findByIdAndUpdate(
    req.params.id,
    { checklist: req.body.checklist },
    {
      new: true,
      runValidators: true
    }
  );

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'site_visit_schedule',
    entity_id: siteVisitSchedule._id,
    description: `Updated checklist for site visit ${siteVisitSchedule.visit_id}`,
    previous_state: previousState,
    new_state: siteVisitSchedule.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: siteVisitSchedule
  });
});

// @desc    Add note to site visit
// @route   POST /api/v1/site-visits/:id/notes
// @access  Private
exports.addNote = asyncHandler(async (req, res, next) => {
  const siteVisitSchedule = await SiteVisitSchedule.findById(req.params.id);

  if (!siteVisitSchedule) {
    return next(
      new ErrorResponse(`Site visit schedule not found with id of ${req.params.id}`, 404)
    );
  }

  // Add user to note
  req.body.created_by = req.user.id;

  // Add note to site visit
  siteVisitSchedule.notes.push(req.body);

  await siteVisitSchedule.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'site_visit_schedule',
    entity_id: siteVisitSchedule._id,
    description: `Added note to site visit ${siteVisitSchedule.visit_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: siteVisitSchedule.notes[siteVisitSchedule.notes.length - 1]
  });
});

// @desc    Delete note
// @route   DELETE /api/v1/site-visits/:id/notes/:noteId
// @access  Private
exports.deleteNote = asyncHandler(async (req, res, next) => {
  const siteVisitSchedule = await SiteVisitSchedule.findById(req.params.id);

  if (!siteVisitSchedule) {
    return next(
      new ErrorResponse(`Site visit schedule not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the note
  const note = siteVisitSchedule.notes.id(req.params.noteId);

  if (!note) {
    return next(
      new ErrorResponse(`Note not found with id of ${req.params.noteId}`, 404)
    );
  }

  // Remove the note
  note.remove();

  await siteVisitSchedule.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'site_visit_schedule',
    entity_id: siteVisitSchedule._id,
    description: `Deleted note from site visit ${siteVisitSchedule.visit_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add attachment to site visit
// @route   POST /api/v1/site-visits/:id/attachments
// @access  Private
exports.addAttachment = asyncHandler(async (req, res, next) => {
  const siteVisitSchedule = await SiteVisitSchedule.findById(req.params.id);

  if (!siteVisitSchedule) {
    return next(
      new ErrorResponse(`Site visit schedule not found with id of ${req.params.id}`, 404)
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
  file.name = `${siteVisitSchedule.visit_id}_${Date.now()}${path.parse(file.name).ext}`;

  // Upload file to server
  file.mv(`${process.env.FILE_UPLOAD_PATH}/site-visits/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    // Add attachment to site visit
    siteVisitSchedule.attachments.push({
      name: req.body.name || file.name,
      file_path: `/uploads/site-visits/${file.name}`,
      file_type: path.extname(file.name).toLowerCase().substring(1),
      uploaded_by: req.user.id
    });

    await siteVisitSchedule.save();

    // Log the activity
    await UserActivityLog.create({
      user_id: req.user.id,
      action_type: 'update',
      entity_type: 'site_visit_schedule',
      entity_id: siteVisitSchedule._id,
      description: `Added attachment to site visit ${siteVisitSchedule.visit_id}`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      data: siteVisitSchedule.attachments[siteVisitSchedule.attachments.length - 1]
    });
  });
});

// @desc    Delete attachment
// @route   DELETE /api/v1/site-visits/:id/attachments/:attachmentId
// @access  Private
exports.deleteAttachment = asyncHandler(async (req, res, next) => {
  const siteVisitSchedule = await SiteVisitSchedule.findById(req.params.id);

  if (!siteVisitSchedule) {
    return next(
      new ErrorResponse(`Site visit schedule not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the attachment
  const attachment = siteVisitSchedule.attachments.id(req.params.attachmentId);

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

  // Remove the attachment
  attachment.remove();

  await siteVisitSchedule.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'site_visit_schedule',
    entity_id: siteVisitSchedule._id,
    description: `Deleted attachment from site visit ${siteVisitSchedule.visit_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add customer feedback
// @route   POST /api/v1/site-visits/:id/feedback
// @access  Private
exports.addCustomerFeedback = asyncHandler(async (req, res, next) => {
  let siteVisitSchedule = await SiteVisitSchedule.findById(req.params.id);

  if (!siteVisitSchedule) {
    return next(
      new ErrorResponse(`Site visit schedule not found with id of ${req.params.id}`, 404)
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
    submitted_by: req.user.id,
    submitted_at: Date.now()
  };

  siteVisitSchedule = await SiteVisitSchedule.findByIdAndUpdate(
    req.params.id,
    { customer_feedback: feedback },
    {
      new: true,
      runValidators: true
    }
  );

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'site_visit_schedule',
    entity_id: siteVisitSchedule._id,
    description: `Added customer feedback to site visit ${siteVisitSchedule.visit_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: siteVisitSchedule.customer_feedback
  });
});

// @desc    Assign site visit to team or technicians
// @route   PUT /api/v1/site-visits/:id/assign
// @access  Private
exports.assignSiteVisit = asyncHandler(async (req, res, next) => {
  let siteVisitSchedule = await SiteVisitSchedule.findById(req.params.id);

  if (!siteVisitSchedule) {
    return next(
      new ErrorResponse(`Site visit schedule not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...siteVisitSchedule.toObject() };

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

  // If visit is being assigned and status is pending, update to scheduled
  if ((req.body.assigned_team || (req.body.assigned_technicians && req.body.assigned_technicians.length > 0)) && 
      siteVisitSchedule.status === 'pending') {
    updateData.status = 'scheduled';
  }

  siteVisitSchedule = await SiteVisitSchedule.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'assign',
    entity_type: 'site_visit_schedule',
    entity_id: siteVisitSchedule._id,
    description: `Assigned site visit ${siteVisitSchedule.visit_id}`,
    previous_state: previousState,
    new_state: siteVisitSchedule.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: siteVisitSchedule
  });
});

// @desc    Change site visit status
// @route   PUT /api/v1/site-visits/:id/status
// @access  Private
exports.changeSiteVisitStatus = asyncHandler(async (req, res, next) => {
  let siteVisitSchedule = await SiteVisitSchedule.findById(req.params.id);

  if (!siteVisitSchedule) {
    return next(
      new ErrorResponse(`Site visit schedule not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...siteVisitSchedule.toObject() };
  const previousStatus = siteVisitSchedule.status;

  // Validate status
  const validStatuses = ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'];
  if (!validStatuses.includes(req.body.status)) {
    return next(
      new ErrorResponse(`Invalid status: ${req.body.status}`, 400)
    );
  }

  // Update status
  siteVisitSchedule = await SiteVisitSchedule.findByIdAndUpdate(
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
    entity_type: 'site_visit_schedule',
    entity_id: siteVisitSchedule._id,
    description: `Changed site visit ${siteVisitSchedule.visit_id} status from ${previousStatus} to ${siteVisitSchedule.status}`,
    previous_state: previousState,
    new_state: siteVisitSchedule.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: siteVisitSchedule
  });
});

// @desc    Get site visits by status
// @route   GET /api/v1/site-visits/status/:status
// @access  Private
exports.getSiteVisitsByStatus = asyncHandler(async (req, res, next) => {
  // Validate status
  const validStatuses = ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'];
  if (!validStatuses.includes(req.params.status)) {
    return next(
      new ErrorResponse(`Invalid status: ${req.params.status}`, 400)
    );
  }

  const siteVisits = await SiteVisitSchedule.find({ status: req.params.status })
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
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
    count: siteVisits.length,
    data: siteVisits
  });
});

// @desc    Get site visits by customer
// @route   GET /api/v1/customers/:customerId/site-visits
// @access  Private
exports.getCustomerSiteVisits = asyncHandler(async (req, res, next) => {
  const customer = await CustomerMaster.findById(req.params.customerId);

  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${req.params.customerId}`, 404)
    );
  }

  const siteVisits = await SiteVisitSchedule.find({ customer: customer._id })
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
    count: siteVisits.length,
    data: siteVisits
  });
});

// @desc    Get site visits assigned to team
// @route   GET /api/v1/teams/:teamId/site-visits
// @access  Private
exports.getTeamSiteVisits = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.teamId);

  if (!team) {
    return next(
      new ErrorResponse(`Team not found with id of ${req.params.teamId}`, 404)
    );
  }

  const siteVisits = await SiteVisitSchedule.find({ assigned_team: team._id })
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
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
    count: siteVisits.length,
    data: siteVisits
  });
});

// @desc    Get site visits assigned to technician
// @route   GET /api/v1/users/:userId/technician-visits
// @access  Private
exports.getTechnicianSiteVisits = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.userId}`, 404)
    );
  }

  const siteVisits = await SiteVisitSchedule.find({ assigned_technicians: user._id })
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
    count: siteVisits.length,
    data: siteVisits
  });
});

// @desc    Get upcoming site visits
// @route   GET /api/v1/site-visits/upcoming/:days
// @access  Private
exports.getUpcomingSiteVisits = asyncHandler(async (req, res, next) => {
  const days = parseInt(req.params.days) || 7;
  
  // Calculate the date 'days' from now
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  // Find site visits scheduled between now and the calculated date
  const siteVisits = await SiteVisitSchedule.find({
    scheduled_date: { $gte: new Date(), $lte: endDate },
    status: { $in: ['scheduled', 'rescheduled'] }
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
      path: 'assigned_technicians',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: siteVisits.length,
    data: siteVisits
  });
});

// @desc    Search site visits
// @route   GET /api/v1/site-visits/search
// @access  Private
exports.searchSiteVisits = asyncHandler(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new ErrorResponse('Please provide a search query', 400));
  }

  // Create search query
  const searchQuery = {
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { visit_id: { $regex: query, $options: 'i' } },
      { visit_type: { $regex: query, $options: 'i' } },
      { 'location.address': { $regex: query, $options: 'i' } },
      { 'location.city': { $regex: query, $options: 'i' } },
      { 'location.state': { $regex: query, $options: 'i' } },
      { 'location.pincode': { $regex: query, $options: 'i' } }
    ]
  };

  const siteVisits = await SiteVisitSchedule.find(searchQuery)
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
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
    count: siteVisits.length,
    data: siteVisits
  });
});
