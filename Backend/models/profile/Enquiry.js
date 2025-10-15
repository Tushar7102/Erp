const mongoose = require('mongoose');
const validator = require('validator');
const mongoosePaginate = require('mongoose-paginate-v2');

const EnquirySchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: [true, 'Name is required'] },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Mobile number must be 10 digits'
    }
  },
  email: {
    type: String,
    validate: {
      validator: function (v) {
        return !v || validator.isEmail(v);
      },
      message: 'Invalid email address'
    }
  },
  pv_capacity_kw: { type: Number },
  pincode: { type: String },
  state: { type: String },
  district: { type: String },
  aadhaar_file: { type: String },
  electricity_bill_file: { type: String },
  bank_statement_file: { type: String },
  pan_file: { type: String },
  project_proposal_file: { type: String },
  branch: { type: String },
  project_type: { type: String },
  category: { type: String, enum: ['Residential', 'Industrial', 'Commercial', 'Government'] },
  connection_type: { type: String, enum: ['Yes', 'No'] },
  project_enhancement: { type: String, enum: ['Yes', 'No'] },
  subsidy_type: { type: String, enum: ['Subsidy', 'Non Subsidy'] },
  type_of_lead: { type: String, enum: ['B2B', 'B2C'], required: true },
  business_model: { type: String, enum: ['Capex', 'Opex'] },
  metering: { type: String, enum: ['Net Metering', 'Open Access', 'Gross Metering'] },
  priority: { type: String, enum: ['High', 'Medium', 'Low'] },
  status_of_lead: { type: String },
  project_location: { type: String },
  source_of_lead: { type: String },
  add_remarks: { type: String },
  source_of_reference: { type: String },
  need_loan: { type: Boolean, default: false },
  
  // Enquiry Metadata
  enquiry_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: ENQ-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `ENQ-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  source_type: {
    type: String,
    required: [true, 'Please add a source type'],
    enum: [
      'Website',
      'WhatsApp',
      'Meta Ads',
      'JustDial',
      'IndiaMART',
      'Walk-in',
      'Referral',
      'Cold Call',
      'Other'
    ]
  },
  channel_type: {
    type: String,
    enum: [
      'Online',
      'Offline',
      'API',
      'Manual',
      'Bulk Upload'
    ]
  },
  enquiry_profile: {
    type: String,
    enum: [
      'Project',
      'Product',
      'AMC/Service',
      'Complaint',
      'Job',
      'Info Request',
      'Installation',
      'Unknown'
    ],
    default: 'Unknown'
  },
  
  // Status and Assignment
  status: {
    type: String,
    required: true,
    enum: [
      'New',
      'Unknown',
      'Blocked',
      'In Progress',
      'Quoted',
      'Converted',
      'Rejected',
      'Duplicate',
      'Repeat',
      'Archived'
    ],
    default: 'New'
  },
  status_type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StatusType'
  },
  stage: {
    type: String,
    required: true,
    enum: [
      'Captured',
      'Telecaller Queue',
      'Profile Identified',
      'Assignment Pending',
      'Assigned',
      'Action in Progress',
      'Quoted',
      'Follow-Up',
      'Closed - Converted',
      'Closed - Rejected',
      'Internal Review',
      'Re-processing',
      'Archived'
    ],
    default: 'Captured'
  },
  priority: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  },
  priority_score: {
    type: Number,
    default: 0
  },
  priority_type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PriorityScoreType'
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assigned_team: {
    type: String
  },
  
  // Status and Assignment History - Now handled by separate models
  // status_history removed - use StatusLog model instead
  
  // assignment_history removed - use AssignmentLog model instead
  
  // Profile-specific data (dynamic based on enquiry_profile)
  profile_data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Call Status
  call_status: {
    type: String,
    enum: [
      'Not Called',
      'Call Scheduled',
      'Call Successful',
      'Missed',
      'Busy',
      'Not Reachable',
      'Invalid Number',
      'Follow-up Scheduled',
      'Call Rejected',
      'No Response',
      'Do Not Disturb'
    ],
    default: 'Not Called'
  },
  last_called_at: {
    type: Date
  },
  next_follow_up: {
    type: Date
  },
  
  // Remarks and Internal Notes
  remarks: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Quotation Information
  quotation_amount: {
    type: Number
  },
  quotation_date: {
    type: Date
  },
  quotation_status: {
    type: String,
    enum: ['Not Generated', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Revised'],
    default: 'Not Generated'
  },
  
  // Tasks and Activities - Now handled by separate Task model
  // tasks removed - use Task model instead
  
  // Communication History - Now handled by separate CommunicationLog model
  // communications removed - use CommunicationLog model instead
  
  // Source Channel Information
  source_channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SourceChannel'
  },
  utm_source: {
    type: String
  },
  utm_medium: {
    type: String
  },
  utm_campaign: {
    type: String
  },
  utm_term: {
    type: String
  },
  utm_content: {
    type: String
  },
  referrer_url: {
    type: String
  },
  landing_page: {
    type: String
  },
  device_info: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Notifications - Now handled by separate NotificationLog model
  // notifications removed - use NotificationLog model instead
  
  // Integration Configs - Now handled by separate IntegrationConfig model
  integration_config: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IntegrationConfig'
  },
  
  // Duplicate/Spam Detection
  is_duplicate: {
    type: Boolean,
    default: false
  },
  duplicate_of: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enquiry'
  },
  spam_score: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  closed_at: {
    type: Date
  }
});

// Create enquiry_id before saving
EnquirySchema.pre('save', async function(next) {
  // Only generate ID for new documents
  if (!this.isNew) {
    return next();
  }
  
  // Generate ID format: ENQ-YYYYMMDD-XXXX (where XXXX is sequential)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the highest enquiry_id for today
  const lastEnquiry = await this.constructor.findOne(
    { enquiry_id: new RegExp(`^ENQ-${dateStr}`) },
    { enquiry_id: 1 },
    { sort: { enquiry_id: -1 } }
  );
  
  let sequence = 1;
  if (lastEnquiry && lastEnquiry.enquiry_id) {
    const lastSequence = parseInt(lastEnquiry.enquiry_id.split('-')[2]);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  // Pad sequence with leading zeros
  const paddedSequence = sequence.toString().padStart(4, '0');
  this.enquiry_id = `ENQ-${dateStr}-${paddedSequence}`;
  
  next();
});

// Update the updated_at field
EnquirySchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Set closed_at when status changes to Converted or Rejected
EnquirySchema.pre('save', function(next) {
  if (
    this.isModified('status') && 
    (this.status === 'Converted' || this.status === 'Rejected') && 
    !this.closed_at
  ) {
    this.closed_at = Date.now();
  }
  
  // Add to status history when status changes
  if (this.isModified('status')) {
    if (!this.status_history) {
      this.status_history = [];
    }
    
    this.status_history.push({
      status: this.status,
      status_type: this.status_type,
      changed_by: this.isNew ? this.created_by : undefined, // Will be set by controller for updates
      timestamp: Date.now()
    });
  }
  
  // Add to assignment history when assigned_to changes
  if (this.isModified('assigned_to')) {
    if (!this.assignment_history) {
      this.assignment_history = [];
    }
    
    this.assignment_history.push({
      assigned_to: this.assigned_to,
      assigned_team: this.assigned_team,
      assigned_by: this.isNew ? this.created_by : undefined, // Will be set by controller for updates
      timestamp: Date.now()
    });
  }
  
  next();
});

// Add custom validation for conditional required fields
EnquirySchema.pre('validate', function (next) {
  // Conditional required for B2B/B2C
  if (this.type_of_lead === 'B2B') {
    if (!this.business_model) {
      this.invalidate('business_model', 'Business Model is required for B2B leads');
    }
    if (!this.company_name) {
      this.invalidate('company_name', 'Company Name is required for B2B leads');
    }
  }
  if (this.type_of_lead === 'B2C') {
    if (!this.pv_capacity_kw) {
      this.invalidate('pv_capacity_kw', 'PV Capacity (kW) is required for B2C leads');
    }
    if (!this.category) {
      this.invalidate('category', 'Category is required for B2C leads');
    }
  }
  // File fields presence (only if need_loan is true)
  if (this.need_loan) {
    if (!this.aadhaar_file) {
      this.invalidate('aadhaar_file', 'Aadhaar file is required for loan enquiries');
    }
    if (!this.electricity_bill_file) {
      this.invalidate('electricity_bill_file', 'Electricity Bill file is required for loan enquiries');
    }
    if (!this.bank_statement_file) {
      this.invalidate('bank_statement_file', 'Bank Statement file is required for loan enquiries');
    }
    if (!this.pan_file) {
      this.invalidate('pan_file', 'PAN file is required for loan enquiries');
    }
    if (!this.project_proposal_file) {
      this.invalidate('project_proposal_file', 'Project Proposal file is required for loan enquiries');
    }
  }
  next();
});

// Indexes for faster queries
EnquirySchema.index({ mobile: 1 });
EnquirySchema.index({ email: 1 });
EnquirySchema.index({ status: 1 });
EnquirySchema.index({ status_type: 1 });
EnquirySchema.index({ stage: 1 });
EnquirySchema.index({ priority: 1 });
EnquirySchema.index({ priority_score: 1 });
EnquirySchema.index({ priority_type: 1 });
EnquirySchema.index({ enquiry_profile: 1 });
EnquirySchema.index({ assigned_to: 1 });
EnquirySchema.index({ created_at: 1 });
EnquirySchema.index({ source_type: 1, created_at: 1 });
EnquirySchema.index({ source_channel: 1 });
EnquirySchema.index({ integration_config: 1 });
EnquirySchema.index({ next_follow_up: 1 });

// Add this line before exporting the model
EnquirySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Enquiry', EnquirySchema);