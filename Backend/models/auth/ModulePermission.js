const mongoose = require('mongoose');

const ModulePermissionSchema = new mongoose.Schema({
  permission_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: PERM-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `PERM-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  module_name: {
    type: String,
    required: [true, 'Please add a module name'],
    trim: true
  },
  permission_type: {
    type: String,
    required: [true, 'Please add a permission type'],
    enum: ['view', 'create', 'update', 'delete', 'manage', 'generate']
  },
  permission_name: {
    type: String,
    required: [true, 'Please add a permission name']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  module_level: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  parent_permission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ModulePermission',
    default: null
  },
  is_active: {
    type: Boolean,
    default: true
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
ModulePermissionSchema.index({ module_name: 1, permission_type: 1 });
ModulePermissionSchema.index({ permission_name: 1 });
ModulePermissionSchema.index({ is_active: 1 });

// Virtual for full permission name
ModulePermissionSchema.virtual('full_permission_name').get(function() {
  return `${this.module_name.toLowerCase().replace(/\s+/g, '_')}_${this.permission_type}`;
});

// Middleware to update updated_at
ModulePermissionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Create permission_id before saving
ModulePermissionSchema.pre('save', async function(next) {
  // Only generate ID for new documents
  if (!this.isNew || this.permission_id.indexOf('XXXX') === -1) {
    return next();
  }
  
  // Generate ID format: PERM-YYYYMMDD-XXXX (where XXXX is sequential)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the highest permission_id for today
  const lastPermission = await this.constructor.findOne(
    { permission_id: new RegExp(`^PERM-${dateStr}`) },
    { permission_id: 1 },
    { sort: { permission_id: -1 } }
  );
  
  let sequence = 1;
  if (lastPermission && lastPermission.permission_id) {
    const lastSequence = parseInt(lastPermission.permission_id.split('-')[2]);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  // Pad sequence with leading zeros
  const paddedSequence = sequence.toString().padStart(4, '0');
  this.permission_id = `PERM-${dateStr}-${paddedSequence}`;
  
  next();
});

// Static method to get permissions by module
ModulePermissionSchema.statics.getByModule = function(moduleName) {
  return this.find({ module_name: moduleName, is_active: true });
};

// Static method to get all permissions for a role
ModulePermissionSchema.statics.getPermissionsForRole = function(permissions) {
  return this.find({ 
    permission_name: { $in: permissions },
    is_active: true 
  });
};

// Instance method to check if permission is hierarchical
ModulePermissionSchema.methods.hasChildren = function() {
  return this.constructor.findOne({ parent_permission: this._id });
};

module.exports = mongoose.model('ModulePermission', ModulePermissionSchema);