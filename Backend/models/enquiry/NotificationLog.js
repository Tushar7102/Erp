const mongoose = require('mongoose');

const NotificationLogSchema = new mongoose.Schema({
  notification_log_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: NLOGXXXX
      return `NLOGXXXX`; // This will be replaced by pre-save hook
    }
  },
  enquiry_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enquiry'
  },
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  notification_type: {
    type: String,
    enum: [
      'enquiry_created',
      'enquiry_updated',
      'enquiry_assigned',
      'enquiry_status_changed',
      'task_created',
      'task_assigned',
      'task_due_reminder',
      'task_overdue',
      'task_completed',
      'sla_breach_warning',
      'sla_breach',
      'escalation',
      'system_alert',
      'custom'
    ],
    required: [true, 'Notification type is required']
  },
  notification_category: {
    type: String,
    enum: ['info', 'warning', 'error', 'success', 'reminder'],
    default: 'info'
  },
  recipient: {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    team_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    role: String,
    external_contact: {
      name: String,
      email: String,
      phone: String
    }
  },
  sender: {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    system_name: {
      type: String,
      default: 'System'
    }
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  message_format: {
    type: String,
    enum: ['text', 'html', 'markdown'],
    default: 'text'
  },
  delivery_channels: [{
    channel: {
      type: String,
      enum: ['in_app', 'email', 'sms', 'push', 'whatsapp', 'slack', 'teams'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
      default: 'pending'
    },
    sent_at: Date,
    delivered_at: Date,
    read_at: Date,
    error_message: String,
    external_id: String
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent', 'critical'],
    default: 'medium'
  },
  urgency_level: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  action_required: {
    type: Boolean,
    default: false
  },
  action_url: {
    type: String
  },
  action_buttons: [{
    label: String,
    action: String,
    url: String,
    style: {
      type: String,
      enum: ['primary', 'secondary', 'success', 'warning', 'danger'],
      default: 'primary'
    }
  }],
  template_used: {
    template_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NotificationTemplate'
    },
    template_name: String,
    template_variables: mongoose.Schema.Types.Mixed
  },
  scheduled_for: {
    type: Date
  },
  expires_at: {
    type: Date
  },
  is_read: {
    type: Boolean,
    default: false
  },
  read_at: {
    type: Date
  },
  is_archived: {
    type: Boolean,
    default: false
  },
  archived_at: {
    type: Date
  },
  retry_settings: {
    max_retries: {
      type: Number,
      default: 3
    },
    retry_count: {
      type: Number,
      default: 0
    },
    retry_intervals: [{
      type: Number // in minutes
    }],
    last_retry_at: Date
  },
  automation_rule_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutomationRule'
  },
  is_automated: {
    type: Boolean,
    default: false
  },
  batch_id: {
    type: String // For bulk notifications
  },
  related_notifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NotificationLog'
  }],
  tags: [String],
  custom_data: {
    type: mongoose.Schema.Types.Mixed
  },
  analytics: {
    opened_count: {
      type: Number,
      default: 0
    },
    clicked_count: {
      type: Number,
      default: 0
    },
    action_taken: {
      type: Boolean,
      default: false
    },
    response_time: Number, // in minutes
    engagement_score: Number
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
    source: {
      type: String,
      enum: ['manual', 'automation', 'api', 'webhook', 'scheduled']
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

// Pre-save hook to generate unique notification_log_id
NotificationLogSchema.pre('save', async function(next) {
  if (this.isNew && this.notification_log_id.includes('XXXX')) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the last notification log for today
    const lastLog = await this.constructor.findOne({
      notification_log_id: new RegExp(`^NLOG-${dateStr}-`)
    }).sort({ notification_log_id: -1 });
    
    let sequence = 1;
    if (lastLog) {
      const lastSequence = parseInt(lastLog.notification_log_id.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.notification_log_id = `NLOG-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }
  
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
NotificationLogSchema.index({ enquiry_id: 1 });
NotificationLogSchema.index({ task_id: 1 });
NotificationLogSchema.index({ 'recipient.user_id': 1, is_read: 1 });
NotificationLogSchema.index({ 'recipient.team_id': 1 });
NotificationLogSchema.index({ notification_type: 1 });
NotificationLogSchema.index({ priority: 1 });
NotificationLogSchema.index({ scheduled_for: 1 });
NotificationLogSchema.index({ created_at: -1 });
NotificationLogSchema.index({ notification_log_id: 1 });
NotificationLogSchema.index({ is_archived: 1 });
NotificationLogSchema.index({ batch_id: 1 });

// Virtual for overall delivery status
NotificationLogSchema.virtual('overall_delivery_status').get(function() {
  if (!this.delivery_channels || this.delivery_channels.length === 0) {
    return 'pending';
  }
  
  const statuses = this.delivery_channels.map(channel => channel.status);
  
  if (statuses.every(status => status === 'delivered' || status === 'read')) {
    return 'delivered';
  } else if (statuses.some(status => status === 'failed')) {
    return 'partially_failed';
  } else if (statuses.some(status => status === 'sent' || status === 'delivered')) {
    return 'in_progress';
  } else {
    return 'pending';
  }
});

// Virtual for time since creation
NotificationLogSchema.virtual('time_since_creation').get(function() {
  const now = new Date();
  const diffMs = now - this.created_at;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays} days ago`;
  if (diffHours > 0) return `${diffHours} hours ago`;
  if (diffMins > 0) return `${diffMins} minutes ago`;
  return 'Just now';
});

// Method to mark as read
NotificationLogSchema.methods.markAsRead = function(userId) {
  this.is_read = true;
  this.read_at = new Date();
  this.analytics.opened_count += 1;
  
  // Update specific channel status if applicable
  this.delivery_channels.forEach(channel => {
    if (channel.channel === 'in_app' && channel.status === 'delivered') {
      channel.status = 'read';
      channel.read_at = new Date();
    }
  });
  
  return this.save();
};

// Method to archive notification
NotificationLogSchema.methods.archive = function() {
  this.is_archived = true;
  this.archived_at = new Date();
  return this.save();
};

// Method to track action taken
NotificationLogSchema.methods.trackAction = function(actionType) {
  this.analytics.action_taken = true;
  this.analytics.clicked_count += 1;
  
  if (this.created_at) {
    this.analytics.response_time = Math.floor((new Date() - this.created_at) / (1000 * 60));
  }
  
  return this.save();
};

// Method to update delivery status
NotificationLogSchema.methods.updateDeliveryStatus = function(channel, status, externalId, errorMessage) {
  const channelIndex = this.delivery_channels.findIndex(ch => ch.channel === channel);
  
  if (channelIndex !== -1) {
    this.delivery_channels[channelIndex].status = status;
    this.delivery_channels[channelIndex][`${status}_at`] = new Date();
    
    if (externalId) {
      this.delivery_channels[channelIndex].external_id = externalId;
    }
    
    if (errorMessage) {
      this.delivery_channels[channelIndex].error_message = errorMessage;
    }
  }
  
  return this.save();
};

// Static method to get user notifications
NotificationLogSchema.statics.getUserNotifications = function(userId, options = {}) {
  const query = { 'recipient.user_id': userId };
  
  if (options.unread_only) {
    query.is_read = false;
  }
  
  if (options.category) {
    query.notification_category = options.category;
  }
  
  if (!options.include_archived) {
    query.is_archived = false;
  }
  
  return this.find(query)
    .populate('enquiry_id', 'enquiry_id customer_name')
    .populate('task_id', 'task_id title')
    .populate('sender.user_id', 'name email')
    .sort({ created_at: -1 })
    .limit(options.limit || 50);
};

// Static method to get notification analytics
NotificationLogSchema.statics.getNotificationAnalytics = function(startDate, endDate, filters = {}) {
  const matchStage = {
    created_at: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (filters.notification_type) {
    matchStage.notification_type = filters.notification_type;
  }
  
  if (filters.priority) {
    matchStage.priority = filters.priority;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          type: '$notification_type',
          category: '$notification_category',
          priority: '$priority'
        },
        count: { $sum: 1 },
        read_count: {
          $sum: { $cond: ['$is_read', 1, 0] }
        },
        avg_response_time: { $avg: '$analytics.response_time' },
        total_opened: { $sum: '$analytics.opened_count' },
        total_clicked: { $sum: '$analytics.clicked_count' }
      }
    },
    {
      $project: {
        notification_type: '$_id.type',
        category: '$_id.category',
        priority: '$_id.priority',
        total_sent: '$count',
        read_rate: {
          $multiply: [
            { $divide: ['$read_count', '$count'] },
            100
          ]
        },
        avg_response_time_minutes: '$avg_response_time',
        engagement_rate: {
          $multiply: [
            { $divide: ['$total_clicked', '$total_opened'] },
            100
          ]
        }
      }
    },
    {
      $sort: { total_sent: -1 }
    }
  ]);
};

// Static method to get delivery statistics
NotificationLogSchema.statics.getDeliveryStats = function(startDate, endDate, channel = null) {
  const pipeline = [
    {
      $match: {
        created_at: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $unwind: '$delivery_channels'
    }
  ];
  
  if (channel) {
    pipeline.push({
      $match: { 'delivery_channels.channel': channel }
    });
  }
  
  pipeline.push(
    {
      $group: {
        _id: {
          channel: '$delivery_channels.channel',
          status: '$delivery_channels.status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.channel',
        statuses: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    }
  );
  
  return this.aggregate(pipeline);
};

// Static method to cleanup old notifications
NotificationLogSchema.statics.cleanupOldNotifications = function(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    created_at: { $lt: cutoffDate },
    is_archived: true,
    is_read: true
  });
};

// Pre-save hook to set expiration date to 2 days from creation if not already set
NotificationLogSchema.pre('save', function(next) {
  // If this is a new notification or expires_at is not set
  if (this.isNew && !this.expires_at) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 2); // Set expiry to 2 days from now
    this.expires_at = expiryDate;
  }
  next();
});

module.exports = mongoose.model('NotificationLog', NotificationLogSchema);