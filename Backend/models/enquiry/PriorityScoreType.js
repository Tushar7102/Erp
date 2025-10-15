const mongoose = require('mongoose');

const PriorityScoreTypeSchema = new mongoose.Schema({
  priority_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: PRI-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `PRI-${dateStr}-XXXX`; // This will be replaced by pre-save hook
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
  color_code: {
    type: String,
    default: '#808080' // Default gray color
  },
  icon: {
    type: String
  },
  is_active: {
    type: Boolean,
    default: true
  },
  score_range: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    }
  },
  display_label: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  auto_assignment: {
    enabled: {
      type: Boolean,
      default: false
    },
    rule_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssignmentRule'
    }
  },
  sla_hours: {
    type: Number,
    default: 24
  },
  scoring_rules: [{
    field: {
      type: String,
      required: true
    },
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in'],
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    score: {
      type: Number,
      required: true
    }
  }],
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
PriorityScoreTypeSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Create priority_id before saving
PriorityScoreTypeSchema.pre('save', async function(next) {
  // Only generate ID for new documents
  if (!this.isNew || this.priority_id.indexOf('XXXX') === -1) {
    return next();
  }
  
  // Generate ID format: PRI-YYYYMMDD-XXXX (where XXXX is sequential)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the highest priority_id for today
  const lastPriority = await this.constructor.findOne(
    { priority_id: new RegExp(`^PRI-${dateStr}`) },
    { priority_id: 1 },
    { sort: { priority_id: -1 } }
  );
  
  let sequence = 1;
  if (lastPriority && lastPriority.priority_id) {
    const lastSequence = parseInt(lastPriority.priority_id.split('-')[2]);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  // Pad sequence with leading zeros
  const paddedSequence = sequence.toString().padStart(4, '0');
  this.priority_id = `PRI-${dateStr}-${paddedSequence}`;
  
  next();
});

module.exports = mongoose.model('PriorityScoreType', PriorityScoreTypeSchema);