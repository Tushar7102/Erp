const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const SecurityRule = require('../../models/auth/SecurityRule');
const SecurityAlert = require('../../models/auth/SecurityAlert');
const SecurityLog = require('../../models/auth/SecurityLog');
const { getDeviceAndLocationInfo } = require('../../utils/deviceTracker');

// @desc    Get all security rules
// @route   GET /api/v1/security/rules
// @access  Private/Admin
exports.getSecurityRules = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single security rule
// @route   GET /api/v1/security/rules/:id
// @access  Private/Admin
exports.getSecurityRule = asyncHandler(async (req, res, next) => {
  const rule = await SecurityRule.findById(req.params.id);

  if (!rule) {
    return next(new ErrorResponse(`Rule not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: rule
  });
});

// @desc    Create new security rule
// @route   POST /api/v1/security/rules
// @access  Private/Admin
exports.createSecurityRule = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.created_by = req.user.id;

  const rule = await SecurityRule.create(req.body);

  // Log rule creation
  await SecurityLog.logSecurityEvent({
    event_type: 'security_setting_changed',
    severity: 'medium',
    source: 'security_rule',
    description: `New security rule created: ${rule.name}`,
    details: rule,
    user: req.user.id,
    metadata: {
      action: 'create_rule',
      rule_id: rule._id
    }
  });

  res.status(201).json({
    success: true,
    data: rule
  });
});

// @desc    Update security rule
// @route   PUT /api/v1/security/rules/:id
// @access  Private/Admin
exports.updateSecurityRule = asyncHandler(async (req, res, next) => {
  let rule = await SecurityRule.findById(req.params.id);

  if (!rule) {
    return next(new ErrorResponse(`Rule not found with id of ${req.params.id}`, 404));
  }

  // Add updater to req.body
  req.body.updated_by = req.user.id;

  rule = await SecurityRule.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log rule update
  await SecurityLog.logSecurityEvent({
    event_type: 'security_setting_changed',
    severity: 'medium',
    source: 'security_rule',
    description: `Security rule updated: ${rule.name}`,
    details: rule,
    user: req.user.id,
    metadata: {
      action: 'update_rule',
      rule_id: rule._id
    }
  });

  res.status(200).json({
    success: true,
    data: rule
  });
});

// @desc    Delete security rule
// @route   DELETE /api/v1/security/rules/:id
// @access  Private/Admin
exports.deleteSecurityRule = asyncHandler(async (req, res, next) => {
  const rule = await SecurityRule.findById(req.params.id);

  if (!rule) {
    return next(new ErrorResponse(`Rule not found with id of ${req.params.id}`, 404));
  }

  await rule.remove();

  // Log rule deletion
  await SecurityLog.logSecurityEvent({
    event_type: 'security_setting_changed',
    severity: 'high',
    source: 'security_rule',
    description: `Security rule deleted: ${rule.name}`,
    details: rule,
    user: req.user.id,
    metadata: {
      action: 'delete_rule',
      rule_id: rule._id
    }
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get all security alerts
// @route   GET /api/v1/security/alerts
// @access  Private/Admin
exports.getSecurityAlerts = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get active security alerts
// @route   GET /api/v1/security/alerts/active
// @access  Private/Admin
exports.getActiveAlerts = asyncHandler(async (req, res, next) => {
  const alerts = await SecurityAlert.find({ status: 'active' })
    .sort('-createdAt')
    .populate('rule user_affected resolved_by');

  res.status(200).json({
    success: true,
    count: alerts.length,
    data: alerts
  });
});

// @desc    Resolve security alert
// @route   PUT /api/v1/security/alerts/:id/resolve
// @access  Private/Admin
exports.resolveAlert = asyncHandler(async (req, res, next) => {
  const alert = await SecurityAlert.findById(req.params.id);

  if (!alert) {
    return next(new ErrorResponse(`Alert not found with id of ${req.params.id}`, 404));
  }

  await alert.resolve(req.user.id, req.body.resolution_notes);

  // Log alert resolution
  await SecurityLog.logSecurityEvent({
    event_type: 'alert_resolved',
    severity: alert.severity,
    source: 'security_rule',
    description: `Security alert resolved: ${alert.title}`,
    details: alert,
    related_alert: alert._id,
    user: req.user.id,
    metadata: {
      resolution_notes: req.body.resolution_notes
    }
  });

  res.status(200).json({
    success: true,
    data: alert
  });
});

// @desc    Get security logs
// @route   GET /api/v1/security/logs
// @access  Private/Admin
exports.getSecurityLogs = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get security dashboard stats
// @route   GET /api/v1/security/stats
// @access  Private/Admin
exports.getSecurityStats = asyncHandler(async (req, res, next) => {
  const activeRules = await SecurityRule.countDocuments({ status: 'active' });
  const activeAlerts = await SecurityAlert.countDocuments({ status: 'active' });
  const totalRules = await SecurityRule.countDocuments();
  
  // Get alerts by severity
  const alertsBySeverity = await SecurityAlert.aggregate([
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get most triggered rules
  const topRules = await SecurityRule.find()
    .sort('-triggers_count')
    .limit(5)
    .select('name triggers_count success_rate');

  res.status(200).json({
    success: true,
    data: {
      activeRules,
      activeAlerts,
      totalRules,
      alertsBySeverity,
      topRules
    }
  });
});

// @desc    Test security rule
// @route   POST /api/v1/security/rules/:id/test
// @access  Private/Admin
exports.testSecurityRule = asyncHandler(async (req, res, next) => {
  const rule = await SecurityRule.findById(req.params.id);

  if (!rule) {
    return next(new ErrorResponse(`Rule not found with id of ${req.params.id}`, 404));
  }

  // Get device and location info
  const deviceInfo = await getDeviceAndLocationInfo(req);

  // Create test alert
  const alert = await SecurityAlert.create({
    rule: rule._id,
    severity: rule.priority,
    title: `Test Alert: ${rule.name}`,
    description: `Test execution of security rule: ${rule.name}`,
    user_affected: req.user.id,
    ip_address: req.ip,
    location: deviceInfo.location,
    device_info: deviceInfo,
    actions_taken: ['test_execution']
  });

  // Log test execution
  await SecurityLog.logSecurityEvent({
    event_type: 'rule_triggered',
    severity: 'info',
    source: 'security_rule',
    description: `Test execution of security rule: ${rule.name}`,
    details: {
      rule,
      test_result: alert
    },
    related_rule: rule._id,
    related_alert: alert._id,
    user: req.user.id,
    ip_address: req.ip,
    location: deviceInfo.location,
    device_info: deviceInfo,
    metadata: {
      is_test: true
    }
  });

  res.status(200).json({
    success: true,
    data: {
      rule,
      alert
    }
  });
});

// @desc    Toggle security rule status
// @route   PUT /api/v1/security/rules/:id/toggle
// @access  Private/Admin
exports.toggleRuleStatus = asyncHandler(async (req, res, next) => {
  const rule = await SecurityRule.findById(req.params.id);

  if (!rule) {
    return next(new ErrorResponse(`Rule not found with id of ${req.params.id}`, 404));
  }

  // Toggle status between active and inactive
  rule.status = rule.status === 'active' ? 'inactive' : 'active';
  await rule.save();

  // Log status change
  await SecurityLog.logSecurityEvent({
    event_type: 'security_setting_changed',
    severity: 'medium',
    source: 'security_rule',
    description: `Security rule status changed to ${rule.status}: ${rule.name}`,
    details: rule,
    user: req.user.id,
    metadata: {
      action: 'toggle_rule_status',
      rule_id: rule._id,
      new_status: rule.status
    }
  });

  res.status(200).json({
    success: true,
    data: rule
  });
});