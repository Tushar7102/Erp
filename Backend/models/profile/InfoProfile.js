const mongoose = require('mongoose');

const InfoProfileSchema = new mongoose.Schema({
  info_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: INF-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `INF-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  title: {
    type: String,
    required: [true, 'Info title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  info_type: {
    type: String,
    required: [true, 'Info type is required'],
    enum: [
      'Product Information',
      'Technical Specification',
      'Pricing',
      'Documentation',
      'Warranty',
      'Service',
      'General Inquiry',
      'Other'
    ]
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerMaster',
    required: [true, 'Customer is required']
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
  request_date: {
    type: Date,
    default: Date.now,
    required: true
  },
  response_date: {
    type: Date
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: [
      'New',
      'In Progress',
      'Pending Customer',
      'Pending Internal',
      'Resolved',
      'Closed'
    ],
    default: 'New'
  },
  priority: {
    type: String,
    enum: [
      'Low',
      'Medium',
      'High'
    ],
    default: 'Medium'
  },
  response_details: {
    content: {
      type: String
    },
    provided_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    provided_at: {
      type: Date
    }
  },
  customer_feedback: {
    is_satisfied: {
      type: Boolean
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
  documents: [{
    name: {
      type: String,
      required: true
    },
    file_path: {
      type: String,
      required: true
    },
    document_type: {
      type: String,
      required: true,
      enum: [
        'Request',
        'Response',
        'Supporting Document',
        'Other'
      ]
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

// Pre-save hook to generate sequential info_id
InfoProfileSchema.pre('save', async function(next) {
  if (this.info_id.includes('XXXX')) {
    try {
      // Find the latest info with the same date prefix
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `INF-${dateStr}`;
      
      const lastInfo = await this.constructor.findOne(
        { info_id: { $regex: `^${prefix}` } },
        { info_id: 1 },
        { sort: { info_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastInfo) {
        const lastNumber = parseInt(lastInfo.info_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Pad with leading zeros to make it 4 digits
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.info_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Update the updated_at field on save
InfoProfileSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('InfoProfile', InfoProfileSchema);