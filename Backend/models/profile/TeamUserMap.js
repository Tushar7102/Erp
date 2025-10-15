const mongoose = require('mongoose');

const TeamUserMapSchema = new mongoose.Schema({
  map_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: TUM-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `TUM-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  role_within_team: {
    type: String,
    required: true,
    enum: [
      'team_lead',
      'manager',
      'member',
      'observer',
      'admin',
      'support'
    ]
  },
  active_flag: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Pre-save hook to generate sequential map_id
TeamUserMapSchema.pre('save', async function(next) {
  if (this.map_id.includes('XXXX')) {
    try {
      // Find the latest mapping with the same date prefix
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `TUM-${dateStr}`;
      
      const lastMapping = await this.constructor.findOne(
        { map_id: { $regex: `^${prefix}` } },
        { map_id: 1 },
        { sort: { map_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastMapping) {
        const lastNumber = parseInt(lastMapping.map_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Pad with leading zeros to make it 4 digits
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.map_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Update the updated_at field on save
TeamUserMapSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Compound index to ensure a user can only have one active role in a team
TeamUserMapSchema.index({ user_id: 1, team_id: 1, active_flag: 1 }, { unique: true, partialFilterExpression: { active_flag: true } });

module.exports = mongoose.model('TeamUserMap', TeamUserMapSchema);