const mongoose = require('mongoose');

const UserActivityLogSchema = new mongoose.Schema({
  log_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: UAL-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `UAL-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action_type: {
    type: String,
    required: true,
    enum: [
      'create',
      'update',
      'delete',
      'view',
      'assign',
      'link',
      'unlink',
      'status_change',
      'login',
      'logout',
      'other'
    ]
  },
  entity_type: {
    type: String,
    required: true,
    enum: [
      'enquiry',
      'project_profile',
      'product_profile',
      'amc_profile',
      'complaint_profile',
      'info_profile',
      'job_profile',
      'site_visit_schedule',
      'profile_mapping',
      'profile_link',
      'team',
      'team_user_map',
      'user',
      'role',
      'other'
    ]
  },
  entity_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  previous_state: {
    type: mongoose.Schema.Types.Mixed
  },
  new_state: {
    type: mongoose.Schema.Types.Mixed
  },
  ip_address: {
    type: String
  },
  user_agent: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  // This ensures that previous_state and new_state are stored as-is without type conversion
  minimize: false
});

// Pre-save hook to generate sequential log_id
UserActivityLogSchema.pre('save', async function(next) {
  if (this.log_id.includes('XXXX')) {
    try {
      // Find the latest log with the same date prefix
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `UAL-${dateStr}`;
      
      const lastLog = await this.constructor.findOne(
        { log_id: { $regex: `^${prefix}` } },
        { log_id: 1 },
        { sort: { log_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastLog) {
        const lastNumber = parseInt(lastLog.log_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Pad with leading zeros to make it 4 digits
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.log_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Create indexes for faster querying
UserActivityLogSchema.index({ user_id: 1, created_at: -1 });
UserActivityLogSchema.index({ entity_type: 1, entity_id: 1 });
UserActivityLogSchema.index({ action_type: 1 });
UserActivityLogSchema.index({ created_at: -1 });

module.exports = mongoose.model('UserActivityLog', UserActivityLogSchema);