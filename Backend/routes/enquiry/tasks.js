const express = require('express');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  assignTask,
  addTaskComment,
  getTaskComments,
  getEnquiryTasks,
  getUserTasks,
  getTaskAnalytics,
  getOverdueTasks,
  exportTasks
} = require('../../controllers/enquiry/tasks');

const router = express.Router();

const { protect, authorize } = require('../../middleware/auth');
const auditLogger = require('../../middleware/auditLogger');

router.use(protect);

// Get all tasks with filters
router.get('/', getTasks);

// Create new task
router.post('/', authorize('Admin', 'Sales Head', 'Telecaller'), auditLogger({ entityType: 'Task', action: 'CREATE' }), createTask);

// Get task analytics
router.get('/analytics', authorize('Admin', 'Sales Head'), getTaskAnalytics);

// Get overdue tasks
router.get('/overdue', getOverdueTasks);

// Export tasks
router.get('/export', authorize('Admin', 'Sales Head'), auditLogger({ entityType: 'Task', action: 'EXPORT' }), exportTasks);

// Get enquiry tasks
router.get('/enquiry/:enquiry_id', getEnquiryTasks);

// Get user tasks
router.get('/user/:user_id', getUserTasks);

// Update task status
router.put('/:id/status', authorize('Admin', 'Sales Head', 'Telecaller'), updateTaskStatus);

// Assign task
router.put('/:id/assign', authorize('Admin', 'Sales Head'), assignTask);

// Add task comment
router.post('/:id/comments', authorize('Admin', 'Sales Head', 'Telecaller'), addTaskComment);

// Get task comments
router.get('/:id/comments', getTaskComments);

// Routes for specific task
router.route('/:id')
  .get(getTaskById)
  .put(authorize('Admin', 'Sales Head', 'Telecaller'), auditLogger({ entityType: 'Task', action: 'UPDATE' }), updateTask)
  .delete(authorize('Admin'), auditLogger({ entityType: 'Task', action: 'DELETE' }), deleteTask);

module.exports = router;
