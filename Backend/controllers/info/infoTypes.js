const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const InfoType = require('../../models/info/InfoType');
const UserActivityLog = require('../../models/profile/UserActivityLog');

// @desc    Get all info types
// @route   GET /api/v1/info-types
// @access  Private
exports.getInfoTypes = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single info type
// @route   GET /api/v1/info-types/:id
// @access  Private
exports.getInfoType = asyncHandler(async (req, res, next) => {
  const infoType = await InfoType.findById(req.params.id)
    .populate({
      path: 'default_sla_rule',
      select: 'rule_name response_time_hours escalation_levels'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    })
    .populate({
      path: 'updated_by',
      select: 'name email'
    });

  if (!infoType) {
    return next(
      new ErrorResponse(`Info type not found with id of ${req.params.id}`, 404)
    );
  }

  // Log the view activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'view',
    entity_type: 'info_type',
    entity_id: infoType._id,
    description: `Viewed info type ${infoType.type_name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoType
  });
});

// @desc    Create new info type
// @route   POST /api/v1/info-types
// @access  Private
exports.createInfoType = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.created_by = req.user.id;

  const infoType = await InfoType.create(req.body);

  // Log the creation activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'create',
    entity_type: 'info_type',
    entity_id: infoType._id,
    description: `Created info type ${infoType.type_name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: infoType
  });
});

// @desc    Update info type
// @route   PUT /api/v1/info-types/:id
// @access  Private
exports.updateInfoType = asyncHandler(async (req, res, next) => {
  let infoType = await InfoType.findById(req.params.id);

  if (!infoType) {
    return next(
      new ErrorResponse(`Info type not found with id of ${req.params.id}`, 404)
    );
  }

  // Add user to req.body
  req.body.updated_by = req.user.id;

  infoType = await InfoType.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log the update activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_type',
    entity_id: infoType._id,
    description: `Updated info type ${infoType.type_name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoType
  });
});

// @desc    Delete info type
// @route   DELETE /api/v1/info-types/:id
// @access  Private
exports.deleteInfoType = asyncHandler(async (req, res, next) => {
  const infoType = await InfoType.findById(req.params.id);

  if (!infoType) {
    return next(
      new ErrorResponse(`Info type not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if type is being used by any info profiles
  const InfoProfile = require('../../models/info/InfoProfile');
  const profilesUsingType = await InfoProfile.countDocuments({ info_type: infoType._id });

  if (profilesUsingType > 0) {
    return next(
      new ErrorResponse(`Cannot delete type. It is being used by ${profilesUsingType} info profile(s)`, 400)
    );
  }

  await infoType.deleteOne();

  // Log the deletion activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'info_type',
    entity_id: infoType._id,
    description: `Deleted info type ${infoType.type_name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get types by category
// @route   GET /api/v1/info-types/category/:category
// @access  Private
exports.getTypesByCategory = asyncHandler(async (req, res, next) => {
  const { category } = req.params;

  const types = await InfoType.find({ 
    type_category: category,
    is_active: true 
  }).sort({ display_order: 1, type_name: 1 });

  res.status(200).json({
    success: true,
    count: types.length,
    data: types
  });
});

// @desc    Get active types
// @route   GET /api/v1/info-types/active
// @access  Private
exports.getActiveTypes = asyncHandler(async (req, res, next) => {
  const types = await InfoType.getActiveTypes();

  res.status(200).json({
    success: true,
    count: types.length,
    data: types
  });
});

// @desc    Get default type
// @route   GET /api/v1/info-types/default
// @access  Private
exports.getDefaultType = asyncHandler(async (req, res, next) => {
  const defaultType = await InfoType.getDefaultType();

  if (!defaultType) {
    return next(
      new ErrorResponse('No default type found', 404)
    );
  }

  res.status(200).json({
    success: true,
    data: defaultType
  });
});

// @desc    Set default type
// @route   PUT /api/v1/info-types/:id/set-default
// @access  Private
exports.setDefaultType = asyncHandler(async (req, res, next) => {
  const infoType = await InfoType.findById(req.params.id);

  if (!infoType) {
    return next(
      new ErrorResponse(`Info type not found with id of ${req.params.id}`, 404)
    );
  }

  if (!infoType.is_active) {
    return next(
      new ErrorResponse('Cannot set inactive type as default', 400)
    );
  }

  // Remove default from all other types
  await InfoType.updateMany(
    { _id: { $ne: req.params.id } },
    { is_default: false, updated_by: req.user.id }
  );

  // Set this type as default
  infoType.is_default = true;
  infoType.updated_by = req.user.id;
  await infoType.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_type',
    entity_id: infoType._id,
    description: `Set ${infoType.type_name} as default type`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoType
  });
});

// @desc    Get types by request channel
// @route   GET /api/v1/info-types/channel/:channel
// @access  Private
exports.getTypesByChannel = asyncHandler(async (req, res, next) => {
  const { channel } = req.params;

  const types = await InfoType.find({ 
    request_channel: { $in: [channel] },
    is_active: true 
  }).sort({ display_order: 1, type_name: 1 });

  res.status(200).json({
    success: true,
    count: types.length,
    data: types
  });
});

// @desc    Get type statistics
// @route   GET /api/v1/info-types/statistics
// @access  Private
exports.getTypeStatistics = asyncHandler(async (req, res, next) => {
  const InfoProfile = require('../../models/info/InfoProfile');

  // Get type usage statistics
  const typeUsage = await InfoProfile.aggregate([
    {
      $group: {
        _id: '$info_type',
        count: { $sum: 1 },
        avg_priority: { $avg: '$priority' },
        avg_response_time: { $avg: '$response_time_hours' }
      }
    },
    {
      $lookup: {
        from: 'infotypes',
        localField: '_id',
        foreignField: '_id',
        as: 'type_info'
      }
    },
    {
      $unwind: '$type_info'
    },
    {
      $project: {
        type_name: '$type_info.type_name',
        type_category: '$type_info.type_category',
        count: 1,
        avg_priority: { $round: ['$avg_priority', 2] },
        avg_response_time: { $round: ['$avg_response_time', 2] }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get category statistics
  const categoryStats = await InfoType.aggregate([
    {
      $group: {
        _id: '$type_category',
        total_types: { $sum: 1 },
        active_types: {
          $sum: { $cond: ['$is_active', 1, 0] }
        },
        default_count: {
          $sum: { $cond: ['$is_default', 1, 0] }
        }
      }
    },
    { $sort: { total_types: -1 } }
  ]);

  // Get channel statistics
  const channelStats = await InfoType.aggregate([
    { $unwind: '$request_channel' },
    {
      $group: {
        _id: '$request_channel',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      type_usage: typeUsage,
      category_statistics: categoryStats,
      channel_statistics: channelStats,
      summary: {
        total_types: await InfoType.countDocuments(),
        active_types: await InfoType.countDocuments({ is_active: true }),
        inactive_types: await InfoType.countDocuments({ is_active: false }),
        default_type_exists: await InfoType.exists({ is_default: true }) !== null
      }
    }
  });
});

// @desc    Bulk update type order
// @route   PUT /api/v1/info-types/bulk-order
// @access  Private
exports.bulkUpdateTypeOrder = asyncHandler(async (req, res, next) => {
  const { type_orders } = req.body;

  if (!Array.isArray(type_orders)) {
    return next(
      new ErrorResponse('type_orders must be an array', 400)
    );
  }

  const bulkOps = type_orders.map(item => ({
    updateOne: {
      filter: { _id: item.type_id },
      update: { 
        display_order: item.display_order,
        updated_by: req.user.id
      }
    }
  }));

  const result = await InfoType.bulkWrite(bulkOps);

  // Log the bulk update activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'bulk_update',
    entity_type: 'info_type',
    description: `Updated display order for ${result.modifiedCount} types`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {
      modified_count: result.modifiedCount,
      matched_count: result.matchedCount
    }
  });
});

// @desc    Toggle type active state
// @route   PUT /api/v1/info-types/:id/toggle-active
// @access  Private
exports.toggleTypeActive = asyncHandler(async (req, res, next) => {
  const infoType = await InfoType.findById(req.params.id);

  if (!infoType) {
    return next(
      new ErrorResponse(`Info type not found with id of ${req.params.id}`, 404)
    );
  }

  // If deactivating the default type, prevent it
  if (infoType.is_default && infoType.is_active) {
    return next(
      new ErrorResponse('Cannot deactivate the default type', 400)
    );
  }

  // If deactivating, check if type is being used
  if (infoType.is_active) {
    const InfoProfile = require('../../models/info/InfoProfile');
    const profilesUsingType = await InfoProfile.countDocuments({ info_type: infoType._id });

    if (profilesUsingType > 0) {
      return next(
        new ErrorResponse(`Cannot deactivate type. It is being used by ${profilesUsingType} info profile(s)`, 400)
      );
    }
  }

  infoType.is_active = !infoType.is_active;
  infoType.updated_by = req.user.id;
  await infoType.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_type',
    entity_id: infoType._id,
    description: `${infoType.is_active ? 'Activated' : 'Deactivated'} type ${infoType.type_name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoType
  });
});

// @desc    Get type workflow
// @route   GET /api/v1/info-types/workflow
// @access  Private
exports.getTypeWorkflow = asyncHandler(async (req, res, next) => {
  const types = await InfoType.find({ is_active: true })
    .populate({
      path: 'default_sla_rule',
      select: 'rule_name response_time_hours'
    })
    .sort({ display_order: 1, type_name: 1 })
    .select('type_name type_category request_channel default_sla_rule display_order');

  // Group by category for workflow visualization
  const workflow = types.reduce((acc, type) => {
    if (!acc[type.type_category]) {
      acc[type.type_category] = [];
    }
    acc[type.type_category].push(type);
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      workflow: workflow,
      total_types: types.length
    }
  });
});

// @desc    Get types with SLA rules
// @route   GET /api/v1/info-types/with-sla
// @access  Private
exports.getTypesWithSla = asyncHandler(async (req, res, next) => {
  const types = await InfoType.find({ 
    is_active: true,
    default_sla_rule: { $exists: true, $ne: null }
  })
    .populate({
      path: 'default_sla_rule',
      select: 'rule_name response_time_hours escalation_levels'
    })
    .sort({ type_name: 1 });

  res.status(200).json({
    success: true,
    count: types.length,
    data: types
  });
});

// @desc    Update type SLA rule
// @route   PUT /api/v1/info-types/:id/sla-rule
// @access  Private
exports.updateTypeSlaRule = asyncHandler(async (req, res, next) => {
  const { sla_rule_id } = req.body;

  const infoType = await InfoType.findById(req.params.id);

  if (!infoType) {
    return next(
      new ErrorResponse(`Info type not found with id of ${req.params.id}`, 404)
    );
  }

  // Validate SLA rule exists
  if (sla_rule_id) {
    const InfoSlaRule = require('../../models/info/InfoSlaRule');
    const slaRule = await InfoSlaRule.findById(sla_rule_id);
    
    if (!slaRule) {
      return next(
        new ErrorResponse(`SLA rule not found with id of ${sla_rule_id}`, 404)
      );
    }

    if (!slaRule.is_active) {
      return next(
        new ErrorResponse('Cannot assign inactive SLA rule', 400)
      );
    }
  }

  infoType.default_sla_rule = sla_rule_id || null;
  infoType.updated_by = req.user.id;
  await infoType.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_type',
    entity_id: infoType._id,
    description: `Updated SLA rule for type ${infoType.type_name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoType
  });
});

// @desc    Get type performance metrics
// @route   GET /api/v1/info-types/:id/performance
// @access  Private
exports.getTypePerformance = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { start_date, end_date } = req.query;

  const infoType = await InfoType.findById(id);

  if (!infoType) {
    return next(
      new ErrorResponse(`Info type not found with id of ${id}`, 404)
    );
  }

  const InfoProfile = require('../../models/info/InfoProfile');
  
  const matchConditions = { info_type: id };
  
  if (start_date && end_date) {
    matchConditions.created_at = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  const performance = await InfoProfile.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        total_requests: { $sum: 1 },
        avg_response_time: { $avg: '$response_time_hours' },
        avg_priority: { $avg: '$priority' },
        completed_requests: {
          $sum: {
            $cond: [{ $eq: ['$status_category', 'Closed'] }, 1, 0]
          }
        },
        overdue_requests: {
          $sum: {
            $cond: [{ $eq: ['$sla_status.is_within_sla', false] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total_requests: 1,
        avg_response_time: { $round: ['$avg_response_time', 2] },
        avg_priority: { $round: ['$avg_priority', 2] },
        completed_requests: 1,
        overdue_requests: 1,
        completion_rate: {
          $multiply: [
            { $divide: ['$completed_requests', '$total_requests'] },
            100
          ]
        },
        sla_compliance_rate: {
          $multiply: [
            { 
              $divide: [
                { $subtract: ['$total_requests', '$overdue_requests'] },
                '$total_requests'
              ]
            },
            100
          ]
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      type_info: {
        type_name: infoType.type_name,
        type_category: infoType.type_category
      },
      performance: performance[0] || {
        total_requests: 0,
        avg_response_time: 0,
        avg_priority: 0,
        completed_requests: 0,
        overdue_requests: 0,
        completion_rate: 0,
        sla_compliance_rate: 0
      }
    }
  });
});