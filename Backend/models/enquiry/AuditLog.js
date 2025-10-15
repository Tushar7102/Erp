const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  // Added entity_details to store entity information in object form
  entity_details: {
    type: mongoose.Schema.Types.Mixed,
    description: 'Stores entity information in object form for quick access'
  },
  audit_log_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: AUDITXXXX
      return `AUDITXXXX`;
    }
  },
  entity_type: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: [
      'Enquiry',
      'EnquiryRemark',
      'User',
      'Task',
      'StatusLog',
      'AssignmentLog',
      'AssignmentRule',
      'CommunicationLog',
      'CallLog',
      'CallFeedback',
      'NotificationLog',
      'IntegrationConfig',
      'StatusType',
      'PriorityScoreType',
      'SourceChannel',
      'AutomationRule',
      'AutomationTrigger',
      'System',
      'Authentication',
      'Other'
    ]
  },
  entity_id: {
    type: String,
    required: [true, 'Entity ID is required']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'CREATE',
      'READ',
      'UPDATE',
      'DELETE',
      'LOGIN',
      'LOGOUT',
      'ASSIGN',
      'UNASSIGN',
      'APPROVE',
      'REJECT',
      'ACTIVATE',
      'DEACTIVATE',
      'SEND',
      'RECEIVE',
      'CALL',
      'EMAIL',
      'SMS',
      'WHATSAPP',
      'SYNC',
      'EXPORT',
      'IMPORT',
      'EXECUTE',
      'TRIGGER',
      'COMPLETE',
      'OTHER'
    ]
  },
  action_category: {
    type: String,
    enum: ['data', 'security', 'communication', 'system', 'automation', 'other'],
    default: 'data'
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.is_system_action;
    }
  },
  is_system_action: {
    type: Boolean,
    default: false
  },
  ip_address: {
    type: String
  },
  user_agent: {
    type: String
  },
  old_values: {
    type: mongoose.Schema.Types.Mixed
  },
  new_values: {
    type: mongoose.Schema.Types.Mixed
  },
  changes: [{
    field: {
      type: String,
      required: true
    },
    old_value: mongoose.Schema.Types.Mixed,
    new_value: mongoose.Schema.Types.Mixed,
    change_type: {
      type: String,
      enum: ['added', 'modified', 'removed'],
      required: true
    }
  }],
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'warning', 'info'],
    default: 'success'
  },
  session_id: {
    type: String
  },
  correlation_id: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Pre-save hook to generate unique audit_log_id
AuditLogSchema.pre('save', async function(next) {
  if (this.isNew && this.audit_log_id.includes('XXXX')) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the last audit log for today
    const lastLog = await this.constructor.findOne({
      audit_log_id: new RegExp(`^AUDIT-${dateStr}-`)
    }).sort({ audit_log_id: -1 });
    
    let sequence = 1;
    if (lastLog) {
      const lastSequence = parseInt(lastLog.audit_log_id.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.audit_log_id = `AUDIT-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }
  
  next();
});

// Indexes for better performance
AuditLogSchema.index({ entity_type: 1, entity_id: 1 });
AuditLogSchema.index({ user_id: 1, created_at: -1 });
AuditLogSchema.index({ action: 1, created_at: -1 });
AuditLogSchema.index({ severity: 1, created_at: -1 });
AuditLogSchema.index({ status: 1 });
AuditLogSchema.index({ session_id: 1 });
AuditLogSchema.index({ correlation_id: 1 });
AuditLogSchema.index({ created_at: -1 }); // Most recent first

// Static method to create audit log entry
AuditLogSchema.statics.createLog = function(userId, entityType, entityId, action, changes, metadata = {}) {
  // Determine action category based on action
  let actionCategory = 'data';
  if (['LOGIN', 'LOGOUT'].includes(action)) {
    actionCategory = 'security';
  } else if (['CALL', 'EMAIL', 'SMS', 'WHATSAPP', 'SEND', 'RECEIVE'].includes(action)) {
    actionCategory = 'communication';
  } else if (['SYNC', 'EXPORT', 'IMPORT'].includes(action)) {
    actionCategory = 'system';
  } else if (['EXECUTE', 'TRIGGER'].includes(action)) {
    actionCategory = 'automation';
  }

  // Process changes to determine old and new values
  let oldValues = {};
  let newValues = {};
  
  if (Array.isArray(changes)) {
    changes.forEach(change => {
      if (change.old_value !== undefined) {
        oldValues[change.field] = change.old_value;
      }
      if (change.new_value !== undefined) {
        newValues[change.field] = change.new_value;
      }
    });
  }

  const logData = {
    user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    action: action,
    action_category: actionCategory,
    changes: changes || [],
    old_values: oldValues,
    new_values: newValues,
    metadata: metadata,
    ip_address: metadata.ip_address,
    user_agent: metadata.user_agent,
    is_system_action: !userId,
    session_id: metadata.session_id,
    correlation_id: metadata.correlation_id,
    severity: metadata.severity || 'low',
    status: metadata.status || 'success',
    description: metadata.description
  };

  const auditLog = new this(logData);
  return auditLog.save();
};

// Static method to get user activity
AuditLogSchema.statics.getUserActivity = function(userId, startDate, endDate, limit = 100) {
  const query = { user_id: userId };
  
  if (startDate || endDate) {
    query.created_at = {};
    if (startDate) query.created_at.$gte = new Date(startDate);
    if (endDate) query.created_at.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('user_id', 'name email')
    .sort({ created_at: -1 })
    .limit(limit);
};

// Static method to get entity history
AuditLogSchema.statics.getEntityHistory = function(entityType, entityId, limit = 50) {
  return this.find({
    entity_type: entityType,
    entity_id: entityId
  })
    .populate('user_id', 'name email')
    .sort({ created_at: -1 })
    .limit(limit);
};

// Static method to get system activity summary
AuditLogSchema.statics.getSystemActivitySummary = function(startDate, endDate) {
  const match = {};
  
  if (startDate || endDate) {
    match.created_at = {};
    if (startDate) match.created_at.$gte = new Date(startDate);
    if (endDate) match.created_at.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          entity_type: '$entity_type',
          action_category: '$action_category',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } }
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        activities: {
          $push: {
            entity_type: '$_id.entity_type',
            action_category: '$_id.action_category',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);