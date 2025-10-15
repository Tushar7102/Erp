const mongoose = require('mongoose');

const EmployeeRoleAssignmentSchema = new mongoose.Schema({
  assignment_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: ASSIGN-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `ASSIGN-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: [true, 'Role ID is required']
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned by user ID is required']
  },
  assigned_at: {
    type: Date,
    default: Date.now
  },
  effective_from: {
    type: Date,
    default: Date.now
  },
  effective_until: {
    type: Date,
    default: null // null means indefinite
  },
  is_active: {
    type: Boolean,
    default: true
  },
  permission_overrides: {
    type: Map,
    of: Boolean,
    default: new Map()
  },
  notes: {
    type: String,
    default: null
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
EmployeeRoleAssignmentSchema.index({ user_id: 1, is_active: 1 });
EmployeeRoleAssignmentSchema.index({ role_id: 1, is_active: 1 });
EmployeeRoleAssignmentSchema.index({ assigned_by: 1 });
EmployeeRoleAssignmentSchema.index({ effective_from: 1, effective_until: 1 });

// Compound index to ensure one active role per user
EmployeeRoleAssignmentSchema.index(
  { user_id: 1, is_active: 1 },
  { 
    unique: true,
    partialFilterExpression: { is_active: true }
  }
);

// Middleware to update updated_at
EmployeeRoleAssignmentSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Create assignment_id before saving
EmployeeRoleAssignmentSchema.pre('save', async function(next) {
  // Only generate ID for new documents
  if (!this.isNew || this.assignment_id.indexOf('XXXX') === -1) {
    return next();
  }
  
  // Generate ID format: ASSIGN-YYYYMMDD-XXXX (where XXXX is sequential)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the highest assignment_id for today
  const lastAssignment = await this.constructor.findOne(
    { assignment_id: new RegExp(`^ASSIGN-${dateStr}`) },
    { assignment_id: 1 },
    { sort: { assignment_id: -1 } }
  );
  
  let sequence = 1;
  if (lastAssignment && lastAssignment.assignment_id) {
    const lastSequence = parseInt(lastAssignment.assignment_id.split('-')[2]);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  // Pad sequence with leading zeros
  const paddedSequence = sequence.toString().padStart(4, '0');
  this.assignment_id = `ASSIGN-${dateStr}-${paddedSequence}`;
  
  next();
});

// Static method to get active assignment for user
EmployeeRoleAssignmentSchema.statics.getActiveAssignment = function(userId) {
  return this.findOne({
    user_id: userId,
    is_active: true,
    $or: [
      { effective_until: null },
      { effective_until: { $gte: new Date() } }
    ]
  }).populate('role_id user_id assigned_by');
};

// Static method to get user's effective permissions
EmployeeRoleAssignmentSchema.statics.getUserPermissions = async function(userId) {
  const assignment = await this.getActiveAssignment(userId);
  if (!assignment) return [];
  
  let permissions = assignment.role_id.permissions || [];
  
  // Apply permission overrides
  if (assignment.permission_overrides && assignment.permission_overrides.size > 0) {
    assignment.permission_overrides.forEach((value, permission) => {
      if (value && !permissions.includes(permission)) {
        permissions.push(permission);
      } else if (!value && permissions.includes(permission)) {
        permissions = permissions.filter(p => p !== permission);
      }
    });
  }
  
  return permissions;
};

// Instance method to check if assignment is currently effective
EmployeeRoleAssignmentSchema.methods.isCurrentlyEffective = function() {
  const now = new Date();
  return this.is_active && 
         this.effective_from <= now && 
         (!this.effective_until || this.effective_until >= now);
};

// Instance method to add permission override
EmployeeRoleAssignmentSchema.methods.addPermissionOverride = function(permission, granted) {
  if (!this.permission_overrides) {
    this.permission_overrides = new Map();
  }
  this.permission_overrides.set(permission, granted);
  return this.save();
};

// Instance method to remove permission override
EmployeeRoleAssignmentSchema.methods.removePermissionOverride = function(permission) {
  if (this.permission_overrides) {
    this.permission_overrides.delete(permission);
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('EmployeeRoleAssignment', EmployeeRoleAssignmentSchema);