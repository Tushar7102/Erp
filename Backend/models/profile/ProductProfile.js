const mongoose = require('mongoose');

const ProductProfileSchema = new mongoose.Schema({
  product_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: PDT-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `PDT-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot be more than 200 characters']
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
  product_type: {
    type: String,
    required: [true, 'Product type is required'],
    enum: [
      'Solar Panel',
      'Inverter',
      'Battery',
      'Mounting Structure',
      'Accessories',
      'Complete System',
      'Other'
    ]
  },
  specifications: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unit_price: {
    type: Number,
    required: [true, 'Unit price is required']
  },
  total_price: {
    type: Number,
    required: [true, 'Total price is required']
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
  warranty_period: {
    type: String
  },
  warranty_details: {
    type: String
  },
  delivery_address: {
    address: {
      type: String,
      required: [true, 'Delivery address is required']
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
    }
  },
  delivery_date: {
    expected: {
      type: Date
    },
    actual: {
      type: Date
    }
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: [
      'New',
      'Processing',
      'Ready for Dispatch',
      'Dispatched',
      'Delivered',
      'Cancelled'
    ],
    default: 'New'
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
  assigned_sales_person: {
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
        'Invoice',
        'Quotation',
        'Warranty Card',
        'Technical Specification',
        'User Manual',
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

// Pre-save hook to generate sequential product_id
ProductProfileSchema.pre('save', async function(next) {
  if (this.product_id.includes('XXXX')) {
    try {
      // Find the latest product with the same date prefix
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `PDT-${dateStr}`;
      
      const lastProduct = await this.constructor.findOne(
        { product_id: { $regex: `^${prefix}` } },
        { product_id: 1 },
        { sort: { product_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastProduct) {
        const lastNumber = parseInt(lastProduct.product_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Pad with leading zeros to make it 4 digits
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.product_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Update the updated_at field on save
ProductProfileSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('ProductProfile', ProductProfileSchema);