const express = require('express');
const {
  register,
  login,
  loginWithOTP,
  verifyOTP,
  verifyEmail,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  getUsers,
  getUser,
  updateUser,
  deactivateUser,
  activateUser,
  deleteUser,
  getUserLoginHistory,
  getLoginAttempts,
  getActiveSessions,
  getSessionById,
  revokeSession
} = require('../controllers/auth');

// Import role assignments routes
const roleAssignmentsRouter = require('./auth/roleAssignments');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/login/otp', loginWithOTP);
router.post('/verify-otp', verifyOTP);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Protected routes
router.use(protect);
router.get('/logout', logout);
router.get('/me', getMe);
router.put('/updatedetails', updateDetails);
router.put('/updatepassword', updatePassword);

// Mount role assignments router
router.use('/role-assignments', roleAssignmentsRouter);

// Admin only routes
router.use(authorize('Admin'));

// User management routes
router.route('/users')
  .get(getUsers)
  .post(register);

router.route('/users/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.put('/users/:id/activate', activateUser);
router.put('/users/:id/deactivate', deactivateUser);

// User login history
router.get('/users/:id/login-history', getUserLoginHistory);

// Login attempts management
router.get('/login-attempts', getLoginAttempts);

// Session management
router.get('/sessions', getActiveSessions);
router.get('/sessions/:id', getSessionById);
router.put('/sessions/:id/revoke', revokeSession);

module.exports = router;