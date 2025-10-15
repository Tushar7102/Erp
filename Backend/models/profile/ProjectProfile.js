const mongoose = require('mongoose');

const ProjectProfileSchema = new mongoose.Schema({
  project_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: PRJ-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `PRJ-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [200, 'Project name cannot be more than 200 characters']
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
  project_type: {
    type: String,
    required: [true, 'Project type is required'],
    enum: [
      'Residential',
      'Commercial',
      'Industrial',
      'Government',
      'Other'
    ]
  },
  capacity_kw: {
    type: Number,
    required: [true, 'Capacity in KW is required']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Project address is required']
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
  start_date: {
    type: Date
  },
  estimated_completion_date: {
    type: Date
  },
  actual_completion_date: {
    type: Date
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: [
      'New',
      'Planning',
      'In Progress',
      'On Hold',
      'Completed',
      'Cancelled'
    ],
    default: 'New'
  },
  budget: {
    type: Number
  },
  actual_cost: {
    type: Number
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
        'Proposal',
        'Invoice',
        'Site Survey',
        'Technical Specification',
        'Approval',
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
  milestones: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    planned_date: {
      type: Date,
      required: true
    },
    actual_date: {
      type: Date
    },
    status: {
      type: String,
      required: true,
      enum: [
        'Pending',
        'In Progress',
        'Completed',
        'Delayed'
      ],
      default: 'Pending'
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

// Pre-save hook to generate sequential project_id
ProjectProfileSchema.pre('save', async function(next) {
  if (this.project_id.includes('XXXX')) {
    try {
      // Find the latest project with the same date prefix
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `PRJ-${dateStr}`;
      
      const lastProject = await this.constructor.findOne(
        { project_id: { $regex: `^${prefix}` } },
        { project_id: 1 },
        { sort: { project_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastProject) {
        const lastNumber = parseInt(lastProject.project_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Pad with leading zeros to make it 4 digits
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.project_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Update the updated_at field on save
ProjectProfileSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('ProjectProfile', ProjectProfileSchema);