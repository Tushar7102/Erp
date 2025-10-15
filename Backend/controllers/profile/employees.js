const asyncHandler = require('../../middleware/async');
const ErrorResponse = require('../../utils/errorResponse');
const Employee = require('../../models/profile/Employee');

// @desc    Get all employees
// @route   GET /api/v1/profile/employees
// @access  Private
exports.getEmployees = asyncHandler(async (req, res, next) => {
  const employees = await Employee.find()
    .populate('user', 'name email')
    .populate('employment_details.role', 'name')
    .sort({ created_at: -1 });

  res.status(200).json({
    success: true,
    count: employees.length,
    data: employees
  });
});

// @desc    Get single employee
// @route   GET /api/v1/profile/employees/:id
// @access  Private
exports.getEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id)
    .populate('user', 'name email')
    .populate('employment_details.role', 'name');

  if (!employee) {
    return next(new ErrorResponse(`Employee not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: employee
  });
});

// @desc    Create employee
// @route   POST /api/v1/profile/employees
// @access  Private
exports.createEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.create(req.body);

  res.status(201).json({
    success: true,
    data: employee
  });
});

// @desc    Update employee
// @route   PUT /api/v1/profile/employees/:id
// @access  Private
exports.updateEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!employee) {
    return next(new ErrorResponse(`Employee not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: employee
  });
});

// @desc    Delete employee
// @route   DELETE /api/v1/profile/employees/:id
// @access  Private
exports.deleteEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    return next(new ErrorResponse(`Employee not found with id of ${req.params.id}`, 404));
  }

  await employee.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
