const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const StatusType = require('../../models/enquiry/StatusType');
const UserActivityLog = require('../../models/profile/UserActivityLog');

// @desc    Get all status types
// @route   GET /api/v1/status-types
// @access  Private
exports.getStatusTypes = asyncHandler(async (req, res, next) => {66
  res.status(200).json(res.advancedResults);
});

// @desc    Get single status type
// @route   GET /api/v1/status-types/:id
// @access  Private
exports.getStatusType = asyncHandler(async (req, res, next) => {
  const statusType = await StatusType.findById(req.params.id);

  if (!statusType) {
    return next(
      new ErrorResponse(`Status type not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: statusType
  });
});

// @desc    Create new status type
// @route   POST /api/v1/status-types
// @access  Private/Admin
exports.createStatusType = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.created_by = req.user.id;

  // Validate category
  const validCategories = ['lead', 'enquiry', 'customer', 'project', 'product', 'service', 'general'];
  if (req.body.category && !validCategories.includes(req.body.category)) {
    return next(
      new ErrorResponse(`Invalid category: ${req.body.category}`, 400)
    );
  }

  // Validate allowed_transitions if provided
  if (req.body.allowed_transitions) {
    for (const transition of req.body.allowed_transitions) {
      if (!transition.to_status) {
        return next(
          new ErrorResponse('Each transition must have a to_status', 400)
        );
      }
    }
  }

  // Validate auto_actions if provided
  if (req.body.auto_actions) {
    for (const action of req.body.auto_actions) {
      if (!action.action_type) {
        return next(
          new ErrorResponse('Each action must have an action_type', 400)
        );
      }

      // Validate action_type
      const validActionTypes = ['notification', 'email', 'sms', 'assignment', 'field_update'];
      if (!validActionTypes.includes(action.action_type)) {
        return next(
          new ErrorResponse(`Invalid action type: ${action.action_type}`, 400)
        );
      }
    }
  }

  const statusType = await StatusType.create(req.body);

  // Log activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'create',
    entity_type: 'StatusType',
    entity_id: statusType._id,
    description: `Created new status type: ${statusType.name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: statusType
  });
});

// @desc    Update status type
// @route   PUT /api/v1/status-types/:id
// @access  Private/Admin
exports.updateStatusType = asyncHandler(async (req, res, next) => {
  // Validate category if provided
  const validCategories = ['lead', 'enquiry', 'customer', 'project', 'product', 'service', 'general'];
  if (req.body.category && !validCategories.includes(req.body.category)) {
    return next(
      new ErrorResponse(`Invalid category: ${req.body.category}`, 400)
    );
  }

  // Validate allowed_transitions if provided
  if (req.body.allowed_transitions) {
    for (const transition of req.body.allowed_transitions) {
      if (!transition.to_status) {
        return next(
          new ErrorResponse('Each transition must have a to_status', 400)
        );
      }
    }
  }

  // Validate auto_actions if provided
  if (req.body.auto_actions) {
    for (const action of req.body.auto_actions) {
      if (!action.action_type) {
        return next(
          new ErrorResponse('Each action must have an action_type', 400)
        );
      }

      // Validate action_type
      const validActionTypes = ['notification', 'email', 'sms', 'assignment', 'field_update'];
      if (!validActionTypes.includes(action.action_type)) {
        return next(
          new ErrorResponse(`Invalid action type: ${action.action_type}`, 400)
        );
      }
    }
  }

  let statusType = await StatusType.findById(req.params.id);

  if (!statusType) {
    return next(
      new ErrorResponse(`Status type not found with id of ${req.params.id}`, 404)
    );
  }

  // Prevent modification of system statuses
  if (statusType.is_system && req.user.role !== 'Admin') {
    return next(
      new ErrorResponse('Cannot modify system status types', 403)
    );
  }

  // Update status type
  statusType = await StatusType.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'StatusType',
    entity_id: statusType._id,
    description: `Updated status type: ${statusType.name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: statusType
  });
});

// @desc    Delete status type
// @route   DELETE /api/v1/status-types/:id
// @access  Private/Admin
exports.deleteStatusType = asyncHandler(async (req, res, next) => {
  const statusType = await StatusType.findById(req.params.id);

  if (!statusType) {
    return next(
      new ErrorResponse(`Status type not found with id of ${req.params.id}`, 404)
    );
  }

  // Prevent deletion of system statuses
  if (statusType.is_system) {
    return next(
      new ErrorResponse('Cannot delete system status types', 403)
    );
  }

  await statusType.deleteOne();

  // Log activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'StatusType',
    entity_id: statusType._id,
    description: `Deleted status type: ${statusType.name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Toggle status type active status
// @route   PUT /api/v1/status-types/:id/toggle-status
// @access  Private/Admin
exports.toggleStatusTypeStatus = asyncHandler(async (req, res, next) => {
  let statusType = await StatusType.findById(req.params.id);

  if (!statusType) {
    return next(
      new ErrorResponse(`Status type not found with id of ${req.params.id}`, 404)
    );
  }

  // Prevent modification of system statuses
  if (statusType.is_system && req.user.role !== 'Admin') {
    return next(
      new ErrorResponse('Cannot modify system status types', 403)
    );
  }

  // Toggle status
  statusType.is_active = !statusType.is_active;
  await statusType.save();

  // Log activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'StatusType',
    entity_id: statusType._id,
    description: `${statusType.is_active ? 'Activated' : 'Deactivated'} status type: ${statusType.name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: statusType
  });
});

// @desc    Get status types by category
// @route   GET /api/v1/status-types/category/:category
// @access  Private
exports.getStatusTypesByCategory = asyncHandler(async (req, res, next) => {
  const validCategories = ['lead', 'enquiry', 'customer', 'project', 'product', 'service', 'general'];
  if (!validCategories.includes(req.params.category)) {
    return next(
      new ErrorResponse(`Invalid category: ${req.params.category}`, 400)
    );
  }

  const statusTypes = await StatusType.find({ category: req.params.category });

  res.status(200).json({
    success: true,
    count: statusTypes.length,
    data: statusTypes
  });
});

// @desc    Get active status types
// @route   GET /api/v1/status-types/active
// @access  Private
exports.getActiveStatusTypes = asyncHandler(async (req, res, next) => {
  const statusTypes = await StatusType.find({ is_active: true });

  res.status(200).json({
    success: true,
    count: statusTypes.length,
    data: statusTypes
  });
});
