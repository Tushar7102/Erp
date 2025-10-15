const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const InfoFeedback = require('../../models/info/InfoFeedback');
const InfoProfile = require('../../models/info/InfoProfile');
const UserActivityLog = require('../../models/profile/UserActivityLog');

// @desc    Get all info feedbacks
// @route   GET /api/v1/info-feedbacks
// @access  Private
exports.getInfoFeedbacks = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single info feedback
// @route   GET /api/v1/info-feedbacks/:id
// @access  Private
exports.getInfoFeedback = asyncHandler(async (req, res, next) => {
  const infoFeedback = await InfoFeedback.findById(req.params.id)
    .populate({
      path: 'info_profile',
      select: 'info_id title status priority'
    })
    .populate({
      path: 'submitted_by',
      select: 'name email'
    })
    .populate({
      path: 'reviewed_by',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  if (!infoFeedback) {
    return next(
      new ErrorResponse(`Info feedback not found with id of ${req.params.id}`, 404)
    );
  }

  // Log the view activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'view',
    entity_type: 'info_feedback',
    entity_id: infoFeedback._id,
    description: `Viewed info feedback ${infoFeedback.feedback_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoFeedback
  });
});

// @desc    Create new info feedback
// @route   POST /api/v1/info-feedbacks
// @access  Private
exports.createInfoFeedback = asyncHandler(async (req, res, next) => {
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

  const infoFeedback = await InfoFeedback.create(req.body);

  // Log the creation activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'create',
    entity_type: 'info_feedback',
    entity_id: infoFeedback._id,
    description: `Created info feedback ${infoFeedback.feedback_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: infoFeedback
  });
});

// @desc    Update info feedback
// @route   PUT /api/v1/info-feedbacks/:id
// @access  Private
exports.updateInfoFeedback = asyncHandler(async (req, res, next) => {
  let infoFeedback = await InfoFeedback.findById(req.params.id);

  if (!infoFeedback) {
    return next(
      new ErrorResponse(`Info feedback not found with id of ${req.params.id}`, 404)
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

  infoFeedback = await InfoFeedback.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log the update activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_feedback',
    entity_id: infoFeedback._id,
    description: `Updated info feedback ${infoFeedback.feedback_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoFeedback
  });
});

// @desc    Delete info feedback
// @route   DELETE /api/v1/info-feedbacks/:id
// @access  Private
exports.deleteInfoFeedback = asyncHandler(async (req, res, next) => {
  const infoFeedback = await InfoFeedback.findById(req.params.id);

  if (!infoFeedback) {
    return next(
      new ErrorResponse(`Info feedback not found with id of ${req.params.id}`, 404)
    );
  }

  await infoFeedback.deleteOne();

  // Log the deletion activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'info_feedback',
    entity_id: infoFeedback._id,
    description: `Deleted info feedback ${infoFeedback.feedback_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get feedbacks by info profile
// @route   GET /api/v1/info-feedbacks/profile/:profileId
// @access  Private
exports.getFeedbacksByProfile = asyncHandler(async (req, res, next) => {
  const feedbacks = await InfoFeedback.find({ info_profile: req.params.profileId })
    .populate({
      path: 'submitted_by',
      select: 'name email'
    })
    .populate({
      path: 'reviewed_by',
      select: 'name email'
    })
    .sort({ feedback_date: -1 });

  res.status(200).json({
    success: true,
    count: feedbacks.length,
    data: feedbacks
  });
});

// @desc    Get feedbacks by type
// @route   GET /api/v1/info-feedbacks/type/:feedbackType
// @access  Private
exports.getFeedbacksByType = asyncHandler(async (req, res, next) => {
  const { feedbackType } = req.params;
  const { start_date, end_date } = req.query;

  const query = { feedback_type: feedbackType };

  if (start_date && end_date) {
    query.feedback_date = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  const feedbacks = await InfoFeedback.find(query)
    .populate({
      path: 'info_profile',
      select: 'info_id title status priority'
    })
    .populate({
      path: 'submitted_by',
      select: 'name email'
    })
    .sort({ feedback_date: -1 });

  res.status(200).json({
    success: true,
    count: feedbacks.length,
    data: feedbacks
  });
});

// @desc    Get pending review feedbacks
// @route   GET /api/v1/info-feedbacks/pending-review
// @access  Private
exports.getPendingReviewFeedbacks = asyncHandler(async (req, res, next) => {
  const pendingFeedbacks = await InfoFeedback.find({
    review_status: 'Pending'
  })
    .populate({
      path: 'info_profile',
      select: 'info_id title status priority'
    })
    .populate({
      path: 'submitted_by',
      select: 'name email'
    })
    .sort({ feedback_date: 1 });

  res.status(200).json({
    success: true,
    count: pendingFeedbacks.length,
    data: pendingFeedbacks
  });
});

// @desc    Review feedback
// @route   PUT /api/v1/info-feedbacks/:id/review
// @access  Private
exports.reviewFeedback = asyncHandler(async (req, res, next) => {
  const { review_status, review_notes } = req.body;

  if (!review_status) {
    return next(
      new ErrorResponse('Review status is required', 400)
    );
  }

  const infoFeedback = await InfoFeedback.findById(req.params.id);

  if (!infoFeedback) {
    return next(
      new ErrorResponse(`Info feedback not found with id of ${req.params.id}`, 404)
    );
  }

  infoFeedback.review_status = review_status;
  infoFeedback.reviewed_by = req.user.id;
  infoFeedback.review_date = new Date();
  
  if (review_notes) {
    infoFeedback.review_notes = review_notes;
  }

  await infoFeedback.save();

  // Log the review activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_feedback',
    entity_id: infoFeedback._id,
    description: `Reviewed info feedback ${infoFeedback.feedback_id} - ${review_status}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoFeedback
  });
});

// @desc    Get feedback statistics
// @route   GET /api/v1/info-feedbacks/statistics
// @access  Private
exports.getFeedbackStatistics = asyncHandler(async (req, res, next) => {
  const { start_date, end_date } = req.query;

  const matchConditions = {};
  
  if (start_date && end_date) {
    matchConditions.feedback_date = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  const statistics = await InfoFeedback.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        total_feedbacks: { $sum: 1 },
        avg_rating: { $avg: '$rating' },
        avg_nps_score: { $avg: '$nps_score' },
        positive_feedbacks: {
          $sum: {
            $cond: [{ $in: ['$sentiment_analysis.sentiment', ['Positive', 'Very Positive']] }, 1, 0]
          }
        },
        negative_feedbacks: {
          $sum: {
            $cond: [{ $in: ['$sentiment_analysis.sentiment', ['Negative', 'Very Negative']] }, 1, 0]
          }
        },
        neutral_feedbacks: {
          $sum: {
            $cond: [{ $eq: ['$sentiment_analysis.sentiment', 'Neutral'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total_feedbacks: 1,
        avg_rating: { $round: ['$avg_rating', 2] },
        avg_nps_score: { $round: ['$avg_nps_score', 2] },
        positive_feedbacks: 1,
        negative_feedbacks: 1,
        neutral_feedbacks: 1,
        positive_percentage: {
          $multiply: [
            { $divide: ['$positive_feedbacks', '$total_feedbacks'] },
            100
          ]
        },
        negative_percentage: {
          $multiply: [
            { $divide: ['$negative_feedbacks', '$total_feedbacks'] },
            100
          ]
        }
      }
    }
  ]);

  const feedbacksByType = await InfoFeedback.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$feedback_type',
        count: { $sum: 1 },
        avg_rating: { $avg: '$rating' },
        avg_nps: { $avg: '$nps_score' }
      }
    },
    {
      $project: {
        feedback_type: '$_id',
        count: 1,
        avg_rating: { $round: ['$avg_rating', 2] },
        avg_nps: { $round: ['$avg_nps', 2] }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const npsDistribution = await InfoFeedback.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$nps_category',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        category: '$_id',
        count: 1
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overall_statistics: statistics[0] || {
        total_feedbacks: 0,
        avg_rating: 0,
        avg_nps_score: 0,
        positive_feedbacks: 0,
        negative_feedbacks: 0,
        neutral_feedbacks: 0,
        positive_percentage: 0,
        negative_percentage: 0
      },
      feedbacks_by_type: feedbacksByType,
      nps_distribution: npsDistribution
    }
  });
});

// @desc    Get customer satisfaction trends
// @route   GET /api/v1/info-feedbacks/satisfaction-trends
// @access  Private
exports.getSatisfactionTrends = asyncHandler(async (req, res, next) => {
  const { period = 'monthly' } = req.query;

  let groupBy;
  switch (period) {
    case 'daily':
      groupBy = {
        year: { $year: '$feedback_date' },
        month: { $month: '$feedback_date' },
        day: { $dayOfMonth: '$feedback_date' }
      };
      break;
    case 'weekly':
      groupBy = {
        year: { $year: '$feedback_date' },
        week: { $week: '$feedback_date' }
      };
      break;
    case 'monthly':
    default:
      groupBy = {
        year: { $year: '$feedback_date' },
        month: { $month: '$feedback_date' }
      };
      break;
  }

  const trends = await InfoFeedback.aggregate([
    {
      $group: {
        _id: groupBy,
        total_feedbacks: { $sum: 1 },
        avg_rating: { $avg: '$rating' },
        avg_nps_score: { $avg: '$nps_score' },
        positive_count: {
          $sum: {
            $cond: [{ $in: ['$sentiment_analysis.sentiment', ['Positive', 'Very Positive']] }, 1, 0]
          }
        },
        negative_count: {
          $sum: {
            $cond: [{ $in: ['$sentiment_analysis.sentiment', ['Negative', 'Very Negative']] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        period: '$_id',
        total_feedbacks: 1,
        avg_rating: { $round: ['$avg_rating', 2] },
        avg_nps_score: { $round: ['$avg_nps_score', 2] },
        satisfaction_percentage: {
          $multiply: [
            { $divide: ['$positive_count', '$total_feedbacks'] },
            100
          ]
        }
      }
    },
    { $sort: { 'period.year': 1, 'period.month': 1, 'period.day': 1, 'period.week': 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: trends
  });
});

// @desc    Get feedback response analysis
// @route   GET /api/v1/info-feedbacks/response-analysis
// @access  Private
exports.getFeedbackResponseAnalysis = asyncHandler(async (req, res, next) => {
  const responseAnalysis = await InfoFeedback.aggregate([
    {
      $match: {
        response_required: true
      }
    },
    {
      $group: {
        _id: null,
        total_requiring_response: { $sum: 1 },
        responded: {
          $sum: {
            $cond: ['$response_provided', 1, 0]
          }
        },
        pending_response: {
          $sum: {
            $cond: ['$response_provided', 0, 1]
          }
        },
        overdue_responses: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$response_provided', false] },
                  { $lt: ['$response_deadline', new Date()] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total_requiring_response: 1,
        responded: 1,
        pending_response: 1,
        overdue_responses: 1,
        response_rate: {
          $multiply: [
            { $divide: ['$responded', '$total_requiring_response'] },
            100
          ]
        }
      }
    }
  ]);

  const overdueDetails = await InfoFeedback.find({
    response_required: true,
    response_provided: false,
    response_deadline: { $lt: new Date() }
  })
    .populate({
      path: 'info_profile',
      select: 'info_id title priority'
    })
    .populate({
      path: 'submitted_by',
      select: 'name email'
    })
    .sort({ response_deadline: 1 })
    .limit(10);

  res.status(200).json({
    success: true,
    data: {
      response_analysis: responseAnalysis[0] || {
        total_requiring_response: 0,
        responded: 0,
        pending_response: 0,
        overdue_responses: 0,
        response_rate: 0
      },
      overdue_feedbacks: overdueDetails
    }
  });
});

// @desc    Provide feedback response
// @route   PUT /api/v1/info-feedbacks/:id/respond
// @access  Private
exports.provideFeedbackResponse = asyncHandler(async (req, res, next) => {
  const { response_text } = req.body;

  if (!response_text) {
    return next(
      new ErrorResponse('Response text is required', 400)
    );
  }

  const infoFeedback = await InfoFeedback.findById(req.params.id);

  if (!infoFeedback) {
    return next(
      new ErrorResponse(`Info feedback not found with id of ${req.params.id}`, 404)
    );
  }

  if (!infoFeedback.response_required) {
    return next(
      new ErrorResponse('This feedback does not require a response', 400)
    );
  }

  infoFeedback.response_provided = true;
  infoFeedback.response_text = response_text;
  infoFeedback.response_date = new Date();
  infoFeedback.response_provided_by = req.user.id;

  await infoFeedback.save();

  // Log the response activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_feedback',
    entity_id: infoFeedback._id,
    description: `Provided response to feedback ${infoFeedback.feedback_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoFeedback
  });
});