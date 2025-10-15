const mongoose = require('mongoose');

const DeviceRegistrySchema = new mongoose.Schema({
  device_id: {
    type: String,
    unique: true,
    required: [true, 'Device ID is required'],
    default: function() {
      // Generate ID format: DEV-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `DEV-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  device_name: {
    type: String,
    required: [true, 'Device name is required'],
    trim: true,
    maxlength: [100, 'Device name cannot be more than 100 characters']
  },
  device_type: {
    type: String,
    required: [true, 'Device type is required'],
    enum: ['mobile', 'tablet', 'desktop', 'laptop', 'other'],
    default: 'desktop'
  },
  device_fingerprint: {
    type: String,
    required: [true, 'Device fingerprint is required']
  },
  browser_info: {
    name: { type: String },
    version: { type: String },
    user_agent: { type: String }
  },
  os_info: {
    name: { type: String },
    version: { type: String },
    platform: { type: String }
  },
  screen_resolution: {
    width: { type: Number },
    height: { type: Number }
  },
  ip_address: {
    type: String,
    required: [true, 'IP address is required']
  },
  location: {
    country: { type: String },
    region: { type: String },
    city: { type: String },
    timezone: { type: String }
  },
  is_trusted: {
    type: Boolean,
    default: false
  },
  is_active: {
    type: Boolean,
    default: true
  },
  last_login: {
    type: Date
  },
  login_count: {
    type: Number,
    default: 0
  },
  security_flags: {
    is_suspicious: { type: Boolean, default: false },
    risk_score: { type: Number, default: 0, min: 0, max: 100 },
    blocked_reason: { type: String },
    blocked_at: { type: Date },
    blocked_by: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  device_metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Create device_id before saving
DeviceRegistrySchema.pre('save', async function(next) {
  // Only generate ID for new documents
  if (!this.isNew) {
    this.updated_at = Date.now();
    return next();
  }
  
  // Generate ID format: DEV-YYYYMMDD-XXXX (where XXXX is sequential)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the highest device_id for today
  const lastDevice = await this.constructor.findOne(
    { device_id: new RegExp(`^DEV-${dateStr}`) },
    { device_id: 1 },
    { sort: { device_id: -1 } }
  );
  
  let sequence = 1;
  if (lastDevice && lastDevice.device_id) {
    const lastSequence = parseInt(lastDevice.device_id.split('-')[2]);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  // Pad sequence with leading zeros
  const paddedSequence = sequence.toString().padStart(4, '0');
  this.device_id = `DEV-${dateStr}-${paddedSequence}`;
  
  next();
});

// Indexes for better performance
DeviceRegistrySchema.index({ user_id: 1 });
DeviceRegistrySchema.index({ device_fingerprint: 1 });
DeviceRegistrySchema.index({ ip_address: 1 });
DeviceRegistrySchema.index({ is_active: 1 });
DeviceRegistrySchema.index({ is_trusted: 1 });
DeviceRegistrySchema.index({ created_at: -1 });

// Instance methods
DeviceRegistrySchema.methods.updateLoginInfo = function() {
  this.last_login = new Date();
  this.login_count += 1;
  return this.save();
};

DeviceRegistrySchema.methods.markAsTrusted = function(userId) {
  this.is_trusted = true;
  this.updated_by = userId;
  this.updated_at = new Date();
  return this.save();
};

DeviceRegistrySchema.methods.blockDevice = function(reason, userId) {
  this.is_active = false;
  this.security_flags.blocked_reason = reason;
  this.security_flags.blocked_at = new Date();
  this.security_flags.blocked_by = userId;
  this.updated_by = userId;
  this.updated_at = new Date();
  return this.save();
};

DeviceRegistrySchema.methods.updateRiskScore = function(score) {
  this.security_flags.risk_score = Math.max(0, Math.min(100, score));
  this.security_flags.is_suspicious = score > 70;
  this.updated_at = new Date();
  return this.save();
};

// Static methods
DeviceRegistrySchema.statics.findByFingerprint = function(fingerprint) {
  return this.findOne({ device_fingerprint: fingerprint });
};

DeviceRegistrySchema.statics.getUserDevices = function(userId, activeOnly = true) {
  const filter = { user_id: userId };
  if (activeOnly) filter.is_active = true;
  return this.find(filter).sort({ last_login: -1 });
};

DeviceRegistrySchema.statics.getSuspiciousDevices = function() {
  return this.find({ 
    'security_flags.is_suspicious': true,
    is_active: true 
  }).populate('user_id', 'name email');
};

module.exports = mongoose.model('DeviceRegistry', DeviceRegistrySchema);