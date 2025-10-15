const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  role_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: ROLE-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `ROLE-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  role_name: {
    type: String,
    required: [true, 'Please add a role name'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  permissions: {
    type: [String],
    default: function() {
      // If this is Admin, include all permissions
      if (this.role_name === 'Admin') {
        return [
          'user_view', 'user_create', 'user_update', 'user_delete',
          'enquiry_view', 'enquiry_create', 'enquiry_update', 'enquiry_delete',
          'call_view', 'call_create', 'call_update', 'call_delete',
          'role_view', 'role_create', 'role_update', 'role_delete',
          'report_view', 'report_generate',
          'settings_view', 'settings_update',
          'profile_view', 'profile_create', 'profile_update', 'profile_delete',
          'dashboard_view'
        ];
      }
      return [];
    },
    validate: {
      validator: async function(permissions) {
        // Get ModulePermission model
        const ModulePermission = mongoose.model('ModulePermission');
        
        // Get all active permissions from ModulePermission model
        const activePermissions = await ModulePermission.find({ is_active: true });
        
        // Create available permissions list from ModulePermission model
        const availablePermissions = [
          // Static permissions (for backward compatibility)
          'user_view', 'user_create', 'user_update', 'user_delete',
          'enquiry_view', 'enquiry_create', 'enquiry_update', 'enquiry_delete',
          'call_view', 'call_create', 'call_update', 'call_delete',
          'role_view', 'role_create', 'role_update', 'role_delete',
          'report_view', 'report_generate',
          'settings_view', 'settings_update',
          'profile_view', 'profile_create', 'profile_update', 'profile_delete',
          'dashboard_view'
        ];
        
        // Add dynamic permissions from ModulePermission model
        activePermissions.forEach(perm => {
          const permissionName = perm.permission_name || perm.full_permission_name;
          if (permissionName && !availablePermissions.includes(permissionName)) {
            availablePermissions.push(permissionName);
          }
          
          // Also add the virtual full_permission_name if it exists
          if (perm.full_permission_name && !availablePermissions.includes(perm.full_permission_name)) {
            availablePermissions.push(perm.full_permission_name);
          }
        });
        
        // Check if all permissions are valid
        return permissions.every(perm => availablePermissions.includes(perm));
      },
      message: 'Invalid permission(s) provided'
    }
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
RoleSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Create role_id before saving
RoleSchema.pre('save', async function(next) {
  // Only generate ID for new documents
  if (!this.isNew || this.role_id.indexOf('XXXX') === -1) {
    return next();
  }
  
  // Generate ID format: ROLE-YYYYMMDD-XXXX (where XXXX is sequential)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the highest role_id for today
  const lastRole = await this.constructor.findOne(
    { role_id: new RegExp(`^ROLE-${dateStr}`) },
    { role_id: 1 },
    { sort: { role_id: -1 } }
  );
  
  let sequence = 1;
  if (lastRole && lastRole.role_id) {
    const lastSequence = parseInt(lastRole.role_id.split('-')[2]);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  // Pad sequence with leading zeros
  const paddedSequence = sequence.toString().padStart(4, '0');
  this.role_id = `ROLE-${dateStr}-${paddedSequence}`;
  
  next();
});

module.exports = mongoose.model('Role', RoleSchema);