const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const InfoResponse = require('../../models/info/InfoResponse');
const InfoProfile = require('../../models/info/InfoProfile');
const UserActivityLog = require('../../models/profile/UserActivityLog');

// @desc    Get all info responses
// @route   GET /api/v1/info-responses
// @access  Private
exports.getInfoResponses = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single info response
// @route   GET /api/v1/info-responses/:id
// @access  Private
exports.getInfoResponse = asyncHandler(async (req, res, next) => {
  const infoResponse = await InfoResponse.findById(req.params.id)
    .populate({
      path: 'info_profile',
      select: 'info_id title status priority'
    })
    .populate({
      path: 'provided_by',
      select: 'name email'
    })
    .populate({
      path: 'approved_by',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  if (!infoResponse) {
    return next(
      new ErrorResponse(`Info response not found with id of ${req.params.id}`, 404)
    );
  }

  // Log the view activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'view',
    entity_type: 'info_response',
    entity_id: infoResponse._id,
    description: `Viewed info response ${infoResponse.response_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoResponse
  });
});

// @desc    Create new info response
// @route   POST /api/v1/info-responses
// @access  Private
exports.createInfoResponse = asyncHandler(async (req, res, next) => {
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

  const infoResponse = await InfoResponse.create(req.body);

  // Log the creation activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'create',
    entity_type: 'info_response',
    entity_id: infoResponse._id,
    description: `Created info response ${infoResponse.response_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: infoResponse
  });
});

// @desc    Update info response
// @route   PUT /api/v1/info-responses/:id
// @access  Private
exports.updateInfoResponse = asyncHandler(async (req, res, next) => {
  let infoResponse = await InfoResponse.findById(req.params.id);

  if (!infoResponse) {
    return next(
      new ErrorResponse(`Info response not found with id of ${req.params.id}`, 404)
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

  infoResponse = await InfoResponse.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log the update activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_response',
    entity_id: infoResponse._id,
    description: `Updated info response ${infoResponse.response_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoResponse
  });
});

// @desc    Delete info response
// @route   DELETE /api/v1/info-responses/:id
// @access  Private
exports.deleteInfoResponse = asyncHandler(async (req, res, next) => {
  const infoResponse = await InfoResponse.findById(req.params.id);

  if (!infoResponse) {
    return next(
      new ErrorResponse(`Info response not found with id of ${req.params.id}`, 404)
    );
  }

  await infoResponse.deleteOne();

  // Log the deletion activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'info_response',
    entity_id: infoResponse._id,
    description: `Deleted info response ${infoResponse.response_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get responses by info profile
// @route   GET /api/v1/info-responses/profile/:profileId
// @access  Private
exports.getResponsesByProfile = asyncHandler(async (req, res, next) => {
  const responses = await InfoResponse.find({ info_profile: req.params.profileId })
    .populate({
      path: 'provided_by',
      select: 'name email'
    })
    .populate({
      path: 'approved_by',
      select: 'name email'
    })
    .sort({ response_date: -1 });

  res.status(200).json({
    success: true,
    count: responses.length,
    data: responses
  });
});

// @desc    Get responses by type
// @route   GET /api/v1/info-responses/type/:responseType
// @access  Private
exports.getResponsesByType = asyncHandler(async (req, res, next) => {
  const { responseType } = req.params;
  const { start_date, end_date } = req.query;

  const query = { response_type: responseType };

  if (start_date && end_date) {
    query.response_date = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  const responses = await InfoResponse.find(query)
    .populate({
      path: 'info_profile',
      select: 'info_id title status priority'
    })
    .populate({
      path: 'provided_by',
      select: 'name email'
    })
    .sort({ response_date: -1 });

  res.status(200).json({
    success: true,
    count: responses.length,
    data: responses
  });
});

// @desc    Get pending approval responses
// @route   GET /api/v1/info-responses/pending-approval
// @access  Private
exports.getPendingApprovalResponses = asyncHandler(async (req, res, next) => {
  const pendingResponses = await InfoResponse.find({
    approval_status: 'Pending'
  })
    .populate({
      path: 'info_profile',
      select: 'info_id title status priority'
    })
    .populate({
      path: 'provided_by',
      select: 'name email'
    })
    .sort({ response_date: 1 });

  res.status(200).json({
    success: true,
    count: pendingResponses.length,
    data: pendingResponses
  });
});

// @desc    Approve response
// @route   PUT /api/v1/info-responses/:id/approve
// @access  Private
exports.approveResponse = asyncHandler(async (req, res, next) => {
  const infoResponse = await InfoResponse.findById(req.params.id);

  if (!infoResponse) {
    return next(
      new ErrorResponse(`Info response not found with id of ${req.params.id}`, 404)
    );
  }

  if (infoResponse.approval_status === 'Approved') {
    return next(
      new ErrorResponse('Response is already approved', 400)
    );
  }

  infoResponse.approval_status = 'Approved';
  infoResponse.approved_by = req.user.id;
  infoResponse.approval_date = new Date();
  
  if (req.body.approval_notes) {
    infoResponse.approval_notes = req.body.approval_notes;
  }

  await infoResponse.save();

  // Log the approval activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_response',
    entity_id: infoResponse._id,
    description: `Approved info response ${infoResponse.response_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoResponse
  });
});

// @desc    Reject response
// @route   PUT /api/v1/info-responses/:id/reject
// @access  Private
exports.rejectResponse = asyncHandler(async (req, res, next) => {
  const { rejection_reason } = req.body;

  if (!rejection_reason) {
    return next(
      new ErrorResponse('Rejection reason is required', 400)
    );
  }

  const infoResponse = await InfoResponse.findById(req.params.id);

  if (!infoResponse) {
    return next(
      new ErrorResponse(`Info response not found with id of ${req.params.id}`, 404)
    );
  }

  if (infoResponse.approval_status === 'Rejected') {
    return next(
      new ErrorResponse('Response is already rejected', 400)
    );
  }

  infoResponse.approval_status = 'Rejected';
  infoResponse.approved_by = req.user.id;
  infoResponse.approval_date = new Date();
  infoResponse.approval_notes = rejection_reason;

  await infoResponse.save();

  // Log the rejection activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_response',
    entity_id: infoResponse._id,
    description: `Rejected info response ${infoResponse.response_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoResponse
  });
});

// @desc    Get response statistics
// @route   GET /api/v1/info-responses/statistics
// @access  Private
exports.getResponseStatistics = asyncHandler(async (req, res, next) => {
  const { start_date, end_date, user_id } = req.query;

  const matchConditions = {};
  
  if (start_date && end_date) {
    matchConditions.response_date = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  if (user_id) {
    matchConditions.provided_by = user_id;
  }

  const statistics = await InfoResponse.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        total_responses: { $sum: 1 },
        approved_responses: {
          $sum: {
            $cond: [{ $eq: ['$approval_status', 'Approved'] }, 1, 0]
          }
        },
        pending_responses: {
          $sum: {
            $cond: [{ $eq: ['$approval_status', 'Pending'] }, 1, 0]
          }
        },
        rejected_responses: {
          $sum: {
            $cond: [{ $eq: ['$approval_status', 'Rejected'] }, 1, 0]
          }
        },
        avg_response_time_hours: {
          $avg: '$response_time_hours'
        }
      }
    },
    {
      $project: {
        _id: 0,
        total_responses: 1,
        approved_responses: 1,
        pending_responses: 1,
        rejected_responses: 1,
        approval_rate: {
          $multiply: [
            { $divide: ['$approved_responses', '$total_responses'] },
            100
          ]
        },
        avg_response_time_hours: { $round: ['$avg_response_time_hours', 2] }
      }
    }
  ]);

  const responsesByType = await InfoResponse.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$response_type',
        count: { $sum: 1 },
        approved: {
          $sum: {
            $cond: [{ $eq: ['$approval_status', 'Approved'] }, 1, 0]
          }
        },
        avg_response_time: {
          $avg: '$response_time_hours'
        }
      }
    },
    {
      $project: {
        response_type: '$_id',
        count: 1,
        approved: 1,
        approval_rate: {
          $multiply: [
            { $divide: ['$approved', '$count'] },
            100
          ]
        },
        avg_response_time_hours: { $round: ['$avg_response_time', 2] }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overall_statistics: statistics[0] || {
        total_responses: 0,
        approved_responses: 0,
        pending_responses: 0,
        rejected_responses: 0,
        approval_rate: 0,
        avg_response_time_hours: 0
      },
      responses_by_type: responsesByType
    }
  });
});

// @desc    Get response quality metrics
// @route   GET /api/v1/info-responses/quality-metrics
// @access  Private
exports.getResponseQualityMetrics = asyncHandler(async (req, res, next) => {
  const { start_date, end_date } = req.query;

  const matchConditions = {};
  
  if (start_date && end_date) {
    matchConditions.response_date = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  const qualityMetrics = await InfoResponse.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$quality_score',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total_responses: { $sum: '$count' },
        quality_distribution: {
          $push: {
            score: '$_id',
            count: '$count'
          }
        },
        avg_quality_score: {
          $avg: {
            $multiply: ['$_id', '$count']
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total_responses: 1,
        quality_distribution: 1,
        avg_quality_score: {
          $divide: ['$avg_quality_score', '$total_responses']
        }
      }
    }
  ]);

  const responseTimeMetrics = await InfoResponse.aggregate([
    { $match: matchConditions },
    {
      $bucket: {
        groupBy: '$response_time_hours',
        boundaries: [0, 1, 4, 8, 24, 48, 72, Infinity],
        default: 'Other',
        output: {
          count: { $sum: 1 },
          avg_quality: { $avg: '$quality_score' }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      quality_metrics: qualityMetrics[0] || {
        total_responses: 0,
        quality_distribution: [],
        avg_quality_score: 0
      },
      response_time_buckets: responseTimeMetrics
    }
  });
});

// @desc    Mark response as final
// @route   PUT /api/v1/info-responses/:id/mark-final
// @access  Private
exports.markResponseAsFinal = asyncHandler(async (req, res, next) => {
  const infoResponse = await InfoResponse.findById(req.params.id);

  if (!infoResponse) {
    return next(
      new ErrorResponse(`Info response not found with id of ${req.params.id}`, 404)
    );
  }

  if (infoResponse.approval_status !== 'Approved') {
    return next(
      new ErrorResponse('Only approved responses can be marked as final', 400)
    );
  }

  infoResponse.is_final_response = true;
  await infoResponse.save();

  // Update the info profile with final response
  await InfoProfile.findByIdAndUpdate(infoResponse.info_profile, {
    'response_details.final_response': infoResponse._id,
    'response_details.response_provided': true,
    'response_details.response_date': infoResponse.response_date
  });

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_response',
    entity_id: infoResponse._id,
    description: `Marked info response ${infoResponse.response_id} as final`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoResponse
  });
});