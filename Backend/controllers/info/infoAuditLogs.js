const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const InfoAuditLog = require('../../models/info/InfoAuditLog');
const UserActivityLog = require('../../models/profile/UserActivityLog');

// @desc    Get all info audit logs
// @route   GET /api/v1/info-audit-logs
// @access  Private
exports.getInfoAuditLogs = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single info audit log
// @route   GET /api/v1/info-audit-logs/:id
// @access  Private
exports.getInfoAuditLog = asyncHandler(async (req, res, next) => {
  const infoAuditLog = await InfoAuditLog.findById(req.params.id)
    .populate({
      path: 'user_id',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  if (!infoAuditLog) {
    return next(
      new ErrorResponse(`Info audit log not found with id of ${req.params.id}`, 404)
    );
  }

  // Log the view activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'view',
    entity_type: 'info_audit_log',
    entity_id: infoAuditLog._id,
    description: `Viewed info audit log ${infoAuditLog.audit_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoAuditLog
  });
});

// @desc    Create new info audit log
// @route   POST /api/v1/info-audit-logs
// @access  Private
exports.createInfoAuditLog = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.created_by = req.user.id;

  const infoAuditLog = await InfoAuditLog.create(req.body);

  res.status(201).json({
    success: true,
    data: infoAuditLog
  });
});

// @desc    Get audit logs by entity
// @route   GET /api/v1/info-audit-logs/entity/:entityType/:entityId
// @access  Private
exports.getAuditLogsByEntity = asyncHandler(async (req, res, next) => {
  const { entityType, entityId } = req.params;
  const { start_date, end_date } = req.query;

  const query = {
    entity_type: entityType,
    entity_id: entityId
  };

  if (start_date && end_date) {
    query.timestamp = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  const auditLogs = await InfoAuditLog.find(query)
    .populate({
      path: 'user_id',
      select: 'name email'
    })
    .sort({ timestamp: -1 });

  res.status(200).json({
    success: true,
    count: auditLogs.length,
    data: auditLogs
  });
});

// @desc    Get audit logs by user
// @route   GET /api/v1/info-audit-logs/user/:userId
// @access  Private
exports.getAuditLogsByUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { start_date, end_date, action_type } = req.query;

  const query = { user_id: userId };

  if (start_date && end_date) {
    query.timestamp = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  if (action_type) {
    query.action_type = action_type;
  }

  const auditLogs = await InfoAuditLog.find(query)
    .populate({
      path: 'user_id',
      select: 'name email'
    })
    .sort({ timestamp: -1 });

  res.status(200).json({
    success: true,
    count: auditLogs.length,
    data: auditLogs
  });
});

// @desc    Get audit logs by action type
// @route   GET /api/v1/info-audit-logs/action/:actionType
// @access  Private
exports.getAuditLogsByAction = asyncHandler(async (req, res, next) => {
  const { actionType } = req.params;
  const { start_date, end_date } = req.query;

  const query = { action_type: actionType };

  if (start_date && end_date) {
    query.timestamp = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  const auditLogs = await InfoAuditLog.find(query)
    .populate({
      path: 'user_id',
      select: 'name email'
    })
    .sort({ timestamp: -1 });

  res.status(200).json({
    success: true,
    count: auditLogs.length,
    data: auditLogs
  });
});

// @desc    Get high risk audit logs
// @route   GET /api/v1/info-audit-logs/high-risk
// @access  Private
exports.getHighRiskAuditLogs = asyncHandler(async (req, res, next) => {
  const { start_date, end_date } = req.query;

  const query = { 'risk_assessment.risk_level': 'High' };

  if (start_date && end_date) {
    query.timestamp = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  const highRiskLogs = await InfoAuditLog.find(query)
    .populate({
      path: 'user_id',
      select: 'name email'
    })
    .sort({ timestamp: -1 });

  res.status(200).json({
    success: true,
    count: highRiskLogs.length,
    data: highRiskLogs
  });
});

// @desc    Get audit statistics
// @route   GET /api/v1/info-audit-logs/statistics
// @access  Private
exports.getAuditStatistics = asyncHandler(async (req, res, next) => {
  const { start_date, end_date } = req.query;

  const matchConditions = {};
  
  if (start_date && end_date) {
    matchConditions.timestamp = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  const statistics = await InfoAuditLog.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        total_logs: { $sum: 1 },
        unique_users: { $addToSet: '$user_id' },
        unique_entities: { $addToSet: '$entity_id' },
        high_risk_count: {
          $sum: {
            $cond: [{ $eq: ['$risk_assessment.risk_level', 'High'] }, 1, 0]
          }
        },
        medium_risk_count: {
          $sum: {
            $cond: [{ $eq: ['$risk_assessment.risk_level', 'Medium'] }, 1, 0]
          }
        },
        low_risk_count: {
          $sum: {
            $cond: [{ $eq: ['$risk_assessment.risk_level', 'Low'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total_logs: 1,
        unique_users_count: { $size: '$unique_users' },
        unique_entities_count: { $size: '$unique_entities' },
        high_risk_count: 1,
        medium_risk_count: 1,
        low_risk_count: 1,
        high_risk_percentage: {
          $multiply: [
            { $divide: ['$high_risk_count', '$total_logs'] },
            100
          ]
        }
      }
    }
  ]);

  const actionTypeStats = await InfoAuditLog.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$action_type',
        count: { $sum: 1 },
        high_risk_count: {
          $sum: {
            $cond: [{ $eq: ['$risk_assessment.risk_level', 'High'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        action_type: '$_id',
        count: 1,
        high_risk_count: 1,
        risk_percentage: {
          $multiply: [
            { $divide: ['$high_risk_count', '$count'] },
            100
          ]
        }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const entityTypeStats = await InfoAuditLog.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$entity_type',
        count: { $sum: 1 },
        unique_entities: { $addToSet: '$entity_id' }
      }
    },
    {
      $project: {
        entity_type: '$_id',
        count: 1,
        unique_entities_count: { $size: '$unique_entities' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overall_statistics: statistics[0] || {
        total_logs: 0,
        unique_users_count: 0,
        unique_entities_count: 0,
        high_risk_count: 0,
        medium_risk_count: 0,
        low_risk_count: 0,
        high_risk_percentage: 0
      },
      action_type_statistics: actionTypeStats,
      entity_type_statistics: entityTypeStats
    }
  });
});

// @desc    Get audit timeline
// @route   GET /api/v1/info-audit-logs/timeline
// @access  Private
exports.getAuditTimeline = asyncHandler(async (req, res, next) => {
  const { entity_type, entity_id, period = 'daily' } = req.query;

  const matchConditions = {};
  
  if (entity_type) {
    matchConditions.entity_type = entity_type;
  }
  
  if (entity_id) {
    matchConditions.entity_id = entity_id;
  }

  let groupBy;
  switch (period) {
    case 'hourly':
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' },
        hour: { $hour: '$timestamp' }
      };
      break;
    case 'daily':
    default:
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' }
      };
      break;
    case 'weekly':
      groupBy = {
        year: { $year: '$timestamp' },
        week: { $week: '$timestamp' }
      };
      break;
    case 'monthly':
      groupBy = {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' }
      };
      break;
  }

  const timeline = await InfoAuditLog.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: groupBy,
        total_activities: { $sum: 1 },
        unique_users: { $addToSet: '$user_id' },
        action_types: { $addToSet: '$action_type' },
        high_risk_activities: {
          $sum: {
            $cond: [{ $eq: ['$risk_assessment.risk_level', 'High'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        period: '$_id',
        total_activities: 1,
        unique_users_count: { $size: '$unique_users' },
        unique_action_types: { $size: '$action_types' },
        high_risk_activities: 1
      }
    },
    { $sort: { 'period.year': 1, 'period.month': 1, 'period.day': 1, 'period.hour': 1, 'period.week': 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: timeline
  });
});

// @desc    Get compliance report
// @route   GET /api/v1/info-audit-logs/compliance-report
// @access  Private
exports.getComplianceReport = asyncHandler(async (req, res, next) => {
  const { start_date, end_date } = req.query;

  const matchConditions = {};
  
  if (start_date && end_date) {
    matchConditions.timestamp = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  // Get compliance violations
  const violations = await InfoAuditLog.find({
    ...matchConditions,
    'compliance_info.compliance_status': 'Violation'
  })
    .populate({
      path: 'user_id',
      select: 'name email'
    })
    .sort({ timestamp: -1 });

  // Get compliance statistics
  const complianceStats = await InfoAuditLog.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$compliance_info.compliance_status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get policy violations by type
  const policyViolations = await InfoAuditLog.aggregate([
    {
      $match: {
        ...matchConditions,
        'compliance_info.compliance_status': 'Violation'
      }
    },
    {
      $group: {
        _id: '$compliance_info.policy_reference',
        count: { $sum: 1 },
        recent_violation: { $max: '$timestamp' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      violations: violations,
      compliance_statistics: complianceStats,
      policy_violations: policyViolations,
      summary: {
        total_violations: violations.length,
        compliance_rate: complianceStats.length > 0 ? 
          ((complianceStats.find(s => s._id === 'Compliant')?.count || 0) / 
           complianceStats.reduce((sum, s) => sum + s.count, 0) * 100).toFixed(2) : 0
      }
    }
  });
});

// @desc    Export audit logs
// @route   GET /api/v1/info-audit-logs/export
// @access  Private
exports.exportAuditLogs = asyncHandler(async (req, res, next) => {
  const { start_date, end_date, format = 'json', entity_type, action_type } = req.query;

  const matchConditions = {};
  
  if (start_date && end_date) {
    matchConditions.timestamp = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  if (entity_type) {
    matchConditions.entity_type = entity_type;
  }

  if (action_type) {
    matchConditions.action_type = action_type;
  }

  const auditLogs = await InfoAuditLog.find(matchConditions)
    .populate({
      path: 'user_id',
      select: 'name email'
    })
    .sort({ timestamp: -1 });

  // Log the export activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'export',
    entity_type: 'info_audit_log',
    description: `Exported ${auditLogs.length} audit logs`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  if (format === 'csv') {
    // Convert to CSV format
    const csvData = auditLogs.map(log => ({
      audit_id: log.audit_id,
      timestamp: log.timestamp,
      user_name: log.user_id?.name || 'Unknown',
      user_email: log.user_id?.email || 'Unknown',
      action_type: log.action_type,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      description: log.description,
      risk_level: log.risk_assessment?.risk_level || 'Unknown',
      compliance_status: log.compliance_info?.compliance_status || 'Unknown'
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit_logs.csv"');
    
    // Simple CSV conversion (in production, use a proper CSV library)
    const csvHeaders = Object.keys(csvData[0] || {}).join(',');
    const csvRows = csvData.map(row => Object.values(row).join(','));
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    res.send(csvContent);
  } else {
    res.status(200).json({
      success: true,
      count: auditLogs.length,
      data: auditLogs
    });
  }
});

// @desc    Delete old audit logs
// @route   DELETE /api/v1/info-audit-logs/cleanup
// @access  Private
exports.cleanupOldAuditLogs = asyncHandler(async (req, res, next) => {
  const { days_old = 365 } = req.query;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(days_old));

  const result = await InfoAuditLog.deleteMany({
    timestamp: { $lt: cutoffDate }
  });

  // Log the cleanup activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'info_audit_log',
    description: `Cleaned up ${result.deletedCount} old audit logs (older than ${days_old} days)`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {
      deleted_count: result.deletedCount,
      cutoff_date: cutoffDate,
      message: `Successfully deleted ${result.deletedCount} audit logs older than ${days_old} days`
    }
  });
});