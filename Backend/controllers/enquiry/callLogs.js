const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const CallLog = require('../../models/enquiry/CallLog');
const Enquiry = require('../../models/enquiry/Enquiry');
const User = require('../../models/profile/User');

// @desc    Get all call logs
// @route   GET /api/v1/call-logs
// @access  Private
exports.getCallLogs = asyncHandler(async (req, res, next) => {
  const { 
    enquiry_id, 
    call_type, 
    call_status, 
    caller_id,
    start_date,
    end_date,
    page = 1, 
    limit = 10 
  } = req.query;

  let filter = {};
  
  if (enquiry_id) filter.enquiry_id = enquiry_id;
  if (call_type) filter.call_type = call_type;
  if (call_status) filter.call_status = call_status;
  if (caller_id) filter['caller.user_id'] = caller_id;
  
  if (start_date || end_date) {
    filter.start_time = {};
    if (start_date) filter.start_time.$gte = new Date(start_date);
    if (end_date) filter.start_time.$lte = new Date(end_date);
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { start_time: -1 },
    populate: [
      { path: 'enquiry_id', select: 'enquiry_id name mobile' },
      { path: 'caller.user_id', select: 'name email' }
    ]
  };

  const callLogs = await CallLog.paginate(filter, options);

  res.status(200).json({
    success: true,
    data: callLogs
  });
});

// @desc    Get call log by ID
// @route   GET /api/v1/call-logs/:id
// @access  Private
exports.getCallLogById = asyncHandler(async (req, res, next) => {
  const callLog = await CallLog.findById(req.params.id)
    .populate('enquiry_id', 'enquiry_id name mobile')
    .populate('caller.user_id', 'name email');

  if (!callLog) {
    return next(new ErrorResponse('Call log not found', 404));
  }

  res.status(200).json({
    success: true,
    data: callLog
  });
});

// @desc    Create call log
// @route   POST /api/v1/call-logs
// @access  Private
exports.createCallLog = asyncHandler(async (req, res, next) => {
  const { 
    enquiry_id, 
    call_type, 
    phone_number, 
    start_time,
    end_time,
    call_status,
    call_notes,
    recording_url,
    metadata 
  } = req.body;

  // Validate enquiry exists if provided
  if (enquiry_id) {
    const enquiry = await Enquiry.findById(enquiry_id);
    if (!enquiry) {
      return next(new ErrorResponse('Enquiry not found', 404));
    }
  }

  const callLog = await CallLog.create({
    enquiry_id,
    call_type,
    phone_number,
    start_time: start_time || new Date(),
    end_time,
    call_status: call_status || 'initiated',
    caller: { user_id: req.user.id },
    call_notes,
    recording_url,
    metadata: {
      ...metadata,
      user_agent: req.get('User-Agent'),
      ip_address: req.ip
    }
  });

  await callLog.populate([
    { path: 'enquiry_id', select: 'enquiry_id name mobile' },
    { path: 'caller.user_id', select: 'name email' }
  ]);

  res.status(201).json({
    success: true,
    data: callLog
  });
});

// @desc    Update call log
// @route   PUT /api/v1/call-logs/:id
// @access  Private
exports.updateCallLog = asyncHandler(async (req, res, next) => {
  let callLog = await CallLog.findById(req.params.id);

  if (!callLog) {
    return next(new ErrorResponse('Call log not found', 404));
  }

  // Only caller or admin can update
  if (callLog.caller.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this call log', 403));
  }

  const allowedUpdates = [
    'end_time', 'call_status', 'call_notes', 'recording_url', 
    'call_outcome', 'follow_up_required', 'follow_up_date', 'metadata'
  ];
  const updates = {};
  
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Calculate duration if end_time is provided
  if (updates.end_time && callLog.start_time) {
    updates.duration = Math.floor((new Date(updates.end_time) - callLog.start_time) / 1000);
  }

  callLog = await CallLog.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate([
    { path: 'enquiry_id', select: 'enquiry_id name mobile' },
    { path: 'caller.user_id', select: 'name email' }
  ]);

  res.status(200).json({
    success: true,
    data: callLog
  });
});

// @desc    End call
// @route   PATCH /api/v1/call-logs/:id/end
// @access  Private
exports.endCall = asyncHandler(async (req, res, next) => {
  const { call_outcome, call_notes, follow_up_required, follow_up_date } = req.body;

  const callLog = await CallLog.findById(req.params.id);

  if (!callLog) {
    return next(new ErrorResponse('Call log not found', 404));
  }

  // Only caller can end the call
  if (callLog.caller.user_id.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to end this call', 403));
  }

  await callLog.endCall(call_outcome, call_notes, follow_up_required, follow_up_date);

  res.status(200).json({
    success: true,
    data: callLog
  });
});

// @desc    Add call feedback
// @route   POST /api/v1/call-logs/:id/feedback
// @access  Private
exports.addCallFeedback = asyncHandler(async (req, res, next) => {
  const { rating, feedback_text, feedback_category } = req.body;

  const callLog = await CallLog.findById(req.params.id);

  if (!callLog) {
    return next(new ErrorResponse('Call log not found', 404));
  }

  await callLog.addFeedback(rating, feedback_text, feedback_category, req.user.id);

  res.status(200).json({
    success: true,
    data: callLog
  });
});

// @desc    Get enquiry call history
// @route   GET /api/v1/call-logs/enquiry/:enquiry_id/history
// @access  Private
exports.getEnquiryCallHistory = asyncHandler(async (req, res, next) => {
  const { enquiry_id } = req.params;
  const { limit = 50 } = req.query;

  const callHistory = await CallLog.getEnquiryCallHistory(enquiry_id, parseInt(limit));

  res.status(200).json({
    success: true,
    data: callHistory
  });
});

// @desc    Get call analytics
// @route   GET /api/v1/call-logs/analytics
// @access  Private
exports.getCallAnalytics = asyncHandler(async (req, res, next) => {
  const { start_date, end_date, user_id, call_type } = req.query;

  const analytics = await CallLog.getCallAnalytics(start_date, end_date, user_id, call_type);

  res.status(200).json({
    success: true,
    data: analytics
  });
});

// @desc    Get user call statistics
// @route   GET /api/v1/call-logs/user/:user_id/stats
// @access  Private
exports.getUserCallStats = asyncHandler(async (req, res, next) => {
  const { user_id } = req.params;
  const { start_date, end_date } = req.query;

  const stats = await CallLog.getUserCallStats(user_id, start_date, end_date);

  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    Get missed calls
// @route   GET /api/v1/call-logs/missed
// @access  Private
exports.getMissedCalls = asyncHandler(async (req, res, next) => {
  const { limit = 50, user_id } = req.query;

  const missedCalls = await CallLog.getMissedCalls(parseInt(limit), user_id);

  res.status(200).json({
    success: true,
    data: missedCalls
  });
});

// @desc    Get calls requiring follow-up
// @route   GET /api/v1/call-logs/follow-up
// @access  Private
exports.getCallsRequiringFollowUp = asyncHandler(async (req, res, next) => {
  const { date, user_id } = req.query;

  const followUpCalls = await CallLog.getCallsRequiringFollowUp(date, user_id);

  res.status(200).json({
    success: true,
    data: followUpCalls
  });
});

// @desc    Mark follow-up as completed
// @route   PATCH /api/v1/call-logs/:id/follow-up-complete
// @access  Private
exports.markFollowUpComplete = asyncHandler(async (req, res, next) => {
  const { completion_notes } = req.body;

  const callLog = await CallLog.findById(req.params.id);

  if (!callLog) {
    return next(new ErrorResponse('Call log not found', 404));
  }

  if (!callLog.follow_up_required) {
    return next(new ErrorResponse('This call does not require follow-up', 400));
  }

  callLog.follow_up_completed = true;
  callLog.follow_up_completed_at = new Date();
  callLog.follow_up_completed_by = req.user.id;
  
  if (completion_notes) {
    callLog.call_notes = callLog.call_notes 
      ? `${callLog.call_notes}\n\nFollow-up completed: ${completion_notes}`
      : `Follow-up completed: ${completion_notes}`;
  }

  await callLog.save();

  res.status(200).json({
    success: true,
    data: callLog
  });
});

// @desc    Get call quality metrics
// @route   GET /api/v1/call-logs/quality-metrics
// @access  Private
exports.getCallQualityMetrics = asyncHandler(async (req, res, next) => {
  const { start_date, end_date, user_id } = req.query;

  const metrics = await CallLog.aggregate([
    {
      $match: {
        ...(start_date && end_date && {
          start_time: {
            $gte: new Date(start_date),
            $lte: new Date(end_date)
          }
        }),
        ...(user_id && { caller_id: mongoose.Types.ObjectId(user_id) }),
        'feedback.rating': { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        total_calls_with_feedback: { $sum: 1 },
        average_rating: { $avg: '$feedback.rating' },
        rating_distribution: {
          $push: '$feedback.rating'
        },
        total_duration: { $sum: '$duration' },
        average_duration: { $avg: '$duration' }
      }
    },
    {
      $project: {
        total_calls_with_feedback: 1,
        average_rating: { $round: ['$average_rating', 2] },
        average_duration_minutes: { $round: [{ $divide: ['$average_duration', 60] }, 2] },
        total_duration_hours: { $round: [{ $divide: ['$total_duration', 3600] }, 2] },
        rating_distribution: 1
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: metrics[0] || {}
  });
});

// @desc    Export call logs
// @route   GET /api/v1/call-logs/export
// @access  Private
exports.exportCallLogs = asyncHandler(async (req, res, next) => {
  const { start_date, end_date, format = 'json', user_id } = req.query;

  if (!start_date || !end_date) {
    return next(new ErrorResponse('Start date and end date are required', 400));
  }

  let filter = {
    start_time: {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    }
  };

  if (user_id) {
    filter.caller_id = user_id;
  }

  const callLogs = await CallLog.find(filter)
    .populate('enquiry_id', 'enquiry_id name mobile')
    .populate('caller.user_id', 'name email')
    .sort({ start_time: -1 });

  if (format === 'csv') {
    // Convert to CSV format
    const csv = callLogs.map(log => ({
      call_log_id: log.call_log_id,
      enquiry_id: log.enquiry_id?.enquiry_id || '',
      customer_name: log.enquiry_id?.name || '',
      phone_number: log.phone_number,
      call_type: log.call_type,
      call_status: log.call_status,
      start_time: log.start_time,
      end_time: log.end_time,
      duration_seconds: log.duration,
      caller_name: log.caller_id?.name || '',
      call_outcome: log.call_outcome,
      rating: log.feedback?.rating || '',
      created_at: log.created_at
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=call-logs.csv');
    
    // Simple CSV conversion (in production, use a proper CSV library)
    const csvContent = [
      Object.keys(csv[0]).join(','),
      ...csv.map(row => Object.values(row).join(','))
    ].join('\n');
    
    return res.send(csvContent);
  }

  res.status(200).json({
    success: true,
    data: callLogs
  });
});

// @desc    Delete call log
// @route   DELETE /api/v1/call-logs/:id
// @access  Private (Admin only)
exports.deleteCallLog = asyncHandler(async (req, res, next) => {
  const callLog = await CallLog.findById(req.params.id);

  if (!callLog) {
    return next(new ErrorResponse('Call log not found', 404));
  }

  // Only allow deletion by admin
  if (req.user.role !== 'Admin') {
    return next(new ErrorResponse('Not authorized to delete call logs', 403));
  }

  await callLog.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Start a call
// @route   POST /api/v1/call-logs/start
// @access  Private (Telecaller)
exports.startCall = asyncHandler(async (req, res, next) => {
  const { enquiry_id, call_type, phone_number } = req.body;

  // Check if enquiry exists
  const enquiry = await Enquiry.findById(enquiry_id);
  if (!enquiry) {
    return next(new ErrorResponse('Enquiry not found', 404));
  }

  const callLog = await CallLog.create({
    enquiry_id,
    call_type,
    phone_number: phone_number || enquiry.mobile,
    caller_id: req.user.id,
    call_status: 'in_progress',
    start_time: new Date()
  });

  await callLog.populate([
    { path: 'enquiry_id', select: 'enquiry_id name mobile' },
    { path: 'caller_id', select: 'name email' }
  ]);

  res.status(201).json({
    success: true,
    data: callLog
  });
});

// @desc    Get user call history
// @route   GET /api/v1/call-logs/user/:user_id
// @access  Private
exports.getUserCallHistory = asyncHandler(async (req, res, next) => {
  const { user_id } = req.params;
  const { call_status, call_type, page = 1, limit = 10 } = req.query;

  let filter = { caller_id: user_id };
  if (call_status) filter.call_status = call_status;
  if (call_type) filter.call_type = call_type;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { start_time: -1 },
    populate: [
      { path: 'enquiry_id', select: 'enquiry_id name mobile' }
    ]
  };

  const callHistory = await CallLog.paginate(filter, options);

  res.status(200).json({
    success: true,
    data: callHistory
  });
});
