const mongoose = require('mongoose');

const IntegrationConfigSchema = new mongoose.Schema({
  integration_config_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: INTG-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `INTG-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  integration_name: {
    type: String,
    required: [true, 'Integration name is required'],
    maxlength: [100, 'Integration name cannot exceed 100 characters']
  },
  integration_type: {
    type: String,
    enum: [
      'lead_source',
      'crm',
      'communication',
      'payment',
      'analytics',
      'marketing',
      'support',
      'social_media',
      'file_storage',
      'notification',
      'webhook',
      'api',
      'custom'
    ],
    required: [true, 'Integration type is required']
  },
  provider: {
    type: String,
    enum: [
      'justdial',
      'indiamart',
      'linkedin',
      'facebook',
      'google',
      'whatsapp_business',
      'twilio',
      'sendgrid',
      'razorpay',
      'paytm',
      'salesforce',
      'hubspot',
      'zoho',
      'slack',
      'teams',
      'zapier',
      'custom'
    ],
    required: [true, 'Provider is required']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'testing', 'error', 'suspended'],
    default: 'inactive'
  },
  environment: {
    type: String,
    enum: ['production', 'staging', 'development', 'testing'],
    default: 'development'
  },
  configuration: {
    api_endpoint: {
      type: String,
      required: function() {
        return this.integration_type === 'api' || this.integration_type === 'webhook';
      }
    },
    api_key: {
      type: String,
      required: function() {
        return ['justdial', 'indiamart', 'linkedin', 'sendgrid', 'twilio'].includes(this.provider);
      }
    },
    api_secret: {
      type: String
    },
    access_token: {
      type: String
    },
    refresh_token: {
      type: String
    },
    webhook_url: {
      type: String
    },
    webhook_secret: {
      type: String
    },
    client_id: {
      type: String
    },
    client_secret: {
      type: String
    },
    username: {
      type: String
    },
    password: {
      type: String
    },
    additional_params: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  authentication: {
    auth_type: {
      type: String,
      enum: ['api_key', 'oauth2', 'basic_auth', 'bearer_token', 'custom'],
      required: [true, 'Authentication type is required']
    },
    token_expiry: {
      type: Date
    },
    last_token_refresh: {
      type: Date
    },
    auto_refresh: {
      type: Boolean,
      default: true
    }
  },
  sync_settings: {
    sync_enabled: {
      type: Boolean,
      default: true
    },
    sync_frequency: {
      type: String,
      enum: ['real_time', 'every_5_minutes', 'every_15_minutes', 'hourly', 'daily', 'weekly', 'manual'],
      default: 'hourly'
    },
    last_sync: {
      type: Date
    },
    next_sync: {
      type: Date
    },
    sync_direction: {
      type: String,
      enum: ['inbound', 'outbound', 'bidirectional'],
      default: 'inbound'
    },
    batch_size: {
      type: Number,
      default: 100,
      min: 1,
      max: 1000
    }
  },
  field_mapping: [{
    source_field: {
      type: String,
      required: true
    },
    target_field: {
      type: String,
      required: true
    },
    field_type: {
      type: String,
      enum: ['string', 'number', 'date', 'boolean', 'array', 'object'],
      default: 'string'
    },
    transformation: {
      type: String,
      enum: ['none', 'uppercase', 'lowercase', 'trim', 'format_date', 'format_phone', 'custom']
    },
    default_value: mongoose.Schema.Types.Mixed,
    is_required: {
      type: Boolean,
      default: false
    }
  }],
  filters: {
    inbound_filters: [{
      field: String,
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in']
      },
      value: mongoose.Schema.Types.Mixed
    }],
    outbound_filters: [{
      field: String,
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in']
      },
      value: mongoose.Schema.Types.Mixed
    }]
  },
  rate_limiting: {
    requests_per_minute: {
      type: Number,
      default: 60
    },
    requests_per_hour: {
      type: Number,
      default: 1000
    },
    requests_per_day: {
      type: Number,
      default: 10000
    },
    current_usage: {
      minute: { type: Number, default: 0 },
      hour: { type: Number, default: 0 },
      day: { type: Number, default: 0 }
    },
    last_reset: {
      minute: Date,
      hour: Date,
      day: Date
    }
  },
  error_handling: {
    retry_attempts: {
      type: Number,
      default: 3,
      min: 0,
      max: 10
    },
    retry_delay: {
      type: Number,
      default: 5000, // milliseconds
      min: 1000,
      max: 60000
    },
    error_notification: {
      type: Boolean,
      default: true
    },
    error_email: {
      type: String
    },
    fallback_action: {
      type: String,
      enum: ['queue', 'discard', 'manual_review'],
      default: 'queue'
    }
  },
  monitoring: {
    health_check_enabled: {
      type: Boolean,
      default: true
    },
    health_check_interval: {
      type: Number,
      default: 300000 // 5 minutes in milliseconds
    },
    last_health_check: {
      type: Date
    },
    health_status: {
      type: String,
      enum: ['healthy', 'warning', 'critical', 'unknown'],
      default: 'unknown'
    },
    uptime_percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  statistics: {
    total_requests: {
      type: Number,
      default: 0
    },
    successful_requests: {
      type: Number,
      default: 0
    },
    failed_requests: {
      type: Number,
      default: 0
    },
    last_request_time: {
      type: Date
    },
    average_response_time: {
      type: Number,
      default: 0
    },
    data_synced: {
      enquiries_imported: { type: Number, default: 0 },
      enquiries_exported: { type: Number, default: 0 },
      last_import_count: { type: Number, default: 0 },
      last_export_count: { type: Number, default: 0 }
    }
  },
  notifications: {
    success_notifications: {
      type: Boolean,
      default: false
    },
    error_notifications: {
      type: Boolean,
      default: true
    },
    sync_notifications: {
      type: Boolean,
      default: true
    },
    notification_recipients: [String]
  },
  security: {
    ip_whitelist: [String],
    encryption_enabled: {
      type: Boolean,
      default: true
    },
    ssl_verification: {
      type: Boolean,
      default: true
    },
    data_retention_days: {
      type: Number,
      default: 90
    }
  },
  custom_settings: {
    type: mongoose.Schema.Types.Mixed
  },
  tags: [String],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to generate unique integration_config_id
IntegrationConfigSchema.pre('save', async function(next) {
  if (this.isNew && this.integration_config_id.includes('XXXX')) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the last integration config for today
    const lastConfig = await this.constructor.findOne({
      integration_config_id: new RegExp(`^INTG-${dateStr}-`)
    }).sort({ integration_config_id: -1 });
    
    let sequence = 1;
    if (lastConfig) {
      const lastSequence = parseInt(lastConfig.integration_config_id.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.integration_config_id = `INTG-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }
  
  // Update next sync time based on frequency
  if (this.sync_settings.sync_enabled && this.sync_settings.sync_frequency !== 'manual') {
    const now = new Date();
    const frequency = this.sync_settings.sync_frequency;
    
    switch (frequency) {
      case 'every_5_minutes':
        this.sync_settings.next_sync = new Date(now.getTime() + 5 * 60 * 1000);
        break;
      case 'every_15_minutes':
        this.sync_settings.next_sync = new Date(now.getTime() + 15 * 60 * 1000);
        break;
      case 'hourly':
        this.sync_settings.next_sync = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case 'daily':
        this.sync_settings.next_sync = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        this.sync_settings.next_sync = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
    }
  }
  
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
IntegrationConfigSchema.index({ provider: 1, status: 1 });
IntegrationConfigSchema.index({ integration_type: 1 });
IntegrationConfigSchema.index({ status: 1 });
IntegrationConfigSchema.index({ 'sync_settings.next_sync': 1 });
IntegrationConfigSchema.index({ created_by: 1 });
IntegrationConfigSchema.index({ integration_config_id: 1 });
IntegrationConfigSchema.index({ environment: 1 });

// Virtual for success rate
IntegrationConfigSchema.virtual('success_rate').get(function() {
  if (this.statistics.total_requests === 0) return 0;
  return ((this.statistics.successful_requests / this.statistics.total_requests) * 100).toFixed(2);
});

// Virtual for next sync display
IntegrationConfigSchema.virtual('next_sync_display').get(function() {
  if (!this.sync_settings.next_sync) return 'Not scheduled';
  return this.sync_settings.next_sync.toLocaleString();
});

// Method to test connection
IntegrationConfigSchema.methods.testConnection = async function() {
  // This would contain actual connection testing logic
  // For now, just update health status
  this.monitoring.last_health_check = new Date();
  this.monitoring.health_status = 'healthy'; // This would be determined by actual test
  return this.save();
};

// Method to update statistics
IntegrationConfigSchema.methods.updateStats = function(success, responseTime) {
  this.statistics.total_requests += 1;
  this.statistics.last_request_time = new Date();
  
  if (success) {
    this.statistics.successful_requests += 1;
  } else {
    this.statistics.failed_requests += 1;
  }
  
  // Update average response time
  const totalRequests = this.statistics.total_requests;
  const currentAvg = this.statistics.average_response_time;
  this.statistics.average_response_time = ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;
  
  return this.save();
};

// Method to reset rate limiting counters
IntegrationConfigSchema.methods.resetRateLimits = function() {
  const now = new Date();
  
  // Reset minute counter if more than a minute has passed
  if (!this.rate_limiting.last_reset.minute || 
      (now - this.rate_limiting.last_reset.minute) >= 60000) {
    this.rate_limiting.current_usage.minute = 0;
    this.rate_limiting.last_reset.minute = now;
  }
  
  // Reset hour counter if more than an hour has passed
  if (!this.rate_limiting.last_reset.hour || 
      (now - this.rate_limiting.last_reset.hour) >= 3600000) {
    this.rate_limiting.current_usage.hour = 0;
    this.rate_limiting.last_reset.hour = now;
  }
  
  // Reset day counter if more than a day has passed
  if (!this.rate_limiting.last_reset.day || 
      (now - this.rate_limiting.last_reset.day) >= 86400000) {
    this.rate_limiting.current_usage.day = 0;
    this.rate_limiting.last_reset.day = now;
  }
  
  return this.save();
};

// Method to check rate limits
IntegrationConfigSchema.methods.checkRateLimit = function() {
  this.resetRateLimits();
  
  return {
    minute: this.rate_limiting.current_usage.minute < this.rate_limiting.requests_per_minute,
    hour: this.rate_limiting.current_usage.hour < this.rate_limiting.requests_per_hour,
    day: this.rate_limiting.current_usage.day < this.rate_limiting.requests_per_day
  };
};

// Static method to get active integrations by type
IntegrationConfigSchema.statics.getActiveIntegrations = function(integrationType) {
  const query = { status: 'active' };
  if (integrationType) {
    query.integration_type = integrationType;
  }
  
  return this.find(query)
    .populate('created_by', 'name email')
    .populate('updated_by', 'name email')
    .sort({ integration_name: 1 });
};

// Static method to get integrations due for sync
IntegrationConfigSchema.statics.getIntegrationsDueForSync = function() {
  return this.find({
    status: 'active',
    'sync_settings.sync_enabled': true,
    'sync_settings.next_sync': { $lte: new Date() }
  });
};

// Static method to get integration analytics
IntegrationConfigSchema.statics.getIntegrationAnalytics = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        created_at: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: {
          provider: '$provider',
          type: '$integration_type',
          status: '$status'
        },
        count: { $sum: 1 },
        total_requests: { $sum: '$statistics.total_requests' },
        successful_requests: { $sum: '$statistics.successful_requests' },
        failed_requests: { $sum: '$statistics.failed_requests' },
        avg_response_time: { $avg: '$statistics.average_response_time' }
      }
    },
    {
      $project: {
        provider: '$_id.provider',
        integration_type: '$_id.type',
        status: '$_id.status',
        count: 1,
        total_requests: 1,
        success_rate: {
          $cond: [
            { $eq: ['$total_requests', 0] },
            0,
            { $multiply: [{ $divide: ['$successful_requests', '$total_requests'] }, 100] }
          ]
        },
        avg_response_time: 1
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

module.exports = mongoose.model('IntegrationConfig', IntegrationConfigSchema);