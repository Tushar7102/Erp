const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const PriorityScoreType = require('../../models/enquiry/PriorityScoreType');
const AssignmentRule = require('../../models/enquiry/AssignmentRule');
const UserActivityLog = require('../../models/profile/UserActivityLog');

// @desc    Get all priority score types
// @route   GET /api/v1/priority-score-types
// @access  Private
exports.getPriorityScoreTypes = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single priority score type
// @route   GET /api/v1/priority-score-types/:id
// @access  Private
exports.getPriorityScoreType = asyncHandler(async (req, res, next) => {
  const priorityScoreType = await PriorityScoreType.findById(req.params.id);

  if (!priorityScoreType) {
    return next(
      new ErrorResponse(`Priority score type not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: priorityScoreType
  });
});

// @desc    Create new priority score type
// @route   POST /api/v1/priority-score-types
// @access  Private/Admin
exports.createPriorityScoreType = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.created_by = req.user.id;

  // Validate display_label
  const validDisplayLabels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  if (req.body.display_label && !validDisplayLabels.includes(req.body.display_label)) {
    return next(
      new ErrorResponse(`Invalid display label: ${req.body.display_label}`, 400)
    );
  }

  // Validate score_range if provided
  if (req.body.score_range) {
    if (typeof req.body.score_range.min !== 'number' || typeof req.body.score_range.max !== 'number') {
      return next(
        new ErrorResponse('Score range must have numeric min and max values', 400)
      );
    }

    if (req.body.score_range.min >= req.body.score_range.max) {
      return next(
        new ErrorResponse('Score range min must be less than max', 400)
      );
    }
  }

  // Validate auto_assignment if provided
  if (req.body.auto_assignment && req.body.auto_assignment.enabled) {
    if (!req.body.auto_assignment.rule_id) {
      return next(
        new ErrorResponse('Auto assignment requires a rule_id', 400)
      );
    }

    // Check if assignment rule exists
    const assignmentRule = await AssignmentRule.findById(req.body.auto_assignment.rule_id);
    if (!assignmentRule) {
      return next(
        new ErrorResponse(`Assignment rule not found with id of ${req.body.auto_assignment.rule_id}`, 404)
      );
    }
  }

  // Validate scoring_rules if provided
  if (req.body.scoring_rules) {
    for (const rule of req.body.scoring_rules) {
      if (!rule.field || !rule.operator || typeof rule.score !== 'number') {
        return next(
          new ErrorResponse('Each scoring rule must have field, operator, and score', 400)
        );
      }

      // Validate operator
      const validOperators = ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in', 'exists', 'not_exists'];
      if (!validOperators.includes(rule.operator)) {
        return next(
          new ErrorResponse(`Invalid operator: ${rule.operator}`, 400)
        );
      }
    }
  }

  const priorityScoreType = await PriorityScoreType.create(req.body);

  // Log activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'create',
    entity_type: 'PriorityScoreType',
    entity_id: priorityScoreType._id,
    description: `Created new priority score type: ${priorityScoreType.name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: priorityScoreType
  });
});

// @desc    Update priority score type
// @route   PUT /api/v1/priority-score-types/:id
// @access  Private/Admin
exports.updatePriorityScoreType = asyncHandler(async (req, res, next) => {
  // Validate display_label if provided
  const validDisplayLabels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  if (req.body.display_label && !validDisplayLabels.includes(req.body.display_label)) {
    return next(
      new ErrorResponse(`Invalid display label: ${req.body.display_label}`, 400)
    );
  }

  // Validate score_range if provided
  if (req.body.score_range) {
    if (typeof req.body.score_range.min !== 'number' || typeof req.body.score_range.max !== 'number') {
      return next(
        new ErrorResponse('Score range must have numeric min and max values', 400)
      );
    }

    if (req.body.score_range.min >= req.body.score_range.max) {
      return next(
        new ErrorResponse('Score range min must be less than max', 400)
      );
    }
  }

  // Validate auto_assignment if provided
  if (req.body.auto_assignment && req.body.auto_assignment.enabled) {
    if (!req.body.auto_assignment.rule_id) {
      return next(
        new ErrorResponse('Auto assignment requires a rule_id', 400)
      );
    }

    // Check if assignment rule exists
    const assignmentRule = await AssignmentRule.findById(req.body.auto_assignment.rule_id);
    if (!assignmentRule) {
      return next(
        new ErrorResponse(`Assignment rule not found with id of ${req.body.auto_assignment.rule_id}`, 404)
      );
    }
  }

  // Validate scoring_rules if provided
  if (req.body.scoring_rules) {
    for (const rule of req.body.scoring_rules) {
      if (!rule.field || !rule.operator || typeof rule.score !== 'number') {
        return next(
          new ErrorResponse('Each scoring rule must have field, operator, and score', 400)
        );
      }

      // Validate operator
      const validOperators = ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in', 'exists', 'not_exists'];
      if (!validOperators.includes(rule.operator)) {
        return next(
          new ErrorResponse(`Invalid operator: ${rule.operator}`, 400)
        );
      }
    }
  }

  let priorityScoreType = await PriorityScoreType.findById(req.params.id);

  if (!priorityScoreType) {
    return next(
      new ErrorResponse(`Priority score type not found with id of ${req.params.id}`, 404)
    );
  }

  // Update priority score type
  priorityScoreType = await PriorityScoreType.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'PriorityScoreType',
    entity_id: priorityScoreType._id,
    description: `Updated priority score type: ${priorityScoreType.name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: priorityScoreType
  });
});

// @desc    Delete priority score type
// @route   DELETE /api/v1/priority-score-types/:id
// @access  Private/Admin
exports.deletePriorityScoreType = asyncHandler(async (req, res, next) => {
  const priorityScoreType = await PriorityScoreType.findById(req.params.id);

  if (!priorityScoreType) {
    return next(
      new ErrorResponse(`Priority score type not found with id of ${req.params.id}`, 404)
    );
  }

  await priorityScoreType.deleteOne();

  // Log activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'PriorityScoreType',
    entity_id: priorityScoreType._id,
    description: `Deleted priority score type: ${priorityScoreType.name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Toggle priority score type active status
// @route   PUT /api/v1/priority-score-types/:id/toggle-status
// @access  Private/Admin
exports.togglePriorityScoreTypeStatus = asyncHandler(async (req, res, next) => {
  let priorityScoreType = await PriorityScoreType.findById(req.params.id);

  if (!priorityScoreType) {
    return next(
      new ErrorResponse(`Priority score type not found with id of ${req.params.id}`, 404)
    );
  }

  // Toggle status
  priorityScoreType.is_active = !priorityScoreType.is_active;
  await priorityScoreType.save();

  // Log activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'PriorityScoreType',
    entity_id: priorityScoreType._id,
    description: `${priorityScoreType.is_active ? 'Activated' : 'Deactivated'} priority score type: ${priorityScoreType.name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: priorityScoreType
  });
});

// @desc    Get active priority score types
// @route   GET /api/v1/priority-score-types/active
// @access  Private
exports.getActivePriorityScoreTypes = asyncHandler(async (req, res, next) => {
  const priorityScoreTypes = await PriorityScoreType.find({ is_active: true });

  res.status(200).json({
    success: true,
    count: priorityScoreTypes.length,
    data: priorityScoreTypes
  });
});

// @desc    Calculate priority score for an enquiry
// @route   POST /api/v1/priority-score-types/calculate-score
// @access  Private
exports.calculatePriorityScore = asyncHandler(async (req, res, next) => {
  const { enquiryData } = req.body;

  if (!enquiryData) {
    return next(
      new ErrorResponse('Enquiry data is required', 400)
    );
  }

  // Get all active priority score types
  const priorityScoreTypes = await PriorityScoreType.find({ is_active: true });

  // Calculate score for each priority type
  const results = [];
  let highestScore = 0;
  let selectedPriorityType = null;

  for (const priorityType of priorityScoreTypes) {
    let score = 0;

    // Apply scoring rules
    if (priorityType.scoring_rules && priorityType.scoring_rules.length > 0) {
      for (const rule of priorityType.scoring_rules) {
        const fieldValue = enquiryData[rule.field];
        
        // Skip if field doesn't exist in enquiry data
        if (fieldValue === undefined) continue;

        // Apply rule based on operator
        switch (rule.operator) {
          case 'equals':
            if (fieldValue === rule.value) score += rule.score;
            break;
          case 'not_equals':
            if (fieldValue !== rule.value) score += rule.score;
            break;
          case 'contains':
            if (typeof fieldValue === 'string' && fieldValue.includes(rule.value)) score += rule.score;
            break;
          case 'not_contains':
            if (typeof fieldValue === 'string' && !fieldValue.includes(rule.value)) score += rule.score;
            break;
          case 'greater_than':
            if (fieldValue > rule.value) score += rule.score;
            break;
          case 'less_than':
            if (fieldValue < rule.value) score += rule.score;
            break;
          case 'in':
            if (Array.isArray(rule.value) && rule.value.includes(fieldValue)) score += rule.score;
            break;
          case 'not_in':
            if (Array.isArray(rule.value) && !rule.value.includes(fieldValue)) score += rule.score;
            break;
          case 'exists':
            if (fieldValue !== undefined && fieldValue !== null) score += rule.score;
            break;
          case 'not_exists':
            if (fieldValue === undefined || fieldValue === null) score += rule.score;
            break;
        }
      }
    }

    // Check if score is within range
    if (
      priorityType.score_range &&
      score >= priorityType.score_range.min &&
      score <= priorityType.score_range.max
    ) {
      results.push({
        priority_type: priorityType._id,
        name: priorityType.name,
        display_label: priorityType.display_label,
        score,
        color_code: priorityType.color_code
      });

      // Track highest score
      if (score > highestScore) {
        highestScore = score;
        selectedPriorityType = {
          priority_type: priorityType._id,
          name: priorityType.name,
          display_label: priorityType.display_label,
          score,
          color_code: priorityType.color_code
        };
      }
    }
  }

  res.status(200).json({
    success: true,
    data: {
      all_scores: results,
      selected_priority: selectedPriorityType,
      total_score: highestScore
    }
  });
});
