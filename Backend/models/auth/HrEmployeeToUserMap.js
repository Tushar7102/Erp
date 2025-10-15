const mongoose = require('mongoose');

const HrEmployeeToUserMapSchema = new mongoose.Schema({
  mapping_id: {
    type: String,
    unique: true,
    default: function() {
      return 'HRUM' + Date.now() + Math.floor(Math.random() * 1000);
    }
  },
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee ID is required']
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  mapping_type: {
    type: String,
    enum: ['Primary', 'Secondary', 'Temporary'],
    default: 'Primary'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  mapped_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Mapped by user is required']
  },
  mapped_at: {
    type: Date,
    default: Date.now
  },
  unmapped_at: {
    type: Date,
    default: null
  },
  unmapped_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
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

// Indexes for better performance
HrEmployeeToUserMapSchema.index({ employee_id: 1, user_id: 1 }, { unique: true });
HrEmployeeToUserMapSchema.index({ employee_id: 1 });
HrEmployeeToUserMapSchema.index({ user_id: 1 });
HrEmployeeToUserMapSchema.index({ is_active: 1 });
HrEmployeeToUserMapSchema.index({ mapping_type: 1 });

// Update the updated_at field before saving
HrEmployeeToUserMapSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Virtual for mapping duration
HrEmployeeToUserMapSchema.virtual('mapping_duration').get(function() {
  if (this.unmapped_at) {
    return this.unmapped_at - this.mapped_at;
  }
  return Date.now() - this.mapped_at;
});

// Static method to find active mappings for an employee
HrEmployeeToUserMapSchema.statics.findActiveByEmployee = function(employeeId) {
  return this.find({ 
    employee_id: employeeId, 
    is_active: true 
  }).populate('user_id employee_id');
};

// Static method to find active mappings for a user
HrEmployeeToUserMapSchema.statics.findActiveByUser = function(userId) {
  return this.find({ 
    user_id: userId, 
    is_active: true 
  }).populate('user_id employee_id');
};

// Instance method to deactivate mapping
HrEmployeeToUserMapSchema.methods.deactivateMapping = function(unmappedBy) {
  this.is_active = false;
  this.unmapped_at = Date.now();
  this.unmapped_by = unmappedBy;
  return this.save();
};

module.exports = mongoose.models.HrEmployeeToUserMap || mongoose.model('HrEmployeeToUserMap', HrEmployeeToUserMapSchema);