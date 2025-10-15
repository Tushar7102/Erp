const mongoose = require('mongoose');

const InfoActionSchema = new mongoose.Schema({
  action_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: ACT-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `ACT-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  info_profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfoProfile',
    required: [true, 'Info profile reference is required']
  },
  action_type: {
    type: String,
    required: [true, 'Action type is required'],
    enum: [
      'Document Upload',
      'Email Sent',
      'WhatsApp Sent',
      'SMS Sent',
      'Phone Call Made',
      'Status Changed',
      'Assignment Changed',
      'Response Added',
      'Note Added',
      'Escalation Triggered',
      'SLA Breach',
      'Customer Contacted',
      'Internal Discussion',
      'Document Downloaded',
      'Feedback Received',
      'Request Closed',
      'Request Reopened',
      'Priority Changed',
      'Other'
    ]
  },
  action_description: {
    type: String,
    required: [true, 'Action description is required'],
    maxlength: [1000, 'Action description cannot exceed 1000 characters']
  },
  action_details: {
    // Flexible field to store action-specific data
    document_name: String,
    document_path: String,
    email_subject: String,
    email_recipients: [String],
    whatsapp_number: String,
    sms_number: String,
    phone_number: String,
    call_duration: Number,
    previous_status: String,
    new_status: String,
    previous_assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    new_assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    escalation_level: Number,
    escalated_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sla_breach_time: Date,
    response_content: String,
    note_content: String,
    priority_from: String,
    priority_to: String,
    additional_data: mongoose.Schema.Types.Mixed
  },
  performed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Action performer is required']
  },
  performed_by_system: {
    type: Boolean,
    default: false
  },
  automation_rule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutomationRule'
  },
  communication_channel: {
    type: String,
    enum: ['Email', 'WhatsApp', 'SMS', 'Phone', 'In-Person', 'Internal', 'System']
  },
  is_customer_facing: {
    type: Boolean,
    default: false
  },
  is_internal: {
    type: Boolean,
    default: true
  },
  success_status: {
    type: String,
    enum: ['Success', 'Failed', 'Pending', 'Partial'],
    default: 'Success'
  },
  failure_reason: {
    type: String,
    maxlength: [500, 'Failure reason cannot exceed 500 characters']
  },
  retry_count: {
    type: Number,
    default: 0,
    min: 0
  },
  scheduled_at: {
    type: Date
  },
  completed_at: {
    type: Date
  },
  duration_minutes: {
    type: Number,
    min: 0
  },
  cost: {
    type: Number,
    min: 0,
    default: 0
  },
  attachments: [{
    name: String,
    file_path: String,
    file_size: Number,
    mime_type: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  ip_address: String,
  user_agent: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to generate sequential action_id
InfoActionSchema.pre('save', async function(next) {
  if (this.action_id.includes('XXXX')) {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `ACT-${dateStr}`;
      
      const lastAction = await this.constructor.findOne(
        { action_id: { $regex: `^${prefix}` } },
        { action_id: 1 },
        { sort: { action_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastAction) {
        const lastNumber = parseInt(lastAction.action_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.action_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Auto-set completed_at if not set and success_status is Success
InfoActionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  
  if (this.success_status === 'Success' && !this.completed_at) {
    this.completed_at = new Date();
  }
  
  // Calculate duration if both scheduled_at and completed_at are available
  if (this.scheduled_at && this.completed_at) {
    this.duration_minutes = Math.round((this.completed_at - this.scheduled_at) / (1000 * 60));
  }
  
  next();
});

// Indexes for better performance
InfoActionSchema.index({ info_profile: 1, created_at: -1 });
InfoActionSchema.index({ action_type: 1, created_at: -1 });
InfoActionSchema.index({ performed_by: 1, created_at: -1 });
InfoActionSchema.index({ success_status: 1 });
InfoActionSchema.index({ is_customer_facing: 1 });

module.exports = mongoose.model('InfoAction', InfoActionSchema);