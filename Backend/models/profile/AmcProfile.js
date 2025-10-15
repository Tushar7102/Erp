const mongoose = require('mongoose');

const AmcProfileSchema = new mongoose.Schema({
  amc_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: AMC-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `AMC-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  name: {
    type: String,
    required: [true, 'AMC name is required'],
    trim: true,
    maxlength: [200, 'AMC name cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerMaster',
    required: [true, 'Customer is required']
  },
  amc_type: {
    type: String,
    required: [true, 'AMC type is required'],
    enum: [
      'Comprehensive',
      'Non-Comprehensive',
      'Preventive Maintenance',
      'On-Call Service',
      'Other'
    ]
  },
  related_project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectProfile'
  },
  related_product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductProfile'
  },
  start_date: {
    type: Date,
    required: [true, 'Start date is required']
  },
  end_date: {
    type: Date,
    required: [true, 'End date is required']
  },
  renewal_date: {
    type: Date
  },
  service_frequency: {
    type: String,
    enum: [
      'Monthly',
      'Quarterly',
      'Half-Yearly',
      'Yearly',
      'On-Demand',
      'Other'
    ],
    required: [true, 'Service frequency is required']
  },
  service_schedule: [{
    scheduled_date: {
      type: Date,
      required: true
    },
    actual_date: {
      type: Date
    },
    status: {
      type: String,
      enum: [
        'Scheduled',
        'Completed',
        'Missed',
        'Rescheduled',
        'Cancelled'
      ],
      default: 'Scheduled'
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remarks: {
      type: String
    }
  }],
  contract_value: {
    type: Number,
    required: [true, 'Contract value is required']
  },
  tax_details: {
    gst_percentage: {
      type: Number,
      default: 0
    },
    gst_amount: {
      type: Number,
      default: 0
    },
    other_tax_percentage: {
      type: Number,
      default: 0
    },
    other_tax_amount: {
      type: Number,
      default: 0
    }
  },
  final_amount: {
    type: Number,
    required: [true, 'Final amount is required']
  },
  payment_terms: {
    type: String
  },
  payment_status: {
    type: String,
    enum: [
      'Not Started',
      'Partially Paid',
      'Fully Paid'
    ],
    default: 'Not Started'
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: [
      'Active',
      'Expired',
      'Renewed',
      'Cancelled',
      'On Hold'
    ],
    default: 'Active'
  },
  assigned_team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  assigned_manager: {
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
        'Contract',
        'Invoice',
        'Service Report',
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

// Pre-save hook to generate sequential amc_id
AmcProfileSchema.pre('save', async function(next) {
  if (this.amc_id.includes('XXXX')) {
    try {
      // Find the latest AMC with the same date prefix
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `AMC-${dateStr}`;
      
      const lastAmc = await this.constructor.findOne(
        { amc_id: { $regex: `^${prefix}` } },
        { amc_id: 1 },
        { sort: { amc_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastAmc) {
        const lastNumber = parseInt(lastAmc.amc_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Pad with leading zeros to make it 4 digits
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.amc_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Update the updated_at field on save
AmcProfileSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('AmcProfile', AmcProfileSchema);