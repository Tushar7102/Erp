const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const InfoSlaRule = require('../../models/info/InfoSlaRule');
const InfoType = require('../../models/info/InfoType');
const InfoStatus = require('../../models/info/InfoStatus');
const UserActivityLog = require('../../models/profile/UserActivityLog');

// @desc    Get all SLA rules
// @route   GET /api/v1/info-sla-rules
// @access  Private
exports.getSlaRules = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single SLA rule
// @route   GET /api/v1/info-sla-rules/:id
// @access  Private
exports.getSlaRule = asyncHandler(async (req, res, next) => {
  const slaRule = await InfoSlaRule.findById(req.params.id)
    .populate({
      path: 'applicable_info_types',
      select: 'type_name type_label type_category'
    })
    .populate({
      path: 'applicable_statuses',
      select: 'status_name status_label status_category'
    })
    .populate({
      path: 'escalation_levels.escalate_to_team',
      select: 'name team_id'
    })
    .populate({
      path: 'escalation_levels.escalate_to_user',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  if (!slaRule) {
    return next(
      new ErrorResponse(`SLA rule not found with id of ${req.params.id}`, 404)
    );
  }

  // Log the view activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'view',
    entity_type: 'info_sla_rule',
    entity_id: slaRule._id,
    description: `Viewed SLA rule ${slaRule.rule_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: slaRule
  });
});

// @desc    Create new SLA rule
// @route   POST /api/v1/info-sla-rules
// @access  Private
exports.createSlaRule = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.created_by = req.user.id;

  // Validate applicable info types
  if (req.body.applicable_info_types && req.body.applicable_info_types.length > 0) {
    const infoTypes = await InfoType.find({
      _id: { $in: req.body.applicable_info_types },
      is_active: true
    });
    
    if (infoTypes.length !== req.body.applicable_info_types.length) {
      return next(
        new ErrorResponse('One or more info types are invalid or inactive', 400)
      );
    }
  }

  // Validate applicable statuses
  if (req.body.applicable_statuses && req.body.applicable_statuses.length > 0) {
    const statuses = await InfoStatus.find({
      _id: { $in: req.body.applicable_statuses },
      is_active: true
    });
    
    if (statuses.length !== req.body.applicable_statuses.length) {
      return next(
        new ErrorResponse('One or more statuses are invalid or inactive', 400)
      );
    }
  }

  const slaRule = await InfoSlaRule.create(req.body);

  // Log the creation activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'create',
    entity_type: 'info_sla_rule',
    entity_id: slaRule._id,
    description: `Created SLA rule ${slaRule.rule_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: slaRule
  });
});

// @desc    Update SLA rule
// @route   PUT /api/v1/info-sla-rules/:id
// @access  Private
exports.updateSlaRule = asyncHandler(async (req, res, next) => {
  let slaRule = await InfoSlaRule.findById(req.params.id);

  if (!slaRule) {
    return next(
      new ErrorResponse(`SLA rule not found with id of ${req.params.id}`, 404)
    );
  }

  // Validate applicable info types if provided
  if (req.body.applicable_info_types && req.body.applicable_info_types.length > 0) {
    const infoTypes = await InfoType.find({
      _id: { $in: req.body.applicable_info_types },
      is_active: true
    });
    
    if (infoTypes.length !== req.body.applicable_info_types.length) {
      return next(
        new ErrorResponse('One or more info types are invalid or inactive', 400)
      );
    }
  }

  // Validate applicable statuses if provided
  if (req.body.applicable_statuses && req.body.applicable_statuses.length > 0) {
    const statuses = await InfoStatus.find({
      _id: { $in: req.body.applicable_statuses },
      is_active: true
    });
    
    if (statuses.length !== req.body.applicable_statuses.length) {
      return next(
        new ErrorResponse('One or more statuses are invalid or inactive', 400)
      );
    }
  }

  slaRule = await InfoSlaRule.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log the update activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_sla_rule',
    entity_id: slaRule._id,
    description: `Updated SLA rule ${slaRule.rule_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: slaRule
  });
});

// @desc    Delete SLA rule
// @route   DELETE /api/v1/info-sla-rules/:id
// @access  Private
exports.deleteSlaRule = asyncHandler(async (req, res, next) => {
  const slaRule = await InfoSlaRule.findById(req.params.id);

  if (!slaRule) {
    return next(
      new ErrorResponse(`SLA rule not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if SLA rule is being used
  const InfoProfile = require('../../models/info/InfoProfile');
  const usageCount = await InfoProfile.countDocuments({
    'sla_tracking.sla_rule': slaRule._id
  });

  if (usageCount > 0) {
    return next(
      new ErrorResponse(`Cannot delete SLA rule as it is being used by ${usageCount} info profiles`, 400)
    );
  }

  await slaRule.deleteOne();

  // Log the deletion activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'info_sla_rule',
    entity_id: slaRule._id,
    description: `Deleted SLA rule ${slaRule.rule_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get active SLA rules
// @route   GET /api/v1/info-sla-rules/active
// @access  Private
exports.getActiveSlaRules = asyncHandler(async (req, res, next) => {
  const slaRules = await InfoSlaRule.find({ is_active: true })
    .populate({
      path: 'applicable_info_types',
      select: 'type_name type_label'
    })
    .populate({
      path: 'applicable_statuses',
      select: 'status_name status_label'
    })
    .sort({ priority: -1, rule_name: 1 });

  res.status(200).json({
    success: true,
    count: slaRules.length,
    data: slaRules
  });
});

// @desc    Get default SLA rule
// @route   GET /api/v1/info-sla-rules/default
// @access  Private
exports.getDefaultSlaRule = asyncHandler(async (req, res, next) => {
  const defaultRule = await InfoSlaRule.getDefaultRule();

  if (!defaultRule) {
    return next(
      new ErrorResponse('No default SLA rule found', 404)
    );
  }

  res.status(200).json({
    success: true,
    data: defaultRule
  });
});

// @desc    Set default SLA rule
// @route   PUT /api/v1/info-sla-rules/:id/set-default
// @access  Private
exports.setDefaultSlaRule = asyncHandler(async (req, res, next) => {
  const slaRule = await InfoSlaRule.findById(req.params.id);

  if (!slaRule) {
    return next(
      new ErrorResponse(`SLA rule not found with id of ${req.params.id}`, 404)
    );
  }

  if (!slaRule.is_active) {
    return next(
      new ErrorResponse('Cannot set inactive SLA rule as default', 400)
    );
  }

  // Remove default flag from all other rules
  await InfoSlaRule.updateMany(
    { _id: { $ne: slaRule._id } },
    { is_default: false }
  );

  // Set this rule as default
  slaRule.is_default = true;
  await slaRule.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_sla_rule',
    entity_id: slaRule._id,
    description: `Set SLA rule ${slaRule.rule_id} as default`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: slaRule
  });
});

// @desc    Get SLA rules by info type
// @route   GET /api/v1/info-sla-rules/by-type/:typeId
// @access  Private
exports.getSlaRulesByType = asyncHandler(async (req, res, next) => {
  const slaRules = await InfoSlaRule.getRulesByInfoType(req.params.typeId);

  res.status(200).json({
    success: true,
    count: slaRules.length,
    data: slaRules
  });
});

// @desc    Calculate SLA for info profile
// @route   POST /api/v1/info-sla-rules/calculate-sla
// @access  Private
exports.calculateSla = asyncHandler(async (req, res, next) => {
  const { info_type, priority, customer_tier, created_at } = req.body;

  if (!info_type || !priority) {
    return next(
      new ErrorResponse('Info type and priority are required', 400)
    );
  }

  const slaCalculation = await InfoSlaRule.calculateSlaForProfile({
    info_type,
    priority,
    customer_tier,
    created_at: created_at || new Date()
  });

  res.status(200).json({
    success: true,
    data: slaCalculation
  });
});

// @desc    Get SLA performance metrics
// @route   GET /api/v1/info-sla-rules/performance
// @access  Private
exports.getSlaPerformance = asyncHandler(async (req, res, next) => {
  const { start_date, end_date, rule_id } = req.query;

  const matchConditions = {};
  
  if (start_date && end_date) {
    matchConditions.created_at = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  if (rule_id) {
    matchConditions['sla_tracking.sla_rule'] = rule_id;
  }

  const InfoProfile = require('../../models/info/InfoProfile');
  
  const performance = await InfoProfile.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$sla_tracking.sla_rule',
        total_requests: { $sum: 1 },
        within_sla: {
          $sum: {
            $cond: ['$sla_tracking.is_within_sla', 1, 0]
          }
        },
        breached_sla: {
          $sum: {
            $cond: ['$sla_tracking.is_within_sla', 0, 1]
          }
        },
        avg_response_time: {
          $avg: '$sla_tracking.actual_response_time_hours'
        }
      }
    },
    {
      $lookup: {
        from: 'infoslarules',
        localField: '_id',
        foreignField: '_id',
        as: 'sla_rule'
      }
    },
    {
      $unwind: '$sla_rule'
    },
    {
      $project: {
        rule_name: '$sla_rule.rule_name',
        total_requests: 1,
        within_sla: 1,
        breached_sla: 1,
        sla_compliance_percentage: {
          $multiply: [
            { $divide: ['$within_sla', '$total_requests'] },
            100
          ]
        },
        avg_response_time: { $round: ['$avg_response_time', 2] }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: performance
  });
});

// @desc    Toggle SLA rule status
// @route   PUT /api/v1/info-sla-rules/:id/toggle-status
// @access  Private
exports.toggleSlaRuleStatus = asyncHandler(async (req, res, next) => {
  const slaRule = await InfoSlaRule.findById(req.params.id);

  if (!slaRule) {
    return next(
      new ErrorResponse(`SLA rule not found with id of ${req.params.id}`, 404)
    );
  }

  // If deactivating the default rule, ensure there's another default
  if (slaRule.is_default && slaRule.is_active) {
    const otherActiveRules = await InfoSlaRule.find({
      _id: { $ne: slaRule._id },
      is_active: true
    });

    if (otherActiveRules.length === 0) {
      return next(
        new ErrorResponse('Cannot deactivate the only active SLA rule', 400)
      );
    }

    // Set another rule as default
    const newDefault = otherActiveRules[0];
    newDefault.is_default = true;
    await newDefault.save();
    
    slaRule.is_default = false;
  }

  slaRule.is_active = !slaRule.is_active;
  await slaRule.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_sla_rule',
    entity_id: slaRule._id,
    description: `${slaRule.is_active ? 'Activated' : 'Deactivated'} SLA rule ${slaRule.rule_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: slaRule
  });
});