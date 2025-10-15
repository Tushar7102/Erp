const mongoose = require('mongoose');

const SecurityLogSchema = new mongoose.Schema({
  event_type: {
    type: String,
    required: true,
    enum: [
      'rule_triggered',
      'rule_action_executed',
      'alert_generated',
      'alert_resolved',
      'security_setting_changed',
      'access_blocked',
      'suspicious_activity',
      'compliance_violation'
    ]
  },
  severity: {
    type: String,
    enum: ['info', 'low', 'medium', 'high', 'critical'],
    default: 'info'
  },
  source: {
    type: String,
    required: true,
    enum: [
      'security_rule',
      'auth_system',
      'device_registry',
      'user_activity',
      'system_monitor'
    ]
  },
  description: {
    type: String,
    required: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  related_rule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SecurityRule'
  },
  related_alert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SecurityAlert'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ip_address: String,
  location: String,
  device_info: mongoose.Schema.Types.Mixed,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
SecurityLogSchema.index({ event_type: 1, created_at: -1 });
SecurityLogSchema.index({ severity: 1, created_at: -1 });
SecurityLogSchema.index({ source: 1, created_at: -1 });
SecurityLogSchema.index({ user: 1, created_at: -1 });

// Static method to create standardized log entries
SecurityLogSchema.statics.logSecurityEvent = async function(eventData) {
  const {
    event_type,
    severity,
    source,
    description,
    details,
    related_rule,
    related_alert,
    user,
    ip_address,
    location,
    device_info,
    metadata
  } = eventData;

  return await this.create({
    event_type,
    severity,
    source,
    description,
    details,
    related_rule,
    related_alert,
    user,
    ip_address,
    location,
    device_info,
    metadata
  });
};

// Method to add additional metadata
SecurityLogSchema.methods.addMetadata = async function(key, value) {
  this.metadata[key] = value;
  await this.save();
};

module.exports = mongoose.model('SecurityLog', SecurityLogSchema);