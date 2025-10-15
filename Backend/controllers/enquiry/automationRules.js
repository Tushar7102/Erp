const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const AutomationRule = require('../../models/enquiry/AutomationRule');
const UserActivityLog = require('../../models/profile/UserActivityLog');

// @desc    Get all automation rules
// @route   GET /api/v1/automation-rules
// @access  Private
exports.getAutomationRules = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single automation rule
// @route   GET /api/v1/automation-rules/:id
// @access  Private
exports.getAutomationRule = asyncHandler(async (req, res, next) => {
  const automationRule = await AutomationRule.findById(req.params.id);

  if (!automationRule) {
    return next(
      new ErrorResponse(`Automation rule not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: automationRule
  });
});

// @desc    Create new automation rule
// @route   POST /api/v1/automation-rules
// @access  Private/Admin
exports.createAutomationRule = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.created_by = req.user.id;

  // Validate rule_type
  const validRuleTypes = ['status_change', 'assignment', 'field_update', 'notification', 'task_creation', 'webhook'];
  if (req.body.rule_type && !validRuleTypes.includes(req.body.rule_type)) {
    return next(
      new ErrorResponse(`Invalid rule type: ${req.body.rule_type}`, 400)
    );
  }

  // Validate trigger
  if (req.body.trigger) {
    const validEventTypes = ['status_change', 'assignment_change', 'field_update', 'new_record', 'scheduled', 'manual'];
    if (req.body.trigger.event_type && !validEventTypes.includes(req.body.trigger.event_type)) {
      return next(
        new ErrorResponse(`Invalid event type: ${req.body.trigger.event_type}`, 400)
      );
    }

    // Validate schedule if event_type is scheduled
    if (req.body.trigger.event_type === 'scheduled' && !req.body.trigger.schedule) {
      return next(
        new ErrorResponse('Schedule is required for scheduled event type', 400)
      );
    }
  } else {
    return next(
      new ErrorResponse('Trigger is required', 400)
    );
  }

  // Validate conditions if provided
  if (req.body.conditions && req.body.conditions.length > 0) {
    for (const condition of req.body.conditions) {
      if (!condition.field || !condition.operator) {
        return next(
          new ErrorResponse('Each condition must have field and operator', 400)
        );
      }

      // Validate operator
      const validOperators = ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in', 'exists', 'not_exists'];
      if (!validOperators.includes(condition.operator)) {
        return next(
          new ErrorResponse(`Invalid operator: ${condition.operator}`, 400)
        );
      }
    }
  }

  // Validate actions
  if (!req.body.actions || req.body.actions.length === 0) {
    return next(
      new ErrorResponse('At least one action is required', 400)
    );
  }

  for (const action of req.body.actions) {
    if (!action.action_type) {
      return next(
        new ErrorResponse('Each action must have an action_type', 400)
      );
    }

    // Validate action_type
    const validActionTypes = ['update_status', 'assign_to_user', 'update_field', 'send_notification', 'send_email', 'send_sms', 'create_task', 'webhook'];
    if (!validActionTypes.includes(action.action_type)) {
      return next(
        new ErrorResponse(`Invalid action type: ${action.action_type}`, 400)
      );
    }

    // Validate action_data based on action_type
    if (!action.action_data) {
      return next(
        new ErrorResponse(`Action data is required for ${action.action_type}`, 400)
      );
    }

    switch (action.action_type) {
      case 'update_status':
        if (!action.action_data.status_id) {
          return next(
            new ErrorResponse('status_id is required for update_status action', 400)
          );
        }
        break;
      case 'assign_to_user':
        if (!action.action_data.user_id && !action.action_data.team_id && !action.action_data.rule_id) {
          return next(
            new ErrorResponse('user_id, team_id, or rule_id is required for assign_to_user action', 400)
          );
        }
        break;
      case 'update_field':
        if (!action.action_data.field || action.action_data.value === undefined) {
          return next(
            new ErrorResponse('field and value are required for update_field action', 400)
          );
        }
        break;
      case 'send_notification':
        if (!action.action_data.template_id && !action.action_data.message) {
          return next(
            new ErrorResponse('template_id or message is required for send_notification action', 400)
          );
        }
        break;
      case 'send_email':
        if (!action.action_data.template_id && !action.action_data.subject) {
          return next(
            new ErrorResponse('template_id or subject is required for send_email action', 400)
          );
        }
        break;
      case 'send_sms':
        if (!action.action_data.template_id && !action.action_data.message) {
          return next(
            new ErrorResponse('template_id or message is required for send_sms action', 400)
          );
        }
        break;
      case 'create_task':
        if (!action.action_data.title || !action.action_data.due_date) {
          return next(
            new ErrorResponse('title and due_date are required for create_task action', 400)
          );
        }
        break;
      case 'webhook':
        if (!action.action_data.url || !action.action_data.method) {
          return next(
            new ErrorResponse('url and method are required for webhook action', 400)
          );
        }
        break;
    }
  }

  const automationRule = await AutomationRule.create(req.body);

  // Log activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'create',
    target_model: 'AutomationRule',
    target_id: automationRule._id,
    description: `Created new automation rule: ${automationRule.name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: automationRule
  });
});

// @desc    Update automation rule
// @route   PUT /api/v1/automation-rules/:id
// @access  Private/Admin
exports.updateAutomationRule = asyncHandler(async (req, res, next) => {
  // Validate rule_type if provided
  const validRuleTypes = ['status_change', 'assignment', 'field_update', 'notification', 'task_creation', 'webhook'];
  if (req.body.rule_type && !validRuleTypes.includes(req.body.rule_type)) {
    return next(
      new ErrorResponse(`Invalid rule type: ${req.body.rule_type}`, 400)
    );
  }

  // Validate trigger if provided
  if (req.body.trigger) {
    const validEventTypes = ['status_change', 'assignment_change', 'field_update', 'new_record', 'scheduled', 'manual'];
    if (req.body.trigger.event_type && !validEventTypes.includes(req.body.trigger.event_type)) {
      return next(
        new ErrorResponse(`Invalid event type: ${req.body.trigger.event_type}`, 400)
      );
    }

    // Validate schedule if event_type is scheduled
    if (req.body.trigger.event_type === 'scheduled' && !req.body.trigger.schedule) {
      return next(
        new ErrorResponse('Schedule is required for scheduled event type', 400)
      );
    }
  }

  // Validate conditions if provided
  if (req.body.conditions && req.body.conditions.length > 0) {
    for (const condition of req.body.conditions) {
      if (!condition.field || !condition.operator) {
        return next(
          new ErrorResponse('Each condition must have field and operator', 400)
        );
      }

      // Validate operator
      const validOperators = ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in', 'exists', 'not_exists'];
      if (!validOperators.includes(condition.operator)) {
        return next(
          new ErrorResponse(`Invalid operator: ${condition.operator}`, 400)
        );
      }
    }
  }

  // Validate actions if provided
  if (req.body.actions && req.body.actions.length > 0) {
    for (const action of req.body.actions) {
      if (!action.action_type) {
        return next(
          new ErrorResponse('Each action must have an action_type', 400)
        );
      }

      // Validate action_type
      const validActionTypes = ['update_status', 'assign_to_user', 'update_field', 'send_notification', 'send_email', 'send_sms', 'create_task', 'webhook'];
      if (!validActionTypes.includes(action.action_type)) {
        return next(
          new ErrorResponse(`Invalid action type: ${action.action_type}`, 400)
        );
      }

      // Validate action_data based on action_type
      if (!action.action_data) {
        return next(
          new ErrorResponse(`Action data is required for ${action.action_type}`, 400)
        );
      }

      switch (action.action_type) {
        case 'update_status':
          if (!action.action_data.status_id) {
            return next(
              new ErrorResponse('status_id is required for update_status action', 400)
            );
          }
          break;
        case 'assign_to_user':
          if (!action.action_data.user_id && !action.action_data.team_id && !action.action_data.rule_id) {
            return next(
              new ErrorResponse('user_id, team_id, or rule_id is required for assign_to_user action', 400)
            );
          }
          break;
        case 'update_field':
          if (!action.action_data.field || action.action_data.value === undefined) {
            return next(
              new ErrorResponse('field and value are required for update_field action', 400)
            );
          }
          break;
        case 'send_notification':
          if (!action.action_data.template_id && !action.action_data.message) {
            return next(
              new ErrorResponse('template_id or message is required for send_notification action', 400)
            );
          }
          break;
        case 'send_email':
          if (!action.action_data.template_id && !action.action_data.subject) {
            return next(
              new ErrorResponse('template_id or subject is required for send_email action', 400)
            );
          }
          break;
        case 'send_sms':
          if (!action.action_data.template_id && !action.action_data.message) {
            return next(
              new ErrorResponse('template_id or message is required for send_sms action', 400)
            );
          }
          break;
        case 'create_task':
          if (!action.action_data.title || !action.action_data.due_date) {
            return next(
              new ErrorResponse('title and due_date are required for create_task action', 400)
            );
          }
          break;
        case 'webhook':
          if (!action.action_data.url || !action.action_data.method) {
            return next(
              new ErrorResponse('url and method are required for webhook action', 400)
            );
          }
          break;
      }
    }
  }

  let automationRule = await AutomationRule.findById(req.params.id);

  if (!automationRule) {
    return next(
      new ErrorResponse(`Automation rule not found with id of ${req.params.id}`, 404)
    );
  }

  // Update automation rule
  automationRule = await AutomationRule.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Reset analytics if actions or conditions are changed
  if (req.body.actions || req.body.conditions) {
    automationRule.analytics = {
      total_executions: 0,
      successful_executions: 0,
      failed_executions: 0,
      last_executed_at: null,
      average_execution_time: 0,
      last_error: null
    };
    await automationRule.save();
  }

  // Log activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'update',
    target_model: 'AutomationRule',
    target_id: automationRule._id,
    description: `Updated automation rule: ${automationRule.name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: automationRule
  });
});

// @desc    Delete automation rule
// @route   DELETE /api/v1/automation-rules/:id
// @access  Private/Admin
exports.deleteAutomationRule = asyncHandler(async (req, res, next) => {
  const automationRule = await AutomationRule.findById(req.params.id);

  if (!automationRule) {
    return next(
      new ErrorResponse(`Automation rule not found with id of ${req.params.id}`, 404)
    );
  }

  await automationRule.deleteOne();

  // Log activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'delete',
    target_model: 'AutomationRule',
    target_id: automationRule._id,
    description: `Deleted automation rule: ${automationRule.name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Toggle automation rule active status
// @route   PUT /api/v1/automation-rules/:id/toggle-status
// @access  Private/Admin
exports.toggleAutomationRuleStatus = asyncHandler(async (req, res, next) => {
  let automationRule = await AutomationRule.findById(req.params.id);

  if (!automationRule) {
    return next(
      new ErrorResponse(`Automation rule not found with id of ${req.params.id}`, 404)
    );
  }

  // Toggle status
  automationRule.is_active = !automationRule.is_active;
  await automationRule.save();

  // Log activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'update',
    target_model: 'AutomationRule',
    target_id: automationRule._id,
    description: `${automationRule.is_active ? 'Activated' : 'Deactivated'} automation rule: ${automationRule.name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: automationRule
  });
});

// @desc    Get automation rules by type
// @route   GET /api/v1/automation-rules/type/:type
// @access  Private
exports.getAutomationRulesByType = asyncHandler(async (req, res, next) => {
  const validRuleTypes = ['status_change', 'assignment', 'field_update', 'notification', 'task_creation', 'webhook'];
  if (!validRuleTypes.includes(req.params.type)) {
    return next(
      new ErrorResponse(`Invalid rule type: ${req.params.type}`, 400)
    );
  }

  const automationRules = await AutomationRule.find({ rule_type: req.params.type });

  res.status(200).json({
    success: true,
    count: automationRules.length,
    data: automationRules
  });
});

// @desc    Get active automation rules
// @route   GET /api/v1/automation-rules/active
// @access  Private
exports.getActiveAutomationRules = asyncHandler(async (req, res, next) => {
  const automationRules = await AutomationRule.find({ is_active: true });

  res.status(200).json({
    success: true,
    count: automationRules.length,
    data: automationRules
  });
});

// @desc    Test automation rule against data
// @route   POST /api/v1/automation-rules/:id/test
// @access  Private/Admin
exports.testAutomationRule = asyncHandler(async (req, res, next) => {
  const { testData } = req.body;

  if (!testData) {
    return next(
      new ErrorResponse('Test data is required', 400)
    );
  }

  const automationRule = await AutomationRule.findById(req.params.id);

  if (!automationRule) {
    return next(
      new ErrorResponse(`Automation rule not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if conditions are met
  let conditionsMet = true;
  
  if (automationRule.conditions && automationRule.conditions.length > 0) {
    for (const condition of automationRule.conditions) {
      const fieldValue = testData[condition.field];
      let result = false;
      
      // Skip if field doesn't exist in test data
      if (fieldValue === undefined) {
        if (condition.operator === 'not_exists') {
          result = true;
        } else {
          result = false;
        }
      } else {
        // Apply condition based on operator
        switch (condition.operator) {
          case 'equals':
            result = fieldValue === condition.value;
            break;
          case 'not_equals':
            result = fieldValue !== condition.value;
            break;
          case 'contains':
            result = typeof fieldValue === 'string' && fieldValue.includes(condition.value);
            break;
          case 'not_contains':
            result = typeof fieldValue === 'string' && !fieldValue.includes(condition.value);
            break;
          case 'greater_than':
            result = fieldValue > condition.value;
            break;
          case 'less_than':
            result = fieldValue < condition.value;
            break;
          case 'in':
            result = Array.isArray(condition.value) && condition.value.includes(fieldValue);
            break;
          case 'not_in':
            result = Array.isArray(condition.value) && !condition.value.includes(fieldValue);
            break;
          case 'exists':
            result = fieldValue !== undefined && fieldValue !== null;
            break;
          case 'not_exists':
            result = fieldValue === undefined || fieldValue === null;
            break;
        }
      }

      // Apply logical operator
      if (condition.logical_operator === 'OR') {
        conditionsMet = conditionsMet || result;
      } else { // Default to AND
        conditionsMet = conditionsMet && result;
      }
    }
  }

  // Prepare actions that would be executed
  const actionsToExecute = [];
  
  if (conditionsMet && automationRule.actions && automationRule.actions.length > 0) {
    for (const action of automationRule.actions) {
      if (action.enabled !== false) { // Default to true if not specified
        actionsToExecute.push({
          action_type: action.action_type,
          action_data: action.action_data,
          order: action.order || 0
        });
      }
    }
    
    // Sort actions by order
    actionsToExecute.sort((a, b) => a.order - b.order);
  }

  res.status(200).json({
    success: true,
    data: {
      rule_id: automationRule._id,
      name: automationRule.name,
      conditions_met: conditionsMet,
      actions_to_execute: actionsToExecute,
      test_data: testData
    }
  });
});

// @desc    Execute automation rule manually
// @route   POST /api/v1/automation-rules/:id/execute
// @access  Private/Admin
exports.executeAutomationRule = asyncHandler(async (req, res, next) => {
  const { targetId, targetType } = req.body;

  if (!targetId || !targetType) {
    return next(
      new ErrorResponse('Target ID and type are required', 400)
    );
  }

  const automationRule = await AutomationRule.findById(req.params.id);

  if (!automationRule) {
    return next(
      new ErrorResponse(`Automation rule not found with id of ${req.params.id}`, 404)
    );
  }

  if (!automationRule.is_active) {
    return next(
      new ErrorResponse('Cannot execute inactive automation rule', 400)
    );
  }

  // This would be a placeholder for actual execution logic
  // In a real implementation, you would:
  // 1. Fetch the target entity (e.g., Enquiry, Lead)
  // 2. Check conditions against the entity
  // 3. Execute actions if conditions are met
  // 4. Update analytics

  // For now, we'll just update the analytics
  const startTime = Date.now();
  
  // Simulate execution time
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const executionTime = Date.now() - startTime;
  
  // Update analytics
  automationRule.analytics.total_executions += 1;
  automationRule.analytics.successful_executions += 1;
  automationRule.analytics.last_executed_at = new Date();
  
  // Update average execution time
  const prevAvg = automationRule.analytics.average_execution_time || 0;
  const prevCount = automationRule.analytics.total_executions - 1;
  automationRule.analytics.average_execution_time = 
    (prevAvg * prevCount + executionTime) / automationRule.analytics.total_executions;
  
  await automationRule.save();

  // Log activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'execute',
    target_model: 'AutomationRule',
    target_id: automationRule._id,
    description: `Manually executed automation rule: ${automationRule.name} on ${targetType} ${targetId}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {
      message: `Automation rule ${automationRule.name} executed successfully`,
      execution_time: executionTime,
      target: {
        id: targetId,
        type: targetType
      }
    }
  });
});


