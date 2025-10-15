const mongoose = require('mongoose');

const SecurityAlertSchema = new mongoose.Schema({
  rule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SecurityRule',
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'investigating', 'resolved', 'false_positive'],
    default: 'active'
  },
  title: {
    type: String,
    required: [true, 'Alert title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Alert description is required'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  user_affected: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ip_address: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  device_info: {
    type: mongoose.Schema.Types.Mixed
  },
  actions_taken: [{
    type: String,
    enum: [
      'account_locked',
      'ip_blocked',
      'session_terminated',
      'admin_notified',
      '2fa_required',
      'password_reset_required',
      'device_blocked'
    ]
  }],
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolved_at: Date,
  resolution_notes: String
}, {
  timestamps: true
});

// Index for quick searches
SecurityAlertSchema.index({ status: 1, severity: 1, created_at: -1 });

// Method to resolve alert
SecurityAlertSchema.methods.resolve = async function(userId, notes) {
  this.status = 'resolved';
  this.resolved_by = userId;
  this.resolved_at = Date.now();
  this.resolution_notes = notes;
  await this.save();
};

// Method to mark as false positive
SecurityAlertSchema.methods.markFalsePositive = async function(userId, notes) {
  this.status = 'false_positive';
  this.resolved_by = userId;
  this.resolved_at = Date.now();
  this.resolution_notes = notes || 'Marked as false positive';
  await this.save();
};

module.exports = mongoose.model('SecurityAlert', SecurityAlertSchema);