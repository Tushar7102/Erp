const mongoose = require('mongoose');

const StatusTypeSchema = new mongoose.Schema({
  status_id: {
    type: String,
    unique: true,
    default: function() {
      return `STXXXX`; // This will be replaced by pre-save hook
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
  is_system: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['lead', 'enquiry', 'customer', 'project', 'product', 'service', 'general'],
    default: 'lead'
  },
  stage_mapping: {
    type: Map,
    of: String,
    default: {}
  },
  allowed_transitions: [{
    to_status: {
      type: String,
      required: true
    },
    roles: [{
      type: String
    }],
    conditions: [{
      field: String,
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']
      },
      value: mongoose.Schema.Types.Mixed
    }]
  }],
  auto_actions: [{
    action_type: {
      type: String,
      enum: ['notification', 'email', 'sms', 'assignment', 'field_update'],
      required: true
    },
    config: mongoose.Schema.Types.Mixed
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
StatusTypeSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Create status_id before saving
StatusTypeSchema.pre('save', async function(next) {
  // Only generate ID for new documents
  if (!this.isNew || this.status_id.indexOf('XXXX') === -1) {
    return next();
  }
  
  // Generate ID format: STS-YYYYMMDD-XXXX (where XXXX is sequential)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the highest status_id for today
  const lastStatus = await this.constructor.findOne(
    { status_id: new RegExp(`^STS-${dateStr}`) },
    { status_id: 1 },
    { sort: { status_id: -1 } }
  );
  
  let sequence = 1;
  if (lastStatus && lastStatus.status_id) {
    const lastSequence = parseInt(lastStatus.status_id.split('-')[2]);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  // Pad sequence with leading zeros
  const paddedSequence = sequence.toString().padStart(4, '0');
  this.status_id = `STS-${dateStr}-${paddedSequence}`;
  
  next();
});

module.exports = mongoose.model('StatusType', StatusTypeSchema);