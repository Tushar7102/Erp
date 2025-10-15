const mongoose = require('mongoose');

const AutomationRuleSchema = new mongoose.Schema({
  rule_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: ARULE-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `ARULE-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  is_active: {
    type: Boolean,
    default: true
  },
  rule_type: {
    type: String,
    required: true,
    enum: ['status_change', 'assignment', 'notification', 'task_creation', 'lead_scoring', 'data_enrichment']
  },
  priority: {
    type: Number,
    default: 0
  },
  trigger: {
    event_type: {
      type: String,
      enum: ['status_change', 'new_lead', 'assignment_change', 'field_update', 'time_based', 'manual'],
      required: true
    },
    specific_event: {
      type: String
    },
    schedule: {
      type: String // Cron expression for time-based triggers
    }
  },
  conditions: [{
    field: {
      type: String,
      required: true
    },
    operator: {
      type: String,
      required: true,
      enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in', 'exists', 'not_exists']
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    logical_operator: {
      type: String,
      enum: ['AND', 'OR'],
      default: 'AND'
    }
  }],
  actions: [{
    action_type: {
      type: String,
      required: true,
      enum: [
        'update_status',
        'update_stage',
        'update_priority',
        'assign_to_user',
        'send_email',
        'send_sms',
        'send_whatsapp',
        'create_task',
        'update_field',
        'webhook'
      ]
    },
    action_data: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    order: {
      type: Number,
      default: 0
    },
    enabled: {
      type: Boolean,
      default: true
    }
  }],
  execution_config: {
    max_retries: {
      type: Number,
      default: 3
    },
    retry_delay: {
      type: Number,
      default: 5 // minutes
    },
    timeout: {
      type: Number,
      default: 30 // seconds
    },
    stop_on_error: {
      type: Boolean,
      default: false
    }
  },
  analytics: {
    total_executions: {
      type: Number,
      default: 0
    },
    successful_executions: {
      type: Number,
      default: 0
    },
    failed_executions: {
      type: Number,
      default: 0
    },
    last_executed_at: {
      type: Date
    },
    average_execution_time: {
      type: Number,
      default: 0 // milliseconds
    },
    last_error: {
      type: String
    }
  },
  created_by: {
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

// Update the updated_at field
AutomationRuleSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Create rule_id before saving
AutomationRuleSchema.pre('save', async function(next) {
  // Only generate ID for new documents
  if (!this.isNew || this.rule_id.indexOf('XXXX') === -1) {
    return next();
  }
  
  // Generate ID format: ARULE-YYYYMMDD-XXXX (where XXXX is sequential)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the highest rule_id for today
  const lastRule = await this.constructor.findOne(
    { rule_id: new RegExp(`^ARULE-${dateStr}`) },
    { rule_id: 1 },
    { sort: { rule_id: -1 } }
  );
  
  let sequence = 1;
  if (lastRule && lastRule.rule_id) {
    const lastSequence = parseInt(lastRule.rule_id.split('-')[2]);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  // Pad sequence with leading zeros
  const paddedSequence = sequence.toString().padStart(4, '0');
  this.rule_id = `ARULE-${dateStr}-${paddedSequence}`;
  
  next();
});

// Indexes for faster queries
AutomationRuleSchema.index({ rule_type: 1 });
AutomationRuleSchema.index({ 'trigger.event_type': 1 });
AutomationRuleSchema.index({ is_active: 1 });
AutomationRuleSchema.index({ priority: 1 });
AutomationRuleSchema.index({ created_at: 1 });

module.exports = mongoose.model('AutomationRule', AutomationRuleSchema);