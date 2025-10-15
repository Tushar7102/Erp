const express = require('express');
const {
  getUserActivityLogs,
  getUserActivityLogsByUser,
  createUserActivityLog,
  getUserActivityLog,
  deleteUserActivityLog
} = require('../../controllers/profile/userActivityLogs');

const router = express.Router();

const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getUserActivityLogs)
  .post(createUserActivityLog);

router
  .route('/user/:userId')
  .get(getUserActivityLogsByUser);

router
  .route('/:id')
  .get(getUserActivityLog)
  .delete(deleteUserActivityLog);

module.exports = router;