const mongoose = require('mongoose');

const SecurityRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Rule name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  type: {
    type: String,
    required: [true, 'Rule type is required'],
    enum: [
      'session_management',
      'authentication',
      'location_monitoring',
      'time_based',
      'device_compliance'
    ]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'paused'],
    default: 'inactive'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  conditions: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Rule conditions are required']
  },
  actions: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Rule actions are required']
  },
  schedule: {
    enabled: {
      type: Boolean,
      default: true
    },
    business_hours_only: {
      type: Boolean,
      default: false
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  applicable_roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  exclude_roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  triggers_count: {
    type: Number,
    default: 0
  },
  success_rate: {
    type: Number,
    default: 100
  },
  last_triggered: Date
}, {
  timestamps: true
});

// Middleware to update success rate
SecurityRuleSchema.methods.updateStats = async function(success) {
  this.triggers_count += 1;
  this.last_triggered = Date.now();
  
  // Update success rate using weighted average
  const weight = 0.7; // 70% weight to historical data
  this.success_rate = (this.success_rate * weight) + (success ? 30 : 0);
  
  await this.save();
};

module.exports = mongoose.model('SecurityRule', SecurityRuleSchema);