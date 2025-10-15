const mongoose = require('mongoose');
const validator = require('validator');

const CustomerMasterSchema = new mongoose.Schema({
  customer_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: CUS-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `CUS-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  customer_type: {
    type: String,
    required: [true, 'Customer type is required'],
    enum: [
      'Individual',
      'Company',
      'Government',
      'NGO',
      'Other'
    ]
  },
  // For Individual
  full_name: {
    type: String,
    trim: true
  },
  // For Company
  company_name: {
    type: String,
    trim: true
  },
  contact_details: {
    primary_contact_name: {
      type: String,
      required: [true, 'Primary contact name is required']
    },
    designation: {
      type: String
    },
    department: {
      type: String
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      validate: {
        validator: function(v) {
          return validator.isEmail(v);
        },
        message: 'Please enter a valid email'
      }
    },
    alternate_email: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || validator.isEmail(v);
        },
        message: 'Please enter a valid alternate email'
      }
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      validate: {
        validator: function(v) {
          return /^\d{10}$/.test(v);
        },
        message: 'Phone number must be 10 digits'
      }
    },
    alternate_phone: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\d{10}$/.test(v);
        },
        message: 'Alternate phone number must be 10 digits'
      }
    },
    whatsapp: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\d{10}$/.test(v);
        },
        message: 'WhatsApp number must be 10 digits'
      }
    }
  },
  address: {
    billing: {
      address_line1: {
        type: String,
        required: [true, 'Billing address line 1 is required']
      },
      address_line2: {
        type: String
      },
      city: {
        type: String,
        required: [true, 'City is required']
      },
      state: {
        type: String,
        required: [true, 'State is required']
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
        default: 'India'
      },
      pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        validate: {
          validator: function(v) {
            return /^\d{6}$/.test(v);
          },
          message: 'Pincode must be 6 digits'
        }
      }
    },
    shipping: {
      is_same_as_billing: {
        type: Boolean,
        default: true
      },
      address_line1: {
        type: String
      },
      address_line2: {
        type: String
      },
      city: {
        type: String
      },
      state: {
        type: String
      },
      country: {
        type: String,
        default: 'India'
      },
      pincode: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^\d{6}$/.test(v);
          },
          message: 'Shipping pincode must be 6 digits'
        }
      }
    }
  },
  tax_information: {
    gst_number: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(v);
        },
        message: 'Please enter a valid GST number'
      }
    },
    pan_number: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
        },
        message: 'Please enter a valid PAN number'
      }
    },
    tax_exemption: {
      is_exempt: {
        type: Boolean,
        default: false
      },
      exemption_details: {
        type: String
      }
    }
  },
  financial_details: {
    credit_limit: {
      type: Number,
      default: 0
    },
    payment_terms: {
      type: String
    },
    bank_name: {
      type: String
    },
    account_number: {
      type: String
    },
    ifsc_code: {
      type: String
    }
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: [
      'Active',
      'Inactive',
      'Blocked',
      'Pending Verification'
    ],
    default: 'Active'
  },
  grade: {
    type: String,
    enum: [
      'A',
      'B',
      'C',
      'D',
      'Not Graded'
    ],
    default: 'Not Graded'
  },
  source: {
    type: String,
    enum: [
      'Website',
      'Referral',
      'Direct',
      'Partner',
      'Exhibition',
      'Advertisement',
      'Social Media',
      'Other'
    ]
  },
  kyc_status: {
    type: String,
    enum: [
      'Not Started',
      'In Progress',
      'Completed',
      'Rejected'
    ],
    default: 'Not Started'
  },
  kyc_documents: [{
    document_type: {
      type: String,
      required: true,
      enum: [
        'PAN Card',
        'GST Certificate',
        'Aadhar Card',
        'Company Registration',
        'Address Proof',
        'Other'
      ]
    },
    document_number: {
      type: String,
      required: true
    },
    file_path: {
      type: String,
      required: true
    },
    verification_status: {
      type: String,
      enum: [
        'Pending',
        'Verified',
        'Rejected'
      ],
      default: 'Pending'
    },
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploaded_at: {
      type: Date,
      default: Date.now
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verified_at: {
      type: Date
    },
    rejection_reason: {
      type: String
    }
  }],
  assigned_sales_manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
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

// Pre-save hook to generate sequential customer_id
CustomerMasterSchema.pre('save', async function(next) {
  if (this.customer_id.includes('XXXX')) {
    try {
      // Find the latest customer with the same date prefix
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `CUS-${dateStr}`;
      
      const lastCustomer = await this.constructor.findOne(
        { customer_id: { $regex: `^${prefix}` } },
        { customer_id: 1 },
        { sort: { customer_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastCustomer) {
        const lastNumber = parseInt(lastCustomer.customer_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Pad with leading zeros to make it 4 digits
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.customer_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Update the updated_at field on save
CustomerMasterSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Validate that either full_name or company_name is provided based on customer_type
CustomerMasterSchema.pre('validate', function(next) {
  if (this.customer_type === 'Individual' && !this.full_name) {
    this.invalidate('full_name', 'Full name is required for Individual customers');
  } else if (this.customer_type === 'Company' && !this.company_name) {
    this.invalidate('company_name', 'Company name is required for Company customers');
  }
  next();
});

module.exports = mongoose.model('CustomerMaster', CustomerMasterSchema);