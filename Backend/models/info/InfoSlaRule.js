const mongoose = require('mongoose');

const InfoSlaRuleSchema = new mongoose.Schema({
  rule_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: SLA-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `SLA-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  rule_name: {
    type: String,
    required: [true, 'SLA rule name is required'],
    trim: true,
    maxlength: [100, 'Rule name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  info_type: {
    type: String,
    required: [true, 'Info type is required'],
    enum: [
      'Brochure',
      'Policy', 
      'Invoice Copy',
      'Catalog',
      'Technical Specification',
      'Pricing',
      'Documentation',
      'Warranty',
      'Service',
      'General Inquiry',
      'Other'
    ]
  },
  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: ['Low', 'Medium', 'High', 'Critical']
  },
  request_channel: {
    type: String,
    enum: ['Website', 'Email', 'WhatsApp', 'Internal', 'Phone', 'Chat']
  },
  response_time_hours: {
    type: Number,
    required: [true, 'Response time in hours is required'],
    min: [0.5, 'Response time must be at least 0.5 hours'],
    max: [720, 'Response time cannot exceed 720 hours (30 days)']
  },
  resolution_time_hours: {
    type: Number,
    required: [true, 'Resolution time in hours is required'],
    min: [1, 'Resolution time must be at least 1 hour'],
    max: [2160, 'Resolution time cannot exceed 2160 hours (90 days)']
  },
  escalation_levels: [{
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    escalation_time_hours: {
      type: Number,
      required: true,
      min: 0.5
    },
    escalate_to_role: {
      type: String,
      required: true,
      enum: ['Team Lead', 'Manager', 'Senior Manager', 'Director', 'Admin']
    },
    escalate_to_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notification_template: {
      type: String,
      maxlength: [1000, 'Notification template cannot exceed 1000 characters']
    }
  }],
  auto_assignment_rules: {
    enabled: {
      type: Boolean,
      default: false
    },
    assign_to_team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    assign_to_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignment_criteria: {
      type: String,
      enum: ['Round Robin', 'Least Loaded', 'Skill Based', 'Random']
    }
  },
  notification_settings: {
    notify_on_creation: {
      type: Boolean,
      default: true
    },
    notify_on_escalation: {
      type: Boolean,
      default: true
    },
    notify_on_sla_breach: {
      type: Boolean,
      default: true
    },
    notification_channels: [{
      type: String,
      enum: ['Email', 'SMS', 'WhatsApp', 'In-App', 'Slack']
    }]
  },
  business_hours: {
    enabled: {
      type: Boolean,
      default: true
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    working_days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    start_time: {
      type: String,
      default: '09:00'
    },
    end_time: {
      type: String,
      default: '18:00'
    }
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Pre-save hook to generate sequential rule_id
InfoSlaRuleSchema.pre('save', async function(next) {
  if (this.rule_id.includes('XXXX')) {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `SLA-${dateStr}`;
      
      const lastRule = await this.constructor.findOne(
        { rule_id: { $regex: `^${prefix}` } },
        { rule_id: 1 },
        { sort: { rule_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastRule) {
        const lastNumber = parseInt(lastRule.rule_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.rule_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Update the updated_at field on save
InfoSlaRuleSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Index for better performance
InfoSlaRuleSchema.index({ info_type: 1, priority: 1, request_channel: 1 });
InfoSlaRuleSchema.index({ is_active: 1 });

module.exports = mongoose.model('InfoSlaRule', InfoSlaRuleSchema);