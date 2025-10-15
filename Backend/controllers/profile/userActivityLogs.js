const asyncHandler = require('../../middleware/async');
const ErrorResponse = require('../../utils/errorResponse');
const UserActivityLog = require('../../models/profile/UserActivityLog');

// @desc    Get all user activity logs
// @route   GET /api/v1/profile/user-activity-logs
// @access  Private
exports.getUserActivityLogs = asyncHandler(async (req, res, next) => {
  const logs = await UserActivityLog.find()
    .populate('user_id', 'name email')
    .sort({ created_at: -1 });

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

// @desc    Get user activity logs by user ID
// @route   GET /api/v1/profile/user-activity-logs/user/:userId
// @access  Private
exports.getUserActivityLogsByUser = asyncHandler(async (req, res, next) => {
  const logs = await UserActivityLog.find({ user_id: req.params.userId })
    .populate('user_id', 'name email')
    .sort({ created_at: -1 });

  if (!logs) {
    return next(new ErrorResponse(`No activity logs found for user ${req.params.userId}`, 404));
  }

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});

// @desc    Create user activity log
// @route   POST /api/v1/profile/user-activity-logs
// @access  Private
exports.createUserActivityLog = asyncHandler(async (req, res, next) => {
  const log = await UserActivityLog.create(req.body);

  res.status(201).json({
    success: true,
    data: log
  });
});

// @desc    Get single user activity log
// @route   GET /api/v1/profile/user-activity-logs/:id
// @access  Private
exports.getUserActivityLog = asyncHandler(async (req, res, next) => {
  const log = await UserActivityLog.findById(req.params.id)
    .populate('user_id', 'name email');

  if (!log) {
    return next(new ErrorResponse(`User activity log not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: log
  });
});

// @desc    Delete user activity log
// @route   DELETE /api/v1/profile/user-activity-logs/:id
// @access  Private
exports.deleteUserActivityLog = asyncHandler(async (req, res, next) => {
  const log = await UserActivityLog.findById(req.params.id);

  if (!log) {
    return next(new ErrorResponse(`User activity log not found with id of ${req.params.id}`, 404));
  }

  await log.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
