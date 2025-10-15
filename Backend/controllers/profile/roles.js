const asyncHandler = require('../../middleware/async');
const ErrorResponse = require('../../utils/errorResponse');
const Role = require('../../models/auth/Role');
const User = require('../../models/profile/User');
const ModulePermission = require('../../models/auth/ModulePermission');

// Helper function to get all available permissions
const getAvailablePermissions = async () => {
  // Get dynamic permissions from ModulePermission model
  const activePermissions = await ModulePermission.find({ is_active: true });
  
  // Available permissions list (combining static and dynamic)
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

  // Add general module permissions (without specific actions)
  const modulePermissions = [
    'user', 'enquiry', 'call', 'role', 'report', 'settings', 'profile', 'dashboard'
  ];
  availablePermissions.push(...modulePermissions);

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

  return availablePermissions;
};

// Helper function to add new permissions to ModulePermission model
const addNewPermissions = async (newPermissions) => {
  for (const permission of newPermissions) {
    // Check if permission already exists in ModulePermission
    const existingPermission = await ModulePermission.findOne({
      $or: [
        { permission_name: permission },
        { full_permission_name: permission }
      ]
    });

    if (!existingPermission) {
      // Parse permission to get module and type
      const parts = permission.split('_');
      const moduleName = parts[0];
      const permissionType = parts.length > 1 ? parts[1] : 'general';
      
      // Create proper module name (capitalize first letter)
      const properModuleName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1) + ' Management';
      
      // Create new permission entry
      await ModulePermission.create({
        module_name: properModuleName,
        permission_type: permissionType,
        permission_name: permission,
        description: `${permissionType.charAt(0).toUpperCase() + permissionType.slice(1)} permission for ${moduleName} module`,
        is_active: true
      });
      console.log(`Added new permission: ${permission}`);
    }
  }
};

// Helper function to expand general permissions to specific permissions
const expandPermissions = (permissions) => {
  const expandedPermissions = [...permissions];
  
  // Define permission expansion mapping
  const permissionExpansion = {
    'user': ['user_view', 'user_create', 'user_update', 'user_delete'],
    'enquiry': ['enquiry_view', 'enquiry_create', 'enquiry_update', 'enquiry_delete'],
    'call': ['call_view', 'call_create', 'call_update', 'call_delete'],
    'role': ['role_view', 'role_create', 'role_update', 'role_delete'],
    'report': ['report_view', 'report_generate'],
    'settings': ['settings_view', 'settings_update'],
    'profile': ['profile_view', 'profile_create', 'profile_update', 'profile_delete'],
    'dashboard': ['dashboard_view']
  };

  // Expand general permissions
  permissions.forEach(permission => {
    if (permissionExpansion[permission]) {
      // Add all specific permissions for this module
      permissionExpansion[permission].forEach(specificPerm => {
        if (!expandedPermissions.includes(specificPerm)) {
          expandedPermissions.push(specificPerm);
        }
      });
    }
  });

  return expandedPermissions;
};

// @desc    Get all roles
// @route   GET /api/v1/profile/roles
// @access  Private
exports.getRoles = asyncHandler(async (req, res, next) => {
  const roles = await Role.find().sort({ created_at: -1 });

  // Get user count for each role
  const rolesWithUserCount = await Promise.all(
    roles.map(async (role) => {
      const userCount = await User.countDocuments({ role_id: role._id });
      return {
        ...role.toObject(),
        user_count: userCount
      };
    })
  );

  res.status(200).json({
    success: true,
    count: rolesWithUserCount.length,
    data: rolesWithUserCount
  });
});

// @desc    Get single role
// @route   GET /api/v1/profile/roles/:id
// @access  Private
exports.getRole = asyncHandler(async (req, res, next) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    return next(new ErrorResponse(`Role not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: role
  });
});

// @desc    Create role
// @route   POST /api/v1/profile/roles
// @access  Private
exports.createRole = asyncHandler(async (req, res, next) => {
  const { role_name, description, permissions } = req.body;

  // Validate required fields
  if (!role_name || !description) {
    return next(new ErrorResponse('Please provide role name and description', 400));
  }

  // Check if role already exists (case-insensitive)
  const existingRole = await Role.findOne({ 
    role_name: { $regex: new RegExp(`^${role_name}$`, 'i') } 
  });

  if (existingRole) {
    return next(new ErrorResponse(`Role with name '${role_name}' already exists`, 400));
  }

  // Validate permissions array if provided
  if (permissions && !Array.isArray(permissions)) {
    return next(new ErrorResponse('Permissions must be an array', 400));
  }

  // Get available permissions
  const availablePermissions = await getAvailablePermissions();

  // Check for new permissions and add them automatically
  if (permissions && permissions.length > 0) {
    const newPermissions = permissions.filter(perm => !availablePermissions.includes(perm));
    if (newPermissions.length > 0) {
      console.log(`Adding new permissions: ${newPermissions.join(', ')}`);
      await addNewPermissions(newPermissions);
      
      // Also add to admin role if it exists
      const adminRole = await Role.findOne({ role_name: { $regex: /^admin$/i } });
      if (adminRole) {
        const updatedAdminPermissions = [...new Set([...adminRole.permissions, ...newPermissions])];
        await Role.findByIdAndUpdate(adminRole._id, { permissions: updatedAdminPermissions });
        console.log(`Added new permissions to admin role: ${newPermissions.join(', ')}`);
      }
    }
  }

  // Expand general permissions to specific permissions
  const expandedPermissions = permissions && permissions.length > 0 ? expandPermissions(permissions) : [];

  const roleData = {
    role_name: role_name.trim(),
    description: description.trim(),
    permissions: expandedPermissions
  };

  const role = await Role.create(roleData);

  res.status(201).json({
    success: true,
    message: `Role '${role.role_name}' created successfully`,
    data: role
  });
});

// @desc    Update role
// @route   PUT /api/v1/profile/roles/:id
// @access  Private
exports.updateRole = asyncHandler(async (req, res, next) => {
  const { role_name, description, permissions } = req.body;

  // Find the role first
  let role = await Role.findById(req.params.id);
  if (!role) {
    return next(new ErrorResponse(`Role not found with id of ${req.params.id}`, 404));
  }

  // Validate permissions array if provided
  if (permissions && !Array.isArray(permissions)) {
    return next(new ErrorResponse('Permissions must be an array', 400));
  }

  // Check for new permissions and add them automatically if permissions are provided
  if (permissions && permissions.length > 0) {
    const availablePermissions = await getAvailablePermissions();
    const newPermissions = permissions.filter(perm => !availablePermissions.includes(perm));
    if (newPermissions.length > 0) {
      console.log(`Adding new permissions: ${newPermissions.join(', ')}`);
      await addNewPermissions(newPermissions);
      
      // Also add to admin role if it exists
      const adminRole = await Role.findOne({ role_name: { $regex: /^admin$/i } });
      if (adminRole) {
        const updatedAdminPermissions = [...new Set([...adminRole.permissions, ...newPermissions])];
        await Role.findByIdAndUpdate(adminRole._id, { permissions: updatedAdminPermissions });
        console.log(`Added new permissions to admin role: ${newPermissions.join(', ')}`);
      }
    }
  }

  // Check if role name already exists (if being updated)
  if (role_name && role_name !== role.role_name) {
    const existingRole = await Role.findOne({ 
      role_name: { $regex: new RegExp(`^${role_name}$`, 'i') },
      _id: { $ne: req.params.id }
    });

    if (existingRole) {
      return next(new ErrorResponse(`Role with name '${role_name}' already exists`, 400));
    }
  }

  // Expand general permissions to specific permissions if permissions are provided
  let updateData = { ...req.body };
  if (permissions && permissions.length > 0) {
    updateData.permissions = expandPermissions(permissions);
  }

  // Update the role
  role = await Role.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: `Role '${role.role_name}' updated successfully`,
    data: role
  });
});

// @desc    Delete role
// @route   DELETE /api/v1/profile/roles/:id
// @access  Private
exports.deleteRole = asyncHandler(async (req, res, next) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    return next(new ErrorResponse(`Role not found with id of ${req.params.id}`, 404));
  }

  await role.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get all available permissions
// @route   GET /api/v1/profile/roles/permissions
// @access  Private
exports.getAvailablePermissions = asyncHandler(async (req, res, next) => {
  const availablePermissions = await getAvailablePermissions();

  res.status(200).json({
    success: true,
    count: availablePermissions.length,
    data: availablePermissions
  });
});
