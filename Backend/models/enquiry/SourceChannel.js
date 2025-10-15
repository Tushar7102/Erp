const mongoose = require('mongoose');

const SourceChannelSchema = new mongoose.Schema({
  channel_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: CHN-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `CHN-${dateStr}-XXXX`; // This will be replaced by pre-save hook
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
  source_type: {
    type: String,
    required: true,
    enum: [
      'Website',
      'WhatsApp',
      'Meta Ads',
      'JustDial',
      'IndiaMART',
      'Walk-in',
      'Referral',
      'Cold Call',
      'Other'
    ]
  },
  channel_type: {
    type: String,
    required: true,
    enum: [
      'Online',
      'Offline',
      'API',
      'Manual',
      'Bulk Upload'
    ]
  },
  is_active: {
    type: Boolean,
    default: true
  },
  // Performance metrics and assignment
  conversion_rate: {
    type: Number,
    default: null
  },
  cost_per_lead: {
    type: Number,
    default: null
  },
  assigned_team: {
    type: String,
    default: ''
  },
  api_key: {
    type: String
  },
  api_secret: {
    type: String
  },
  webhook_url: {
    type: String
  },
  field_mapping: {
    type: Map,
    of: String,
    default: {}
  },
  default_profile: {
    type: String,
    enum: [
      'Project',
      'Product',
      'AMC/Service',
      'Complaint',
      'Job',
      'Info Request',
      'Installation',
      'Unknown'
    ],
    default: 'Unknown'
  },
  default_status: {
    type: String,
    enum: [
      'New',
      'Unknown'
    ],
    default: 'New'
  },
  auto_assignment_rule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AssignmentRule'
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
SourceChannelSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Create channel_id before saving
SourceChannelSchema.pre('save', async function(next) {
  // Only generate ID for new documents
  if (!this.isNew || this.channel_id.indexOf('XXXX') === -1) {
    return next();
  }
  
  // Generate ID format: CHN-YYYYMMDD-XXXX (where XXXX is sequential)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the highest channel_id for today
  const lastChannel = await this.constructor.findOne(
    { channel_id: new RegExp(`^CHN-${dateStr}`) },
    { channel_id: 1 },
    { sort: { channel_id: -1 } }
  );
  
  let sequence = 1;
  if (lastChannel && lastChannel.channel_id) {
    const lastSequence = parseInt(lastChannel.channel_id.split('-')[2]);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  // Pad sequence with leading zeros
  const paddedSequence = sequence.toString().padStart(4, '0');
  this.channel_id = `CHN-${dateStr}-${paddedSequence}`;
  
  next();
});

module.exports = mongoose.model('SourceChannel', SourceChannelSchema);