const mongoose = require('mongoose');

const InfoStatusSchema = new mongoose.Schema({
  status_id: {
    type: String,
    unique: true,
    required: [true, 'Status ID is required']
  },
  status_name: {
    type: String,
    required: [true, 'Status name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Status name cannot exceed 50 characters']
  },
  status_label: {
    type: String,
    required: [true, 'Status label is required'],
    maxlength: [100, 'Status label cannot exceed 100 characters']
  },
  status_description: {
    type: String,
    maxlength: [500, 'Status description cannot exceed 500 characters']
  },
  status_category: {
    type: String,
    required: [true, 'Status category is required'],
    enum: [
      'Open',
      'In Progress',
      'Pending',
      'Resolved',
      'Closed',
      'Cancelled'
    ]
  },
  status_type: {
    type: String,
    required: [true, 'Status type is required'],
    enum: [
      'Initial',
      'Intermediate',
      'Final',
      'System'
    ]
  },
  color_code: {
    type: String,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color code'],
    default: '#6c757d'
  },
  icon: {
    type: String,
    maxlength: [50, 'Icon name cannot exceed 50 characters']
  },
  sort_order: {
    type: Number,
    required: [true, 'Sort order is required'],
    min: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  is_default: {
    type: Boolean,
    default: false
  },
  is_system_status: {
    type: Boolean,
    default: false
  },
  workflow_rules: {
    can_transition_to: [{
      status_id: String,
      condition: String,
      required_role: String
    }],
    auto_transition: {
      enabled: {
        type: Boolean,
        default: false
      },
      condition: String,
      target_status: String,
      delay_minutes: Number
    },
    notifications: {
      send_to_customer: {
        type: Boolean,
        default: false
      },
      send_to_assigned: {
        type: Boolean,
        default: true
      },
      send_to_team: {
        type: Boolean,
        default: false
      },
      email_template: String,
      sms_template: String,
      whatsapp_template: String
    }
  },
  sla_impact: {
    stops_sla_timer: {
      type: Boolean,
      default: false
    },
    resets_sla_timer: {
      type: Boolean,
      default: false
    },
    escalation_trigger: {
      type: Boolean,
      default: false
    }
  },
  permissions: {
    roles_can_set: [String],
    departments_can_set: [String],
    customer_visible: {
      type: Boolean,
      default: true
    }
  },
  reporting: {
    include_in_open_count: {
      type: Boolean,
      default: true
    },
    include_in_pending_count: {
      type: Boolean,
      default: false
    },
    include_in_resolved_count: {
      type: Boolean,
      default: false
    },
    include_in_closed_count: {
      type: Boolean,
      default: false
    }
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
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

// Pre-save hook to ensure only one default status
InfoStatusSchema.pre('save', async function(next) {
  this.updated_at = Date.now();
  
  if (this.is_default) {
    // Remove default flag from other statuses
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, is_default: true },
      { is_default: false }
    );
  }
  
  next();
});

// Static method to get default status
InfoStatusSchema.statics.getDefaultStatus = function() {
  return this.findOne({ is_default: true, is_active: true });
};

// Static method to get active statuses
InfoStatusSchema.statics.getActiveStatuses = function() {
  return this.find({ is_active: true }).sort({ sort_order: 1 });
};

// Static method to get statuses by category
InfoStatusSchema.statics.getStatusesByCategory = function(category) {
  return this.find({ status_category: category, is_active: true }).sort({ sort_order: 1 });
};

// Method to check if transition is allowed
InfoStatusSchema.methods.canTransitionTo = function(targetStatusId, userRole) {
  const rule = this.workflow_rules.can_transition_to.find(
    rule => rule.status_id === targetStatusId
  );
  
  if (!rule) return false;
  
  if (rule.required_role && rule.required_role !== userRole) {
    return false;
  }
  
  return true;
};

// Indexes for better performance
InfoStatusSchema.index({ status_name: 1 });
InfoStatusSchema.index({ status_category: 1, sort_order: 1 });
InfoStatusSchema.index({ is_active: 1, sort_order: 1 });
InfoStatusSchema.index({ is_default: 1 });

module.exports = mongoose.model('InfoStatus', InfoStatusSchema);