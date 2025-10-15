const asyncHandler = require('../../middleware/async');
const ErrorResponse = require('../../utils/errorResponse');
const CustomerMaster = require('../../models/profile/CustomerMaster');

// @desc    Get all customers
// @route   GET /api/v1/profile/customers
// @access  Private
exports.getCustomers = asyncHandler(async (req, res, next) => {
  const customers = await CustomerMaster.find().sort({ created_at: -1 });

  res.status(200).json({
    success: true,
    count: customers.length,
    data: customers
  });
});

// @desc    Get single customer
// @route   GET /api/v1/profile/customers/:id
// @access  Private
exports.getCustomer = asyncHandler(async (req, res, next) => {
  const customer = await CustomerMaster.findById(req.params.id);

  if (!customer) {
    return next(new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: customer
  });
});

// @desc    Create customer
// @route   POST /api/v1/profile/customers
// @access  Private
exports.createCustomer = asyncHandler(async (req, res, next) => {
  const customer = await CustomerMaster.create(req.body);

  res.status(201).json({
    success: true,
    data: customer
  });
});

// @desc    Update customer
// @route   PUT /api/v1/profile/customers/:id
// @access  Private
exports.updateCustomer = asyncHandler(async (req, res, next) => {
  const customer = await CustomerMaster.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!customer) {
    return next(new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: customer
  });
});

// @desc    Delete customer
// @route   DELETE /api/v1/profile/customers/:id
// @access  Private
exports.deleteCustomer = asyncHandler(async (req, res, next) => {
  const customer = await CustomerMaster.findById(req.params.id);

  if (!customer) {
    return next(new ErrorResponse(`Customer not found with id of ${req.params.id}`, 404));
  }

  await customer.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
