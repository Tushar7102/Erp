const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  employee_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: EMP-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `EMP-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  personal_details: {
    first_name: {
      type: String,
      required: true
    },
    last_name: {
      type: String,
      required: true
    },
    middle_name: String,
    date_of_birth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    marital_status: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed', 'other']
    },
    blood_group: String,
    nationality: String,
    religion: String,
    category: String, // SC, ST, OBC, General, etc.
    physically_challenged: {
      type: Boolean,
      default: false
    }
  },
  contact_details: {
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    personal_email: String,
    phone: {
      type: String,
      match: [
        /^\+?[1-9]\d{9,14}$/,
        'Please add a valid phone number'
      ]
    },
    alternate_phone: String,
    emergency_contact: {
      name: String,
      relationship: String,
      phone: String
    },
    current_address: {
      street: String,
      city: String,
      state: String,
      postal_code: String,
      country: String
    },
    permanent_address: {
      street: String,
      city: String,
      state: String,
      postal_code: String,
      country: String
    }
  },
  employment_details: {
    employee_type: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'intern', 'probation', 'consultant'],
      default: 'full_time'
    },
    department: {
      type: String,
      required: true
    },
    designation: {
      type: String,
      required: true
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    },
    reporting_manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    work_location: String,
    join_date: {
      type: Date,
      required: true
    },
    confirmation_date: Date,
    probation_period: Number, // in months
    notice_period: Number, // in days
    exit_date: Date,
    exit_reason: String,
    work_experience: Number, // in years
    status: {
      type: String,
      enum: ['active', 'on_leave', 'terminated', 'resigned', 'retired', 'absconding'],
      default: 'active'
    }
  },
  salary_details: {
    basic_salary: Number,
    hra: Number,
    conveyance_allowance: Number,
    medical_allowance: Number,
    special_allowance: Number,
    bonus: Number,
    pf_contribution: Number,
    esi_contribution: Number,
    professional_tax: Number,
    tds: Number,
    net_salary: Number,
    salary_account: {
      bank_name: String,
      account_number: String,
      ifsc_code: String,
      branch_name: String
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  identification_details: {
    pan_number: String,
    aadhar_number: String,
    passport_number: String,
    passport_expiry: Date,
    driving_license: String,
    driving_license_expiry: Date,
    voter_id: String,
    uan_number: String // Universal Account Number for PF
  },
  education: [{
    degree: String,
    institution: String,
    field_of_study: String,
    start_date: Date,
    end_date: Date,
    percentage: Number,
    cgpa: Number
  }],
  work_history: [{
    company_name: String,
    designation: String,
    start_date: Date,
    end_date: Date,
    responsibilities: String,
    reason_for_leaving: String
  }],
  skills: [{
    name: String,
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    years_of_experience: Number
  }],
  documents: [{
    document_type: String,
    document_name: String,
    document_url: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  notes: String,
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

// Update the updated_at field
EmployeeSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Create employee_id before saving
EmployeeSchema.pre('save', async function(next) {
  // Only generate ID for new documents
  if (!this.isNew || this.employee_id.indexOf('XXXX') === -1) {
    return next();
  }
  
  // Generate ID format: EMP-YYYYMMDD-XXXX (where XXXX is sequential)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the highest employee_id for today
  const lastEmployee = await this.constructor.findOne(
    { employee_id: new RegExp(`^EMP-${dateStr}`) },
    { employee_id: 1 },
    { sort: { employee_id: -1 } }
  );
  
  let sequence = 1;
  if (lastEmployee && lastEmployee.employee_id) {
    const lastSequence = parseInt(lastEmployee.employee_id.split('-')[2]);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  // Pad sequence with leading zeros
  const paddedSequence = sequence.toString().padStart(4, '0');
  this.employee_id = `EMP-${dateStr}-${paddedSequence}`;
  
  next();
});

module.exports = mongoose.model('Employee', EmployeeSchema);