const mongoose = require('mongoose');

const SiteVisitScheduleSchema = new mongoose.Schema({
  visit_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: SVS-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `SVS-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  title: {
    type: String,
    required: [true, 'Visit title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  visit_type: {
    type: String,
    required: [true, 'Visit type is required'],
    enum: [
      'Pre-Sales',
      'Site Survey',
      'Installation',
      'Maintenance',
      'Inspection',
      'Troubleshooting',
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
  related_complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ComplaintProfile'
  },
  location: {
    address: {
      type: String,
      required: [true, 'Site address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required']
    },
    coordinates: {
      latitude: {
        type: Number
      },
      longitude: {
        type: Number
      }
    }
  },
  scheduled_date: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  scheduled_time_slot: {
    start_time: {
      type: String,
      required: [true, 'Start time is required']
    },
    end_time: {
      type: String,
      required: [true, 'End time is required']
    }
  },
  actual_visit_date: {
    type: Date
  },
  actual_time_spent: {
    hours: {
      type: Number
    },
    minutes: {
      type: Number
    }
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: [
      'Scheduled',
      'Confirmed',
      'In Progress',
      'Completed',
      'Cancelled',
      'Rescheduled',
      'No Show'
    ],
    default: 'Scheduled'
  },
  assigned_team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  assigned_technicians: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  equipment_required: [{
    type: String
  }],
  checklist: [{
    item: {
      type: String,
      required: true
    },
    is_completed: {
      type: Boolean,
      default: false
    },
    remarks: {
      type: String
    }
  }],
  visit_report: {
    findings: {
      type: String
    },
    actions_taken: {
      type: String
    },
    recommendations: {
      type: String
    },
    customer_signature: {
      type: String
    },
    technician_signature: {
      type: String
    },
    submitted_at: {
      type: Date
    }
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
  attachments: [{
    name: {
      type: String,
      required: true
    },
    file_path: {
      type: String,
      required: true
    },
    file_type: {
      type: String,
      enum: [
        'Image',
        'Document',
        'Video',
        'Other'
      ],
      default: 'Image'
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

// Pre-save hook to generate sequential visit_id
SiteVisitScheduleSchema.pre('save', async function(next) {
  if (this.visit_id.includes('XXXX')) {
    try {
      // Find the latest visit with the same date prefix
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `SVS-${dateStr}`;
      
      const lastVisit = await this.constructor.findOne(
        { visit_id: { $regex: `^${prefix}` } },
        { visit_id: 1 },
        { sort: { visit_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastVisit) {
        const lastNumber = parseInt(lastVisit.visit_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Pad with leading zeros to make it 4 digits
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.visit_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Update the updated_at field on save
SiteVisitScheduleSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('SiteVisitSchedule', SiteVisitScheduleSchema);