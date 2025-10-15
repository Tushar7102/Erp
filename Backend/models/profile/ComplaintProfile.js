const mongoose = require('mongoose');

const ComplaintProfileSchema = new mongoose.Schema({
  complaint_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: CMP-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `CMP-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  subject: {
    type: String,
    required: [true, 'Complaint subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Complaint description is required'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerMaster',
    required: [true, 'Customer is required']
  },
  complaint_type: {
    type: String,
    required: [true, 'Complaint type is required'],
    enum: [
      'Technical',
      'Service',
      'Billing',
      'Product Quality',
      'Delivery',
      'Warranty',
      'Other'
    ]
  },
  severity: {
    type: String,
    required: [true, 'Severity is required'],
    enum: [
      'Low',
      'Medium',
      'High',
      'Critical'
    ],
    default: 'Medium'
  },
  related_project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectProfile'
  },
  related_product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductProfile'
  },
  related_amc: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AmcProfile'
  },
  reported_date: {
    type: Date,
    default: Date.now,
    required: true
  },
  expected_resolution_date: {
    type: Date
  },
  actual_resolution_date: {
    type: Date
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: [
      'New',
      'Assigned',
      'In Progress',
      'On Hold',
      'Resolved',
      'Closed',
      'Reopened'
    ],
    default: 'New'
  },
  resolution: {
    type: String,
    maxlength: [2000, 'Resolution cannot be more than 2000 characters']
  },
  resolution_type: {
    type: String,
    enum: [
      'Fixed',
      'Workaround Provided',
      'Replacement',
      'Refund',
      'Not Reproducible',
      'Not a Bug',
      'Other'
    ]
  },
  customer_feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: {
      type: String
    },
    submitted_at: {
      type: Date
    }
  },
  assigned_team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  activity_log: [{
    action: {
      type: String,
      required: true
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String
    }
  }],
  attachments: [{
    name: {
      type: String,
      required: true
    },
    file_path: {
      type: String,
      required: true
    },
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  notes: [{
    content: {
      type: String,
      required: true
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    created_at: {
      type: Date,
      default: Date.now
    }
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
});

// Pre-save hook to generate sequential complaint_id
ComplaintProfileSchema.pre('save', async function(next) {
  if (this.complaint_id.includes('XXXX')) {
    try {
      // Find the latest complaint with the same date prefix
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `CMP-${dateStr}`;
      
      const lastComplaint = await this.constructor.findOne(
        { complaint_id: { $regex: `^${prefix}` } },
        { complaint_id: 1 },
        { sort: { complaint_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastComplaint) {
        const lastNumber = parseInt(lastComplaint.complaint_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Pad with leading zeros to make it 4 digits
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.complaint_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Update the updated_at field on save
ComplaintProfileSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('ComplaintProfile', ComplaintProfileSchema);