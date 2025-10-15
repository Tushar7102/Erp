const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number']
  },
  company: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    default: 'direct'
  },
  // Validation fields
  validation_score: {
    type: Number,
    default: 0
  },
  duplicate_score: {
    type: Number,
    default: 0
  },
  validation_issues: [String],
  potential_duplicates: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Lead'
  }],
  status: {
    type: String,
    enum: ['pending', 'validated', 'rejected'],
    default: 'pending'
  },
  validated_at: Date,
  validated_by: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  notes: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Create validation history when status changes
LeadSchema.pre('save', async function(next) {
  if (this.isModified('status') || this.isModified('validation_score') || this.isModified('duplicate_score')) {
    this.updated_at = Date.now();
    
    // In a real implementation, you would create a validation history entry here
    // const ValidationHistory = mongoose.model('ValidationHistory');
    // await ValidationHistory.create({
    //   lead: this._id,
    //   action: 'status_change',
    //   previous_status: this._original.status,
    //   new_status: this.status,
    //   changed_by: this.validated_by,
    //   notes: this.notes,
    //   created_at: Date.now()
    // });
  }
  next();
});

// Method to check for duplicates
LeadSchema.methods.findDuplicates = async function(threshold = 80) {
  const Lead = mongoose.model('Lead');
  
  // In a real implementation, this would use more sophisticated matching
  const potentialDuplicates = await Lead.find({
    $or: [
      { email: this.email },
      { phone: this.phone },
      { 
        name: this.name,
        company: this.company
      }
    ],
    _id: { $ne: this._id }
  });
  
  return potentialDuplicates;
};

// Method to validate lead
LeadSchema.methods.validate = async function() {
  const issues = [];
  let score = 100;
  
  // Email validation
  if (!this.email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
    issues.push('Invalid email');
    score -= 20;
  }
  
  // Phone validation
  if (!this.phone.match(/^\+?[0-9]{10,15}$/)) {
    issues.push('Invalid phone');
    score -= 20;
  }
  
  // Company validation
  if (!this.company || this.company.length < 2) {
    issues.push('Missing company');
    score -= 10;
  }
  
  // Spam detection (simple example)
  if (this.email.includes('spam') || this.name.includes('test')) {
    issues.push('Spam detected');
    score -= 50;
  }
  
  this.validation_issues = issues;
  this.validation_score = Math.max(0, score);
  
  // Check for duplicates
  const duplicates = await this.findDuplicates();
  this.potential_duplicates = duplicates.map(d => d._id);
  this.duplicate_score = duplicates.length > 0 ? 100 : 0;
  
  return this;
};

module.exports = mongoose.model('Lead', LeadSchema);