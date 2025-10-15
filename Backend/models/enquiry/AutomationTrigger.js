const mongoose = require('mongoose');

const automationTriggerSchema = new mongoose.Schema({
  // Trigger Basic Info
  name: { type: String, required: true, unique: true },
  description: String,
  trigger_type: { 
    type: String, 
    enum: ['time_based', 'event_based', 'condition_based'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'draft'],
    default: 'draft'
  },

  // Time-based Trigger Configuration
  timeConfig: {
    frequency: { 
      type: String, 
      enum: ['once', 'daily', 'weekly', 'monthly', 'custom'],
      default: 'once'
    },
    startDate: Date,
    endDate: Date,
    time: String, // HH:MM format
    daysOfWeek: [Number], // 0-6 (Sunday-Saturday)
    timezone: { type: String, default: 'Asia/Kolkata' },
    customCron: String // For custom cron expressions
  },

  // Event-based Trigger Configuration
  eventConfig: {
    event: { 
      type: String, 
      enum: [
        'enquiry_created',
        'enquiry_updated',
        'status_changed',
        'assigned',
        'call_logged',
        'profile_completed',
        'quotation_sent',
        'converted',
        'rejected',
        'follow_up_due',
        'escalation_needed'
      ]
    },
    conditions: [{
      field: String,
      operator: { 
        type: String, 
        enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']
      },
      value: mongoose.Schema.Types.Mixed
    }],
    delay: { type: Number, default: 0 } // minutes
  },

  // Condition-based Trigger Configuration
  conditionConfig: {
    conditions: [{
      field: String,
      operator: { 
        type: String, 
        enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in', 'exists', 'not_exists']
      },
      value: mongoose.Schema.Types.Mixed,
      logicalOperator: { type: String, enum: ['AND', 'OR'], default: 'AND' }
    }],
    evaluationFrequency: { 
      type: String, 
      enum: ['realtime', 'hourly', 'daily'],
      default: 'realtime'
    }
  },

  // Actions Configuration
  actions: [{
    action_type: { 
      type: String, 
      enum: [
        'send_notification',
        'send_email',
        'send_sms',
        'send_whatsapp',
        'assign_user',
        'change_status',
        'create_task',
        'escalate',
        'update_field',
        'webhook_call'
      ],
      required: true
    },
    action_config: {
      // Notification actions
      template_id: { type: mongoose.Schema.Types.ObjectId, ref: 'NotificationTemplate' },
      recipients: [String],
      subject: String,
      message: String,
      
      // Assignment actions
      assign_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      assign_team: String,
      
      // Status actions
      new_status: String,
      new_stage: String,
      
      // Task actions
      task_title: String,
      task_description: String,
      task_priority: { type: String, enum: ['low', 'medium', 'high'] },
      task_due_date: Date,
      
      // Webhook actions
      webhook_url: String,
      webhook_method: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE'], default: 'POST' },
      webhook_headers: mongoose.Schema.Types.Mixed,
      webhook_body: mongoose.Schema.Types.Mixed,
      
      // Field update actions
      field_name: String,
      field_value: mongoose.Schema.Types.Mixed
    },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true }
  }],

  // Target Configuration
  target: {
    entity_type: { 
      type: String, 
      enum: ['enquiry', 'user', 'profile', 'call', 'all'],
      default: 'enquiry'
    },
    filters: [{
      field: String,
      operator: { 
        type: String, 
        enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']
      },
      value: mongoose.Schema.Types.Mixed
    }],
    limit: { type: Number, default: 100 }
  },

  // Execution Configuration
  execution: {
    maxRetries: { type: Number, default: 3 },
    retryDelay: { type: Number, default: 5 }, // minutes
    timeout: { type: Number, default: 30 }, // seconds
    concurrent: { type: Boolean, default: false },
    stopOnError: { type: Boolean, default: false }
  },

  // Analytics
  analytics: {
    totalExecutions: { type: Number, default: 0 },
    successfulExecutions: { type: Number, default: 0 },
    failedExecutions: { type: Number, default: 0 },
    lastExecutedAt: Date,
    averageExecutionTime: { type: Number, default: 0 }, // milliseconds
    lastError: String
  },

  // Access Control
  accessControl: {
    roles: [String],
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }
}, {
  timestamps: true
});

// Index for efficient queries
automationTriggerSchema.index({ trigger_type: 1 });
automationTriggerSchema.index({ status: 1 });
automationTriggerSchema.index({ 'eventConfig.event': 1 });
automationTriggerSchema.index({ createdAt: -1 });

// Method to check if trigger should execute
automationTriggerSchema.methods.shouldExecute = function(context) {
  if (this.status !== 'active') return false;
  
  // Check time-based conditions
  if (this.trigger_type === 'time_based') {
    const now = new Date();
    if (this.timeConfig.endDate && now > this.timeConfig.endDate) return false;
    if (this.timeConfig.startDate && now < this.timeConfig.startDate) return false;
  }
  
  // Check event-based conditions
  if (this.trigger_type === 'event_based') {
    if (this.eventConfig.event !== context.event) return false;
    
    // Check conditions
    for (const condition of this.eventConfig.conditions) {
      const fieldValue = context.data[condition.field];
      if (!this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
        return false;
      }
    }
  }
  
  return true;
};

// Method to evaluate conditions
automationTriggerSchema.methods.evaluateCondition = function(fieldValue, operator, expectedValue) {
  switch (operator) {
    case 'equals':
      return fieldValue === expectedValue;
    case 'not_equals':
      return fieldValue !== expectedValue;
    case 'contains':
      return String(fieldValue).includes(String(expectedValue));
    case 'greater_than':
      return Number(fieldValue) > Number(expectedValue);
    case 'less_than':
      return Number(fieldValue) < Number(expectedValue);
    case 'in':
      return Array.isArray(expectedValue) && expectedValue.includes(fieldValue);
    case 'not_in':
      return Array.isArray(expectedValue) && !expectedValue.includes(fieldValue);
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;
    case 'not_exists':
      return fieldValue === undefined || fieldValue === null;
    default:
      return false;
  }
};

module.exports = mongoose.model('AutomationTrigger', automationTriggerSchema); 