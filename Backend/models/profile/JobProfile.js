const mongoose = require('mongoose');

const JobProfileSchema = new mongoose.Schema({
  job_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: JOB-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `JOB-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  job_type: {
    type: String,
    required: [true, 'Job type is required'],
    enum: [
      'Full-time',
      'Part-time',
      'Contract',
      'Internship',
      'Temporary',
      'Other'
    ]
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: [
      'Engineering',
      'Sales',
      'Marketing',
      'Finance',
      'HR',
      'Operations',
      'Support',
      'Management',
      'Other'
    ]
  },
  location: {
    type: String,
    required: [true, 'Job location is required']
  },
  experience_required: {
    min_years: {
      type: Number,
      required: true
    },
    max_years: {
      type: Number
    }
  },
  skills_required: [{
    type: String,
    required: true
  }],
  qualifications: [{
    type: String,
    required: true
  }],
  salary_range: {
    min: {
      type: Number
    },
    max: {
      type: Number
    },
    currency: {
      type: String,
      default: 'INR'
    },
    is_negotiable: {
      type: Boolean,
      default: true
    }
  },
  benefits: [{
    type: String
  }],
  posting_date: {
    type: Date,
    default: Date.now,
    required: true
  },
  closing_date: {
    type: Date
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: [
      'Draft',
      'Open',
      'In Progress',
      'On Hold',
      'Filled',
      'Cancelled',
      'Closed'
    ],
    default: 'Draft'
  },
  vacancy_count: {
    type: Number,
    required: [true, 'Number of vacancies is required'],
    min: [1, 'Vacancy count must be at least 1']
  },
  applications_count: {
    type: Number,
    default: 0
  },
  hiring_manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assigned_team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  interview_rounds: [{
    round_name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    interviewers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  applicants: [{
    applicant_name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    resume_path: {
      type: String,
      required: true
    },
    application_date: {
      type: Date,
      default: Date.now
    },
    current_stage: {
      type: String,
      enum: [
        'Applied',
        'Screening',
        'Interview',
        'Assessment',
        'Offer',
        'Hired',
        'Rejected'
      ],
      default: 'Applied'
    },
    interview_feedback: [{
      round: {
        type: String,
        required: true
      },
      interviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: {
        type: String
      },
      date: {
        type: Date,
        default: Date.now
      }
    }],
    status: {
      type: String,
      enum: [
        'In Process',
        'Selected',
        'Rejected',
        'On Hold',
        'Withdrawn'
      ],
      default: 'In Process'
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

// Pre-save hook to generate sequential job_id
JobProfileSchema.pre('save', async function(next) {
  if (this.job_id.includes('XXXX')) {
    try {
      // Find the latest job with the same date prefix
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `JOB-${dateStr}`;
      
      const lastJob = await this.constructor.findOne(
        { job_id: { $regex: `^${prefix}` } },
        { job_id: 1 },
        { sort: { job_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastJob) {
        const lastNumber = parseInt(lastJob.job_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Pad with leading zeros to make it 4 digits
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.job_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Update the updated_at field on save
JobProfileSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('JobProfile', JobProfileSchema);