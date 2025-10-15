const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const SourceChannel = require('../../models/enquiry/SourceChannel');
// const Profile = require('../../models/profile/Profile'); // Commented out - Profile model not found
const AssignmentRule = require('../../models/enquiry/AssignmentRule');

// @desc    Get all source channels
// @route   GET /api/v1/source-channels
// @access  Private
exports.getSourceChannels = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single source channel
// @route   GET /api/v1/source-channels/:id
// @access  Private
exports.getSourceChannel = asyncHandler(async (req, res, next) => {
  const sourceChannel = await SourceChannel.findById(req.params.id)
    .populate('default_profile', 'profile_type name')
    .populate('auto_assignment_rule', 'name rule_type');

  if (!sourceChannel) {
    return next(
      new ErrorResponse(`Source channel not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: sourceChannel
  });
});

// @desc    Create new source channel
// @route   POST /api/v1/source-channels
// @access  Private/Admin
exports.createSourceChannel = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.created_by = req.user.id;

  // Validate source_type
  const validSourceTypes = [
    'Website',
    'WhatsApp',
    'Meta Ads',
    'JustDial',
    'IndiaMART',
    'Walk-in',
    'Referral',
    'Cold Call',
    'Other'
  ];

  if (!validSourceTypes.includes(req.body.source_type)) {
    return next(
      new ErrorResponse(`Invalid source type: ${req.body.source_type}`, 400)
    );
  }

  // Validate channel_type
  const validChannelTypes = ['Online', 'Offline', 'API', 'Manual', 'Bulk Upload'];

  if (!validChannelTypes.includes(req.body.channel_type)) {
    return next(
      new ErrorResponse(`Invalid channel type: ${req.body.channel_type}`, 400)
    );
  }

  // Check if default profile exists if provided
  // if (req.body.default_profile) {
  //   const profile = await Profile.findById(req.body.default_profile);
  //   if (!profile) {
  //     return next(
  //       new ErrorResponse(
  //         `Profile not found with id of ${req.body.default_profile}`,
  //         404
  //       )
  //     );
  //   }
  // }

  // Check if auto assignment rule exists if provided
  if (req.body.auto_assignment_rule) {
    const rule = await AssignmentRule.findById(req.body.auto_assignment_rule);
    if (!rule) {
      return next(
        new ErrorResponse(
          `Assignment rule not found with id of ${req.body.auto_assignment_rule}`,
          404
        )
      );
    }
  }

  const sourceChannel = await SourceChannel.create(req.body);

  res.status(201).json({
    success: true,
    data: sourceChannel
  });
});

// @desc    Update source channel
// @route   PUT /api/v1/source-channels/:id
// @access  Private/Admin
exports.updateSourceChannel = asyncHandler(async (req, res, next) => {
  // Validate source_type if provided
  if (req.body.source_type) {
    const validSourceTypes = [
      'Website',
      'WhatsApp',
      'Meta Ads',
      'JustDial',
      'IndiaMART',
      'Walk-in',
      'Referral',
      'Cold Call',
      'Other'
    ];

    if (!validSourceTypes.includes(req.body.source_type)) {
      return next(
        new ErrorResponse(`Invalid source type: ${req.body.source_type}`, 400)
      );
    }
  }

  // Validate channel_type if provided
  if (req.body.channel_type) {
    const validChannelTypes = ['Online', 'Offline', 'API', 'Manual', 'Bulk Upload'];

    if (!validChannelTypes.includes(req.body.channel_type)) {
      return next(
        new ErrorResponse(`Invalid channel type: ${req.body.channel_type}`, 400)
      );
    }
  }

  // Check if default profile exists if provided
  // if (req.body.default_profile) {
  //   const profile = await Profile.findById(req.body.default_profile);
  //   if (!profile) {
  //     return next(
  //       new ErrorResponse(
  //         `Profile not found with id of ${req.body.default_profile}`,
  //         404
  //       )
  //     );
  //   }
  // }

  // Check if auto assignment rule exists if provided
  if (req.body.auto_assignment_rule) {
    const rule = await AssignmentRule.findById(req.body.auto_assignment_rule);
    if (!rule) {
      return next(
        new ErrorResponse(
          `Assignment rule not found with id of ${req.body.auto_assignment_rule}`,
          404
        )
      );
    }
  }

  let sourceChannel = await SourceChannel.findById(req.params.id);

  if (!sourceChannel) {
    return next(
      new ErrorResponse(`Source channel not found with id of ${req.params.id}`, 404)
    );
  }

  // Update source channel
  sourceChannel = await SourceChannel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: sourceChannel
  });
});

// @desc    Delete source channel
// @route   DELETE /api/v1/source-channels/:id
// @access  Private/Admin
exports.deleteSourceChannel = asyncHandler(async (req, res, next) => {
  const sourceChannel = await SourceChannel.findById(req.params.id);

  if (!sourceChannel) {
    return next(
      new ErrorResponse(`Source channel not found with id of ${req.params.id}`, 404)
    );
  }

  await sourceChannel.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Toggle source channel active status
// @route   PUT /api/v1/source-channels/:id/toggle-status
// @access  Private/Admin
exports.toggleSourceChannelStatus = asyncHandler(async (req, res, next) => {
  let sourceChannel = await SourceChannel.findById(req.params.id);

  if (!sourceChannel) {
    return next(
      new ErrorResponse(`Source channel not found with id of ${req.params.id}`, 404)
    );
  }

  // Toggle status
  sourceChannel.is_active = !sourceChannel.is_active;
  await sourceChannel.save();

  res.status(200).json({
    success: true,
    data: sourceChannel
  });
});

// @desc    Get source channels by source type
// @route   GET /api/v1/source-channels/source/:type
// @access  Private
exports.getChannelsBySourceType = asyncHandler(async (req, res, next) => {
  const validSourceTypes = [
    'Website',
    'WhatsApp',
    'Facebook',
    'Instagram',
    'Email',
    'Phone',
    'Walk-in',
    'Referral',
    'Other'
  ];

  if (!validSourceTypes.includes(req.params.type)) {
    return next(
      new ErrorResponse(`Invalid source type: ${req.params.type}`, 400)
    );
  }

  const sourceChannels = await SourceChannel.find({ source_type: req.params.type })
    .populate('default_profile', 'profile_type name')
    .populate('auto_assignment_rule', 'name rule_type');

  res.status(200).json({
    success: true,
    count: sourceChannels.length,
    data: sourceChannels
  });
});

// @desc    Get source channels by channel type
// @route   GET /api/v1/source-channels/channel/:type
// @access  Private
exports.getChannelsByChannelType = asyncHandler(async (req, res, next) => {
  const validChannelTypes = ['Online', 'Offline', 'Social', 'Referral'];

  if (!validChannelTypes.includes(req.params.type)) {
    return next(
      new ErrorResponse(`Invalid channel type: ${req.params.type}`, 400)
    );
  }

  const sourceChannels = await SourceChannel.find({ channel_type: req.params.type })
    .populate('default_profile', 'profile_type name')
    .populate('auto_assignment_rule', 'name rule_type');

  res.status(200).json({
    success: true,
    count: sourceChannels.length,
    data: sourceChannels
  });
});

// @desc    Get active source channels
// @route   GET /api/v1/source-channels/active
// @access  Private
exports.getActiveChannels = asyncHandler(async (req, res, next) => {
  const sourceChannels = await SourceChannel.find({ is_active: true })
    .populate('default_profile', 'profile_type name')
    .populate('auto_assignment_rule', 'name rule_type');

  res.status(200).json({
    success: true,
    count: sourceChannels.length,
    data: sourceChannels
  });
});

// @desc    Update source channel API credentials
// @route   PUT /api/v1/source-channels/:id/credentials
// @access  Private/Admin
exports.updateCredentials = asyncHandler(async (req, res, next) => {
  const { api_key, api_secret, api_token } = req.body;

  if (!api_key && !api_secret && !api_token) {
    return next(
      new ErrorResponse('Please provide at least one credential to update', 400)
    );
  }

  let sourceChannel = await SourceChannel.findById(req.params.id);

  if (!sourceChannel) {
    return next(
      new ErrorResponse(`Source channel not found with id of ${req.params.id}`, 404)
    );
  }

  // Update credentials
  if (api_key) sourceChannel.api_credentials.api_key = api_key;
  if (api_secret) sourceChannel.api_credentials.api_secret = api_secret;
  if (api_token) sourceChannel.api_credentials.api_token = api_token;

  await sourceChannel.save();

  // Don't return the credentials in the response
  const response = {
    _id: sourceChannel._id,
    name: sourceChannel.name,
    source_type: sourceChannel.source_type,
    channel_type: sourceChannel.channel_type,
    is_active: sourceChannel.is_active,
    credentials_updated: true
  };

  res.status(200).json({
    success: true,
    data: response
  });
});

// @desc    Update source channel webhook URL
// @route   PUT /api/v1/source-channels/:id/webhook
// @access  Private/Admin
exports.updateWebhookUrl = asyncHandler(async (req, res, next) => {
  const { webhook_url } = req.body;

  if (!webhook_url) {
    return next(new ErrorResponse('Please provide a webhook URL', 400));
  }

  let sourceChannel = await SourceChannel.findById(req.params.id);

  if (!sourceChannel) {
    return next(
      new ErrorResponse(`Source channel not found with id of ${req.params.id}`, 404)
    );
  }

  // Update webhook URL
  sourceChannel.webhook_url = webhook_url;
  await sourceChannel.save();

  res.status(200).json({
    success: true,
    data: sourceChannel
  });
});

// @desc    Update source channel field mapping
// @route   PUT /api/v1/source-channels/:id/field-mapping
// @access  Private/Admin
exports.updateFieldMapping = asyncHandler(async (req, res, next) => {
  const { field_mapping } = req.body;

  if (!field_mapping || !Array.isArray(field_mapping)) {
    return next(new ErrorResponse('Please provide field mapping array', 400));
  }

  // Validate field mapping
  for (const mapping of field_mapping) {
    if (!mapping.source_field || !mapping.target_field) {
      return next(
        new ErrorResponse('Each mapping must have source and target fields', 400)
      );
    }
  }

  let sourceChannel = await SourceChannel.findById(req.params.id);

  if (!sourceChannel) {
    return next(
      new ErrorResponse(`Source channel not found with id of ${req.params.id}`, 404)
    );
  }

  // Update field mapping
  sourceChannel.field_mapping = field_mapping;
  await sourceChannel.save();

  res.status(200).json({
    success: true,
    data: sourceChannel
  });
});
