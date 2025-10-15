const mongoose = require('mongoose');

const AssignmentRuleSchema = new mongoose.Schema({
  rule_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: RULE-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `RULE-${dateStr}-XXXX`; // This will be replaced by pre-save hook
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
    enum: ['round-robin', 'load-based', 'manual', 'fallback']
  },
  priority: {
    type: Number,
    default: 0
  },
  conditions: [{
    field: {
      type: String,
      required: true
    },
    operator: {
      type: String,
      required: true,
      enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in']
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  }],
  assignment_to: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    weight: {
      type: Number,
      default: 1
    },
    max_daily_assignments: {
      type: Number,
      default: 0 // 0 means no limit
    }
  }],
  fallback_user_id: {
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
AssignmentRuleSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Create rule_id before saving
AssignmentRuleSchema.pre('save', async function(next) {
  // Only generate ID for new documents
  if (!this.isNew || this.rule_id.indexOf('XXXX') === -1) {
    return next();
  }
  
  // Generate ID format: RULE-YYYYMMDD-XXXX (where XXXX is sequential)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the highest rule_id for today
  const lastRule = await this.constructor.findOne(
    { rule_id: new RegExp(`^RULE-${dateStr}`) },
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
  this.rule_id = `RULE-${dateStr}-${paddedSequence}`;
  
  next();
});

module.exports = mongoose.model('AssignmentRule', AssignmentRuleSchema);