const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const CommunicationLogSchema = new mongoose.Schema({
  communication_log_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: CLOGXXXX
      return `CLOGXXXX`; // This will be replaced by pre-save hook
    }
  },
  enquiry_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enquiry',
    required: [true, 'Enquiry ID is required']
  },
  communication_type: {
    type: String,
    enum: ['email', 'sms', 'whatsapp', 'voice_call', 'video_call', 'chat', 'notification'],
    required: [true, 'Communication type is required']
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: [true, 'Communication direction is required']
  },
  sender: {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    external_contact: {
      name: String,
      email: String,
      phone: String,
      identifier: String // For external systems
    }
  },
  recipient: {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    external_contact: {
      name: String,
      email: String,
      phone: String,
      identifier: String
    }
  },
  subject: {
    type: String,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message_content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [5000, 'Message content cannot exceed 5000 characters']
  },
  message_format: {
    type: String,
    enum: ['text', 'html', 'markdown', 'rich_text'],
    default: 'text'
  },
  attachments: [{
    file_name: String,
    file_path: String,
    file_size: Number,
    file_type: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  delivery_status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'bounced'],
    default: 'pending'
  },
  delivery_timestamp: {
    type: Date
  },
  metadata: {
    type: Object,
    default: {}
  },
  read_timestamp: {
    type: Date
  },
  response_required: {
    type: Boolean,
    default: false
  },
  response_deadline: {
    type: Date
  },
  template_used: {
    template_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template'
    },
    template_name: String,
    template_variables: mongoose.Schema.Types.Mixed
  },
  integration_details: {
    provider: {
      type: String,
      enum: ['twilio', 'sendgrid', 'whatsapp_business', 'smtp', 'internal']
    },
    external_id: String,
    webhook_data: mongoose.Schema.Types.Mixed
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
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
  metadata: {
    ip_address: String,
    user_agent: String,
    device_info: String,
    location: {
      country: String,
      state: String,
      city: String
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

// Pre-save hook to generate unique communication_log_id and update timestamps
CommunicationLogSchema.pre('save', async function(next) {
  if (this.isNew && this.communication_log_id.includes('XXXX')) {
    // Find the last communication log with CLOGXXXX format
    const lastLog = await this.constructor.findOne({
      communication_log_id: /^CLOG\d{4}$/
    }).sort({ communication_log_id: -1 });
    
    let sequence = 1;
    if (lastLog) {
      // Extract the numeric part from the last log ID
      const lastSequence = parseInt(lastLog.communication_log_id.substring(4));
      sequence = lastSequence + 1;
    }
    
    // Generate new communication log ID in CLOGXXXX format
    this.communication_log_id = `CLOG${sequence.toString().padStart(4, '0')}`;
  }
  
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
CommunicationLogSchema.index({ enquiry_id: 1, created_at: -1 });
CommunicationLogSchema.index({ communication_type: 1 });
CommunicationLogSchema.index({ direction: 1 });
CommunicationLogSchema.index({ 'sender.user_id': 1 });
CommunicationLogSchema.index({ 'recipient.user_id': 1 });
CommunicationLogSchema.index({ delivery_status: 1 });
CommunicationLogSchema.index({ created_at: -1 });
CommunicationLogSchema.index({ communication_log_id: 1 });
CommunicationLogSchema.index({ is_automated: 1 });
CommunicationLogSchema.index({ priority: 1 });

// Virtual for formatted timestamps
CommunicationLogSchema.virtual('formatted_created_at').get(function() {
  return this.created_at.toLocaleString();
});

CommunicationLogSchema.virtual('formatted_delivery_timestamp').get(function() {
  return this.delivery_timestamp ? this.delivery_timestamp.toLocaleString() : null;
});

// Method to mark as delivered
CommunicationLogSchema.methods.markAsDelivered = function() {
  this.delivery_status = 'delivered';
  this.delivery_timestamp = new Date();
  return this.save();
};

// Method to mark as read
CommunicationLogSchema.methods.markAsRead = function() {
  this.delivery_status = 'read';
  this.read_timestamp = new Date();
  return this.save();
};

// Method to calculate response time
CommunicationLogSchema.methods.getResponseTime = async function() {
  if (this.direction === 'outbound') return null;
  
  const response = await this.constructor.findOne({
    enquiry_id: this.enquiry_id,
    direction: 'outbound',
    created_at: { $gt: this.created_at }
  }).sort({ created_at: 1 });
  
  if (response) {
    return response.created_at - this.created_at;
  }
  return null;
};

// Static method to get communication history for an enquiry
CommunicationLogSchema.statics.getEnquiryCommunicationHistory = function(enquiryId, options = {}) {
  const query = { enquiry_id: enquiryId };
  
  if (options.type) {
    query.communication_type = options.type;
  }
  
  if (options.direction) {
    query.direction = options.direction;
  }
  
  return this.find(query)
    .populate('sender.user_id', 'name email')
    .populate('recipient.user_id', 'name email')
    .populate('template_used.template_id', 'name')
    .sort({ created_at: -1 })
    .limit(options.limit || 50);
};

// Static method to get communication analytics
CommunicationLogSchema.statics.getCommunicationAnalytics = function(startDate, endDate, filters = {}) {
  const matchStage = {
    created_at: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (filters.communication_type) {
    matchStage.communication_type = filters.communication_type;
  }
  
  if (filters.direction) {
    matchStage.direction = filters.direction;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          type: '$communication_type',
          direction: '$direction',
          status: '$delivery_status'
        },
        count: { $sum: 1 },
        total_cost: { $sum: '$cost.amount' },
        avg_response_time: { $avg: '$response_time' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get delivery statistics
CommunicationLogSchema.statics.getDeliveryStats = function(startDate, endDate) {
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
        _id: '$delivery_status',
        count: { $sum: 1 },
        percentage: {
          $multiply: [
            { $divide: ['$count', { $sum: 1 }] },
            100
          ]
        }
      }
    }
  ]);
};

// Add pagination plugin
CommunicationLogSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('CommunicationLog', CommunicationLogSchema);