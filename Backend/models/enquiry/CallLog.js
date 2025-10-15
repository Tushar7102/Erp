const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const CallLogSchema = new mongoose.Schema({
  call_log_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: CALL-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `CALL-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  enquiry_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enquiry',
    required: [true, 'Enquiry ID is required']
  },
  call_type: {
    type: String,
    enum: ['voice', 'video', 'conference'],
    required: [true, 'Call type is required']
  },
  call_direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: [true, 'Call direction is required']
  },
  caller: {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    external_contact: {
      name: String,
      phone: String,
      email: String
    }
  },
  recipient: {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    external_contact: {
      name: String,
      phone: String,
      email: String
    }
  },
  call_status: {
    type: String,
    enum: ['initiated', 'ringing', 'answered', 'completed', 'missed', 'busy', 'failed', 'cancelled'],
    default: 'initiated'
  },
  call_start_time: {
    type: Date,
    required: [true, 'Call start time is required']
  },
  call_end_time: {
    type: Date
  },
  call_duration: {
    type: Number, // Duration in seconds
    default: 0
  },
  recording_url: {
    type: String
  },
  recording_duration: {
    type: Number // Duration in seconds
  },
  call_quality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  call_purpose: {
    type: String,
    enum: [
      'initial_contact',
      'follow_up',
      'information_gathering',
      'requirement_discussion',
      'quotation_discussion',
      'complaint_resolution',
      'feedback_collection',
      'closure_call',
      'escalation',
      'other'
    ],
    required: [true, 'Call purpose is required']
  },
  call_outcome: {
    type: String,
    enum: [
      'information_provided',
      'requirement_captured',
      'quotation_sent',
      'meeting_scheduled',
      'follow_up_required',
      'enquiry_closed',
      'escalated',
      'no_response',
      'wrong_number',
      'callback_requested',
      'converted_to_lead'
    ]
  },
  call_notes: {
    type: String,
    maxlength: [2000, 'Call notes cannot exceed 2000 characters']
  },
  call_summary: {
    type: String,
    maxlength: [500, 'Call summary cannot exceed 500 characters']
  },
  next_action: {
    action_type: {
      type: String,
      enum: ['call_back', 'send_email', 'send_quotation', 'schedule_meeting', 'escalate', 'close', 'none']
    },
    action_date: Date,
    action_notes: String
  },
  participants: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['primary', 'secondary', 'observer']
    },
    join_time: Date,
    leave_time: Date
  }],
  integration_details: {
    provider: {
      type: String,
      enum: ['twilio', 'zoom', 'teams', 'internal', 'other']
    },
    external_call_id: String,
    webhook_data: mongoose.Schema.Types.Mixed
  },
  cost: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  tags: [String],
  is_automated: {
    type: Boolean,
    default: false
  },
  automation_rule_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutomationRule'
  },
  metadata: {
    ip_address: String,
    user_agent: String,
    device_info: String,
    location: {
      country: String,
      state: String,
      city: String
    },
    call_metrics: {
      connection_time: Number,
      audio_quality_score: Number,
      network_quality: String
    },
    additional_data: mongoose.Schema.Types.Mixed
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

// Pre-save hook to generate unique call_log_id and calculate duration
CallLogSchema.pre('save', async function(next) {
  if (this.isNew && this.call_log_id.includes('XXXX')) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the last call log for today
    const lastLog = await this.constructor.findOne({
      call_log_id: new RegExp(`^CALL-${dateStr}-`)
    }).sort({ call_log_id: -1 });
    
    let sequence = 1;
    if (lastLog) {
      const lastSequence = parseInt(lastLog.call_log_id.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.call_log_id = `CALL-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }
  
  // Calculate call duration if end time is provided
  if (this.call_end_time && this.call_start_time) {
    this.call_duration = Math.floor((this.call_end_time - this.call_start_time) / 1000);
  }
  
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
CallLogSchema.index({ enquiry_id: 1, call_start_time: -1 });
CallLogSchema.index({ call_type: 1 });
CallLogSchema.index({ call_direction: 1 });
CallLogSchema.index({ call_status: 1 });
CallLogSchema.index({ 'caller.user_id': 1 });
CallLogSchema.index({ 'recipient.user_id': 1 });
CallLogSchema.index({ call_start_time: -1 });
CallLogSchema.index({ call_log_id: 1 });
CallLogSchema.index({ call_purpose: 1 });

// Virtual for formatted call duration
CallLogSchema.virtual('formatted_duration').get(function() {
  if (!this.call_duration) return '0:00';
  
  const minutes = Math.floor(this.call_duration / 60);
  const seconds = this.call_duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for call status display
CallLogSchema.virtual('status_display').get(function() {
  const statusMap = {
    'initiated': 'Call Initiated',
    'ringing': 'Ringing',
    'answered': 'Call Answered',
    'completed': 'Call Completed',
    'missed': 'Missed Call',
    'busy': 'Busy',
    'failed': 'Call Failed',
    'cancelled': 'Call Cancelled'
  };
  return statusMap[this.call_status] || this.call_status;
});

// Method to end call
CallLogSchema.methods.endCall = function(outcome, notes) {
  this.call_end_time = new Date();
  this.call_status = 'completed';
  if (outcome) this.call_outcome = outcome;
  if (notes) this.call_notes = notes;
  return this.save();
};

// Method to mark as missed
CallLogSchema.methods.markAsMissed = function() {
  this.call_status = 'missed';
  this.call_end_time = new Date();
  return this.save();
};

// Static method to get call history for an enquiry
CallLogSchema.statics.getEnquiryCallHistory = function(enquiryId) {
  return this.find({ enquiry_id: enquiryId })
    .populate('caller.user_id', 'name email')
    .populate('recipient.user_id', 'name email')
    .populate('participants.user_id', 'name email')
    .sort({ call_start_time: -1 });
};

// Static method to get call analytics
CallLogSchema.statics.getCallAnalytics = function(startDate, endDate, filters = {}) {
  const matchStage = {
    call_start_time: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (filters.call_type) {
    matchStage.call_type = filters.call_type;
  }
  
  if (filters.call_direction) {
    matchStage.call_direction = filters.call_direction;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          type: '$call_type',
          direction: '$call_direction',
          status: '$call_status'
        },
        count: { $sum: 1 },
        total_duration: { $sum: '$call_duration' },
        avg_duration: { $avg: '$call_duration' },
        total_cost: { $sum: '$cost.amount' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get user call statistics
CallLogSchema.statics.getUserCallStats = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { 'caller.user_id': new mongoose.Types.ObjectId(userId) },
          { 'recipient.user_id': new mongoose.Types.ObjectId(userId) }
        ],
        call_start_time: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$call_status',
        count: { $sum: 1 },
        total_duration: { $sum: '$call_duration' },
        avg_duration: { $avg: '$call_duration' }
      }
    }
  ]);
};

// Apply the mongoose-paginate-v2 plugin to enable pagination
CallLogSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('CallLog', CallLogSchema);