const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const TaskSchema = new mongoose.Schema({
  task_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: TASKXXXX
      return `TASKXXXX`; // This will be replaced by pre-save hook
    }
  },
  enquiry_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enquiry',
    required: [true, 'Enquiry ID is required']
  },
  task_type: {
    type: String,
    enum: [
      'follow_up_call',
      'send_quotation',
      'send_email',
      'send_sms',
      'schedule_meeting',
      'site_visit',
      'document_collection',
      'verification',
      'escalation',
      'closure',
      'feedback_collection',
      'payment_follow_up',
      'custom'
    ],
    required: [true, 'Task type is required']
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Task description cannot exceed 1000 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold', 'overdue'],
    default: 'pending'
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must be assigned to a user']
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must have an assigner']
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  due_date: {
    type: Date,
    required: [true, 'Due date is required']
  },
  estimated_duration: {
    type: Number, // Duration in minutes
    default: 30
  },
  actual_duration: {
    type: Number // Duration in minutes
  },
  start_date: {
    type: Date
  },
  completion_date: {
    type: Date
  },
  reminder_settings: {
    enable_reminders: {
      type: Boolean,
      default: true
    },
    reminder_intervals: [{
      type: String,
      enum: ['15_minutes', '30_minutes', '1_hour', '2_hours', '1_day', '2_days'],
      default: '1_hour'
    }],
    last_reminder_sent: Date
  },
  dependencies: [{
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    dependency_type: {
      type: String,
      enum: ['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'],
      default: 'finish_to_start'
    }
  }],
  subtasks: [{
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Subtask title cannot exceed 100 characters']
    },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending'
    },
    completed_at: Date,
    completed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  attachments: [{
    file_name: String,
    file_path: String,
    file_size: Number,
    file_type: String,
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    comment_text: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    commented_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    commented_at: {
      type: Date,
      default: Date.now
    },
    is_internal: {
      type: Boolean,
      default: true
    }
  }],
  completion_notes: {
    type: String,
    maxlength: [1000, 'Completion notes cannot exceed 1000 characters']
  },
  cancellation_reason: {
    type: String,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  automation_rule_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutomationRule'
  },
  is_automated: {
    type: Boolean,
    default: false
  },
  recurring_settings: {
    is_recurring: {
      type: Boolean,
      default: false
    },
    recurrence_pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    },
    recurrence_interval: {
      type: Number,
      default: 1
    },
    end_date: Date,
    next_occurrence: Date
  },
  sla_settings: {
    sla_deadline: Date,
    sla_status: {
      type: String,
      enum: ['within_sla', 'approaching_breach', 'breached'],
      default: 'within_sla'
    },
    breach_time: Date
  },
  tags: [String],
  custom_fields: [{
    field_name: String,
    field_value: mongoose.Schema.Types.Mixed,
    field_type: {
      type: String,
      enum: ['text', 'number', 'date', 'boolean', 'select']
    }
  }],
  metadata: {
    ip_address: String,
    user_agent: String,
    source: {
      type: String,
      enum: ['manual', 'automation', 'api', 'import']
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

// Pre-save hook to generate unique task_id and update timestamps
TaskSchema.pre('save', async function(next) {
  if (this.isNew && this.task_id.includes('XXXX')) {
    // Find the last task with TASKXXXX format
    const lastTask = await this.constructor.findOne({
      task_id: /^TASK\d{4}$/
    }).sort({ task_id: -1 });
    
    let sequence = 1;
    if (lastTask) {
      // Extract the numeric part from the last task ID
      const lastSequence = parseInt(lastTask.task_id.substring(4));
      sequence = lastSequence + 1;
    }
    
    // Generate new task ID in TASKXXXX format
    this.task_id = `TASK${sequence.toString().padStart(4, '0')}`;
  }
  
  // Update SLA status based on due date
  if (this.due_date && this.status !== 'completed' && this.status !== 'cancelled') {
    const now = new Date();
    const timeToDeadline = this.due_date - now;
    const oneHour = 60 * 60 * 1000;
    
    if (timeToDeadline < 0) {
      this.sla_settings.sla_status = 'breached';
      this.status = 'overdue';
      if (!this.sla_settings.breach_time) {
        this.sla_settings.breach_time = now;
      }
    } else if (timeToDeadline < oneHour) {
      this.sla_settings.sla_status = 'approaching_breach';
    } else {
      this.sla_settings.sla_status = 'within_sla';
    }
  }
  
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
TaskSchema.index({ enquiry_id: 1, status: 1 });
TaskSchema.index({ assigned_to: 1, status: 1 });
TaskSchema.index({ team_id: 1 });
TaskSchema.index({ due_date: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ task_type: 1 });
TaskSchema.index({ created_at: -1 });
TaskSchema.index({ task_id: 1 });
TaskSchema.index({ 'sla_settings.sla_status': 1 });
TaskSchema.index({ status: 1, due_date: 1 });

// Virtual for task progress percentage
TaskSchema.virtual('progress_percentage').get(function() {
  if (this.status === 'completed') return 100;
  if (this.status === 'cancelled') return 0;
  
  if (this.subtasks && this.subtasks.length > 0) {
    const completedSubtasks = this.subtasks.filter(st => st.status === 'completed').length;
    return Math.round((completedSubtasks / this.subtasks.length) * 100);
  }
  
  if (this.status === 'in_progress') return 50;
  return 0;
});

// Virtual for time remaining
TaskSchema.virtual('time_remaining').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') return null;
  
  const now = new Date();
  const timeRemaining = this.due_date - now;
  
  if (timeRemaining < 0) return 'Overdue';
  
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} days, ${hours} hours`;
  return `${hours} hours`;
});

// Method to start task
TaskSchema.methods.startTask = function() {
  this.status = 'in_progress';
  this.start_date = new Date();
  return this.save();
};

// Method to complete task
TaskSchema.methods.completeTask = function(completionNotes, completedBy) {
  this.status = 'completed';
  this.completion_date = new Date();
  if (completionNotes) this.completion_notes = completionNotes;
  
  // Calculate actual duration
  if (this.start_date) {
    this.actual_duration = Math.floor((this.completion_date - this.start_date) / (1000 * 60));
  }
  
  return this.save();
};

// Method to cancel task
TaskSchema.methods.cancelTask = function(reason) {
  this.status = 'cancelled';
  this.cancellation_reason = reason;
  return this.save();
};

// Method to add comment
TaskSchema.methods.addComment = function(commentText, commentedBy, isInternal = true) {
  this.comments.push({
    comment_text: commentText,
    commented_by: commentedBy,
    is_internal: isInternal
  });
  return this.save();
};

// Method to add subtask
TaskSchema.methods.addSubtask = function(title, description) {
  this.subtasks.push({
    title: title,
    description: description
  });
  return this.save();
};

// Static method to get tasks for an enquiry
TaskSchema.statics.getEnquiryTasks = function(enquiryId, status = null) {
  const query = { enquiry_id: enquiryId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('assigned_to', 'name email')
    .populate('assigned_by', 'name email')
    .populate('team_id', 'name')
    .sort({ due_date: 1 });
};

// Static method to get user tasks
TaskSchema.statics.getUserTasks = function(userId, status = null, limit = 50) {
  const query = { assigned_to: userId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('enquiry_id', 'enquiry_id customer_name')
    .populate('assigned_by', 'name email')
    .sort({ due_date: 1 })
    .limit(limit);
};

// Static method to get overdue tasks
TaskSchema.statics.getOverdueTasks = function(teamId = null) {
  const query = {
    due_date: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  };
  
  if (teamId) query.team_id = teamId;
  
  return this.find(query)
    .populate('assigned_to', 'name email')
    .populate('enquiry_id', 'enquiry_id customer_name')
    .sort({ due_date: 1 });
};

// Static method to get task analytics
TaskSchema.statics.getTaskAnalytics = function(startDate, endDate, filters = {}) {
  const matchStage = {
    created_at: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (filters.assigned_to) {
    matchStage.assigned_to = new mongoose.Types.ObjectId(filters.assigned_to);
  }
  
  if (filters.team_id) {
    matchStage.team_id = new mongoose.Types.ObjectId(filters.team_id);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          status: '$status',
          priority: '$priority',
          type: '$task_type'
        },
        count: { $sum: 1 },
        avg_duration: { $avg: '$actual_duration' },
        avg_estimated_duration: { $avg: '$estimated_duration' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Apply the pagination plugin to the schema
TaskSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Task', TaskSchema);