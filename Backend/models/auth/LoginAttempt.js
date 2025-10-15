const mongoose = require('mongoose');

const LoginAttemptSchema = new mongoose.Schema({
  attempt_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: ATT-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `ATT-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  ip_address: {
    type: String,
    default: null
  },
  device_info: {
    type: String,
    default: null
  },
  location: {
    country: {
      type: String,
      default: 'Unknown'
    },
    region: {
      type: String,
      default: 'Unknown'
    },
    city: {
      type: String,
      default: 'Unknown'
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    }
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    required: true
  },
  reason: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
LoginAttemptSchema.index({ user_id: 1, timestamp: -1 });
LoginAttemptSchema.index({ email: 1, timestamp: -1 });
LoginAttemptSchema.index({ ip_address: 1, timestamp: -1 });

// Create attempt_id before saving
LoginAttemptSchema.pre('save', async function(next) {
  // Only generate ID for new documents
  if (!this.isNew || this.attempt_id.indexOf('XXXX') === -1) {
    return next();
  }
  
  // Generate ID format: ATT-YYYYMMDD-XXXX (where XXXX is sequential)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the highest attempt_id for today
  const lastAttempt = await this.constructor.findOne(
    { attempt_id: new RegExp(`^ATT-${dateStr}`) },
    { attempt_id: 1 },
    { sort: { attempt_id: -1 } }
  );
  
  let sequence = 1;
  if (lastAttempt && lastAttempt.attempt_id) {
    const lastSequence = parseInt(lastAttempt.attempt_id.split('-')[2]);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  // Pad sequence with leading zeros
  const paddedSequence = sequence.toString().padStart(4, '0');
  this.attempt_id = `ATT-${dateStr}-${paddedSequence}`;
  
  next();
});

module.exports = mongoose.model('LoginAttempt', LoginAttemptSchema);