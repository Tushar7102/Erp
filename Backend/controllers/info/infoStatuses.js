const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const InfoStatus = require('../../models/info/InfoStatus');
const UserActivityLog = require('../../models/profile/UserActivityLog');

// @desc    Get all info statuses
// @route   GET /api/v1/info-statuses
// @access  Private
exports.getInfoStatuses = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single info status
// @route   GET /api/v1/info-statuses/:id
// @access  Private
exports.getInfoStatus = asyncHandler(async (req, res, next) => {
  const infoStatus = await InfoStatus.findById(req.params.id)
    .populate({
      path: 'created_by',
      select: 'name email'
    })
    .populate({
      path: 'updated_by',
      select: 'name email'
    });

  if (!infoStatus) {
    return next(
      new ErrorResponse(`Info status not found with id of ${req.params.id}`, 404)
    );
  }

  // Log the view activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'view',
    entity_type: 'info_status',
    entity_id: infoStatus._id,
    description: `Viewed info status ${infoStatus.status_name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoStatus
  });
});

// @desc    Create new info status
// @route   POST /api/v1/info-statuses
// @access  Private
exports.createInfoStatus = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.created_by = req.user.id;

  const infoStatus = await InfoStatus.create(req.body);

  // Log the creation activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'create',
    entity_type: 'info_status',
    entity_id: infoStatus._id,
    description: `Created info status ${infoStatus.status_name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: infoStatus
  });
});

// @desc    Update info status
// @route   PUT /api/v1/info-statuses/:id
// @access  Private
exports.updateInfoStatus = asyncHandler(async (req, res, next) => {
  let infoStatus = await InfoStatus.findById(req.params.id);

  if (!infoStatus) {
    return next(
      new ErrorResponse(`Info status not found with id of ${req.params.id}`, 404)
    );
  }

  // Add user to req.body
  req.body.updated_by = req.user.id;

  infoStatus = await InfoStatus.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log the update activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_status',
    entity_id: infoStatus._id,
    description: `Updated info status ${infoStatus.status_name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoStatus
  });
});

// @desc    Delete info status
// @route   DELETE /api/v1/info-statuses/:id
// @access  Private
exports.deleteInfoStatus = asyncHandler(async (req, res, next) => {
  const infoStatus = await InfoStatus.findById(req.params.id);

  if (!infoStatus) {
    return next(
      new ErrorResponse(`Info status not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if status is being used by any info profiles
  const InfoProfile = require('../../models/info/InfoProfile');
  const profilesUsingStatus = await InfoProfile.countDocuments({ status: infoStatus._id });

  if (profilesUsingStatus > 0) {
    return next(
      new ErrorResponse(`Cannot delete status. It is being used by ${profilesUsingStatus} info profile(s)`, 400)
    );
  }

  await infoStatus.deleteOne();

  // Log the deletion activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'info_status',
    entity_id: infoStatus._id,
    description: `Deleted info status ${infoStatus.status_name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get statuses by category
// @route   GET /api/v1/info-statuses/category/:category
// @access  Private
exports.getStatusesByCategory = asyncHandler(async (req, res, next) => {
  const { category } = req.params;

  const statuses = await InfoStatus.find({ 
    status_category: category,
    is_active: true 
  }).sort({ display_order: 1, status_name: 1 });

  res.status(200).json({
    success: true,
    count: statuses.length,
    data: statuses
  });
});

// @desc    Get active statuses
// @route   GET /api/v1/info-statuses/active
// @access  Private
exports.getActiveStatuses = asyncHandler(async (req, res, next) => {
  const statuses = await InfoStatus.getActiveStatuses();

  res.status(200).json({
    success: true,
    count: statuses.length,
    data: statuses
  });
});

// @desc    Get default status
// @route   GET /api/v1/info-statuses/default
// @access  Private
exports.getDefaultStatus = asyncHandler(async (req, res, next) => {
  const defaultStatus = await InfoStatus.getDefaultStatus();

  if (!defaultStatus) {
    return next(
      new ErrorResponse('No default status found', 404)
    );
  }

  res.status(200).json({
    success: true,
    data: defaultStatus
  });
});

// @desc    Set default status
// @route   PUT /api/v1/info-statuses/:id/set-default
// @access  Private
exports.setDefaultStatus = asyncHandler(async (req, res, next) => {
  const infoStatus = await InfoStatus.findById(req.params.id);

  if (!infoStatus) {
    return next(
      new ErrorResponse(`Info status not found with id of ${req.params.id}`, 404)
    );
  }

  if (!infoStatus.is_active) {
    return next(
      new ErrorResponse('Cannot set inactive status as default', 400)
    );
  }

  // Remove default from all other statuses
  await InfoStatus.updateMany(
    { _id: { $ne: req.params.id } },
    { is_default: false, updated_by: req.user.id }
  );

  // Set this status as default
  infoStatus.is_default = true;
  infoStatus.updated_by = req.user.id;
  await infoStatus.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_status',
    entity_id: infoStatus._id,
    description: `Set ${infoStatus.status_name} as default status`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoStatus
  });
});

// @desc    Get statuses with SLA impact
// @route   GET /api/v1/info-statuses/sla-impact/:impact
// @access  Private
exports.getStatusesBySlaImpact = asyncHandler(async (req, res, next) => {
  const { impact } = req.params;

  const statuses = await InfoStatus.find({ 
    sla_impact: impact,
    is_active: true 
  }).sort({ display_order: 1, status_name: 1 });

  res.status(200).json({
    success: true,
    count: statuses.length,
    data: statuses
  });
});

// @desc    Get status statistics
// @route   GET /api/v1/info-statuses/statistics
// @access  Private
exports.getStatusStatistics = asyncHandler(async (req, res, next) => {
  const InfoProfile = require('../../models/info/InfoProfile');

  // Get status usage statistics
  const statusUsage = await InfoProfile.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avg_priority: { $avg: '$priority' }
      }
    },
    {
      $lookup: {
        from: 'infostatuses',
        localField: '_id',
        foreignField: '_id',
        as: 'status_info'
      }
    },
    {
      $unwind: '$status_info'
    },
    {
      $project: {
        status_name: '$status_info.status_name',
        status_category: '$status_info.status_category',
        sla_impact: '$status_info.sla_impact',
        count: 1,
        avg_priority: { $round: ['$avg_priority', 2] }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get category statistics
  const categoryStats = await InfoStatus.aggregate([
    {
      $group: {
        _id: '$status_category',
        total_statuses: { $sum: 1 },
        active_statuses: {
          $sum: { $cond: ['$is_active', 1, 0] }
        },
        default_count: {
          $sum: { $cond: ['$is_default', 1, 0] }
        }
      }
    },
    { $sort: { total_statuses: -1 } }
  ]);

  // Get SLA impact statistics
  const slaImpactStats = await InfoStatus.aggregate([
    {
      $group: {
        _id: '$sla_impact',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      status_usage: statusUsage,
      category_statistics: categoryStats,
      sla_impact_statistics: slaImpactStats,
      summary: {
        total_statuses: await InfoStatus.countDocuments(),
        active_statuses: await InfoStatus.countDocuments({ is_active: true }),
        inactive_statuses: await InfoStatus.countDocuments({ is_active: false }),
        default_status_exists: await InfoStatus.exists({ is_default: true }) !== null
      }
    }
  });
});

// @desc    Bulk update status order
// @route   PUT /api/v1/info-statuses/bulk-order
// @access  Private
exports.bulkUpdateStatusOrder = asyncHandler(async (req, res, next) => {
  const { status_orders } = req.body;

  if (!Array.isArray(status_orders)) {
    return next(
      new ErrorResponse('status_orders must be an array', 400)
    );
  }

  const bulkOps = status_orders.map(item => ({
    updateOne: {
      filter: { _id: item.status_id },
      update: { 
        display_order: item.display_order,
        updated_by: req.user.id
      }
    }
  }));

  const result = await InfoStatus.bulkWrite(bulkOps);

  // Log the bulk update activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'bulk_update',
    entity_type: 'info_status',
    description: `Updated display order for ${result.modifiedCount} statuses`,
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

// @desc    Toggle status active state
// @route   PUT /api/v1/info-statuses/:id/toggle-active
// @access  Private
exports.toggleStatusActive = asyncHandler(async (req, res, next) => {
  const infoStatus = await InfoStatus.findById(req.params.id);

  if (!infoStatus) {
    return next(
      new ErrorResponse(`Info status not found with id of ${req.params.id}`, 404)
    );
  }

  // If deactivating the default status, prevent it
  if (infoStatus.is_default && infoStatus.is_active) {
    return next(
      new ErrorResponse('Cannot deactivate the default status', 400)
    );
  }

  // If deactivating, check if status is being used
  if (infoStatus.is_active) {
    const InfoProfile = require('../../models/info/InfoProfile');
    const profilesUsingStatus = await InfoProfile.countDocuments({ status: infoStatus._id });

    if (profilesUsingStatus > 0) {
      return next(
        new ErrorResponse(`Cannot deactivate status. It is being used by ${profilesUsingStatus} info profile(s)`, 400)
      );
    }
  }

  infoStatus.is_active = !infoStatus.is_active;
  infoStatus.updated_by = req.user.id;
  await infoStatus.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_status',
    entity_id: infoStatus._id,
    description: `${infoStatus.is_active ? 'Activated' : 'Deactivated'} status ${infoStatus.status_name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoStatus
  });
});

// @desc    Get status workflow
// @route   GET /api/v1/info-statuses/workflow
// @access  Private
exports.getStatusWorkflow = asyncHandler(async (req, res, next) => {
  const statuses = await InfoStatus.find({ is_active: true })
    .sort({ display_order: 1, status_name: 1 })
    .select('status_name status_category sla_impact display_order color_code');

  // Group by category for workflow visualization
  const workflow = statuses.reduce((acc, status) => {
    if (!acc[status.status_category]) {
      acc[status.status_category] = [];
    }
    acc[status.status_category].push(status);
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      workflow: workflow,
      total_statuses: statuses.length
    }
  });
});

// @desc    Validate status transitions
// @route   POST /api/v1/info-statuses/validate-transition
// @access  Private
exports.validateStatusTransition = asyncHandler(async (req, res, next) => {
  const { from_status_id, to_status_id } = req.body;

  const fromStatus = await InfoStatus.findById(from_status_id);
  const toStatus = await InfoStatus.findById(to_status_id);

  if (!fromStatus || !toStatus) {
    return next(
      new ErrorResponse('Invalid status IDs provided', 400)
    );
  }

  // Basic validation rules
  const validationRules = {
    can_transition: true,
    warnings: [],
    restrictions: []
  };

  // Check if both statuses are active
  if (!fromStatus.is_active || !toStatus.is_active) {
    validationRules.can_transition = false;
    validationRules.restrictions.push('Cannot transition to/from inactive status');
  }

  // Check SLA impact transitions
  if (fromStatus.sla_impact === 'Critical' && toStatus.sla_impact === 'None') {
    validationRules.warnings.push('Transitioning from Critical to No SLA impact - ensure proper approval');
  }

  // Check category transitions
  if (fromStatus.status_category === 'Closed' && toStatus.status_category !== 'Closed') {
    validationRules.warnings.push('Reopening a closed item - consider creating a new request instead');
  }

  res.status(200).json({
    success: true,
    data: {
      from_status: fromStatus.status_name,
      to_status: toStatus.status_name,
      validation: validationRules
    }
  });
});