const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const StatusLog = require('../../models/enquiry/StatusLog');
const Enquiry = require('../../models/enquiry/Enquiry');

// @desc    Get all status logs
// @route   GET /api/v1/status-logs
// @access  Private
exports.getStatusLogs = asyncHandler(async (req, res, next) => {
  const { enquiry_id, status, changed_by, page = 1, limit = 10 } = req.query;

  let filter = {};
  
  if (enquiry_id) filter.enquiry_id = enquiry_id;
  if (status) filter.status = status;
  if (changed_by) filter.changed_by = changed_by;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { created_at: -1 },
    populate: [
      { path: 'enquiry_id', select: 'enquiry_id name mobile' },
      { path: 'changed_by', select: 'first_name last_name email _id' }
    ]
  };

  const statusLogs = await StatusLog.paginate(filter, options);

  res.status(200).json({
    success: true,
    data: statusLogs
  });
});

// @desc    Get status log by ID
// @route   GET /api/v1/status-logs/:id
// @access  Private
exports.getStatusLogById = asyncHandler(async (req, res, next) => {
  const statusLog = await StatusLog.findById(req.params.id)
    .populate('enquiry_id', 'enquiry_id name mobile')
    .populate('changed_by', 'name email');

  if (!statusLog) {
    return next(new ErrorResponse('Status log not found', 404));
  }

  res.status(200).json({
    success: true,
    data: statusLog
  });
});

// @desc    Create status log
// @route   POST /api/v1/status-logs
// @access  Private
exports.createStatusLog = asyncHandler(async (req, res, next) => {
  const { enquiry_id, old_status, new_status, old_status_id, new_status_id, change_reason } = req.body;

  // Validate enquiry exists
  const enquiry = await Enquiry.findById(enquiry_id);
  if (!enquiry) {
    return next(new ErrorResponse('Enquiry not found', 404));
  }

  // Status to reason mapping - ALWAYS generate based on status
  const statusReasonMap = {
    'New': 'New Enquiry created',
    'In Process': 'Processing started',
    'Qualified': 'Lead qualified',
    'Not Qualified': 'Lead not qualified',
    'Converted': 'Enquiry converted to customer',
    'Closed': 'Enquiry closed',
    'On Hold': 'Enquiry put on hold',
    'Cancelled': 'Enquiry cancelled',
    'Pending': 'Pending further action',
    'Contacted': 'Customer contacted',
    'Follow Up': 'Follow up scheduled',
    'Interested': 'Customer showed interest',
    'Not Interested': 'Customer not interested'
  };
  
  // Always use the mapped reason based on status (ignore any provided reason)
  const autoReason = statusReasonMap[new_status] || `${new_status} update`;

  // Create status log with the provided old and new status values
  const statusLog = await StatusLog.create({
    enquiry_id,
    old_status: old_status || enquiry.status, // Use provided old_status or current enquiry status
    new_status: new_status, // Use provided new_status
    old_status_id,
    new_status_id,
    changed_by: req.user.id,
    change_reason: autoReason,
    metadata: {
      user_agent: req.get('User-Agent'),
      ip_address: req.ip
    }
  });

  // Update enquiry status with the new status
  enquiry.status = new_status;
  await enquiry.save();

  await statusLog.populate([
    { path: 'enquiry_id', select: 'enquiry_id name mobile' },
    { path: 'changed_by', select: 'first_name last_name email _id' }
  ]);

  res.status(201).json({
    success: true,
    data: statusLog
  });
});

// @desc    Get enquiry status history
// @route   GET /api/v1/status-logs/enquiry/:enquiry_id/history
// @access  Private
exports.getEnquiryStatusHistory = asyncHandler(async (req, res, next) => {
  const { enquiry_id } = req.params;
  const { limit = 50 } = req.query;

  const statusHistory = await StatusLog.getEnquiryStatusHistory(enquiry_id, parseInt(limit));

  res.status(200).json({
    success: true,
    data: statusHistory
  });
});

// @desc    Get status analytics
// @route   GET /api/v1/status-logs/analytics
// @access  Private
exports.getStatusAnalytics = asyncHandler(async (req, res, next) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return next(new ErrorResponse('Start date and end date are required', 400));
  }

  const analytics = await StatusLog.getStatusAnalytics(start_date, end_date);

  res.status(200).json({
    success: true,
    data: analytics
  });
});

// @desc    Get user status change activity
// @route   GET /api/v1/status-logs/user/:user_id/activity
// @access  Private
exports.getUserStatusActivity = asyncHandler(async (req, res, next) => {
  const { user_id } = req.params;
  const { start_date, end_date, limit = 100 } = req.query;

  const activity = await StatusLog.getUserStatusActivity(user_id, start_date, end_date, parseInt(limit));

  res.status(200).json({
    success: true,
    data: activity
  });
});

// @desc    Get status transition patterns
// @route   GET /api/v1/status-logs/transitions
// @access  Private
exports.getStatusTransitions = asyncHandler(async (req, res, next) => {
  const { start_date, end_date } = req.query;

  const transitions = await StatusLog.aggregate([
    {
      $match: {
        created_at: {
          $gte: new Date(start_date),
          $lte: new Date(end_date)
        }
      }
    },
    {
      $group: {
        _id: {
          from: '$previous_status',
          to: '$status'
        },
        count: { $sum: 1 },
        avg_duration: { $avg: '$duration_in_previous_status' }
      }
    },
    {
      $project: {
        from_status: '$_id.from',
        to_status: '$_id.to',
        transition_count: '$count',
        avg_duration_hours: { $round: [{ $divide: ['$avg_duration', 3600000] }, 2] }
      }
    },
    {
      $sort: { transition_count: -1 }
    }
  ]);

  res.status(200).json({
    success: true,
    data: transitions
  });
});

// @desc    Delete status log
// @route   DELETE /api/v1/status-logs/:id
// @access  Private (Admin only)
exports.deleteStatusLog = asyncHandler(async (req, res, next) => {
  const statusLog = await StatusLog.findById(req.params.id);

  if (!statusLog) {
    return next(new ErrorResponse('Status log not found', 404));
  }

  // Only allow admin to delete status logs
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete status logs', 403));
  }

  await statusLog.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Update status log
// @route   PUT /api/v1/status-logs/:id
// @access  Private (Admin/Sales Head only)
exports.updateStatusLog = asyncHandler(async (req, res, next) => {
  let statusLog = await StatusLog.findById(req.params.id);

  if (!statusLog) {
    return next(new ErrorResponse('Status log not found', 404));
  }

  // Only allow updating reason and metadata
  const allowedFields = ['reason', 'metadata'];
  const updateData = {};
  
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updateData[key] = req.body[key];
    }
  });

  statusLog = await StatusLog.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('enquiry_id', 'enquiry_id name mobile')
   .populate('changed_by', 'name email');

  res.status(200).json({
    success: true,
    data: statusLog
  });
});

// @desc    Get status duration for enquiry
// @route   GET /api/v1/status-logs/enquiry/:enquiry_id/duration
// @access  Private
exports.getStatusDuration = asyncHandler(async (req, res, next) => {
  const { enquiry_id } = req.params;

  const statusLogs = await StatusLog.find({ enquiry_id })
    .sort({ created_at: 1 })
    .populate('changed_by', 'name email');

  if (statusLogs.length === 0) {
    return next(new ErrorResponse('No status logs found for this enquiry', 404));
  }

  const durations = [];
  
  for (let i = 0; i < statusLogs.length; i++) {
    const currentLog = statusLogs[i];
    const nextLog = statusLogs[i + 1];
    
    const startTime = currentLog.created_at;
    const endTime = nextLog ? nextLog.created_at : new Date();
    const duration = Math.round((endTime - startTime) / (1000 * 60 * 60)); // Duration in hours
    
    durations.push({
      status: currentLog.status,
      start_time: startTime,
      end_time: nextLog ? nextLog.created_at : null,
      duration_hours: duration,
      changed_by: currentLog.changed_by,
      reason: currentLog.reason
    });
  }

  const totalDuration = durations.reduce((sum, d) => sum + d.duration_hours, 0);

  res.status(200).json({
    success: true,
    data: {
      enquiry_id,
      total_duration_hours: totalDuration,
      status_durations: durations
    }
  });
});

// @desc    Export status logs
// @route   GET /api/v1/status-logs/export
// @access  Private (Admin/Sales Head only)
exports.exportStatusLogs = asyncHandler(async (req, res, next) => {
  const { enquiry_id, status, start_date, end_date, format = 'json' } = req.query;

  let filter = {};
  
  if (enquiry_id) filter.enquiry_id = enquiry_id;
  if (status) filter.status = status;
  
  if (start_date || end_date) {
    filter.created_at = {};
    if (start_date) filter.created_at.$gte = new Date(start_date);
    if (end_date) filter.created_at.$lte = new Date(end_date);
  }

  const statusLogs = await StatusLog.find(filter)
    .populate('enquiry_id', 'enquiry_id name mobile')
    .populate('changed_by', 'name email')
    .sort({ created_at: -1 });

  if (format === 'csv') {
    // Convert to CSV format with proper handling of objects and values
    const csv = statusLogs.map(log => {
      // Handle changed_by properly - format as string if it's an object
      let changedByStr = 'System';
      if (log.changed_by) {
        if (typeof log.changed_by === 'object') {
          // Format user details properly
          const firstName = log.changed_by.first_name || '';
          const lastName = log.changed_by.last_name || '';
          const email = log.changed_by.email || '';
          changedByStr = `${firstName} ${lastName} (${email})`;
        } else {
          changedByStr = String(log.changed_by);
        }
      }

      // Handle enquiry_id properly
      let enquiryIdStr = '';
      let enquiryNameStr = '';
      if (log.enquiry_id) {
        if (typeof log.enquiry_id === 'object') {
          enquiryIdStr = log.enquiry_id.enquiry_id || '';
          enquiryNameStr = log.enquiry_id.name || '';
        } else {
          enquiryIdStr = String(log.enquiry_id);
        }
      }

      return {
        status_log_id: log.status_log_id || '',
        enquiry_id: enquiryIdStr,
        enquiry_name: enquiryNameStr,
        status: log.new_status || log.status || '',
        previous_status: log.old_status || log.previous_status || '',
        changed_by: changedByStr,
        reason: log.change_reason || log.reason || '',
        created_at: log.created_at ? new Date(log.created_at).toISOString() : ''
      };
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=status-logs.csv');
    
    // Improved CSV conversion with proper escaping
    const csvHeader = Object.keys(csv[0] || {}).join(',');
    const csvRows = csv.map(row => {
      return Object.values(row).map(value => {
        // Handle values that might contain commas or quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    return res.send(csvContent);
  }

  res.status(200).json({
    success: true,
    count: statusLogs.length,
    data: statusLogs
  });
});

// @desc    Bulk create status logs
// @route   POST /api/v1/status-logs/bulk
// @access  Private (Admin only)
exports.bulkCreateStatusLogs = asyncHandler(async (req, res, next) => {
  const { status_logs } = req.body;

  if (!Array.isArray(status_logs) || status_logs.length === 0) {
    return next(new ErrorResponse('Please provide an array of status logs', 400));
  }

  // Add created_by to each status log
  const statusLogsWithUser = status_logs.map(log => ({
    ...log,
    changed_by: req.user.id
  }));

  const createdStatusLogs = await StatusLog.insertMany(statusLogsWithUser);

  res.status(201).json({
    success: true,
    count: createdStatusLogs.length,
    data: createdStatusLogs
  });
});
