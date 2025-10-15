const mongoose = require('mongoose');
const crypto = require('crypto');

const ApiAccessTokenSchema = new mongoose.Schema({
  token_id: {
    type: String,
    unique: true,
    required: [true, 'Token ID is required'],
    default: function() {
      // Generate ID format: API-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `API-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  token_name: {
    type: String,
    required: [true, 'Token name is required'],
    trim: true,
    maxlength: [100, 'Token name cannot be more than 100 characters']
  },
  token_hash: {
    type: String,
    required: [true, 'Token hash is required']
  },
  token_prefix: {
    type: String,
    required: [true, 'Token prefix is required'],
    maxlength: [10, 'Token prefix cannot be more than 10 characters']
  },
  scopes: [{
    type: String,
    enum: [
      'read:profile', 'write:profile',
      'read:users', 'write:users',
      'read:enquiries', 'write:enquiries',
      'read:calls', 'write:calls',
      'read:reports', 'write:reports',
      'read:settings', 'write:settings',
      'admin:all'
    ]
  }],
  permissions: {
    can_read: { type: Boolean, default: true },
    can_write: { type: Boolean, default: false },
    can_delete: { type: Boolean, default: false },
    can_admin: { type: Boolean, default: false }
  },
  rate_limit: {
    requests_per_minute: { type: Number, default: 60 },
    requests_per_hour: { type: Number, default: 1000 },
    requests_per_day: { type: Number, default: 10000 }
  },
  usage_stats: {
    total_requests: { type: Number, default: 0 },
    last_used: { type: Date },
    requests_today: { type: Number, default: 0 },
    requests_this_hour: { type: Number, default: 0 },
    requests_this_minute: { type: Number, default: 0 },
    last_reset_daily: { type: Date, default: Date.now },
    last_reset_hourly: { type: Date, default: Date.now },
    last_reset_minute: { type: Date, default: Date.now }
  },
  ip_restrictions: [{
    ip_address: { type: String },
    description: { type: String }
  }],
  domain_restrictions: [{
    domain: { type: String },
    description: { type: String }
  }],
  expires_at: {
    type: Date,
    required: [true, 'Expiration date is required']
  },
  is_active: {
    type: Boolean,
    default: true
  },
  is_revoked: {
    type: Boolean,
    default: false
  },
  revoked_at: {
    type: Date
  },
  revoked_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  revoked_reason: {
    type: String
  },
  last_activity: {
    ip_address: { type: String },
    user_agent: { type: String },
    endpoint: { type: String },
    method: { type: String },
    timestamp: { type: Date }
  },
  security_flags: {
    is_suspicious: { type: Boolean, default: false },
    failed_attempts: { type: Number, default: 0 },
    last_failed_attempt: { type: Date },
    blocked_until: { type: Date }
  },
  metadata: {
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

// Create token_id before saving
ApiAccessTokenSchema.pre('save', async function(next) {
  // Only generate ID for new documents
  if (!this.isNew) {
    this.updated_at = Date.now();
    return next();
  }
  
  // Generate ID format: API-YYYYMMDD-XXXX (where XXXX is sequential)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the highest token_id for today
  const lastToken = await this.constructor.findOne(
    { token_id: new RegExp(`^API-${dateStr}`) },
    { token_id: 1 },
    { sort: { token_id: -1 } }
  );
  
  let sequence = 1;
  if (lastToken && lastToken.token_id) {
    const lastSequence = parseInt(lastToken.token_id.split('-')[2]);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  // Pad sequence with leading zeros
  const paddedSequence = sequence.toString().padStart(4, '0');
  this.token_id = `API-${dateStr}-${paddedSequence}`;
  
  next();
});

// Indexes for better performance
ApiAccessTokenSchema.index({ user_id: 1 });
ApiAccessTokenSchema.index({ token_hash: 1 });
ApiAccessTokenSchema.index({ token_prefix: 1 });
ApiAccessTokenSchema.index({ is_active: 1 });
ApiAccessTokenSchema.index({ expires_at: 1 });
ApiAccessTokenSchema.index({ created_at: -1 });

// Instance methods
ApiAccessTokenSchema.methods.generateToken = function() {
  // Generate a secure random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Create prefix (first 8 characters)
  this.token_prefix = token.substring(0, 8);
  
  // Hash the full token for storage
  this.token_hash = crypto.createHash('sha256').update(token).digest('hex');
  
  // Return the full token (only time it's available in plain text)
  return `cosmic_${token}`;
};

ApiAccessTokenSchema.methods.verifyToken = function(providedToken) {
  // Remove prefix if present
  const cleanToken = providedToken.replace(/^cosmic_/, '');
  
  // Hash the provided token
  const hashedToken = crypto.createHash('sha256').update(cleanToken).digest('hex');
  
  // Compare with stored hash
  return this.token_hash === hashedToken;
};

ApiAccessTokenSchema.methods.updateUsage = function(endpoint, method, ipAddress, userAgent) {
  const now = new Date();
  
  // Update general stats
  this.usage_stats.total_requests += 1;
  this.usage_stats.last_used = now;
  
  // Reset counters if needed
  const currentMinute = Math.floor(now.getTime() / 60000);
  const lastMinute = Math.floor(this.usage_stats.last_reset_minute.getTime() / 60000);
  
  if (currentMinute > lastMinute) {
    this.usage_stats.requests_this_minute = 0;
    this.usage_stats.last_reset_minute = now;
  }
  
  const currentHour = Math.floor(now.getTime() / 3600000);
  const lastHour = Math.floor(this.usage_stats.last_reset_hourly.getTime() / 3600000);
  
  if (currentHour > lastHour) {
    this.usage_stats.requests_this_hour = 0;
    this.usage_stats.last_reset_hourly = now;
  }
  
  const currentDay = Math.floor(now.getTime() / 86400000);
  const lastDay = Math.floor(this.usage_stats.last_reset_daily.getTime() / 86400000);
  
  if (currentDay > lastDay) {
    this.usage_stats.requests_today = 0;
    this.usage_stats.last_reset_daily = now;
  }
  
  // Increment counters
  this.usage_stats.requests_this_minute += 1;
  this.usage_stats.requests_this_hour += 1;
  this.usage_stats.requests_today += 1;
  
  // Update last activity
  this.last_activity = {
    ip_address: ipAddress,
    user_agent: userAgent,
    endpoint: endpoint,
    method: method,
    timestamp: now
  };
  
  return this.save();
};

ApiAccessTokenSchema.methods.checkRateLimit = function() {
  const limits = this.rate_limit;
  const stats = this.usage_stats;
  
  if (stats.requests_this_minute >= limits.requests_per_minute) {
    return { allowed: false, reason: 'Rate limit exceeded: requests per minute' };
  }
  
  if (stats.requests_this_hour >= limits.requests_per_hour) {
    return { allowed: false, reason: 'Rate limit exceeded: requests per hour' };
  }
  
  if (stats.requests_today >= limits.requests_per_day) {
    return { allowed: false, reason: 'Rate limit exceeded: requests per day' };
  }
  
  return { allowed: true };
};

ApiAccessTokenSchema.methods.revokeToken = function(reason, userId) {
  this.is_revoked = true;
  this.revoked_at = new Date();
  this.revoked_reason = reason;
  this.revoked_by = userId;
  this.updated_by = userId;
  return this.save();
};

ApiAccessTokenSchema.methods.hasScope = function(requiredScope) {
  return this.scopes.includes(requiredScope) || this.scopes.includes('admin:all');
};

ApiAccessTokenSchema.methods.hasPermission = function(permission) {
  switch(permission) {
    case 'read': return this.permissions.can_read;
    case 'write': return this.permissions.can_write;
    case 'delete': return this.permissions.can_delete;
    case 'admin': return this.permissions.can_admin;
    default: return false;
  }
};

// Static methods
ApiAccessTokenSchema.statics.findByToken = function(token) {
  // Remove prefix if present
  const cleanToken = token.replace(/^cosmic_/, '');
  
  // Get prefix for faster lookup
  const prefix = cleanToken.substring(0, 8);
  
  // Hash the token
  const hashedToken = crypto.createHash('sha256').update(cleanToken).digest('hex');
  
  return this.findOne({
    token_prefix: prefix,
    token_hash: hashedToken,
    is_active: true,
    is_revoked: false,
    expires_at: { $gt: new Date() }
  }).populate('user_id');
};

ApiAccessTokenSchema.statics.getUserTokens = function(userId, activeOnly = true) {
  const filter = { user_id: userId };
  if (activeOnly) {
    filter.is_active = true;
    filter.is_revoked = false;
    filter.expires_at = { $gt: new Date() };
  }
  return this.find(filter).sort({ created_at: -1 });
};

ApiAccessTokenSchema.statics.getExpiredTokens = function() {
  return this.find({
    $or: [
      { expires_at: { $lte: new Date() } },
      { is_revoked: true }
    ]
  });
};

ApiAccessTokenSchema.statics.cleanupExpiredTokens = function() {
  return this.deleteMany({
    $or: [
      { expires_at: { $lte: new Date() } },
      { is_revoked: true }
    ]
  });
};

module.exports = mongoose.model('ApiAccessToken', ApiAccessTokenSchema);