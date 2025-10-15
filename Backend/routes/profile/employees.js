const express = require('express');
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../../controllers/profile/employees');

const router = express.Router();

const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getEmployees)
  .post(createEmployee);

router
  .route('/:id')
  .get(getEmployee)
  .put(updateEmployee)
  .delete(deleteEmployee);

module.exports = router;