const express = require('express');
const {
  getDevices,
  getDevice,
  registerDevice,
  updateDevice,
  deleteDevice,
  getUserDevices,
  trustDevice,
  blockDevice,
  unblockDevice,
  getCurrentDevice
} = require('../../controllers/profile/deviceRegistry');

const DeviceRegistry = require('../../models/auth/DeviceRegistry');

const router = express.Router();

const { protect, authorize } = require('../../middleware/auth');
const advancedResults = require('../../middleware/advancedResults');

router.use(protect);

router
  .route('/')
  .get(
    authorize('admin'),
    advancedResults(DeviceRegistry, { path: 'user_id', select: 'name email role' }),
    getDevices
  )
  .post(registerDevice);

router
  .route('/current')
  .get(getCurrentDevice);

router
  .route('/user/:userId')
  .get(getUserDevices);

router
  .route('/:id')
  .get(getDevice)
  .put(authorize('admin'), updateDevice)
  .delete(authorize('admin'), deleteDevice);

router
  .route('/:id/trust')
  .put(trustDevice);

router
  .route('/:id/block')
  .put(blockDevice);

router
  .route('/:id/unblock')
  .put(authorize('admin'), unblockDevice);

module.exports = router;