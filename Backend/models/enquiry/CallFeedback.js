const mongoose = require('mongoose');

const CallFeedbackSchema = new mongoose.Schema({
  feedback_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: CFB-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `CFB-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  call_log_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CallLog',
    required: [true, 'Call log ID is required']
  },
  enquiry_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enquiry',
    required: [true, 'Enquiry ID is required']
  },
  feedback_provider: {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    external_contact: {
      name: String,
      phone: String,
      email: String
    },
    provider_type: {
      type: String,
      enum: ['customer', 'agent', 'supervisor', 'system'],
      required: [true, 'Provider type is required']
    }
  },
  feedback_type: {
    type: String,
    enum: ['quality_rating', 'satisfaction_survey', 'complaint', 'compliment', 'suggestion', 'technical_issue'],
    required: [true, 'Feedback type is required']
  },
  overall_rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    required: [true, 'Overall rating is required']
  },
  detailed_ratings: {
    call_quality: {
      type: Number,
      min: 1,
      max: 5
    },
    agent_behavior: {
      type: Number,
      min: 1,
      max: 5
    },
    problem_resolution: {
      type: Number,
      min: 1,
      max: 5
    },
    response_time: {
      type: Number,
      min: 1,
      max: 5
    },
    knowledge_level: {
      type: Number,
      min: 1,
      max: 5
    },
    communication_clarity: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  feedback_text: {
    type: String,
    maxlength: [2000, 'Feedback text cannot exceed 2000 characters']
  },
  feedback_categories: [{
    category: {
      type: String,
      enum: [
        'audio_quality',
        'connection_issues',
        'agent_professionalism',
        'wait_time',
        'information_accuracy',
        'follow_up_required',
        'technical_support',
        'billing_inquiry',
        'general_inquiry'
      ]
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String
  }],
  sentiment_analysis: {
    sentiment_score: {
      type: Number,
      min: -1,
      max: 1
    },
    sentiment_label: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    },
    confidence_score: {
      type: Number,
      min: 0,
      max: 1
    },
    keywords: [String]
  },
  issues_reported: [{
    issue_type: {
      type: String,
      enum: [
        'audio_quality',
        'connection_dropped',
        'echo_noise',
        'delay_lag',
        'agent_unavailable',
        'wrong_information',
        'rude_behavior',
        'technical_problem',
        'billing_error',
        'other'
      ]
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    description: String,
    resolution_required: {
      type: Boolean,
      default: false
    }
  }],
  follow_up_required: {
    type: Boolean,
    default: false
  },
  follow_up_reason: {
    type: String,
    maxlength: [500, 'Follow-up reason cannot exceed 500 characters']
  },
  follow_up_deadline: {
    type: Date
  },
  resolution_status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'escalated', 'closed'],
    default: 'pending'
  },
  resolution_notes: {
    type: String,
    maxlength: [1000, 'Resolution notes cannot exceed 1000 characters']
  },
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolved_at: {
    type: Date
  },
  escalated_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  escalation_reason: {
    type: String,
    maxlength: [500, 'Escalation reason cannot exceed 500 characters']
  },
  feedback_source: {
    type: String,
    enum: ['post_call_survey', 'email_survey', 'sms_survey', 'web_form', 'phone_call', 'chat', 'manual_entry'],
    required: [true, 'Feedback source is required']
  },
  survey_response_time: {
    type: Number // Time taken to complete survey in seconds
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  verification_notes: {
    type: String
  },
  tags: [String],
  metadata: {
    ip_address: String,
    user_agent: String,
    device_info: String,
    survey_version: String,
    response_method: String,
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

// Pre-save hook to generate unique feedback_id
CallFeedbackSchema.pre('save', async function(next) {
  if (this.isNew && this.feedback_id.includes('XXXX')) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the last feedback for today
    const lastFeedback = await this.constructor.findOne({
      feedback_id: new RegExp(`^CFB-${dateStr}-`)
    }).sort({ feedback_id: -1 });
    
    let sequence = 1;
    if (lastFeedback) {
      const lastSequence = parseInt(lastFeedback.feedback_id.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.feedback_id = `CFB-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }
  
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
CallFeedbackSchema.index({ call_log_id: 1 });
CallFeedbackSchema.index({ enquiry_id: 1 });
CallFeedbackSchema.index({ 'feedback_provider.user_id': 1 });
CallFeedbackSchema.index({ feedback_type: 1 });
CallFeedbackSchema.index({ overall_rating: 1 });
CallFeedbackSchema.index({ resolution_status: 1 });
CallFeedbackSchema.index({ created_at: -1 });
CallFeedbackSchema.index({ feedback_id: 1 });
CallFeedbackSchema.index({ follow_up_required: 1 });

// Virtual for average detailed rating
CallFeedbackSchema.virtual('average_detailed_rating').get(function() {
  const ratings = this.detailed_ratings;
  if (!ratings) return null;
  
  const values = Object.values(ratings).filter(val => val !== null && val !== undefined);
  if (values.length === 0) return null;
  
  const sum = values.reduce((acc, val) => acc + val, 0);
  return (sum / values.length).toFixed(2);
});

// Virtual for feedback summary
CallFeedbackSchema.virtual('feedback_summary').get(function() {
  const rating = this.overall_rating;
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 3.5) return 'Good';
  if (rating >= 2.5) return 'Average';
  if (rating >= 1.5) return 'Poor';
  return 'Very Poor';
});

// Method to mark as resolved
CallFeedbackSchema.methods.markAsResolved = function(resolvedBy, notes) {
  this.resolution_status = 'resolved';
  this.resolved_by = resolvedBy;
  this.resolved_at = new Date();
  if (notes) this.resolution_notes = notes;
  return this.save();
};

// Method to escalate feedback
CallFeedbackSchema.methods.escalate = function(escalatedTo, reason) {
  this.resolution_status = 'escalated';
  this.escalated_to = escalatedTo;
  this.escalation_reason = reason;
  return this.save();
};

// Method to calculate response time
CallFeedbackSchema.methods.getResponseTime = async function() {
  const callLog = await mongoose.model('CallLog').findById(this.call_log_id);
  if (!callLog || !callLog.call_end_time) return null;
  
  return Math.floor((this.created_at - callLog.call_end_time) / (1000 * 60)); // in minutes
};

// Static method to get feedback analytics
CallFeedbackSchema.statics.getFeedbackAnalytics = function(startDate, endDate, filters = {}) {
  const matchStage = {
    created_at: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (filters.feedback_type) {
    matchStage.feedback_type = filters.feedback_type;
  }
  
  if (filters.provider_type) {
    matchStage['feedback_provider.provider_type'] = filters.provider_type;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          rating: '$overall_rating',
          type: '$feedback_type'
        },
        count: { $sum: 1 },
        avg_detailed_rating: { $avg: '$average_detailed_rating' }
      }
    },
    {
      $sort: { '_id.rating': -1 }
    }
  ]);
};

// Static method to get satisfaction trends
CallFeedbackSchema.statics.getSatisfactionTrends = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        created_at: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
        },
        avg_rating: { $avg: '$overall_rating' },
        total_feedback: { $sum: 1 },
        positive_feedback: {
          $sum: { $cond: [{ $gte: ['$overall_rating', 4] }, 1, 0] }
        },
        negative_feedback: {
          $sum: { $cond: [{ $lte: ['$overall_rating', 2] }, 1, 0] }
        }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);
};

// Static method to get agent performance feedback
CallFeedbackSchema.statics.getAgentFeedbackStats = function(agentId, startDate, endDate) {
  return this.aggregate([
    {
      $lookup: {
        from: 'calllogs',
        localField: 'call_log_id',
        foreignField: '_id',
        as: 'call_info'
      }
    },
    {
      $match: {
        $or: [
          { 'call_info.caller.user_id': new mongoose.Types.ObjectId(agentId) },
          { 'call_info.recipient.user_id': new mongoose.Types.ObjectId(agentId) }
        ],
        created_at: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: null,
        avg_overall_rating: { $avg: '$overall_rating' },
        avg_agent_behavior: { $avg: '$detailed_ratings.agent_behavior' },
        avg_knowledge_level: { $avg: '$detailed_ratings.knowledge_level' },
        avg_communication_clarity: { $avg: '$detailed_ratings.communication_clarity' },
        total_feedback: { $sum: 1 },
        positive_feedback: {
          $sum: { $cond: [{ $gte: ['$overall_rating', 4] }, 1, 0] }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('CallFeedback', CallFeedbackSchema);