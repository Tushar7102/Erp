const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const DeviceRegistry = require('../../models/auth/DeviceRegistry');
const User = require('../../models/profile/User');
const { getDeviceAndLocationInfo } = require('../../utils/deviceTracker');

/**
 * @desc    Get all devices
 * @route   GET /api/v1/devices
 * @access  Private/Admin
 */
exports.getDevices = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @desc    Get single device
 * @route   GET /api/v1/devices/:id
 * @access  Private/Admin
 */
exports.getDevice = asyncHandler(async (req, res, next) => {
  const device = await DeviceRegistry.findById(req.params.id).populate({
    path: 'user_id',
    select: 'name email role'
  });

  if (!device) {
    return next(
      new ErrorResponse(`Device not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: device
  });
});

/**
 * @desc    Register a device
 * @route   POST /api/v1/devices
 * @access  Private
 */
exports.registerDevice = asyncHandler(async (req, res, next) => {
  // Get device info from request
  const deviceInfo = await getDeviceAndLocationInfo(req);
  
  // Add user to request body
  req.body.user_id = req.user.id;
  req.body.created_by = req.user.id;
  
  // Merge device info with request body
  const deviceData = {
    ...req.body,
    ip_address: deviceInfo.ip_address,
    browser_info: {
      name: deviceInfo.device_info.browser.name,
      version: deviceInfo.device_info.browser.version,
      user_agent: deviceInfo.device_info.user_agent
    },
    os_info: {
      name: deviceInfo.device_info.os.name,
      version: deviceInfo.device_info.os.version,
      platform: deviceInfo.device_info.device.type
    },
    location: {
      country: deviceInfo.location.country,
      region: deviceInfo.location.region,
      city: deviceInfo.location.city,
      timezone: deviceInfo.location.timezone
    }
  };

  // Create device
  const device = await DeviceRegistry.create(deviceData);

  res.status(201).json({
    success: true,
    data: device
  });
});

/**
 * @desc    Update device
 * @route   PUT /api/v1/devices/:id
 * @access  Private/Admin
 */
exports.updateDevice = asyncHandler(async (req, res, next) => {
  let device = await DeviceRegistry.findById(req.params.id);

  if (!device) {
    return next(
      new ErrorResponse(`Device not found with id of ${req.params.id}`, 404)
    );
  }

  // Add updated_by field
  req.body.updated_by = req.user.id;
  req.body.updated_at = Date.now();

  device = await DeviceRegistry.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: device
  });
});

/**
 * @desc    Delete device
 * @route   DELETE /api/v1/devices/:id
 * @access  Private/Admin
 */
exports.deleteDevice = asyncHandler(async (req, res, next) => {
  const device = await DeviceRegistry.findById(req.params.id);

  if (!device) {
    return next(
      new ErrorResponse(`Device not found with id of ${req.params.id}`, 404)
    );
  }

  await device.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Get user devices
 * @route   GET /api/v1/devices/user/:userId
 * @access  Private
 */
exports.getUserDevices = asyncHandler(async (req, res, next) => {
  const userId = req.params.userId || req.user.id;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${userId}`, 404)
    );
  }

  // Check permissions - users can only see their own devices unless admin
  if (userId !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`Not authorized to access other user's devices`, 403)
    );
  }

  const devices = await DeviceRegistry.find({ user_id: userId });

  res.status(200).json({
    success: true,
    count: devices.length,
    data: devices
  });
});

/**
 * @desc    Mark device as trusted
 * @route   PUT /api/v1/devices/:id/trust
 * @access  Private/Admin
 */
exports.trustDevice = asyncHandler(async (req, res, next) => {
  let device = await DeviceRegistry.findById(req.params.id);

  if (!device) {
    return next(
      new ErrorResponse(`Device not found with id of ${req.params.id}`, 404)
    );
  }

  // Check permissions - users can only trust their own devices unless admin
  if (device.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`Not authorized to trust this device`, 403)
    );
  }

  device = await DeviceRegistry.findByIdAndUpdate(
    req.params.id,
    { 
      is_trusted: true,
      updated_by: req.user.id,
      updated_at: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: device
  });
});

/**
 * @desc    Block device
 * @route   PUT /api/v1/devices/:id/block
 * @access  Private/Admin
 */
exports.blockDevice = asyncHandler(async (req, res, next) => {
  let device = await DeviceRegistry.findById(req.params.id);

  if (!device) {
    return next(
      new ErrorResponse(`Device not found with id of ${req.params.id}`, 404)
    );
  }

  // Check permissions - users can only block their own devices unless admin
  if (device.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`Not authorized to block this device`, 403)
    );
  }

  device = await DeviceRegistry.findByIdAndUpdate(
    req.params.id,
    { 
      is_active: false,
      'security_flags.is_suspicious': true,
      'security_flags.blocked_reason': req.body.reason || 'Manually blocked by user',
      'security_flags.blocked_at': Date.now(),
      'security_flags.blocked_by': req.user.id,
      updated_by: req.user.id,
      updated_at: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: device
  });
});

/**
 * @desc    Unblock device
 * @route   PUT /api/v1/devices/:id/unblock
 * @access  Private/Admin
 */
exports.unblockDevice = asyncHandler(async (req, res, next) => {
  let device = await DeviceRegistry.findById(req.params.id);

  if (!device) {
    return next(
      new ErrorResponse(`Device not found with id of ${req.params.id}`, 404)
    );
  }

  // Only admins can unblock devices
  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`Only admins can unblock devices`, 403)
    );
  }

  device = await DeviceRegistry.findByIdAndUpdate(
    req.params.id,
    { 
      is_active: true,
      'security_flags.is_suspicious': false,
      'security_flags.blocked_reason': null,
      updated_by: req.user.id,
      updated_at: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: device
  });
});

/**
 * @desc    Get current device
 * @route   GET /api/v1/devices/current
 * @access  Private
 */
exports.getCurrentDevice = asyncHandler(async (req, res, next) => {
  // Get device info from request
  const deviceInfo = await getDeviceAndLocationInfo(req);
  
  // Find device by fingerprint and user
  const device = await DeviceRegistry.findOne({
    device_fingerprint: req.body.device_fingerprint,
    user_id: req.user.id
  });

  if (!device) {
    return res.status(200).json({
      success: true,
      data: null,
      message: 'Device not registered'
    });
  }

  res.status(200).json({
    success: true,
    data: device
  });
});