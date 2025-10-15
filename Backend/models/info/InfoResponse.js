const mongoose = require('mongoose');

const InfoResponseSchema = new mongoose.Schema({
  response_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: RES-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `RES-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  info_profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfoProfile',
    required: [true, 'Info profile reference is required']
  },
  response_type: {
    type: String,
    required: [true, 'Response type is required'],
    enum: [
      'Initial Response',
      'Follow-up Response',
      'Clarification Request',
      'Information Provided',
      'Solution Provided',
      'Escalation Response',
      'Closure Response',
      'Acknowledgment',
      'Status Update',
      'Document Request',
      'Document Provided',
      'Meeting Scheduled',
      'Call Scheduled',
      'Automated Response',
      'System Generated',
      'Customer Response',
      'Internal Note',
      'Other'
    ]
  },
  response_content: {
    type: String,
    required: [true, 'Response content is required'],
    maxlength: [5000, 'Response content cannot exceed 5000 characters']
  },
  response_summary: {
    type: String,
    maxlength: [500, 'Response summary cannot exceed 500 characters']
  },
  response_format: {
    type: String,
    enum: ['Text', 'HTML', 'Markdown', 'JSON'],
    default: 'Text'
  },
  communication_channel: {
    type: String,
    required: [true, 'Communication channel is required'],
    enum: ['Email', 'WhatsApp', 'SMS', 'Phone', 'In-Person', 'Portal', 'Chat', 'System']
  },
  channel_details: {
    email_subject: String,
    email_recipients: [String],
    email_cc: [String],
    email_bcc: [String],
    whatsapp_number: String,
    sms_number: String,
    phone_number: String,
    call_duration: Number,
    meeting_location: String,
    meeting_link: String,
    chat_session_id: String,
    portal_notification_id: String
  },
  response_direction: {
    type: String,
    required: [true, 'Response direction is required'],
    enum: ['Incoming', 'Outgoing']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sender_details: {
    name: String,
    email: String,
    phone: String,
    role: String,
    is_customer: {
      type: Boolean,
      default: false
    },
    is_system: {
      type: Boolean,
      default: false
    }
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipient_details: {
    name: String,
    email: String,
    phone: String,
    role: String,
    is_customer: {
      type: Boolean,
      default: false
    }
  },
  is_customer_facing: {
    type: Boolean,
    default: false
  },
  is_internal: {
    type: Boolean,
    default: true
  },
  is_automated: {
    type: Boolean,
    default: false
  },
  automation_rule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutomationRule'
  },
  template_used: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResponseTemplate'
  },
  template_name: String,
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
  response_status: {
    type: String,
    enum: ['Draft', 'Sent', 'Delivered', 'Read', 'Failed', 'Pending'],
    default: 'Sent'
  },
  delivery_status: {
    email_delivered: Boolean,
    email_opened: Boolean,
    email_clicked: Boolean,
    whatsapp_delivered: Boolean,
    whatsapp_read: Boolean,
    sms_delivered: Boolean,
    call_connected: Boolean,
    delivery_timestamp: Date,
    read_timestamp: Date,
    failure_reason: String
  },
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfoAttachment'
  }],
  attachment_details: [{
    name: String,
    file_path: String,
    file_size: Number,
    mime_type: String,
    is_inline: Boolean
  }],
  related_responses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfoResponse'
  }],
  parent_response: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfoResponse'
  },
  thread_id: String,
  response_time_minutes: {
    type: Number,
    min: 0
  },
  sla_compliance: {
    is_within_sla: Boolean,
    sla_rule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InfoSlaRule'
    },
    expected_response_time: Date,
    actual_response_time: Date,
    breach_duration_minutes: Number
  },
  sentiment_analysis: {
    sentiment_score: {
      type: Number,
      min: -1,
      max: 1
    },
    sentiment_label: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative']
    },
    confidence_score: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  keywords: [String],
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
  cost: {
    type: Number,
    min: 0,
    default: 0
  },
  ip_address: String,
  user_agent: String,
  scheduled_at: Date,
  sent_at: Date,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to generate sequential response_id
InfoResponseSchema.pre('save', async function(next) {
  if (this.response_id.includes('XXXX')) {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `RES-${dateStr}`;
      
      const lastResponse = await this.constructor.findOne(
        { response_id: { $regex: `^${prefix}` } },
        { response_id: 1 },
        { sort: { response_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastResponse) {
        const lastNumber = parseInt(lastResponse.response_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.response_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Pre-save hook to update timestamps and calculate response time
InfoResponseSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  
  // Set sent_at if status is Sent and not already set
  if (this.response_status === 'Sent' && !this.sent_at) {
    this.sent_at = new Date();
  }
  
  // Calculate response time if this is an outgoing response
  if (this.response_direction === 'Outgoing' && this.sent_at) {
    this.response_time_minutes = Math.round((this.sent_at - this.created_at) / (1000 * 60));
  }
  
  // Generate summary if not provided
  if (!this.response_summary && this.response_content) {
    this.response_summary = this.response_content.substring(0, 200) + 
      (this.response_content.length > 200 ? '...' : '');
  }
  
  next();
});

// Indexes for better performance
InfoResponseSchema.index({ info_profile: 1, created_at: -1 });
InfoResponseSchema.index({ response_type: 1, created_at: -1 });
InfoResponseSchema.index({ communication_channel: 1 });
InfoResponseSchema.index({ sender: 1, created_at: -1 });
InfoResponseSchema.index({ response_status: 1 });
InfoResponseSchema.index({ is_customer_facing: 1 });
InfoResponseSchema.index({ thread_id: 1 });
InfoResponseSchema.index({ parent_response: 1 });

module.exports = mongoose.model('InfoResponse', InfoResponseSchema);