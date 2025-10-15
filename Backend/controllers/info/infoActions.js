const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const InfoAction = require('../../models/info/InfoAction');
const InfoProfile = require('../../models/info/InfoProfile');
const UserActivityLog = require('../../models/profile/UserActivityLog');

// @desc    Get all info actions
// @route   GET /api/v1/info-actions
// @access  Private
exports.getInfoActions = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single info action
// @route   GET /api/v1/info-actions/:id
// @access  Private
exports.getInfoAction = asyncHandler(async (req, res, next) => {
  const infoAction = await InfoAction.findById(req.params.id)
    .populate({
      path: 'info_profile',
      select: 'info_id title status priority'
    })
    .populate({
      path: 'performed_by',
      select: 'name email'
    })
    .populate({
      path: 'assigned_to',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  if (!infoAction) {
    return next(
      new ErrorResponse(`Info action not found with id of ${req.params.id}`, 404)
    );
  }

  // Log the view activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'view',
    entity_type: 'info_action',
    entity_id: infoAction._id,
    description: `Viewed info action ${infoAction.action_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoAction
  });
});

// @desc    Create new info action
// @route   POST /api/v1/info-actions
// @access  Private
exports.createInfoAction = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.created_by = req.user.id;

  // Validate info profile exists
  if (req.body.info_profile) {
    const infoProfile = await InfoProfile.findById(req.body.info_profile);
    if (!infoProfile) {
      return next(
        new ErrorResponse(`Info profile not found with id of ${req.body.info_profile}`, 404)
      );
    }
  }

  const infoAction = await InfoAction.create(req.body);

  // Log the creation activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'create',
    entity_type: 'info_action',
    entity_id: infoAction._id,
    description: `Created info action ${infoAction.action_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: infoAction
  });
});

// @desc    Update info action
// @route   PUT /api/v1/info-actions/:id
// @access  Private
exports.updateInfoAction = asyncHandler(async (req, res, next) => {
  let infoAction = await InfoAction.findById(req.params.id);

  if (!infoAction) {
    return next(
      new ErrorResponse(`Info action not found with id of ${req.params.id}`, 404)
    );
  }

  // Validate info profile if provided
  if (req.body.info_profile) {
    const infoProfile = await InfoProfile.findById(req.body.info_profile);
    if (!infoProfile) {
      return next(
        new ErrorResponse(`Info profile not found with id of ${req.body.info_profile}`, 404)
      );
    }
  }

  infoAction = await InfoAction.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log the update activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_action',
    entity_id: infoAction._id,
    description: `Updated info action ${infoAction.action_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoAction
  });
});

// @desc    Delete info action
// @route   DELETE /api/v1/info-actions/:id
// @access  Private
exports.deleteInfoAction = asyncHandler(async (req, res, next) => {
  const infoAction = await InfoAction.findById(req.params.id);

  if (!infoAction) {
    return next(
      new ErrorResponse(`Info action not found with id of ${req.params.id}`, 404)
    );
  }

  await infoAction.deleteOne();

  // Log the deletion activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'info_action',
    entity_id: infoAction._id,
    description: `Deleted info action ${infoAction.action_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get actions by info profile
// @route   GET /api/v1/info-actions/profile/:profileId
// @access  Private
exports.getActionsByProfile = asyncHandler(async (req, res, next) => {
  const actions = await InfoAction.find({ info_profile: req.params.profileId })
    .populate({
      path: 'performed_by',
      select: 'name email'
    })
    .populate({
      path: 'assigned_to',
      select: 'name email'
    })
    .sort({ action_date: -1 });

  res.status(200).json({
    success: true,
    count: actions.length,
    data: actions
  });
});

// @desc    Get actions by type
// @route   GET /api/v1/info-actions/type/:actionType
// @access  Private
exports.getActionsByType = asyncHandler(async (req, res, next) => {
  const { actionType } = req.params;
  const { start_date, end_date } = req.query;

  const query = { action_type: actionType };

  if (start_date && end_date) {
    query.action_date = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  const actions = await InfoAction.find(query)
    .populate({
      path: 'info_profile',
      select: 'info_id title status priority'
    })
    .populate({
      path: 'performed_by',
      select: 'name email'
    })
    .sort({ action_date: -1 });

  res.status(200).json({
    success: true,
    count: actions.length,
    data: actions
  });
});

// @desc    Get pending actions
// @route   GET /api/v1/info-actions/pending
// @access  Private
exports.getPendingActions = asyncHandler(async (req, res, next) => {
  const pendingActions = await InfoAction.find({
    action_status: 'Pending',
    due_date: { $exists: true }
  })
    .populate({
      path: 'info_profile',
      select: 'info_id title status priority'
    })
    .populate({
      path: 'assigned_to',
      select: 'name email'
    })
    .sort({ due_date: 1 });

  res.status(200).json({
    success: true,
    count: pendingActions.length,
    data: pendingActions
  });
});

// @desc    Get overdue actions
// @route   GET /api/v1/info-actions/overdue
// @access  Private
exports.getOverdueActions = asyncHandler(async (req, res, next) => {
  const overdueActions = await InfoAction.find({
    action_status: 'Pending',
    due_date: { $lt: new Date() }
  })
    .populate({
      path: 'info_profile',
      select: 'info_id title status priority'
    })
    .populate({
      path: 'assigned_to',
      select: 'name email'
    })
    .sort({ due_date: 1 });

  res.status(200).json({
    success: true,
    count: overdueActions.length,
    data: overdueActions
  });
});

// @desc    Complete action
// @route   PUT /api/v1/info-actions/:id/complete
// @access  Private
exports.completeAction = asyncHandler(async (req, res, next) => {
  const infoAction = await InfoAction.findById(req.params.id);

  if (!infoAction) {
    return next(
      new ErrorResponse(`Info action not found with id of ${req.params.id}`, 404)
    );
  }

  if (infoAction.action_status === 'Completed') {
    return next(
      new ErrorResponse('Action is already completed', 400)
    );
  }

  infoAction.action_status = 'Completed';
  infoAction.completion_date = new Date();
  infoAction.performed_by = req.user.id;
  
  if (req.body.completion_notes) {
    infoAction.action_details.completion_notes = req.body.completion_notes;
  }

  await infoAction.save();

  // Log the completion activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_action',
    entity_id: infoAction._id,
    description: `Completed info action ${infoAction.action_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoAction
  });
});

// @desc    Get action statistics
// @route   GET /api/v1/info-actions/statistics
// @access  Private
exports.getActionStatistics = asyncHandler(async (req, res, next) => {
  const { start_date, end_date, user_id } = req.query;

  const matchConditions = {};
  
  if (start_date && end_date) {
    matchConditions.action_date = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  if (user_id) {
    matchConditions.performed_by = user_id;
  }

  const statistics = await InfoAction.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        total_actions: { $sum: 1 },
        completed_actions: {
          $sum: {
            $cond: [{ $eq: ['$action_status', 'Completed'] }, 1, 0]
          }
        },
        pending_actions: {
          $sum: {
            $cond: [{ $eq: ['$action_status', 'Pending'] }, 1, 0]
          }
        },
        in_progress_actions: {
          $sum: {
            $cond: [{ $eq: ['$action_status', 'In Progress'] }, 1, 0]
          }
        },
        avg_duration_hours: {
          $avg: '$duration_hours'
        }
      }
    },
    {
      $project: {
        _id: 0,
        total_actions: 1,
        completed_actions: 1,
        pending_actions: 1,
        in_progress_actions: 1,
        completion_rate: {
          $multiply: [
            { $divide: ['$completed_actions', '$total_actions'] },
            100
          ]
        },
        avg_duration_hours: { $round: ['$avg_duration_hours', 2] }
      }
    }
  ]);

  const actionsByType = await InfoAction.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$action_type',
        count: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ['$action_status', 'Completed'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        action_type: '$_id',
        count: 1,
        completed: 1,
        completion_rate: {
          $multiply: [
            { $divide: ['$completed', '$count'] },
            100
          ]
        }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overall_statistics: statistics[0] || {
        total_actions: 0,
        completed_actions: 0,
        pending_actions: 0,
        in_progress_actions: 0,
        completion_rate: 0,
        avg_duration_hours: 0
      },
      actions_by_type: actionsByType
    }
  });
});

// @desc    Assign action to user
// @route   PUT /api/v1/info-actions/:id/assign
// @access  Private
exports.assignAction = asyncHandler(async (req, res, next) => {
  const { assigned_to, due_date } = req.body;

  if (!assigned_to) {
    return next(
      new ErrorResponse('Assigned user is required', 400)
    );
  }

  const infoAction = await InfoAction.findById(req.params.id);

  if (!infoAction) {
    return next(
      new ErrorResponse(`Info action not found with id of ${req.params.id}`, 404)
    );
  }

  // Validate assigned user exists
  const User = require('../../models/profile/User');
  const assignedUser = await User.findById(assigned_to);
  if (!assignedUser) {
    return next(
      new ErrorResponse(`User not found with id of ${assigned_to}`, 404)
    );
  }

  infoAction.assigned_to = assigned_to;
  if (due_date) {
    infoAction.due_date = new Date(due_date);
  }
  
  await infoAction.save();

  // Log the assignment activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_action',
    entity_id: infoAction._id,
    description: `Assigned info action ${infoAction.action_id} to ${assignedUser.name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoAction
  });
});