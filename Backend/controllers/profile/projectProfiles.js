const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const ProjectProfile = require('../../models/profile/ProjectProfile');
const CustomerMaster = require('../../models/profile/CustomerMaster');
const Team = require('../../models/profile/Team');
const User = require('../../models/profile/User');
const UserActivityLog = require('../../models/profile/UserActivityLog');
const path = require('path');
const fs = require('fs');

// @desc    Get all project profiles
// @route   GET /api/v1/project-profiles
// @access  Private
exports.getProjectProfiles = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single project profile
// @route   GET /api/v1/project-profiles/:id
// @access  Private
exports.getProjectProfile = asyncHandler(async (req, res, next) => {
  const projectProfile = await ProjectProfile.findById(req.params.id)
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_manager',
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
      path: 'notes.created_by',
      select: 'name email'
    });

  if (!projectProfile) {
    return next(
      new ErrorResponse(`Project profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Log the view activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'view',
    entity_type: 'project_profile',
    entity_id: projectProfile._id,
    description: `Viewed project profile ${projectProfile.project_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: projectProfile
  });
});

// @desc    Create new project profile
// @route   POST /api/v1/project-profiles
// @access  Private
exports.createProjectProfile = asyncHandler(async (req, res, next) => {
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

  // Check if assigned_manager exists
  if (req.body.assigned_manager) {
    const manager = await User.findById(req.body.assigned_manager);
    if (!manager) {
      return next(
        new ErrorResponse(`User not found with id of ${req.body.assigned_manager}`, 404)
      );
    }
  }

  const projectProfile = await ProjectProfile.create(req.body);

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'create',
    entity_type: 'project_profile',
    entity_id: projectProfile._id,
    description: `Created project profile ${projectProfile.project_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: projectProfile
  });
});

// @desc    Update project profile
// @route   PUT /api/v1/project-profiles/:id
// @access  Private
exports.updateProjectProfile = asyncHandler(async (req, res, next) => {
  let projectProfile = await ProjectProfile.findById(req.params.id);

  if (!projectProfile) {
    return next(
      new ErrorResponse(`Project profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...projectProfile.toObject() };

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

  // Check if assigned_manager exists if being updated
  if (req.body.assigned_manager) {
    const manager = await User.findById(req.body.assigned_manager);
    if (!manager) {
      return next(
        new ErrorResponse(`User not found with id of ${req.body.assigned_manager}`, 404)
      );
    }
  }

  projectProfile = await ProjectProfile.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'project_profile',
    entity_id: projectProfile._id,
    description: `Updated project profile ${projectProfile.project_id}`,
    previous_state: previousState,
    new_state: projectProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: projectProfile
  });
});

// @desc    Delete project profile
// @route   DELETE /api/v1/project-profiles/:id
// @access  Private/Admin
exports.deleteProjectProfile = asyncHandler(async (req, res, next) => {
  const projectProfile = await ProjectProfile.findById(req.params.id);

  if (!projectProfile) {
    return next(
      new ErrorResponse(`Project profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store the profile data for activity log
  const deletedProfile = { ...projectProfile.toObject() };

  // Delete all documents associated with this profile
  if (projectProfile.documents && projectProfile.documents.length > 0) {
    projectProfile.documents.forEach(doc => {
      const filePath = `${process.env.FILE_UPLOAD_PATH}${doc.file_path}`;
      fs.unlink(filePath, err => {
        if (err && err.code !== 'ENOENT') {
          console.error(`Error deleting file: ${filePath}`, err);
        }
      });
    });
  }

  await projectProfile.remove();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'project_profile',
    entity_id: projectProfile._id,
    description: `Deleted project profile ${projectProfile.project_id}`,
    previous_state: deletedProfile,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add milestone to project
// @route   POST /api/v1/project-profiles/:id/milestones
// @access  Private
exports.addMilestone = asyncHandler(async (req, res, next) => {
  const projectProfile = await ProjectProfile.findById(req.params.id);

  if (!projectProfile) {
    return next(
      new ErrorResponse(`Project profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Add milestone to project
  projectProfile.milestones.push(req.body);

  await projectProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'project_profile',
    entity_id: projectProfile._id,
    description: `Added milestone to project ${projectProfile.project_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: projectProfile.milestones[projectProfile.milestones.length - 1]
  });
});

// @desc    Update milestone
// @route   PUT /api/v1/project-profiles/:id/milestones/:milestoneId
// @access  Private
exports.updateMilestone = asyncHandler(async (req, res, next) => {
  let projectProfile = await ProjectProfile.findById(req.params.id);

  if (!projectProfile) {
    return next(
      new ErrorResponse(`Project profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the milestone
  const milestone = projectProfile.milestones.id(req.params.milestoneId);

  if (!milestone) {
    return next(
      new ErrorResponse(`Milestone not found with id of ${req.params.milestoneId}`, 404)
    );
  }

  // Update the milestone fields
  if (req.body.name) milestone.name = req.body.name;
  if (req.body.description) milestone.description = req.body.description;
  if (req.body.planned_date) milestone.planned_date = req.body.planned_date;
  if (req.body.actual_date) milestone.actual_date = req.body.actual_date;
  if (req.body.status) milestone.status = req.body.status;

  await projectProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'project_profile',
    entity_id: projectProfile._id,
    description: `Updated milestone in project ${projectProfile.project_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: milestone
  });
});

// @desc    Delete milestone
// @route   DELETE /api/v1/project-profiles/:id/milestones/:milestoneId
// @access  Private
exports.deleteMilestone = asyncHandler(async (req, res, next) => {
  const projectProfile = await ProjectProfile.findById(req.params.id);

  if (!projectProfile) {
    return next(
      new ErrorResponse(`Project profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the milestone
  const milestone = projectProfile.milestones.id(req.params.milestoneId);

  if (!milestone) {
    return next(
      new ErrorResponse(`Milestone not found with id of ${req.params.milestoneId}`, 404)
    );
  }

  // Remove the milestone
  milestone.remove();

  await projectProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'project_profile',
    entity_id: projectProfile._id,
    description: `Deleted milestone from project ${projectProfile.project_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add note to project
// @route   POST /api/v1/project-profiles/:id/notes
// @access  Private
exports.addNote = asyncHandler(async (req, res, next) => {
  const projectProfile = await ProjectProfile.findById(req.params.id);

  if (!projectProfile) {
    return next(
      new ErrorResponse(`Project profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Add user to note
  req.body.created_by = req.user.id;

  // Add note to project
  projectProfile.notes.push(req.body);

  await projectProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'project_profile',
    entity_id: projectProfile._id,
    description: `Added note to project ${projectProfile.project_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: projectProfile.notes[projectProfile.notes.length - 1]
  });
});

// @desc    Delete note
// @route   DELETE /api/v1/project-profiles/:id/notes/:noteId
// @access  Private
exports.deleteNote = asyncHandler(async (req, res, next) => {
  const projectProfile = await ProjectProfile.findById(req.params.id);

  if (!projectProfile) {
    return next(
      new ErrorResponse(`Project profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the note
  const note = projectProfile.notes.id(req.params.noteId);

  if (!note) {
    return next(
      new ErrorResponse(`Note not found with id of ${req.params.noteId}`, 404)
    );
  }

  // Remove the note
  note.remove();

  await projectProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'project_profile',
    entity_id: projectProfile._id,
    description: `Deleted note from project ${projectProfile.project_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add document to project
// @route   POST /api/v1/project-profiles/:id/documents
// @access  Private
exports.addDocument = asyncHandler(async (req, res, next) => {
  const projectProfile = await ProjectProfile.findById(req.params.id);

  if (!projectProfile) {
    return next(
      new ErrorResponse(`Project profile not found with id of ${req.params.id}`, 404)
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
  file.name = `${projectProfile.project_id}_${Date.now()}${path.parse(file.name).ext}`;

  // Upload file to server
  file.mv(`${process.env.FILE_UPLOAD_PATH}/projects/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    // Add document to project
    projectProfile.documents.push({
      name: req.body.name || file.name,
      file_path: `/uploads/projects/${file.name}`,
      document_type: req.body.document_type || 'other',
      uploaded_by: req.user.id
    });

    await projectProfile.save();

    // Log the activity
    await UserActivityLog.create({
      user_id: req.user.id,
      action_type: 'update',
      entity_type: 'project_profile',
      entity_id: projectProfile._id,
      description: `Added document to project ${projectProfile.project_id}`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      data: projectProfile.documents[projectProfile.documents.length - 1]
    });
  });
});

// @desc    Delete document
// @route   DELETE /api/v1/project-profiles/:id/documents/:documentId
// @access  Private
exports.deleteDocument = asyncHandler(async (req, res, next) => {
  const projectProfile = await ProjectProfile.findById(req.params.id);

  if (!projectProfile) {
    return next(
      new ErrorResponse(`Project profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the document
  const document = projectProfile.documents.id(req.params.documentId);

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

  await projectProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'project_profile',
    entity_id: projectProfile._id,
    description: `Deleted document from project ${projectProfile.project_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Assign project to team or manager
// @route   PUT /api/v1/project-profiles/:id/assign
// @access  Private
exports.assignProject = asyncHandler(async (req, res, next) => {
  let projectProfile = await ProjectProfile.findById(req.params.id);

  if (!projectProfile) {
    return next(
      new ErrorResponse(`Project profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...projectProfile.toObject() };

  // Check if team exists if assigned_team is provided
  if (req.body.assigned_team) {
    const team = await Team.findById(req.body.assigned_team);
    if (!team) {
      return next(
        new ErrorResponse(`Team not found with id of ${req.body.assigned_team}`, 404)
      );
    }
  }

  // Check if manager exists if assigned_manager is provided
  if (req.body.assigned_manager) {
    const manager = await User.findById(req.body.assigned_manager);
    if (!manager) {
      return next(
        new ErrorResponse(`User not found with id of ${req.body.assigned_manager}`, 404)
      );
    }
  }

  // Update assignment fields
  const updateData = {};
  if (req.body.assigned_team) updateData.assigned_team = req.body.assigned_team;
  if (req.body.assigned_manager) updateData.assigned_manager = req.body.assigned_manager;

  projectProfile = await ProjectProfile.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'assign',
    entity_type: 'project_profile',
    entity_id: projectProfile._id,
    description: `Assigned project ${projectProfile.project_id}`,
    previous_state: previousState,
    new_state: projectProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: projectProfile
  });
});

// @desc    Change project status
// @route   PUT /api/v1/project-profiles/:id/status
// @access  Private
exports.changeProjectStatus = asyncHandler(async (req, res, next) => {
  let projectProfile = await ProjectProfile.findById(req.params.id);

  if (!projectProfile) {
    return next(
      new ErrorResponse(`Project profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...projectProfile.toObject() };
  const previousStatus = projectProfile.status;

  // Validate status
  const validStatuses = ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'];
  if (!validStatuses.includes(req.body.status)) {
    return next(
      new ErrorResponse(`Invalid status: ${req.body.status}`, 400)
    );
  }

  // Update status
  projectProfile = await ProjectProfile.findByIdAndUpdate(
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
    entity_type: 'project_profile',
    entity_id: projectProfile._id,
    description: `Changed project ${projectProfile.project_id} status from ${previousStatus} to ${projectProfile.status}`,
    previous_state: previousState,
    new_state: projectProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: projectProfile
  });
});

// @desc    Get projects by status
// @route   GET /api/v1/project-profiles/status/:status
// @access  Private
exports.getProjectsByStatus = asyncHandler(async (req, res, next) => {
  // Validate status
  const validStatuses = ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'];
  if (!validStatuses.includes(req.params.status)) {
    return next(
      new ErrorResponse(`Invalid status: ${req.params.status}`, 400)
    );
  }

  const projects = await ProjectProfile.find({ status: req.params.status })
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_manager',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: projects.length,
    data: projects
  });
});

// @desc    Get projects by customer
// @route   GET /api/v1/customers/:customerId/projects
// @access  Private
exports.getCustomerProjects = asyncHandler(async (req, res, next) => {
  const customer = await CustomerMaster.findById(req.params.customerId);

  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${req.params.customerId}`, 404)
    );
  }

  const projects = await ProjectProfile.find({ customer: customer._id })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_manager',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: projects.length,
    data: projects
  });
});

// @desc    Get projects assigned to team
// @route   GET /api/v1/teams/:teamId/projects
// @access  Private
exports.getTeamProjects = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.teamId);

  if (!team) {
    return next(
      new ErrorResponse(`Team not found with id of ${req.params.teamId}`, 404)
    );
  }

  const projects = await ProjectProfile.find({ assigned_team: team._id })
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'assigned_manager',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: projects.length,
    data: projects
  });
});

// @desc    Get projects assigned to manager
// @route   GET /api/v1/users/:userId/managed-projects
// @access  Private
exports.getManagerProjects = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.userId}`, 404)
    );
  }

  const projects = await ProjectProfile.find({ assigned_manager: user._id })
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
    count: projects.length,
    data: projects
  });
});

// @desc    Search projects
// @route   GET /api/v1/project-profiles/search
// @access  Private
exports.searchProjects = asyncHandler(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new ErrorResponse('Please provide a search query', 400));
  }

  // Create search query
  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { project_id: { $regex: query, $options: 'i' } },
      { project_type: { $regex: query, $options: 'i' } },
      { 'location.city': { $regex: query, $options: 'i' } },
      { 'location.state': { $regex: query, $options: 'i' } }
    ]
  };

  const projects = await ProjectProfile.find(searchQuery)
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_manager',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: projects.length,
    data: projects
  });
});
