const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const AssignmentLogSchema = new mongoose.Schema({
  assignment_log_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: ALOGXXXX
      return `ALOGXXXX`;
    }
  },
  enquiry_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enquiry',
    required: [true, 'Enquiry ID is required']
  },
  assignment_type: {
    type: String,
    enum: ['user', 'team', 'queue', 'auto_assignment', 'manual_assignment', 'reassignment'],
    required: [true, 'Assignment type is required']
  },
  old_assignee: {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    team_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    queue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Queue'
    }
  },
  new_assignee: {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    team_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    queue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Queue'
    }
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned by user is required']
  },
  assignment_reason: {
    type: String,
    enum: [
      'initial_assignment',
      'workload_balancing',
      'skill_match',
      'escalation',
      'user_request',
      'system_auto',
      'manual_override',
      'availability_change',
      'performance_based',
      'geographic_routing'
    ],
    required: [true, 'Assignment reason is required']
  },
  priority_level: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent', 'critical'],
    default: 'medium'
  },
  assignment_method: {
    type: String,
    enum: ['round_robin', 'skill_based', 'workload_based', 'manual', 'random', 'priority_based'],
    required: [true, 'Assignment method is required']
  },
  remarks: {
    type: String,
    maxlength: [1000, 'Remarks cannot exceed 1000 characters']
  },
  assignment_duration: {
    type: Number, // Duration in minutes
    default: null
  },
  is_active: {
    type: Boolean,
    default: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  ip_address: {
    type: String
  },
  user_agent: {
    type: String
  },
  metadata: {
    automation_rule_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AutomationRule'
    },
    workload_score: Number,
    skill_match_score: Number,
    geographic_match: Boolean,
    additional_data: mongoose.Schema.Types.Mixed
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to generate unique assignment_log_id
AssignmentLogSchema.pre('save', async function(next) {
  if (this.isNew && this.assignment_log_id.includes('XXXX')) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the last assignment log for today
    const lastLog = await this.constructor.findOne({
      assignment_log_id: new RegExp(`^ALOG-${dateStr}-`)
    }).sort({ assignment_log_id: -1 });
    
    let sequence = 1;
    if (lastLog) {
      const lastSequence = parseInt(lastLog.assignment_log_id.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.assignment_log_id = `ALOG-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

// Indexes for better performance
AssignmentLogSchema.index({ enquiry_id: 1, timestamp: -1 });
AssignmentLogSchema.index({ 'new_assignee.user_id': 1 });
AssignmentLogSchema.index({ 'new_assignee.team_id': 1 });
AssignmentLogSchema.index({ assigned_by: 1 });
AssignmentLogSchema.index({ assignment_type: 1 });
AssignmentLogSchema.index({ timestamp: -1 });
AssignmentLogSchema.index({ assignment_log_id: 1 });
AssignmentLogSchema.index({ is_active: 1 });

// Apply the pagination plugin
AssignmentLogSchema.plugin(mongoosePaginate);

// Virtual for formatted timestamp
AssignmentLogSchema.virtual('formatted_timestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Method to calculate assignment duration
AssignmentLogSchema.methods.calculateDuration = async function() {
  if (this.assignment_duration) {
    return this.assignment_duration;
  }
  
  const nextAssignment = await this.constructor.findOne({
    enquiry_id: this.enquiry_id,
    timestamp: { $gt: this.timestamp }
  }).sort({ timestamp: 1 });
  
  if (nextAssignment) {
    const duration = Math.floor((nextAssignment.timestamp - this.timestamp) / (1000 * 60));
    this.assignment_duration = duration;
    await this.save();
    return duration;
  }
  
  return Math.floor((Date.now() - this.timestamp) / (1000 * 60));
};

// Static method to get assignment history for an enquiry
AssignmentLogSchema.statics.getEnquiryAssignmentHistory = function(enquiryId) {
  return this.find({ enquiry_id: enquiryId })
    .populate('old_assignee.user_id', 'name email')
    .populate('old_assignee.team_id', 'name')
    .populate('new_assignee.user_id', 'name email')
    .populate('new_assignee.team_id', 'name')
    .populate('assigned_by', 'name email')
    .sort({ timestamp: -1 });
};

// Static method to get user assignment analytics
AssignmentLogSchema.statics.getUserAssignmentStats = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        'new_assignee.user_id': new mongoose.Types.ObjectId(userId),
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          assignment_type: '$assignment_type'
        },
        count: { $sum: 1 },
        avg_duration: { $avg: '$assignment_duration' }
      }
    },
    {
      $sort: { '_id.date': -1 }
    }
  ]);
};

// Static method to get team workload distribution
AssignmentLogSchema.statics.getTeamWorkloadDistribution = function(teamId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        'new_assignee.team_id': new mongoose.Types.ObjectId(teamId),
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'new_assignee.user_id',
        foreignField: '_id',
        as: 'user_info'
      }
    },
    {
      $group: {
        _id: '$new_assignee.user_id',
        user_name: { $first: { $arrayElemAt: ['$user_info.name', 0] } },
        total_assignments: { $sum: 1 },
        avg_duration: { $avg: '$assignment_duration' },
        assignment_types: { $addToSet: '$assignment_type' }
      }
    },
    {
      $sort: { total_assignments: -1 }
    }
  ]);
};

module.exports = mongoose.model('AssignmentLog', AssignmentLogSchema);