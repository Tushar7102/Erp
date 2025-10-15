const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const IntegrationConfig = require('../../models/enquiry/IntegrationConfig');

// @desc    Get all integration configs
// @route   GET /api/v1/integration-configs
// @access  Private
exports.getIntegrationConfigs = asyncHandler(async (req, res, next) => {
  const { 
    integration_type, 
    provider, 
    status, 
    page = 1, 
    limit = 10 
  } = req.query;

  let filter = {};
  
  if (integration_type) filter.integration_type = integration_type;
  if (provider) filter.provider = provider;
  if (status) filter.status = status;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { created_at: -1 }
  };

  const integrationConfigs = await IntegrationConfig.paginate(filter, options);

  res.status(200).json({
    success: true,
    data: integrationConfigs
  });
});

// @desc    Get integration config by ID
// @route   GET /api/v1/integration-configs/:id
// @access  Private
exports.getIntegrationConfigById = asyncHandler(async (req, res, next) => {
  const integrationConfig = await IntegrationConfig.findById(req.params.id);

  if (!integrationConfig) {
    return next(new ErrorResponse('Integration config not found', 404));
  }

  res.status(200).json({
    success: true,
    data: integrationConfig
  });
});

// @desc    Create integration config
// @route   POST /api/v1/integration-configs
// @access  Private (Admin only)
exports.createIntegrationConfig = asyncHandler(async (req, res, next) => {
  const { 
    name, 
    integration_type, 
    provider, 
    config_data,
    sync_settings,
    rate_limit_settings,
    metadata 
  } = req.body;

  // Only admin can create integration configs
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to create integration configs', 403));
  }

  const integrationConfig = await IntegrationConfig.create({
    name,
    integration_type,
    provider,
    config_data,
    sync_settings,
    rate_limit_settings,
    metadata: {
      ...metadata,
      created_by: req.user.id,
      user_agent: req.get('User-Agent'),
      ip_address: req.ip
    }
  });

  res.status(201).json({
    success: true,
    data: integrationConfig
  });
});

// @desc    Update integration config
// @route   PUT /api/v1/integration-configs/:id
// @access  Private (Admin only)
exports.updateIntegrationConfig = asyncHandler(async (req, res, next) => {
  let integrationConfig = await IntegrationConfig.findById(req.params.id);

  if (!integrationConfig) {
    return next(new ErrorResponse('Integration config not found', 404));
  }

  // Only admin can update integration configs
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update integration configs', 403));
  }

  const allowedUpdates = [
    'name', 'config_data', 'sync_settings', 'rate_limit_settings', 
    'status', 'metadata'
  ];
  const updates = {};
  
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Update last_modified timestamp
  updates.last_modified = new Date();

  integrationConfig = await IntegrationConfig.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: integrationConfig
  });
});

// @desc    Test integration connection
// @route   POST /api/v1/integration-configs/:id/test
// @access  Private (Admin only)
exports.testConnection = asyncHandler(async (req, res, next) => {
  const integrationConfig = await IntegrationConfig.findById(req.params.id);

  if (!integrationConfig) {
    return next(new ErrorResponse('Integration config not found', 404));
  }

  // Only admin can test connections
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to test integration connections', 403));
  }

  try {
    const testResult = await integrationConfig.testConnection();
    
    res.status(200).json({
      success: true,
      data: testResult
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      error: error.message,
      data: {
        connection_status: 'failed',
        error_message: error.message,
        tested_at: new Date()
      }
    });
  }
});

// @desc    Enable integration
// @route   PATCH /api/v1/integration-configs/:id/enable
// @access  Private (Admin only)
exports.enableIntegration = asyncHandler(async (req, res, next) => {
  const integrationConfig = await IntegrationConfig.findById(req.params.id);

  if (!integrationConfig) {
    return next(new ErrorResponse('Integration config not found', 404));
  }

  // Only admin can enable/disable integrations
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to modify integration status', 403));
  }

  integrationConfig.status = 'active';
  integrationConfig.last_modified = new Date();
  await integrationConfig.save();

  res.status(200).json({
    success: true,
    data: integrationConfig
  });
});

// @desc    Disable integration
// @route   PATCH /api/v1/integration-configs/:id/disable
// @access  Private (Admin only)
exports.disableIntegration = asyncHandler(async (req, res, next) => {
  const integrationConfig = await IntegrationConfig.findById(req.params.id);

  if (!integrationConfig) {
    return next(new ErrorResponse('Integration config not found', 404));
  }

  // Only admin can enable/disable integrations
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to modify integration status', 403));
  }

  integrationConfig.status = 'inactive';
  integrationConfig.last_modified = new Date();
  await integrationConfig.save();

  res.status(200).json({
    success: true,
    data: integrationConfig
  });
});

// @desc    Update sync statistics
// @route   PATCH /api/v1/integration-configs/:id/sync-stats
// @access  Private
exports.updateSyncStats = asyncHandler(async (req, res, next) => {
  const { success_count, error_count, last_error } = req.body;

  const integrationConfig = await IntegrationConfig.findById(req.params.id);

  if (!integrationConfig) {
    return next(new ErrorResponse('Integration config not found', 404));
  }

  await integrationConfig.updateSyncStats(success_count, error_count, last_error);

  res.status(200).json({
    success: true,
    data: integrationConfig
  });
});

// @desc    Reset rate limit
// @route   PATCH /api/v1/integration-configs/:id/reset-rate-limit
// @access  Private (Admin only)
exports.resetRateLimit = asyncHandler(async (req, res, next) => {
  const integrationConfig = await IntegrationConfig.findById(req.params.id);

  if (!integrationConfig) {
    return next(new ErrorResponse('Integration config not found', 404));
  }

  // Only admin can reset rate limits
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to reset rate limits', 403));
  }

  await integrationConfig.resetRateLimit();

  res.status(200).json({
    success: true,
    data: integrationConfig
  });
});

// @desc    Check rate limit
// @route   GET /api/v1/integration-configs/:id/rate-limit-status
// @access  Private
exports.checkRateLimit = asyncHandler(async (req, res, next) => {
  const integrationConfig = await IntegrationConfig.findById(req.params.id);

  if (!integrationConfig) {
    return next(new ErrorResponse('Integration config not found', 404));
  }

  const isLimited = await integrationConfig.checkRateLimit();

  res.status(200).json({
    success: true,
    data: {
      is_rate_limited: isLimited,
      current_requests: integrationConfig.rate_limit_stats.current_requests,
      limit: integrationConfig.rate_limit_settings.requests_per_hour,
      reset_time: integrationConfig.rate_limit_stats.window_start
    }
  });
});

// @desc    Get active integrations
// @route   GET /api/v1/integration-configs/active
// @access  Private
exports.getActiveIntegrations = asyncHandler(async (req, res, next) => {
  const { integration_type } = req.query;

  const activeIntegrations = await IntegrationConfig.getActiveIntegrations(integration_type);

  res.status(200).json({
    success: true,
    data: activeIntegrations
  });
});

// @desc    Get integrations due for sync
// @route   GET /api/v1/integration-configs/due-for-sync
// @access  Private
exports.getIntegrationsDueForSync = asyncHandler(async (req, res, next) => {
  const integrationsDue = await IntegrationConfig.getIntegrationsDueForSync();

  res.status(200).json({
    success: true,
    data: integrationsDue
  });
});

// @desc    Get integration analytics
// @route   GET /api/v1/integration-configs/analytics
// @access  Private
exports.getIntegrationAnalytics = asyncHandler(async (req, res, next) => {
  const { start_date, end_date, integration_type } = req.query;

  const analytics = await IntegrationConfig.getIntegrationAnalytics(
    start_date, 
    end_date, 
    integration_type
  );

  res.status(200).json({
    success: true,
    data: analytics
  });
});

// @desc    Trigger manual sync
// @route   POST /api/v1/integration-configs/:id/sync
// @access  Private (Admin only)
exports.triggerManualSync = asyncHandler(async (req, res, next) => {
  const integrationConfig = await IntegrationConfig.findById(req.params.id);

  if (!integrationConfig) {
    return next(new ErrorResponse('Integration config not found', 404));
  }

  // Only admin can trigger manual sync
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to trigger manual sync', 403));
  }

  if (integrationConfig.status !== 'active') {
    return next(new ErrorResponse('Integration must be active to sync', 400));
  }

  // Check rate limit
  const isRateLimited = await integrationConfig.checkRateLimit();
  if (isRateLimited) {
    return next(new ErrorResponse('Rate limit exceeded. Please try again later.', 429));
  }

  // Update last sync attempt
  integrationConfig.sync_stats.last_sync_attempt = new Date();
  await integrationConfig.save();

  // Here you would typically trigger the actual sync process
  // For now, we'll just return a success response
  res.status(200).json({
    success: true,
    message: 'Manual sync triggered successfully',
    data: {
      integration_id: integrationConfig._id,
      sync_triggered_at: new Date()
    }
  });
});

// @desc    Get integration logs
// @route   GET /api/v1/integration-configs/:id/logs
// @access  Private
exports.getIntegrationLogs = asyncHandler(async (req, res, next) => {
  const { limit = 50, level } = req.query;

  const integrationConfig = await IntegrationConfig.findById(req.params.id);

  if (!integrationConfig) {
    return next(new ErrorResponse('Integration config not found', 404));
  }

  // Filter logs by level if specified
  let logs = integrationConfig.sync_stats.error_logs || [];
  
  if (level) {
    logs = logs.filter(log => log.level === level);
  }

  // Sort by timestamp (newest first) and limit
  logs = logs
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, parseInt(limit));

  res.status(200).json({
    success: true,
    data: logs
  });
});

// @desc    Export integration config
// @route   GET /api/v1/integration-configs/:id/export
// @access  Private (Admin only)
exports.exportIntegrationConfig = asyncHandler(async (req, res, next) => {
  const integrationConfig = await IntegrationConfig.findById(req.params.id);

  if (!integrationConfig) {
    return next(new ErrorResponse('Integration config not found', 404));
  }

  // Only admin can export configs
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to export integration configs', 403));
  }

  // Remove sensitive data before export
  const exportData = {
    name: integrationConfig.name,
    integration_type: integrationConfig.integration_type,
    provider: integrationConfig.provider,
    sync_settings: integrationConfig.sync_settings,
    rate_limit_settings: integrationConfig.rate_limit_settings,
    status: integrationConfig.status,
    created_at: integrationConfig.created_at
  };

  res.status(200).json({
    success: true,
    data: exportData
  });
});

// @desc    Clone integration config
// @route   POST /api/v1/integration-configs/:id/clone
// @access  Private (Admin only)
exports.cloneIntegrationConfig = asyncHandler(async (req, res, next) => {
  const { new_name } = req.body;

  const originalConfig = await IntegrationConfig.findById(req.params.id);

  if (!originalConfig) {
    return next(new ErrorResponse('Integration config not found', 404));
  }

  // Only admin can clone configs
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to clone integration configs', 403));
  }

  if (!new_name) {
    return next(new ErrorResponse('New name is required for cloning', 400));
  }

  const clonedConfig = await IntegrationConfig.create({
    name: new_name,
    integration_type: originalConfig.integration_type,
    provider: originalConfig.provider,
    config_data: originalConfig.config_data,
    sync_settings: originalConfig.sync_settings,
    rate_limit_settings: originalConfig.rate_limit_settings,
    status: 'inactive', // Start as inactive
    metadata: {
      cloned_from: originalConfig._id,
      created_by: req.user.id,
      user_agent: req.get('User-Agent'),
      ip_address: req.ip
    }
  });

  res.status(201).json({
    success: true,
    data: clonedConfig
  });
});

// @desc    Delete integration config
// @route   DELETE /api/v1/integration-configs/:id
// @access  Private (Admin only)
exports.deleteIntegrationConfig = asyncHandler(async (req, res, next) => {
  const integrationConfig = await IntegrationConfig.findById(req.params.id);

  if (!integrationConfig) {
    return next(new ErrorResponse('Integration config not found', 404));
  }

  // Only admin can delete integration configs
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete integration configs', 403));
  }

  // Check if integration is currently active
  if (integrationConfig.status === 'active') {
    return next(new ErrorResponse('Cannot delete active integration. Please disable it first.', 400));
  }

  // Check if there are any dependent configurations
  const dependentConfigs = await IntegrationConfig.find({
    'dependencies.config_id': req.params.id
  });

  if (dependentConfigs.length > 0) {
    return next(new ErrorResponse('Cannot delete integration config with dependencies', 400));
  }

  await integrationConfig.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Sync data with external system
// @route   POST /api/v1/integration-configs/:id/sync
// @access  Private (Admin)
exports.syncData = asyncHandler(async (req, res, next) => {
  const integrationConfig = await IntegrationConfig.findById(req.params.id);

  if (!integrationConfig) {
    return next(new ErrorResponse('Integration config not found', 404));
  }

  if (integrationConfig.status !== 'active') {
    return next(new ErrorResponse('Integration is not active', 400));
  }

  // Update last sync attempt
  integrationConfig.last_sync_attempt = new Date();
  
  try {
    // Here you would implement the actual sync logic based on integration type
    // For now, we'll just simulate a successful sync
    
    integrationConfig.last_sync_success = new Date();
    integrationConfig.sync_stats.successful_syncs += 1;
    
    await integrationConfig.save();

    res.status(200).json({
      success: true,
      message: 'Data sync initiated successfully',
      data: integrationConfig
    });
  } catch (error) {
    integrationConfig.sync_stats.failed_syncs += 1;
    integrationConfig.last_error = error.message;
    await integrationConfig.save();
    
    return next(new ErrorResponse('Sync failed: ' + error.message, 500));
  }
});

// @desc    Get available integrations
// @route   GET /api/v1/integration-configs/available
// @access  Private (Admin)
exports.getAvailableIntegrations = asyncHandler(async (req, res, next) => {
  const availableIntegrations = [
    {
      type: 'crm',
      providers: ['salesforce', 'hubspot', 'pipedrive', 'zoho'],
      description: 'Customer Relationship Management systems'
    },
    {
      type: 'email',
      providers: ['mailchimp', 'sendgrid', 'mailgun', 'ses'],
      description: 'Email marketing and delivery services'
    },
    {
      type: 'sms',
      providers: ['twilio', 'nexmo', 'textlocal', 'msg91'],
      description: 'SMS and messaging services'
    },
    {
      type: 'analytics',
      providers: ['google_analytics', 'mixpanel', 'amplitude'],
      description: 'Analytics and tracking services'
    },
    {
      type: 'payment',
      providers: ['stripe', 'paypal', 'razorpay', 'payu'],
      description: 'Payment processing services'
    }
  ];

  res.status(200).json({
    success: true,
    data: availableIntegrations
  });
});

// @desc    Export integration configs
// @route   GET /api/v1/integration-configs/export
// @access  Private (Admin)
exports.exportIntegrationConfigs = asyncHandler(async (req, res, next) => {
  const { integration_type, provider, status } = req.query;

  let filter = {};
  
  if (integration_type) filter.integration_type = integration_type;
  if (provider) filter.provider = provider;
  if (status) filter.status = status;

  const integrationConfigs = await IntegrationConfig.find(filter)
    .select('-config.credentials') // Exclude sensitive credentials
    .sort({ created_at: -1 });

  res.status(200).json({
    success: true,
    count: integrationConfigs.length,
    data: integrationConfigs
  });
});
