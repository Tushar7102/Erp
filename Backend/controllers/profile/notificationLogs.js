const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const NotificationLog = require('../../models/profile/NotificationLog');
const Enquiry = require('../../models/enquiry/Enquiry');
const User = require('../../models/profile/User');

// @desc    Get all notification logs
// @route   GET /api/v1/notification-logs
// @access  Private
exports.getNotificationLogs = asyncHandler(async (req, res, next) => {
  const { 
    enquiry_id, 
    notification_type, 
    status, 
    recipient_id,
    start_date,
    end_date,
    page = 1, 
    limit = 10 
  } = req.query;

  let filter = {
    // Only show notifications that haven't expired
    $or: [
      { expires_at: { $gt: new Date() } },
      { expires_at: { $exists: false } }
    ]
  };
  
  if (enquiry_id) filter.enquiry_id = enquiry_id;
  if (notification_type) filter.notification_type = notification_type;
  if (status) filter.status = status;
  if (recipient_id) filter.recipient_id = recipient_id;
  
  if (start_date || end_date) {
    filter.created_at = {};
    if (start_date) filter.created_at.$gte = new Date(start_date);
    if (end_date) filter.created_at.$lte = new Date(end_date);
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { created_at: -1 },
    populate: [
      { path: 'enquiry_id', select: 'enquiry_id name mobile' },
      { path: 'recipient.user_id', select: 'name email' }
    ]
  };

  const notificationLogs = await NotificationLog.paginate(filter, options);

  res.status(200).json({
    success: true,
    data: notificationLogs
  });
});

// @desc    Get notification log by ID
// @route   GET /api/v1/notification-logs/:id
// @access  Private
exports.getNotificationLogById = asyncHandler(async (req, res, next) => {
  const notificationLog = await NotificationLog.findById(req.params.id)
    .populate('enquiry_id', 'enquiry_id name mobile')
    .populate('recipient.user_id', 'name email');

  if (!notificationLog) {
    return next(new ErrorResponse('Notification log not found', 404));
  }

  res.status(200).json({
    success: true,
    data: notificationLog
  });
});

// @desc    Create notification log
// @route   POST /api/v1/notification-logs
// @access  Private
exports.createNotificationLog = asyncHandler(async (req, res, next) => {
  const { 
    enquiry_id, 
    notification_type, 
    title, 
    message, 
    recipient_id,
    scheduled_at,
    metadata 
  } = req.body;

  // Validate enquiry exists if provided
  if (enquiry_id) {
    const enquiry = await Enquiry.findById(enquiry_id);
    if (!enquiry) {
      return next(new ErrorResponse('Enquiry not found', 404));
    }
  }

  // Validate recipient exists
  const recipient = await User.findById(recipient_id);
  if (!recipient) {
    return next(new ErrorResponse('Recipient not found', 404));
  }

  const notificationLog = await NotificationLog.create({
    enquiry_id,
    notification_type,
    title,
    message,
    recipient_id,
    scheduled_at,
    metadata: {
      ...metadata,
      user_agent: req.get('User-Agent'),
      ip_address: req.ip,
      created_by: req.user.id
    }
  });

  await notificationLog.populate([
    { path: 'enquiry_id', select: 'enquiry_id name mobile' },
    { path: 'recipient_id', select: 'name email' }
  ]);

  res.status(201).json({
    success: true,
    data: notificationLog
  });
});

// @desc    Update notification log
// @route   PUT /api/v1/notification-logs/:id
// @access  Private
exports.updateNotificationLog = asyncHandler(async (req, res, next) => {
  let notificationLog = await NotificationLog.findById(req.params.id);

  if (!notificationLog) {
    return next(new ErrorResponse('Notification log not found', 404));
  }

  // Only admin can update notification logs
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update notification logs', 403));
  }

  const allowedUpdates = ['title', 'message', 'status', 'scheduled_at', 'metadata'];
  const updates = {};
  
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  notificationLog = await NotificationLog.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate([
    { path: 'enquiry_id', select: 'enquiry_id name mobile' },
    { path: 'recipient_id', select: 'name email' }
  ]);

  res.status(200).json({
    success: true,
    data: notificationLog
  });
});

// @desc    Mark notification as read
// @route   PATCH /api/v1/notification-logs/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notificationLog = await NotificationLog.findById(req.params.id);

  if (!notificationLog) {
    return next(new ErrorResponse('Notification log not found', 404));
  }

  // Only recipient can mark as read
  if (notificationLog.recipient_id.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to mark this notification as read', 403));
  }

  await notificationLog.markAsRead();

  res.status(200).json({
    success: true,
    data: notificationLog
  });
});

// @desc    Mark notification as sent
// @route   PATCH /api/v1/notification-logs/:id/sent
// @access  Private
exports.markAsSent = asyncHandler(async (req, res, next) => {
  const { delivery_details } = req.body;

  const notificationLog = await NotificationLog.findById(req.params.id);

  if (!notificationLog) {
    return next(new ErrorResponse('Notification log not found', 404));
  }

  await notificationLog.markAsSent(delivery_details);

  res.status(200).json({
    success: true,
    data: notificationLog
  });
});

// @desc    Mark notification as failed
// @route   PATCH /api/v1/notification-logs/:id/failed
// @access  Private
exports.markAsFailed = asyncHandler(async (req, res, next) => {
  const { error_details } = req.body;

  const notificationLog = await NotificationLog.findById(req.params.id);

  if (!notificationLog) {
    return next(new ErrorResponse('Notification log not found', 404));
  }

  await notificationLog.markAsFailed(error_details);

  res.status(200).json({
    success: true,
    data: notificationLog
  });
});

// @desc    Archive notification
// @route   PATCH /api/v1/notification-logs/:id/archive
// @access  Private
exports.archiveNotification = asyncHandler(async (req, res, next) => {
  const notificationLog = await NotificationLog.findById(req.params.id);

  if (!notificationLog) {
    return next(new ErrorResponse('Notification log not found', 404));
  }

  // Only recipient or admin can archive
  if (notificationLog.recipient_id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to archive this notification', 403));
  }

  await notificationLog.archive();

  res.status(200).json({
    success: true,
    data: notificationLog
  });
});

// @desc    Get user notifications
// @route   GET /api/v1/notification-logs/user/:user_id
// @access  Private
exports.getUserNotifications = asyncHandler(async (req, res, next) => {
  const { user_id } = req.params;
  const { status, notification_type, limit = 50 } = req.query;

  // Users can only get their own notifications unless admin
  if (user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to view these notifications', 403));
  }

  const notifications = await NotificationLog.getUserNotifications(
    user_id, 
    status, 
    notification_type, 
    parseInt(limit)
  );

  res.status(200).json({
    success: true,
    data: notifications
  });
});

// @desc    Get unread notifications count
// @route   GET /api/v1/notification-logs/user/:user_id/unread-count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  const { user_id } = req.params;

  // Users can only get their own count unless admin
  if (user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to view this information', 403));
  }

  const count = await NotificationLog.countDocuments({
    recipient_id: user_id,
    status: 'unread',
    archived: false
  });

  res.status(200).json({
    success: true,
    data: { unread_count: count }
  });
});

// @desc    Get notification analytics
// @route   GET /api/v1/notification-logs/analytics
// @access  Private
exports.getNotificationAnalytics = asyncHandler(async (req, res, next) => {
  const { start_date, end_date, notification_type } = req.query;

  const analytics = await NotificationLog.getNotificationAnalytics(
    start_date, 
    end_date, 
    notification_type
  );

  res.status(200).json({
    success: true,
    data: analytics
  });
});

// @desc    Get pending notifications
// @route   GET /api/v1/notification-logs/pending
// @access  Private
exports.getPendingNotifications = asyncHandler(async (req, res, next) => {
  const { notification_type, limit = 100 } = req.query;

  const pendingNotifications = await NotificationLog.find({
    status: 'pending',
    $or: [
      { scheduled_at: { $lte: new Date() } },
      { scheduled_at: { $exists: false } }
    ],
    ...(notification_type && { notification_type })
  })
  .populate('enquiry_id', 'enquiry_id name mobile')
  .populate('recipient_id', 'name email')
  .sort({ created_at: 1 })
  .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: pendingNotifications
  });
});

// @desc    Get scheduled notifications
// @route   GET /api/v1/notification-logs/scheduled
// @access  Private
exports.getScheduledNotifications = asyncHandler(async (req, res, next) => {
  const { date, notification_type } = req.query;

  let filter = {
    status: 'pending',
    scheduled_at: { $exists: true }
  };

  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    filter.scheduled_at = {
      $gte: startDate,
      $lt: endDate
    };
  }

  if (notification_type) {
    filter.notification_type = notification_type;
  }

  const scheduledNotifications = await NotificationLog.find(filter)
    .populate('enquiry_id', 'enquiry_id name mobile')
    .populate('recipient_id', 'name email')
    .sort({ scheduled_at: 1 });

  res.status(200).json({
    success: true,
    data: scheduledNotifications
  });
});

// @desc    Bulk mark as read
// @route   PATCH /api/v1/notification-logs/bulk-read
// @access  Private
exports.bulkMarkAsRead = asyncHandler(async (req, res, next) => {
  const { notification_ids } = req.body;

  if (!notification_ids || !Array.isArray(notification_ids)) {
    return next(new ErrorResponse('Notification IDs array is required', 400));
  }

  // Only allow users to mark their own notifications as read
  const notifications = await NotificationLog.find({
    _id: { $in: notification_ids },
    recipient_id: req.user.id
  });

  if (notifications.length !== notification_ids.length) {
    return next(new ErrorResponse('Some notifications not found or not authorized', 403));
  }

  const result = await NotificationLog.updateMany(
    { 
      _id: { $in: notification_ids },
      recipient_id: req.user.id 
    },
    { 
      status: 'read',
      read_at: new Date()
    }
  );

  res.status(200).json({
    success: true,
    data: {
      matched: result.matchedCount,
      modified: result.modifiedCount
    }
  });
});

// @desc    Bulk archive notifications
// @route   PATCH /api/v1/notification-logs/bulk-archive
// @access  Private
exports.bulkArchive = asyncHandler(async (req, res, next) => {
  const { notification_ids } = req.body;

  if (!notification_ids || !Array.isArray(notification_ids)) {
    return next(new ErrorResponse('Notification IDs array is required', 400));
  }

  // Only allow users to archive their own notifications
  const result = await NotificationLog.updateMany(
    { 
      _id: { $in: notification_ids },
      recipient_id: req.user.id 
    },
    { 
      archived: true,
      archived_at: new Date()
    }
  );

  res.status(200).json({
    success: true,
    data: {
      matched: result.matchedCount,
      modified: result.modifiedCount
    }
  });
});

// @desc    Send notification
// @route   POST /api/v1/notification-logs/send
// @access  Private
exports.sendNotification = asyncHandler(async (req, res, next) => {
  const { 
    recipient_ids, 
    notification_type, 
    title, 
    message, 
    enquiry_id,
    metadata 
  } = req.body;

  if (!recipient_ids || !Array.isArray(recipient_ids) || recipient_ids.length === 0) {
    return next(new ErrorResponse('Recipient IDs array is required', 400));
  }

  // Validate all recipients exist
  const recipients = await User.find({ _id: { $in: recipient_ids } });
  if (recipients.length !== recipient_ids.length) {
    return next(new ErrorResponse('Some recipients not found', 404));
  }

  // Create notifications for all recipients
  const notifications = await Promise.all(
    recipient_ids.map(recipient_id => 
      NotificationLog.create({
        enquiry_id,
        notification_type,
        title,
        message,
        recipient_id,
        metadata: {
          ...metadata,
          user_agent: req.get('User-Agent'),
          ip_address: req.ip,
          created_by: req.user.id
        }
      })
    )
  );

  res.status(201).json({
    success: true,
    data: notifications
  });
});

// @desc    Delete notification log
// @route   DELETE /api/v1/notification-logs/:id
// @access  Private (Admin only)
exports.deleteNotificationLog = asyncHandler(async (req, res, next) => {
  const notificationLog = await NotificationLog.findById(req.params.id);

  if (!notificationLog) {
    return next(new ErrorResponse('Notification log not found', 404));
  }

  // Only allow deletion by admin
  if (req.user.role !== 'Admin') {
    return next(new ErrorResponse('Not authorized to delete notification logs', 403));
  }

  await notificationLog.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Mark notification as delivered
// @route   PUT /api/v1/notification-logs/:id/delivered
// @access  Private (Admin, Sales Head)
exports.markAsDelivered = asyncHandler(async (req, res, next) => {
  const notificationLog = await NotificationLog.findById(req.params.id);

  if (!notificationLog) {
    return next(new ErrorResponse('Notification log not found', 404));
  }

  notificationLog.status = 'delivered';
  notificationLog.delivered_at = new Date();

  await notificationLog.save();

  res.status(200).json({
    success: true,
    data: notificationLog
  });
});

// @desc    Get unread notifications for user
// @route   GET /api/v1/notification-logs/unread
// @access  Private
exports.getUnreadNotifications = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  const filter = { 
    recipient_id: req.user.id,
    read_status: false 
  };

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { created_at: -1 },
    populate: [
      { path: 'enquiry_id', select: 'enquiry_id name mobile' }
    ]
  };

  const unreadNotifications = await NotificationLog.paginate(filter, options);

  res.status(200).json({
    success: true,
    data: unreadNotifications
  });
});

// @desc    Bulk delete notifications
// @route   DELETE /api/v1/notification-logs/bulk/delete
// @access  Private
exports.bulkDelete = asyncHandler(async (req, res, next) => {
  const { notification_ids } = req.body;

  if (!notification_ids || !Array.isArray(notification_ids)) {
    return next(new ErrorResponse('Please provide an array of notification IDs', 400));
  }

  // Only allow users to delete their own notifications or admin to delete any
  let filter = { _id: { $in: notification_ids } };
  
  if (req.user.role !== 'Admin') {
    filter.recipient_id = req.user.id;
  }

  const result = await NotificationLog.deleteMany(filter);

  res.status(200).json({
    success: true,
    data: {
      deletedCount: result.deletedCount
    }
  });
});

// @desc    Export notification logs
// @route   GET /api/v1/notification-logs/export
// @access  Private (Admin, Sales Head)
exports.exportNotificationLogs = asyncHandler(async (req, res, next) => {
  const { 
    start_date, 
    end_date, 
    notification_type, 
    status,
    recipient_id,
    enquiry_id
  } = req.query;

  let filter = {};
  
  if (start_date && end_date) {
    filter.created_at = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }
  
  if (notification_type) filter.notification_type = notification_type;
  if (status) filter.status = status;
  if (recipient_id) filter.recipient_id = recipient_id;
  if (enquiry_id) filter.enquiry_id = enquiry_id;

  const notificationLogs = await NotificationLog.find(filter)
    .populate('enquiry_id', 'enquiry_id name mobile')
    .populate('recipient_id', 'name email')
    .sort({ created_at: -1 });

  res.status(200).json({
    success: true,
    count: notificationLogs.length,
    data: notificationLogs
  });
});
