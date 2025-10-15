const mongoose = require('mongoose');

const InfoFeedbackSchema = new mongoose.Schema({
  feedback_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: FBK-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `FBK-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  info_profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfoProfile',
    required: [true, 'Info profile reference is required']
  },
  info_response: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfoResponse'
  },
  feedback_type: {
    type: String,
    required: [true, 'Feedback type is required'],
    enum: [
      'Service Rating',
      'Response Quality',
      'Resolution Time',
      'Communication',
      'Overall Experience',
      'Complaint',
      'Suggestion',
      'Compliment',
      'Feature Request',
      'Bug Report',
      'General Feedback',
      'Follow-up Feedback',
      'Exit Feedback'
    ]
  },
  feedback_category: {
    type: String,
    enum: [
      'Service Quality',
      'Technical Support',
      'Customer Service',
      'Product Quality',
      'Process Improvement',
      'Staff Behavior',
      'Response Time',
      'Resolution Quality',
      'Communication',
      'Documentation',
      'User Experience',
      'Other'
    ]
  },
  rating_scale: {
    type: String,
    enum: ['1-5', '1-10', 'Thumbs', 'Stars', 'NPS', 'CSAT', 'CES'],
    default: '1-5'
  },
  rating_value: {
    type: Number,
    min: 0,
    max: 10
  },
  rating_label: {
    type: String,
    enum: ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent', 'Thumbs Up', 'Thumbs Down']
  },
  nps_score: {
    type: Number,
    min: 0,
    max: 10
  },
  nps_category: {
    type: String,
    enum: ['Detractor', 'Passive', 'Promoter']
  },
  csat_score: {
    type: Number,
    min: 1,
    max: 5
  },
  ces_score: {
    type: Number,
    min: 1,
    max: 7
  },
  feedback_title: {
    type: String,
    maxlength: [200, 'Feedback title cannot exceed 200 characters']
  },
  feedback_content: {
    type: String,
    required: [true, 'Feedback content is required'],
    maxlength: [5000, 'Feedback content cannot exceed 5000 characters']
  },
  feedback_summary: {
    type: String,
    maxlength: [500, 'Feedback summary cannot exceed 500 characters']
  },
  feedback_source: {
    type: String,
    required: [true, 'Feedback source is required'],
    enum: ['Email', 'WhatsApp', 'SMS', 'Phone', 'Web Portal', 'Mobile App', 'Survey', 'In-Person', 'Social Media']
  },
  survey_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey'
  },
  survey_name: String,
  question_responses: [{
    question_id: String,
    question_text: String,
    question_type: {
      type: String,
      enum: ['Text', 'Rating', 'Multiple Choice', 'Checkbox', 'Yes/No']
    },
    response_value: String,
    rating_value: Number
  }],
  customer_details: {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    name: String,
    email: String,
    phone: String,
    company: String,
    designation: String,
    is_verified: {
      type: Boolean,
      default: false
    }
  },
  submitted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  is_anonymous: {
    type: Boolean,
    default: false
  },
  sentiment_analysis: {
    sentiment_score: {
      type: Number,
      min: -1,
      max: 1
    },
    sentiment_label: {
      type: String,
      enum: ['Very Negative', 'Negative', 'Neutral', 'Positive', 'Very Positive']
    },
    confidence_score: {
      type: Number,
      min: 0,
      max: 1
    },
    emotions: [{
      emotion: String,
      confidence: Number
    }]
  },
  keywords: [String],
  topics: [String],
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  feedback_status: {
    type: String,
    enum: ['New', 'Under Review', 'In Progress', 'Resolved', 'Closed', 'Escalated'],
    default: 'New'
  },
  resolution_status: {
    type: String,
    enum: ['Pending', 'Acknowledged', 'Investigating', 'Resolved', 'Cannot Resolve', 'Duplicate'],
    default: 'Pending'
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assigned_team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  escalated_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  escalation_reason: String,
  escalation_date: Date,
  response_required: {
    type: Boolean,
    default: true
  },
  response_deadline: Date,
  response_content: String,
  response_date: Date,
  responded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  follow_up_required: {
    type: Boolean,
    default: false
  },
  follow_up_date: Date,
  follow_up_notes: String,
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfoAttachment'
  }],
  related_tickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfoProfile'
  }],
  improvement_actions: [{
    action_description: String,
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    due_date: Date,
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending'
    },
    completion_date: Date,
    notes: String
  }],
  impact_assessment: {
    business_impact: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical']
    },
    customer_impact: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical']
    },
    financial_impact: Number,
    reputation_impact: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical']
    }
  },
  resolution_details: {
    root_cause: String,
    solution_provided: String,
    preventive_measures: String,
    lessons_learned: String,
    resolution_time_hours: Number
  },
  customer_satisfaction: {
    post_resolution_rating: Number,
    post_resolution_feedback: String,
    would_recommend: Boolean,
    likelihood_to_return: Number
  },
  internal_notes: [{
    note: String,
    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    added_at: {
      type: Date,
      default: Date.now
    },
    is_confidential: {
      type: Boolean,
      default: false
    }
  }],
  tags: [String],
  language: {
    type: String,
    default: 'en'
  },
  translation_required: {
    type: Boolean,
    default: false
  },
  translated_content: String,
  ip_address: String,
  user_agent: String,
  location: {
    country: String,
    state: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  device_info: {
    device_type: String,
    browser: String,
    os: String,
    screen_resolution: String
  },
  submission_method: {
    type: String,
    enum: ['Manual', 'Automated', 'Imported', 'API'],
    default: 'Manual'
  },
  is_public: {
    type: Boolean,
    default: false
  },
  published_at: Date,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to generate sequential feedback_id
InfoFeedbackSchema.pre('save', async function(next) {
  if (this.feedback_id.includes('XXXX')) {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `FBK-${dateStr}`;
      
      const lastFeedback = await this.constructor.findOne(
        { feedback_id: { $regex: `^${prefix}` } },
        { feedback_id: 1 },
        { sort: { feedback_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastFeedback) {
        const lastNumber = parseInt(lastFeedback.feedback_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.feedback_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Pre-save hook to calculate NPS category and generate summary
InfoFeedbackSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  
  // Calculate NPS category
  if (this.nps_score !== undefined) {
    if (this.nps_score >= 0 && this.nps_score <= 6) {
      this.nps_category = 'Detractor';
    } else if (this.nps_score >= 7 && this.nps_score <= 8) {
      this.nps_category = 'Passive';
    } else if (this.nps_score >= 9 && this.nps_score <= 10) {
      this.nps_category = 'Promoter';
    }
  }
  
  // Generate summary if not provided
  if (!this.feedback_summary && this.feedback_content) {
    this.feedback_summary = this.feedback_content.substring(0, 200) + 
      (this.feedback_content.length > 200 ? '...' : '');
  }
  
  // Set response deadline if response is required and not set
  if (this.response_required && !this.response_deadline) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 3); // 3 days default
    this.response_deadline = deadline;
  }
  
  next();
});

// Method to calculate overall satisfaction score
InfoFeedbackSchema.methods.calculateOverallScore = function() {
  let totalScore = 0;
  let scoreCount = 0;
  
  if (this.rating_value) {
    totalScore += this.rating_value;
    scoreCount++;
  }
  
  if (this.csat_score) {
    totalScore += (this.csat_score / 5) * 10; // Normalize to 10
    scoreCount++;
  }
  
  if (this.ces_score) {
    totalScore += ((8 - this.ces_score) / 7) * 10; // Invert and normalize
    scoreCount++;
  }
  
  return scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
};

// Indexes for better performance
InfoFeedbackSchema.index({ info_profile: 1, created_at: -1 });
InfoFeedbackSchema.index({ feedback_type: 1, created_at: -1 });
InfoFeedbackSchema.index({ feedback_status: 1 });
InfoFeedbackSchema.index({ rating_value: 1 });
InfoFeedbackSchema.index({ nps_score: 1 });
InfoFeedbackSchema.index({ assigned_to: 1 });
InfoFeedbackSchema.index({ 'customer_details.customer_id': 1 });
InfoFeedbackSchema.index({ 'sentiment_analysis.sentiment_label': 1 });

module.exports = mongoose.model('InfoFeedback', InfoFeedbackSchema);