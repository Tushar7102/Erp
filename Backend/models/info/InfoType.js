const mongoose = require('mongoose');

const InfoTypeSchema = new mongoose.Schema({
  type_id: {
    type: String,
    unique: true,
    required: [true, 'Type ID is required']
  },
  type_name: {
    type: String,
    required: [true, 'Type name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Type name cannot exceed 100 characters']
  },
  type_label: {
    type: String,
    required: [true, 'Type label is required'],
    maxlength: [150, 'Type label cannot exceed 150 characters']
  },
  type_description: {
    type: String,
    maxlength: [1000, 'Type description cannot exceed 1000 characters']
  },
  type_category: {
    type: String,
    required: [true, 'Type category is required'],
    enum: [
      'Product',
      'Service',
      'Technical',
      'Commercial',
      'Support',
      'Documentation',
      'General'
    ]
  },
  parent_type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfoType'
  },
  sub_types: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfoType'
  }],
  color_code: {
    type: String,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color code'],
    default: '#007bff'
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
  is_system_type: {
    type: Boolean,
    default: false
  },
  workflow_settings: {
    default_priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    default_sla_rule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InfoSlaRule'
    },
    auto_assignment: {
      enabled: {
        type: Boolean,
        default: false
      },
      assignment_rule: String,
      default_team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      },
      default_assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    required_fields: [String],
    optional_fields: [String],
    custom_fields: [{
      field_name: String,
      field_type: {
        type: String,
        enum: ['Text', 'Number', 'Date', 'Boolean', 'Select', 'Multi-Select', 'File']
      },
      field_label: String,
      is_required: Boolean,
      options: [String],
      validation_rules: String
    }]
  },
  sla_settings: {
    default_response_time_hours: {
      type: Number,
      min: 0,
      default: 24
    },
    default_resolution_time_hours: {
      type: Number,
      min: 0,
      default: 72
    },
    escalation_enabled: {
      type: Boolean,
      default: true
    },
    escalation_levels: [{
      level: Number,
      escalate_after_hours: Number,
      escalate_to_role: String,
      escalate_to_team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      },
      escalate_to_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  notification_settings: {
    notify_on_create: {
      customer: Boolean,
      assigned_user: Boolean,
      team: Boolean,
      manager: Boolean
    },
    notify_on_update: {
      customer: Boolean,
      assigned_user: Boolean,
      team: Boolean,
      manager: Boolean
    },
    notify_on_close: {
      customer: Boolean,
      assigned_user: Boolean,
      team: Boolean,
      manager: Boolean
    },
    email_templates: {
      creation_template: String,
      update_template: String,
      closure_template: String
    }
  },
  approval_settings: {
    requires_approval: {
      type: Boolean,
      default: false
    },
    approval_workflow: [{
      step: Number,
      approver_role: String,
      approver_team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      },
      approver_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      is_mandatory: Boolean
    }]
  },
  document_settings: {
    allowed_file_types: [String],
    max_file_size_mb: {
      type: Number,
      default: 10,
      min: 1
    },
    max_files_count: {
      type: Number,
      default: 5,
      min: 1
    },
    require_documents: {
      type: Boolean,
      default: false
    },
    document_categories: [String]
  },
  customer_settings: {
    customer_can_create: {
      type: Boolean,
      default: true
    },
    customer_can_view: {
      type: Boolean,
      default: true
    },
    customer_can_update: {
      type: Boolean,
      default: false
    },
    customer_can_close: {
      type: Boolean,
      default: false
    },
    show_in_customer_portal: {
      type: Boolean,
      default: true
    }
  },
  reporting_settings: {
    include_in_reports: {
      type: Boolean,
      default: true
    },
    kpi_metrics: [String],
    dashboard_widgets: [String]
  },
  integration_settings: {
    external_system_mapping: [{
      system_name: String,
      external_type_id: String,
      sync_enabled: Boolean
    }],
    api_endpoints: [{
      endpoint_name: String,
      endpoint_url: String,
      method: String,
      headers: mongoose.Schema.Types.Mixed
    }]
  },
  usage_statistics: {
    total_requests: {
      type: Number,
      default: 0
    },
    last_used: Date,
    average_resolution_time_hours: Number,
    customer_satisfaction_score: Number
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

// Pre-save hook to ensure only one default type
InfoTypeSchema.pre('save', async function(next) {
  this.updated_at = Date.now();
  
  if (this.is_default) {
    // Remove default flag from other types
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, is_default: true },
      { is_default: false }
    );
  }
  
  next();
});

// Static method to get default type
InfoTypeSchema.statics.getDefaultType = function() {
  return this.findOne({ is_default: true, is_active: true });
};

// Static method to get active types
InfoTypeSchema.statics.getActiveTypes = function() {
  return this.find({ is_active: true }).sort({ sort_order: 1 });
};

// Static method to get types by category
InfoTypeSchema.statics.getTypesByCategory = function(category) {
  return this.find({ type_category: category, is_active: true }).sort({ sort_order: 1 });
};

// Static method to get parent types (no parent)
InfoTypeSchema.statics.getParentTypes = function() {
  return this.find({ parent_type: null, is_active: true }).sort({ sort_order: 1 });
};

// Method to get sub types
InfoTypeSchema.methods.getSubTypes = function() {
  return this.constructor.find({ parent_type: this._id, is_active: true }).sort({ sort_order: 1 });
};

// Method to increment usage statistics
InfoTypeSchema.methods.incrementUsage = function() {
  this.usage_statistics.total_requests += 1;
  this.usage_statistics.last_used = new Date();
  return this.save();
};

// Method to update average resolution time
InfoTypeSchema.methods.updateAverageResolutionTime = function(resolutionTimeHours) {
  const currentAvg = this.usage_statistics.average_resolution_time_hours || 0;
  const totalRequests = this.usage_statistics.total_requests || 1;
  
  this.usage_statistics.average_resolution_time_hours = 
    ((currentAvg * (totalRequests - 1)) + resolutionTimeHours) / totalRequests;
  
  return this.save();
};

// Indexes for better performance
InfoTypeSchema.index({ type_name: 1 });
InfoTypeSchema.index({ type_category: 1, sort_order: 1 });
InfoTypeSchema.index({ is_active: 1, sort_order: 1 });
InfoTypeSchema.index({ is_default: 1 });
InfoTypeSchema.index({ parent_type: 1 });

module.exports = mongoose.model('InfoType', InfoTypeSchema);