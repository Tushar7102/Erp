const AutomationTrigger = require('../../models/enquiry/AutomationTrigger');
const asyncHandler = require('../../middleware/async');
const ErrorResponse = require('../../utils/errorResponse');

// @desc    Get all automation triggers
// @route   GET /api/automation-triggers
// @access  Private
exports.getAutomationTriggers = asyncHandler(async (req, res, next) => {
  const triggers = await AutomationTrigger.find()
    .populate('accessControl.createdBy', 'name email')
    .populate('accessControl.updatedBy', 'name email');

  res.status(200).json({
    success: true,
    count: triggers.length,
    data: triggers
  });
});

// @desc    Get single automation trigger
// @route   GET /api/automation-triggers/:id
// @access  Private
exports.getAutomationTrigger = asyncHandler(async (req, res, next) => {
  const trigger = await AutomationTrigger.findById(req.params.id)
    .populate('accessControl.createdBy', 'name email')
    .populate('accessControl.updatedBy', 'name email');

  if (!trigger) {
    return next(new ErrorResponse(`Automation trigger not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: trigger
  });
});

// @desc    Create new automation trigger
// @route   POST /api/automation-triggers
// @access  Private
exports.createAutomationTrigger = asyncHandler(async (req, res, next) => {
  req.body.accessControl = {
    ...req.body.accessControl,
    createdBy: req.user.id
  };
  
  const trigger = await AutomationTrigger.create(req.body);

  res.status(201).json({
    success: true,
    data: trigger
  });
});

// @desc    Update automation trigger
// @route   PUT /api/automation-triggers/:id
// @access  Private
exports.updateAutomationTrigger = asyncHandler(async (req, res, next) => {
  let trigger = await AutomationTrigger.findById(req.params.id);

  if (!trigger) {
    return next(new ErrorResponse(`Automation trigger not found with id of ${req.params.id}`, 404));
  }

  req.body.accessControl = {
    ...req.body.accessControl,
    updatedBy: req.user.id
  };
  
  trigger = await AutomationTrigger.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('accessControl.createdBy', 'name email')
    .populate('accessControl.updatedBy', 'name email');

  res.status(200).json({
    success: true,
    data: trigger
  });
});

// @desc    Delete automation trigger
// @route   DELETE /api/automation-triggers/:id
// @access  Private
exports.deleteAutomationTrigger = asyncHandler(async (req, res, next) => {
  const trigger = await AutomationTrigger.findById(req.params.id);

  if (!trigger) {
    return next(new ErrorResponse(`Automation trigger not found with id of ${req.params.id}`, 404));
  }

  await trigger.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Activate automation trigger
// @route   PATCH /api/automation-triggers/:id/activate
// @access  Private
exports.activateAutomationTrigger = asyncHandler(async (req, res, next) => {
  const trigger = await AutomationTrigger.findById(req.params.id);

  if (!trigger) {
    return next(new ErrorResponse(`Automation trigger not found with id of ${req.params.id}`, 404));
  }

  trigger.status = 'active';
  trigger.accessControl.updatedBy = req.user.id;
  await trigger.save();

  res.status(200).json({
    success: true,
    data: trigger
  });
});

// @desc    Deactivate automation trigger
// @route   PATCH /api/automation-triggers/:id/deactivate
// @access  Private
exports.deactivateAutomationTrigger = asyncHandler(async (req, res, next) => {
  const trigger = await AutomationTrigger.findById(req.params.id);

  if (!trigger) {
    return next(new ErrorResponse(`Automation trigger not found with id of ${req.params.id}`, 404));
  }

  trigger.status = 'inactive';
  trigger.accessControl.updatedBy = req.user.id;
  await trigger.save();

  res.status(200).json({
    success: true,
    data: trigger
  });
});

// @desc    Get automation triggers by type
// @route   GET /api/automation-triggers/type/:type
// @access  Private
exports.getAutomationTriggersByType = asyncHandler(async (req, res, next) => {
  const triggers = await AutomationTrigger.find({ 
    trigger_type: req.params.type,
    status: 'active'
  }).populate('accessControl.createdBy', 'name email');

  res.status(200).json({
    success: true,
    count: triggers.length,
    data: triggers
  });
});

// @desc    Get automation triggers by event
// @route   GET /api/automation-triggers/event/:event
// @access  Private
exports.getAutomationTriggersByEvent = asyncHandler(async (req, res, next) => {
  const triggers = await AutomationTrigger.find({ 
    'eventConfig.event': req.params.event,
    status: 'active'
  }).populate('accessControl.createdBy', 'name email');

  res.status(200).json({
    success: true,
    count: triggers.length,
    data: triggers
  });
});

// @desc    Execute automation trigger
// @route   POST /api/automation-triggers/:id/execute
// @access  Private
exports.executeAutomationTrigger = asyncHandler(async (req, res, next) => {
  const { context } = req.body;

  const trigger = await AutomationTrigger.findById(req.params.id);

  if (!trigger) {
    return next(new ErrorResponse(`Automation trigger not found with id of ${req.params.id}`, 404));
  }

  if (!trigger.shouldExecute(context)) {
    return next(new ErrorResponse('Trigger conditions not met', 400));
  }

  // Execute actions
  const results = [];
  for (const action of trigger.actions) {
    if (!action.enabled) continue;

    try {
      const result = await executeAction(action, context);
      results.push({
        action: action.action_type,
        success: true,
        result
      });
    } catch (error) {
      results.push({
        action: action.action_type,
        success: false,
        error: error.message
      });
    }
  }

  // Update analytics
  trigger.analytics.totalExecutions++;
  trigger.analytics.successfulExecutions += results.filter(r => r.success).length;
  trigger.analytics.failedExecutions += results.filter(r => !r.success).length;
  trigger.analytics.lastExecutedAt = new Date();
  await trigger.save();

  res.status(200).json({
    success: true,
    data: {
      trigger: trigger.name,
      results
    }
  });
});

// @desc    Get automation trigger analytics
// @route   GET /api/automation-triggers/:id/analytics
// @access  Private
exports.getAutomationTriggerAnalytics = asyncHandler(async (req, res, next) => {
  const trigger = await AutomationTrigger.findById(req.params.id);

  if (!trigger) {
    return next(new ErrorResponse(`Automation trigger not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: trigger.analytics
  });
});

// @desc    Test automation trigger
// @route   POST /api/automation-triggers/:id/test
// @access  Private
exports.testAutomationTrigger = asyncHandler(async (req, res, next) => {
  const { context } = req.body;

  const trigger = await AutomationTrigger.findById(req.params.id);

  if (!trigger) {
    return next(new ErrorResponse(`Automation trigger not found with id of ${req.params.id}`, 404));
  }

  const shouldExecute = trigger.shouldExecute(context);
  const conditionResults = [];

  if (trigger.trigger_type === 'event_based') {
    for (const condition of trigger.eventConfig.conditions) {
      const fieldValue = context.data[condition.field];
      const result = trigger.evaluateCondition(fieldValue, condition.operator, condition.value);
      conditionResults.push({
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
        actualValue: fieldValue,
        result
      });
    }
  }

  res.status(200).json({
    success: true,
    data: {
      shouldExecute,
      conditionResults,
      trigger: {
        name: trigger.name,
        type: trigger.trigger_type,
        status: trigger.status
      }
    }
  });
});

// Helper function to execute actions
async function executeAction(action, context) {
  switch (action.action_type) {
    case 'send_notification':
      // Implementation for sending notification
      return { message: 'Notification sent' };
    
    case 'send_email':
      // Implementation for sending email
      return { message: 'Email sent' };
    
    case 'send_sms':
      // Implementation for sending SMS
      return { message: 'SMS sent' };
    
    case 'send_whatsapp':
      // Implementation for sending WhatsApp
      return { message: 'WhatsApp sent' };
    
    case 'assign_user':
      // Implementation for assigning user
      return { message: 'User assigned' };
    
    case 'change_status':
      // Implementation for changing status
      return { message: 'Status changed' };
    
    case 'create_task':
      // Implementation for creating task
      return { message: 'Task created' };
    
    case 'escalate':
      // Implementation for escalation
      return { message: 'Escalated' };
    
    case 'update_field':
      // Implementation for updating field
      return { message: 'Field updated' };
    
    case 'webhook_call':
      // Implementation for webhook call
      return { message: 'Webhook called' };
    
    default:
      throw new Error(`Unknown action type: ${action.action_type}`);
  }
} 
