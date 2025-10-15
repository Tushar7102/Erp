const mongoose = require('mongoose');

const InfoAuditLogSchema = new mongoose.Schema({
  audit_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: AUD-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `AUD-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  info_profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfoProfile',
    required: [true, 'Info profile reference is required']
  },
  entity_type: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: [
      'InfoProfile',
      'InfoAction',
      'InfoResponse',
      'InfoAttachment',
      'InfoFeedback',
      'InfoSlaRule',
      'User',
      'Customer',
      'Team',
      'Other'
    ]
  },
  entity_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Entity ID is required']
  },
  action_type: {
    type: String,
    required: [true, 'Action type is required'],
    enum: [
      'Create',
      'Update',
      'Delete',
      'View',
      'Download',
      'Upload',
      'Assign',
      'Unassign',
      'Status Change',
      'Priority Change',
      'Escalate',
      'Close',
      'Reopen',
      'Comment',
      'Attachment Add',
      'Attachment Remove',
      'Response Add',
      'Feedback Add',
      'SLA Breach',
      'Login',
      'Logout',
      'Export',
      'Import',
      'Bulk Update',
      'System Action',
      'Other'
    ]
  },
  action_description: {
    type: String,
    required: [true, 'Action description is required'],
    maxlength: [1000, 'Action description cannot exceed 1000 characters']
  },
  field_changes: [{
    field_name: {
      type: String,
      required: true
    },
    field_label: String,
    old_value: mongoose.Schema.Types.Mixed,
    new_value: mongoose.Schema.Types.Mixed,
    data_type: {
      type: String,
      enum: ['String', 'Number', 'Boolean', 'Date', 'Object', 'Array'],
      default: 'String'
    }
  }],
  before_state: {
    type: mongoose.Schema.Types.Mixed
  },
  after_state: {
    type: mongoose.Schema.Types.Mixed
  },
  performed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Action performer is required']
  },
  performed_by_details: {
    name: String,
    email: String,
    role: String,
    department: String
  },
  performed_by_system: {
    type: Boolean,
    default: false
  },
  system_component: {
    type: String,
    enum: ['Web Portal', 'Mobile App', 'API', 'Background Job', 'Automation Rule', 'Email Service', 'SMS Service', 'WhatsApp Service', 'Other']
  },
  automation_rule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutomationRule'
  },
  session_id: String,
  request_id: String,
  transaction_id: String,
  ip_address: String,
  user_agent: String,
  device_info: {
    device_type: String,
    browser: String,
    os: String,
    screen_resolution: String
  },
  location: {
    country: String,
    state: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  api_endpoint: String,
  http_method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  },
  request_payload: mongoose.Schema.Types.Mixed,
  response_status: Number,
  response_time_ms: Number,
  error_details: {
    error_code: String,
    error_message: String,
    stack_trace: String
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  category: {
    type: String,
    enum: [
      'Security',
      'Data Change',
      'User Activity',
      'System Activity',
      'Performance',
      'Error',
      'Compliance',
      'Business Process',
      'Integration',
      'Other'
    ],
    default: 'User Activity'
  },
  compliance_flags: {
    gdpr_relevant: {
      type: Boolean,
      default: false
    },
    pii_involved: {
      type: Boolean,
      default: false
    },
    financial_data: {
      type: Boolean,
      default: false
    },
    sensitive_data: {
      type: Boolean,
      default: false
    }
  },
  retention_period_days: {
    type: Number,
    default: 2555, // 7 years default
    min: 1
  },
  auto_delete_at: Date,
  is_archived: {
    type: Boolean,
    default: false
  },
  archived_at: Date,
  tags: [String],
  metadata: {
    correlation_id: String,
    business_context: String,
    workflow_step: String,
    integration_source: String,
    batch_id: String,
    parent_audit_id: String,
    child_audit_ids: [String]
  },
  notification_sent: {
    type: Boolean,
    default: false
  },
  notification_details: {
    recipients: [String],
    notification_type: String,
    sent_at: Date,
    delivery_status: String
  },
  risk_score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  anomaly_detected: {
    type: Boolean,
    default: false
  },
  anomaly_details: {
    anomaly_type: String,
    confidence_score: Number,
    detection_algorithm: String,
    baseline_comparison: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to generate sequential audit_id
InfoAuditLogSchema.pre('save', async function(next) {
  if (this.audit_id.includes('XXXX')) {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `AUD-${dateStr}`;
      
      const lastAudit = await this.constructor.findOne(
        { audit_id: { $regex: `^${prefix}` } },
        { audit_id: 1 },
        { sort: { audit_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastAudit) {
        const lastNumber = parseInt(lastAudit.audit_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.audit_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Pre-save hook to set auto delete date and calculate risk score
InfoAuditLogSchema.pre('save', function(next) {
  // Set auto delete date based on retention period
  if (this.retention_period_days && !this.auto_delete_at) {
    this.auto_delete_at = new Date(Date.now() + (this.retention_period_days * 24 * 60 * 60 * 1000));
  }
  
  // Calculate basic risk score
  if (this.risk_score === 0) {
    let score = 0;
    
    // High risk actions
    if (['Delete', 'Bulk Update', 'Export', 'SLA Breach'].includes(this.action_type)) {
      score += 30;
    }
    
    // Medium risk actions
    if (['Update', 'Status Change', 'Priority Change', 'Assign'].includes(this.action_type)) {
      score += 15;
    }
    
    // Security category adds risk
    if (this.category === 'Security') {
      score += 25;
    }
    
    // Compliance flags add risk
    if (this.compliance_flags.pii_involved) score += 20;
    if (this.compliance_flags.financial_data) score += 25;
    if (this.compliance_flags.sensitive_data) score += 15;
    
    // System actions are generally lower risk
    if (this.performed_by_system) {
      score = Math.max(0, score - 10);
    }
    
    this.risk_score = Math.min(100, score);
  }
  
  next();
});

// Static method to create audit log
InfoAuditLogSchema.statics.createAuditLog = function(data) {
  return new this(data).save();
};

// Static method to log field changes
InfoAuditLogSchema.statics.logFieldChanges = function(infoProfileId, entityType, entityId, oldDoc, newDoc, userId, actionType = 'Update') {
  const changes = [];
  const fieldsToTrack = ['title', 'description', 'status', 'priority', 'assigned_to', 'assigned_team'];
  
  fieldsToTrack.forEach(field => {
    if (oldDoc[field] !== newDoc[field]) {
      changes.push({
        field_name: field,
        field_label: field.replace('_', ' ').toUpperCase(),
        old_value: oldDoc[field],
        new_value: newDoc[field],
        data_type: typeof newDoc[field] === 'object' ? 'Object' : typeof newDoc[field]
      });
    }
  });
  
  if (changes.length > 0) {
    return this.createAuditLog({
      info_profile: infoProfileId,
      entity_type: entityType,
      entity_id: entityId,
      action_type: actionType,
      action_description: `${actionType} ${entityType} with ${changes.length} field changes`,
      field_changes: changes,
      before_state: oldDoc,
      after_state: newDoc,
      performed_by: userId
    });
  }
  
  return Promise.resolve();
};

// Indexes for better performance
InfoAuditLogSchema.index({ info_profile: 1, created_at: -1 });
InfoAuditLogSchema.index({ entity_type: 1, entity_id: 1, created_at: -1 });
InfoAuditLogSchema.index({ action_type: 1, created_at: -1 });
InfoAuditLogSchema.index({ performed_by: 1, created_at: -1 });
InfoAuditLogSchema.index({ category: 1, severity: 1 });
InfoAuditLogSchema.index({ auto_delete_at: 1 });
InfoAuditLogSchema.index({ risk_score: -1 });
InfoAuditLogSchema.index({ anomaly_detected: 1 });

module.exports = mongoose.model('InfoAuditLog', InfoAuditLogSchema);