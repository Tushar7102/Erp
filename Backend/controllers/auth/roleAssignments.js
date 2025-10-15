const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const EmployeeRoleAssignment = require('../../models/auth/EmployeeRoleAssignment');
const User = require('../../models/profile/User');
const Role = require('../../models/auth/Role');

/**
 * @desc    Get all role assignments
 * @route   GET /api/auth/role-assignments
 * @access  Private
 */
exports.getRoleAssignments = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const query = {};
  
  // Add filters if provided
  if (req.query.user_id) {
    query.user_id = req.query.user_id;
  }
  
  if (req.query.role_id) {
    query.role_id = req.query.role_id;
  }
  
  if (req.query.is_active !== undefined) {
    query.is_active = req.query.is_active === 'true';
  }

  // Execute query
  const total = await EmployeeRoleAssignment.countDocuments(query);
  const assignments = await EmployeeRoleAssignment.find(query)
    .populate({
      path: 'user_id',
      select: 'first_name last_name email profile_image'
    })
    .populate({
      path: 'role_id',
      select: 'name description level'
    })
    .populate({
      path: 'assigned_by',
      select: 'first_name last_name'
    })
    .sort({ assigned_at: -1 })
    .skip(startIndex)
    .limit(limit);

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: assignments.length,
    pagination,
    data: assignments,
    total
  });
});

/**
 * @desc    Get single role assignment
 * @route   GET /api/auth/role-assignments/:id
 * @access  Private
 */
exports.getRoleAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await EmployeeRoleAssignment.findById(req.params.id)
    .populate({
      path: 'user_id',
      select: 'first_name last_name email profile_image'
    })
    .populate({
      path: 'role_id',
      select: 'name description level permissions'
    })
    .populate({
      path: 'assigned_by',
      select: 'first_name last_name'
    });

  if (!assignment) {
    return next(
      new ErrorResponse(`Role assignment not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: assignment
  });
});

/**
 * @desc    Create new role assignment
 * @route   POST /api/auth/role-assignments
 * @access  Private
 */
exports.createRoleAssignment = asyncHandler(async (req, res, next) => {
  // Check if user exists
  const user = await User.findById(req.body.user_id);
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.body.user_id}`, 404)
    );
  }

  // Check if role exists
  const role = await Role.findById(req.body.role_id);
  if (!role) {
    return next(
      new ErrorResponse(`Role not found with id of ${req.body.role_id}`, 404)
    );
  }

  // Add assigned_by field (current user)
  req.body.assigned_by = req.user.id;

  // Deactivate any existing active assignments for this user
  await EmployeeRoleAssignment.updateMany(
    { user_id: req.body.user_id, is_active: true },
    { is_active: false, effective_until: Date.now() }
  );

  // Create new assignment
  const assignment = await EmployeeRoleAssignment.create(req.body);

  // Populate response data
  const populatedAssignment = await EmployeeRoleAssignment.findById(assignment._id)
    .populate({
      path: 'user_id',
      select: 'first_name last_name email profile_image'
    })
    .populate({
      path: 'role_id',
      select: 'name description level'
    })
    .populate({
      path: 'assigned_by',
      select: 'first_name last_name'
    });

  res.status(201).json({
    success: true,
    data: populatedAssignment
  });
});

/**
 * @desc    Update role assignment
 * @route   PUT /api/auth/role-assignments/:id
 * @access  Private
 */
exports.updateRoleAssignment = asyncHandler(async (req, res, next) => {
  let assignment = await EmployeeRoleAssignment.findById(req.params.id);

  if (!assignment) {
    return next(
      new ErrorResponse(`Role assignment not found with id of ${req.params.id}`, 404)
    );
  }

  // Don't allow changing user_id or role_id after creation
  if (req.body.user_id || req.body.role_id) {
    return next(
      new ErrorResponse('Cannot change user or role after assignment creation', 400)
    );
  }

  assignment = await EmployeeRoleAssignment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .populate({
      path: 'user_id',
      select: 'first_name last_name email profile_image'
    })
    .populate({
      path: 'role_id',
      select: 'name description level'
    })
    .populate({
      path: 'assigned_by',
      select: 'first_name last_name'
    });

  res.status(200).json({
    success: true,
    data: assignment
  });
});

/**
 * @desc    Deactivate current role assignment for user
 * @route   PUT /api/auth/role-assignments/user/:userId/deactivate
 * @access  Private
 */
exports.deactivateUserAssignment = asyncHandler(async (req, res, next) => {
  const userId = req.params.userId;
  
  // Find active assignment for user
  const activeAssignment = await EmployeeRoleAssignment.findOne({
    user_id: userId,
    is_active: true
  });

  if (!activeAssignment) {
    return next(
      new ErrorResponse(`No active role assignment found for user ${userId}`, 404)
    );
  }

  // Deactivate assignment
  activeAssignment.is_active = false;
  activeAssignment.effective_until = Date.now();
  await activeAssignment.save();

  res.status(200).json({
    success: true,
    data: activeAssignment
  });
});

/**
 * @desc    Delete role assignment
 * @route   DELETE /api/auth/role-assignments/:id
 * @access  Private
 */
exports.deleteRoleAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await EmployeeRoleAssignment.findById(req.params.id);

  if (!assignment) {
    return next(
      new ErrorResponse(`Role assignment not found with id of ${req.params.id}`, 404)
    );
  }

  await assignment.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});