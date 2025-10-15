const mongoose = require('mongoose');
const TeamUserMap = require('./TeamUserMap');

const TeamSchema = new mongoose.Schema({
  team_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: TEM-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `TEM-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: [100, 'Team name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  team_lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Team Lead is required']
  },
  territory: {
    type: String,
    required: [true, 'Territory is required'],
    trim: true,
    maxlength: [100, 'Territory cannot be more than 100 characters']
  },
  target_goals: {
    type: String,
    trim: true,
    maxlength: [500, 'Target Goals cannot be more than 500 characters']
  },
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot be more than 100 characters']
  },
  contact_email: {
    type: String,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  contact_phone: {
    type: String,
    trim: true,
    match: [
      /^\+?[1-9]\d{9,14}$/,
      'Please add a valid phone number'
    ]
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: [
      'Sales',
      'Marketing',
      'Engineering',
      'Support',
      'Finance',
      'HR',
      'Operations',
      'Management',
      'Legal',
      'Other'
    ]
  },
  team_type: {
    type: String,
    required: [true, 'Team type is required'],
    enum: [
      'project',
      'product',
      'amc',
      'complaint',
      'info',
      'job',
      'site_visit',
      'cross_functional',
      'other'
    ]
  },
  is_active: {
    type: Boolean,
    default: true
  },
  team_members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
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
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for member count
TeamSchema.virtual('member_count', {
  ref: 'TeamUserMap',
  localField: '_id',
  foreignField: 'team_id',
  count: true
});

// Pre-save hook to generate sequential team_id
TeamSchema.pre('save', async function(next) {
  if (this.team_id.includes('XXXX')) {
    try {
      // Find the latest team with the same date prefix
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `TEM-${dateStr}`;
      
      const lastTeam = await this.constructor.findOne(
        { team_id: { $regex: `^${prefix}` } },
        { team_id: 1 },
        { sort: { team_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastTeam) {
        const lastNumber = parseInt(lastTeam.team_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Pad with leading zeros to make it 4 digits
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.team_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Update the updated_at field on save
TeamSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Team', TeamSchema);