const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const StatusLogSchema = new mongoose.Schema({
  status_log_id: {
    type: String,
    unique: true,
    default: function() {
      return `SLXXXX`; // This will be replaced by pre-save hook
    }
  },
  enquiry_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enquiry',
    required: [true, 'Enquiry ID is required']
  },
  old_status: {
    type: String,
    required: false,
    default: 'Previous Status'
  },
  new_status: {
    type: String,
    required: false,
    default: 'New Status'
  },
  old_status_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StatusType'
  },
  new_status_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StatusType',
    required: false
  },
  changed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Changed by user is required']
  },
  change_reason: {
    type: String,
    maxlength: [500, 'Change reason cannot exceed 500 characters']
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
    type: mongoose.Schema.Types.Mixed
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to generate unique status_log_id
StatusLogSchema.pre('save', async function(next) {
  if (this.isNew && this.status_log_id.includes('XXXX')) {
    // Find the last status log
    const lastLog = await this.constructor.findOne({
      status_log_id: new RegExp('^SL')
    }).sort({ status_log_id: -1 });
    
    let sequence = 1;
    if (lastLog) {
      // Extract the sequence number from SL0001 format
      const lastSequence = parseInt(lastLog.status_log_id.substring(2));
      sequence = lastSequence + 1;
    }
    
    // Format: SL0001, SL0002, etc.
    this.status_log_id = `SL${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

// Indexes for better performance
StatusLogSchema.index({ enquiry_id: 1, timestamp: -1 });
StatusLogSchema.index({ changed_by: 1 });
StatusLogSchema.index({ new_status_id: 1 });
StatusLogSchema.index({ timestamp: -1 });
StatusLogSchema.index({ status_log_id: 1 });

// Virtual for formatted timestamp
StatusLogSchema.virtual('formatted_timestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Method to get status change duration
StatusLogSchema.methods.getStatusDuration = async function() {
  const nextLog = await this.constructor.findOne({
    enquiry_id: this.enquiry_id,
    timestamp: { $gt: this.timestamp }
  }).sort({ timestamp: 1 });
  
  if (nextLog) {
    return nextLog.timestamp - this.timestamp;
  }
  return Date.now() - this.timestamp;
};

// Static method to get status history for an enquiry
StatusLogSchema.statics.getEnquiryStatusHistory = function(enquiryId) {
  return this.find({ enquiry_id: enquiryId })
    .populate('old_status_id', 'name color')
    .populate('new_status_id', 'name color')
    .populate('changed_by', 'name email')
    .sort({ timestamp: -1 });
};

// Static method to get status change analytics
StatusLogSchema.statics.getStatusAnalytics = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$new_status',
        count: { $sum: 1 },
        unique_enquiries: { $addToSet: '$enquiry_id' }
      }
    },
    {
      $project: {
        status: '$_id',
        total_changes: '$count',
        unique_enquiries_count: { $size: '$unique_enquiries' }
      }
    }
  ]);
};

// Apply the pagination plugin to the schema
StatusLogSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('StatusLog', StatusLogSchema);