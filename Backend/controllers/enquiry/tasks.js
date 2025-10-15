const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const Task = require('../../models/enquiry/Task');
const Enquiry = require('../../models/enquiry/Enquiry');
const User = require('../../models/profile/User');
const NotificationLog = require('../../models/profile/NotificationLog');

// @desc    Get all tasks
// @route   GET /api/v1/tasks
// @access  Private
exports.getTasks = asyncHandler(async (req, res, next) => {
  const { 
    enquiry_id, 
    task_type, 
    status, 
    priority,
    assigned_to,
    created_by,
    due_date_from,
    due_date_to,
    page = 1, 
    limit = 10 
  } = req.query;

  let filter = {};
  
  if (enquiry_id) filter.enquiry_id = enquiry_id;
  if (task_type) filter.task_type = task_type;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assigned_to) filter.assigned_to = assigned_to;
  if (created_by) filter.created_by = created_by;
  
  if (due_date_from || due_date_to) {
    filter.due_date = {};
    if (due_date_from) filter.due_date.$gte = new Date(due_date_from);
    if (due_date_to) filter.due_date.$lte = new Date(due_date_to);
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { due_date: 1, priority: -1 },
    populate: [
      { path: 'enquiry_id', select: 'enquiry_id name mobile' },
      { path: 'assigned_to', select: 'first_name last_name email team' },
      { path: 'created_by', select: 'first_name last_name email' }
    ]
  };

  const tasks = await Task.paginate(filter, options);

  res.status(200).json({
    success: true,
    data: tasks
  });
});

// @desc    Get task by ID
// @route   GET /api/v1/tasks/:id
// @access  Private
exports.getTaskById = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('enquiry_id', 'enquiry_id name mobile')
    .populate('assigned_to', 'name email team')
    .populate('created_by', 'name email')
    .populate('dependencies', 'task_id title status');

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Create task
// @route   POST /api/v1/tasks
// @access  Private
exports.createTask = asyncHandler(async (req, res, next) => {
  const { 
    enquiry_id, 
    title, 
    description, 
    task_type, 
    priority,
    assigned_to,
    due_date,
    estimated_hours,
    dependencies,
    metadata 
  } = req.body;

  // Validate enquiry exists
  const enquiry = await Enquiry.findById(enquiry_id);
  if (!enquiry) {
    return next(new ErrorResponse('Enquiry not found', 404));
  }

  // Validate assigned user exists if provided
  if (assigned_to) {
    const assignedUser = await User.findById(assigned_to);
    if (!assignedUser) {
      return next(new ErrorResponse('Assigned user not found', 404));
    }
  }

  // Validate dependencies exist if provided
  if (dependencies && dependencies.length > 0) {
    const dependentTasks = await Task.find({ _id: { $in: dependencies } });
    if (dependentTasks.length !== dependencies.length) {
      return next(new ErrorResponse('One or more dependent tasks not found', 404));
    }
  }

  const task = await Task.create({
    enquiry_id,
    title,
    description,
    task_type,
    priority: priority || 'medium',
    assigned_to,
    assigned_by: req.body.assigned_by || req.user.id, // Use assigned_by from request or fallback to current user
    created_by: req.user.id,
    due_date,
    estimated_hours,
    dependencies,
    metadata: {
      ...metadata,
      user_agent: req.get('User-Agent'),
      ip_address: req.ip
    }
  });

  await task.populate([
    { path: 'enquiry_id', select: 'enquiry_id name mobile' },
    { path: 'assigned_to', select: 'name email team' },
    { path: 'created_by', select: 'name email' }
  ]);

  // Create notification for task creation
  if (task.assigned_to) {
    try {
      await NotificationLog.create({
        task_id: task._id,
        enquiry_id: task.enquiry_id,
        notification_type: 'task_created',
        notification_category: 'info',
        recipient: {
          user_id: task.assigned_to
        },
        sender: {
          user_id: req.user.id
        },
        title: `New Task: ${task.title}`,
        message: `You have been assigned a new task: ${task.title}. Due date: ${new Date(task.due_date).toLocaleDateString()}`,
        priority: task.priority,
        action_required: true,
        action_url: `/tasks/${task._id}`,
        is_read: false
      });
    } catch (err) {
      console.error('Error creating notification:', err);
      // Continue execution even if notification fails
    }
  }

  res.status(201).json({
    success: true,
    data: task
  });
});

// @desc    Update task
// @route   PUT /api/v1/tasks/:id
// @access  Private
exports.updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  // Only assigned user, creator, or admin can update
  const canUpdate = task.assigned_to?.toString() === req.user.id || 
                   (task.created_by && task.created_by.toString() === req.user.id) || 
                   req.user.role === 'admin';

  if (!canUpdate) {
    return next(new ErrorResponse('Not authorized to update this task', 403));
  }

  const allowedUpdates = [
    'title', 'description', 'priority', 'assigned_to', 'due_date', 
    'estimated_hours', 'dependencies', 'metadata', 'status', 'completion_notes'
  ];
  const updates = {};
  
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Validate assigned user exists if being updated
  if (updates.assigned_to) {
    const assignedUser = await User.findById(updates.assigned_to);
    if (!assignedUser) {
      return next(new ErrorResponse('Assigned user not found', 404));
    }
  }

  task = await Task.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate([
    { path: 'enquiry_id', select: 'enquiry_id name mobile' },
    { path: 'assigned_to', select: 'name email team' },
    { path: 'created_by', select: 'name email' }
  ]);

  // Create notification for task update if assigned_to has changed
  if (updates.assigned_to && updates.assigned_to !== task.assigned_to.toString()) {
    try {
      await NotificationLog.create({
        task_id: task._id,
        enquiry_id: task.enquiry_id,
        notification_type: 'task_assigned',
        notification_category: 'info',
        recipient: {
          user_id: updates.assigned_to
        },
        sender: {
          user_id: req.user.id
        },
        title: `Task Assigned: ${task.title}`,
        message: `You have been assigned a task: ${task.title}. Due date: ${new Date(task.due_date).toLocaleDateString()}`,
        priority: task.priority,
        action_required: true,
        action_url: `/tasks/${task._id}`,
        is_read: false
      });
    } catch (err) {
      console.error('Error creating notification:', err);
      // Continue execution even if notification fails
    }
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Update task status
// @route   PATCH /api/v1/tasks/:id/status
// @access  Private
exports.updateTaskStatus = asyncHandler(async (req, res, next) => {
  const { status, completion_notes } = req.body;

  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  // Only assigned user or admin can update status
  if (task.assigned_to?.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update task status', 403));
  }

  await task.updateStatus(status, completion_notes, req.user.id);

  // Create notification for task status update
  try {
    let notificationType = 'task_updated';
    let notificationCategory = 'info';
    let title = `Task Updated: ${task.title}`;
    let message = `Task status has been updated to ${status}`;
    
    if (status === 'completed') {
      notificationType = 'task_completed';
      notificationCategory = 'success';
      title = `Task Completed: ${task.title}`;
      message = `Task has been marked as completed`;
    } else if (status === 'overdue') {
      notificationType = 'task_overdue';
      notificationCategory = 'warning';
      title = `Task Overdue: ${task.title}`;
      message = `Task is now overdue`;
    }
    
    await NotificationLog.create({
      task_id: task._id,
      enquiry_id: task.enquiry_id,
      notification_type: notificationType,
      notification_category: notificationCategory,
      recipient: {
        user_id: task.assigned_to
      },
      sender: {
        user_id: req.user.id
      },
      title: title,
      message: message,
      priority: task.priority,
      action_required: status !== 'completed',
      action_url: `/tasks/${task._id}`,
      is_read: false
    });
  } catch (err) {
    console.error('Error creating notification:', err);
    // Continue execution even if notification fails
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Complete task
// @route   PATCH /api/v1/tasks/:id/complete
// @access  Private
exports.completeTask = asyncHandler(async (req, res, next) => {
  const { completion_notes, actual_hours } = req.body;

  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  // Only assigned user can complete task
  if (task.assigned_to?.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to complete this task', 403));
  }

  await task.completeTask(completion_notes, actual_hours);

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Add task comment
// @route   POST /api/v1/tasks/:id/comments
// @access  Private
exports.addTaskComment = asyncHandler(async (req, res, next) => {
  const { comment_text } = req.body;

  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  await task.addComment(comment_text, req.user.id);

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Get enquiry tasks
// @route   GET /api/v1/tasks/enquiry/:enquiry_id
// @access  Private
exports.getEnquiryTasks = asyncHandler(async (req, res, next) => {
  const { enquiry_id } = req.params;
  const { status, priority } = req.query;

  const tasks = await Task.getEnquiryTasks(enquiry_id, status, priority);

  res.status(200).json({
    success: true,
    data: tasks
  });
});

// @desc    Get user tasks
// @route   GET /api/v1/tasks/user/:user_id
// @access  Private
exports.getUserTasks = asyncHandler(async (req, res, next) => {
  const { user_id } = req.params;
  const { status, priority, limit = 50 } = req.query;

  const tasks = await Task.getUserTasks(user_id, status, priority, parseInt(limit));

  res.status(200).json({
    success: true,
    data: tasks
  });
});

// @desc    Get overdue tasks
// @route   GET /api/v1/tasks/overdue
// @access  Private
exports.getOverdueTasks = asyncHandler(async (req, res, next) => {
  const { user_id, limit = 50 } = req.query;

  const overdueTasks = await Task.getOverdueTasks(user_id, parseInt(limit));

  res.status(200).json({
    success: true,
    data: overdueTasks
  });
});

// @desc    Get task analytics
// @route   GET /api/v1/tasks/analytics
// @access  Private
exports.getTaskAnalytics = asyncHandler(async (req, res, next) => {
  const { start_date, end_date, user_id, task_type } = req.query;

  const analytics = await Task.getTaskAnalytics(start_date, end_date, user_id, task_type);

  res.status(200).json({
    success: true,
    data: analytics
  });
});

// @desc    Get task dependencies
// @route   GET /api/v1/tasks/:id/dependencies
// @access  Private
exports.getTaskDependencies = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('dependencies', 'task_id title status priority due_date');

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  res.status(200).json({
    success: true,
    data: task.dependencies
  });
});

// @desc    Add task dependency
// @route   POST /api/v1/tasks/:id/dependencies
// @access  Private
exports.addTaskDependency = asyncHandler(async (req, res, next) => {
  const { dependency_task_id } = req.body;

  const task = await Task.findById(req.params.id);
  const dependencyTask = await Task.findById(dependency_task_id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  if (!dependencyTask) {
    return next(new ErrorResponse('Dependency task not found', 404));
  }

  // Check for circular dependencies
  const wouldCreateCircularDependency = await Task.checkCircularDependency(
    req.params.id, 
    dependency_task_id
  );

  if (wouldCreateCircularDependency) {
    return next(new ErrorResponse('Adding this dependency would create a circular dependency', 400));
  }

  if (!task.dependencies.includes(dependency_task_id)) {
    task.dependencies.push(dependency_task_id);
    await task.save();
  }

  await task.populate('dependencies', 'task_id title status priority due_date');

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Remove task dependency
// @route   DELETE /api/v1/tasks/:id/dependencies/:dependency_id
// @access  Private
exports.removeTaskDependency = asyncHandler(async (req, res, next) => {
  const { dependency_id } = req.params;

  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  task.dependencies = task.dependencies.filter(
    dep => dep.toString() !== dependency_id
  );
  
  await task.save();

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Bulk update tasks
// @route   PATCH /api/v1/tasks/bulk-update
// @access  Private
exports.bulkUpdateTasks = asyncHandler(async (req, res, next) => {
  const { task_ids, updates } = req.body;

  if (!task_ids || !Array.isArray(task_ids) || task_ids.length === 0) {
    return next(new ErrorResponse('Task IDs array is required', 400));
  }

  if (!updates || Object.keys(updates).length === 0) {
    return next(new ErrorResponse('Updates object is required', 400));
  }

  const allowedUpdates = ['status', 'priority', 'assigned_to', 'due_date'];
  const validUpdates = {};
  
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      validUpdates[key] = updates[key];
    }
  });

  const result = await Task.updateMany(
    { _id: { $in: task_ids } },
    validUpdates
  );

  res.status(200).json({
    success: true,
    data: {
      matched: result.matchedCount,
      modified: result.modifiedCount
    }
  });
});

// @desc    Get task timeline
// @route   GET /api/v1/tasks/:id/timeline
// @access  Private
exports.getTaskTimeline = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  const timeline = task.status_history.map(entry => ({
    status: entry.status,
    changed_at: entry.changed_at,
    changed_by: entry.changed_by,
    notes: entry.notes
  }));

  res.status(200).json({
    success: true,
    data: timeline
  });
});

// @desc    Delete task
// @route   DELETE /api/v1/tasks/:id
// @access  Private
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  // Only allow deletion by admin or task creator
  if (req.user.role !== 'Admin' && task.created_by.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to delete this task', 403));
  }

  // Check if task has dependencies
  const dependentTasks = await Task.find({ dependencies: req.params.id });
  if (dependentTasks.length > 0) {
    return next(new ErrorResponse('Cannot delete task with dependencies', 400));
  }

  await task.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Assign task to user
// @route   PUT /api/v1/tasks/:id/assign
// @access  Private (Admin, Sales Head)
exports.assignTask = asyncHandler(async (req, res, next) => {
  const { assigned_to } = req.body;

  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  // Check if user exists
  const user = await User.findById(assigned_to);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  task.assigned_to = assigned_to;
  task.assignment_date = new Date();
  
  await task.save();

  await task.populate([
    { path: 'enquiry_id', select: 'enquiry_id name mobile' },
    { path: 'assigned_to', select: 'name email team' },
    { path: 'created_by', select: 'name email' }
  ]);

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Get task comments
// @route   GET /api/v1/tasks/:id/comments
// @access  Private
exports.getTaskComments = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  // Populate comments with user details
  await task.populate('comments.created_by', 'name email');

  res.status(200).json({
    success: true,
    data: task.comments
  });
});

// @desc    Export tasks
// @route   GET /api/v1/tasks/export
// @access  Private (Admin, Sales Head)
exports.exportTasks = asyncHandler(async (req, res, next) => {
  const { 
    start_date, 
    end_date, 
    status, 
    priority,
    task_type,
    assigned_to,
    created_by
  } = req.query;

  let filter = {};
  
  if (start_date && end_date) {
    filter.created_at = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }
  
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (task_type) filter.task_type = task_type;
  if (assigned_to) filter.assigned_to = assigned_to;
  if (created_by) filter.created_by = created_by;

  const tasks = await Task.find(filter)
    .populate('enquiry_id', 'enquiry_id name mobile')
    .populate('assigned_to', 'name email team')
    .populate('created_by', 'name email')
    .sort({ created_at: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});
