const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const CommunicationLog = require('../../models/enquiry/CommunicationLog');
const Enquiry = require('../../models/enquiry/Enquiry');
const User = require('../../models/profile/User');

// @desc    Get all communication logs
// @route   GET /api/v1/communication-logs
// @access  Private
exports.getCommunicationLogs = asyncHandler(async (req, res, next) => {
  const { 
    enquiry_id, 
    communication_type, 
    direction, 
    status, 
    created_by,
    start_date,
    end_date,
    page = 1, 
    limit = 10 
  } = req.query;

  let filter = {};
  
  if (enquiry_id) filter.enquiry_id = enquiry_id;
  if (communication_type) filter.communication_type = communication_type;
  if (direction) filter.direction = direction;
  if (status) filter.status = status;
  if (created_by) filter.created_by = created_by;
  
  if (start_date || end_date) {
    filter.created_at = {};
    if (start_date) filter.created_at.$gte = new Date(start_date);
    if (end_date) filter.created_at.$lte = new Date(end_date);
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { created_at: -1 },
    populate: [
      { path: 'enquiry_id', select: 'enquiry_id name mobile' }
    ]
  };

  try {
    const communicationLogs = await CommunicationLog.paginate(filter, options);

    res.status(200).json({
      success: true,
      data: {
        docs: communicationLogs.docs,
        pagination: {
          total: communicationLogs.totalDocs,
          limit: communicationLogs.limit,
          page: communicationLogs.page,
          pages: communicationLogs.totalPages,
          hasNextPage: communicationLogs.hasNextPage,
          hasPrevPage: communicationLogs.hasPrevPage,
          nextPage: communicationLogs.nextPage,
        prevPage: communicationLogs.prevPage
      }
    }
  });
  } catch (error) {
    console.error('Error in getCommunicationLogs:', error);
    return next(new ErrorResponse('Error retrieving communication logs', 500));
  }
});

// @desc    Get communication log by ID
// @route   GET /api/v1/communication-logs/:id
// @access  Private
exports.getCommunicationLogById = asyncHandler(async (req, res, next) => {
  const communicationLog = await CommunicationLog.findById(req.params.id)
    .populate('enquiry_id', 'enquiry_id name mobile')
    .populate('created_by', 'name email');

  if (!communicationLog) {
    return next(new ErrorResponse('Communication log not found', 404));
  }

  res.status(200).json({
    success: true,
    data: communicationLog
  });
});

// @desc    Create communication log
// @route   POST /api/communication-logs
// @access  Private
exports.createCommunicationLog = asyncHandler(async (req, res, next) => {
  const { 
    enquiry_id, 
    communication_type, 
    direction, 
    subject, 
    message_content, 
    contact_details,
    scheduled_at,
    metadata,
    sender,
    recipient
  } = req.body;

  // Validate enquiry exists
  const enquiry = await Enquiry.findById(enquiry_id);
  if (!enquiry) {
    return next(new ErrorResponse('Enquiry not found', 404));
  }

  // Validate required fields based on communication type
  if (communication_type === 'email' && !subject) {
    return next(new ErrorResponse('Subject is required for email communications', 400));
  }

  if (!message_content) {
    return next(new ErrorResponse('Message content is required', 400));
  }

  // Create communication log
  const communicationLog = await CommunicationLog.create({
    enquiry_id,
    communication_type,
    direction,
    subject,
    message_content,
    sender,
    recipient,
    scheduled_at,
    created_by: req.user.id,
    metadata: {
      ...metadata,
      user_agent: req.get('User-Agent'),
      ip_address: req.ip
    },
    delivery_status: 'pending'
  });

  // Send the communication based on type
  try {
    // Import utility functions
    const sendEmail = require('../../utils/sendEmail');
    const sendSMS = require('../../utils/sendSMS');
    
    let deliveryResult = null;
    
    // Determine recipient contact details
    const recipientEmail = recipient?.external_contact?.email || contact_details?.email;
    const recipientPhone = recipient?.external_contact?.phone || contact_details?.phone;
    
    if (direction === 'outbound') {
      switch (communication_type) {
        case 'email':
          if (!recipientEmail) {
            throw new Error('Recipient email is required for sending emails');
          }
          
          try {
            await sendEmail({
              email: recipientEmail,
              subject: subject || 'Communication from CRM',
              message: message_content,
              html: `<div>${message_content}</div>`
            });
            
            deliveryResult = 'sent';
          } catch (emailError) {
            console.error('Email sending error:', emailError);
            throw new Error(`Failed to send email: ${emailError.message}`);
          }
          break;
          
        case 'sms':
          if (!recipientPhone) {
            throw new Error('Recipient phone number is required for sending SMS');
          }
          
          try {
            await sendSMS({
              to: recipientPhone,
              message: message_content
            });
            
            deliveryResult = 'sent';
          } catch (smsError) {
            console.error('SMS sending error:', smsError);
            throw new Error(`Failed to send SMS: ${smsError.message}`);
          }
          break;
          
        case 'whatsapp':
          if (!recipientPhone) {
            throw new Error('Recipient phone number is required for sending WhatsApp messages');
          }
          
          // For now, we'll use SMS as a fallback since WhatsApp API integration
          // would require additional setup
          try {
            await sendSMS({
              to: recipientPhone,
              message: `[WhatsApp] ${message_content}`
            });
            
            deliveryResult = 'sent';
          } catch (whatsappError) {
            console.error('WhatsApp sending error:', whatsappError);
            throw new Error(`Failed to send WhatsApp message: ${whatsappError.message}`);
          }
          break;
          
        default:
          // For other communication types, just log without sending
          deliveryResult = 'pending';
      }
      
      // Update delivery status if message was sent
      if (deliveryResult === 'sent') {
        communicationLog.delivery_status = 'sent';
        communicationLog.delivery_timestamp = new Date();
        await communicationLog.save();
      }
    }
  } catch (error) {
    console.error(`Error sending ${communication_type}:`, error);
    
    // Update communication log with error status
    communicationLog.delivery_status = 'failed';
    communicationLog.metadata = {
      ...communicationLog.metadata,
      error_message: error.message
    };
    await communicationLog.save();
    
    // Return the communication log with error status
    return res.status(200).json({
      success: true,
      data: communicationLog,
      message: `Communication log created but delivery failed: ${error.message}`
    });
  }

  await communicationLog.populate([
    { path: 'enquiry_id', select: 'enquiry_id name mobile' }
    // Removed created_by as it doesn't exist in the schema
  ]);

  res.status(201).json({
    success: true,
    data: communicationLog
  });
});

// @desc    Update communication log
// @route   PUT /api/v1/communication-logs/:id
// @access  Private
exports.updateCommunicationLog = asyncHandler(async (req, res, next) => {
  let communicationLog = await CommunicationLog.findById(req.params.id);

  if (!communicationLog) {
    return next(new ErrorResponse('Communication log not found', 404));
  }

  // Only creator or admin can update
  if (communicationLog.created_by.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this communication log', 403));
  }

  const allowedUpdates = ['subject', 'content', 'status', 'scheduled_at', 'metadata'];
  const updates = {};
  
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  communicationLog = await CommunicationLog.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate([
    { path: 'enquiry_id', select: 'enquiry_id name mobile' },
    { path: 'created_by', select: 'name email' }
  ]);

  res.status(200).json({
    success: true,
    data: communicationLog
  });
});

// @desc    Get enquiry communication history
// @route   GET /api/v1/communication-logs/enquiry/:enquiry_id/history
// @access  Private
exports.getEnquiryCommunicationHistory = asyncHandler(async (req, res, next) => {
  const { enquiry_id } = req.params;
  const { limit = 50, communication_type } = req.query;

  const communicationHistory = await CommunicationLog.getEnquiryCommunicationHistory(
    enquiry_id, 
    parseInt(limit),
    communication_type
  );

  res.status(200).json({
    success: true,
    data: communicationHistory
  });
});

// @desc    Get communication analytics
// @route   GET /api/v1/communication-logs/analytics
// @access  Private
exports.getCommunicationAnalytics = asyncHandler(async (req, res, next) => {
  const { start_date, end_date, user_id, team } = req.query;

  const analytics = await CommunicationLog.getCommunicationAnalytics(start_date, end_date, user_id, team);

  res.status(200).json({
    success: true,
    data: analytics
  });
});

// @desc    Mark communication as sent
// @route   PATCH /api/v1/communication-logs/:id/sent
// @access  Private
exports.markAsSent = asyncHandler(async (req, res, next) => {
  const { delivery_details } = req.body;

  const communicationLog = await CommunicationLog.findById(req.params.id);

  if (!communicationLog) {
    return next(new ErrorResponse('Communication log not found', 404));
  }

  await communicationLog.markAsSent(delivery_details);

  res.status(200).json({
    success: true,
    data: communicationLog
  });
});

// @desc    Mark communication as failed
// @route   PATCH /api/v1/communication-logs/:id/failed
// @access  Private
exports.markAsFailed = asyncHandler(async (req, res, next) => {
  const { error_details } = req.body;

  const communicationLog = await CommunicationLog.findById(req.params.id);

  if (!communicationLog) {
    return next(new ErrorResponse('Communication log not found', 404));
  }

  await communicationLog.markAsFailed(error_details);

  res.status(200).json({
    success: true,
    data: communicationLog
  });
});

// @desc    Add response to communication
// @route   POST /api/v1/communication-logs/:id/response
// @access  Private
exports.addResponse = asyncHandler(async (req, res, next) => {
  const { response_content, response_metadata } = req.body;

  const communicationLog = await CommunicationLog.findById(req.params.id);

  if (!communicationLog) {
    return next(new ErrorResponse('Communication log not found', 404));
  }

  await communicationLog.addResponse(response_content, response_metadata);

  res.status(200).json({
    success: true,
    data: communicationLog
  });
});

// @desc    Get pending communications
// @route   GET /api/v1/communication-logs/pending
// @access  Private
exports.getPendingCommunications = asyncHandler(async (req, res, next) => {
  const { communication_type, limit = 50 } = req.query;

  const pendingCommunications = await CommunicationLog.getPendingCommunications(
    communication_type,
    parseInt(limit)
  );

  res.status(200).json({
    success: true,
    data: pendingCommunications
  });
});

// @desc    Get scheduled communications
// @route   GET /api/v1/communication-logs/scheduled
// @access  Private
exports.getScheduledCommunications = asyncHandler(async (req, res, next) => {
  const { date, communication_type } = req.query;

  const scheduledCommunications = await CommunicationLog.getScheduledCommunications(
    date,
    communication_type
  );

  res.status(200).json({
    success: true,
    data: scheduledCommunications
  });
});

// @desc    Bulk update communication status
// @route   PATCH /api/v1/communication-logs/bulk-update
// @access  Private
exports.bulkUpdateStatus = asyncHandler(async (req, res, next) => {
  const { communication_ids, status, metadata } = req.body;

  if (!communication_ids || !Array.isArray(communication_ids) || communication_ids.length === 0) {
    return next(new ErrorResponse('Communication IDs array is required', 400));
  }

  if (!status) {
    return next(new ErrorResponse('Status is required', 400));
  }

  const result = await CommunicationLog.updateMany(
    { _id: { $in: communication_ids } },
    { 
      status,
      ...(status === 'sent' && { sent_at: new Date() }),
      ...(status === 'failed' && { failed_at: new Date() }),
      ...(metadata && { $push: { metadata } })
    }
  );

  res.status(200).json({
    success: true,
    data: {
      matched: result.matchedCount,
      modified: result.modifiedCount
    }
  });
});

// @desc    Get communication templates
// @route   GET /api/v1/communication-logs/templates
// @access  Private
exports.getCommunicationTemplates = asyncHandler(async (req, res, next) => {
  const { communication_type } = req.query;

  const templates = await CommunicationLog.getCommunicationTemplates(communication_type);

  res.status(200).json({
    success: true,
    data: templates
  });
});

// @desc    Archive communication log
// @route   PATCH /api/v1/communication-logs/:id/archive
// @access  Private
exports.archiveCommunicationLog = asyncHandler(async (req, res, next) => {
  const communicationLog = await CommunicationLog.findById(req.params.id);

  if (!communicationLog) {
    return next(new ErrorResponse('Communication log not found', 404));
  }

  // Only creator or admin can archive
  if (communicationLog.created_by.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to archive this communication log', 403));
  }

  await communicationLog.archive();

  res.status(200).json({
    success: true,
    data: communicationLog
  });
});

// @desc    Delete communication log
// @route   DELETE /api/v1/communication-logs/:id
// @access  Private (Admin only)
exports.deleteCommunicationLog = asyncHandler(async (req, res, next) => {
  const communicationLog = await CommunicationLog.findById(req.params.id);

  if (!communicationLog) {
    return next(new ErrorResponse('Communication log not found', 404));
  }

  // Only allow deletion by admin or the creator
  if (req.user.role !== 'Admin' && communicationLog.created_by.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to delete this communication log', 403));
  }

  await communicationLog.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get enquiry communications
// @route   GET /api/v1/communication-logs/enquiry/:enquiry_id
// @access  Private
exports.getEnquiryCommunications = asyncHandler(async (req, res, next) => {
  const { enquiry_id } = req.params;
  const { communication_type, direction, page = 1, limit = 10 } = req.query;

  let filter = { enquiry_id };
  if (communication_type) filter.communication_type = communication_type;
  if (direction) filter.direction = direction;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { created_at: -1 },
    populate: [
      { path: 'created_by', select: 'name email' }
    ]
  };

  const communications = await CommunicationLog.paginate(filter, options);

  res.status(200).json({
    success: true,
    data: {
      docs: communications.docs,
      pagination: {
        total: communications.totalDocs,
        limit: communications.limit,
        page: communications.page,
        pages: communications.totalPages,
        hasNextPage: communications.hasNextPage,
        hasPrevPage: communications.hasPrevPage,
        nextPage: communications.nextPage,
        prevPage: communications.prevPage
      }
    }
  });
});

// @desc    Get user communications
// @route   GET /api/v1/communication-logs/user/:user_id
// @access  Private
exports.getUserCommunications = asyncHandler(async (req, res, next) => {
  const { user_id } = req.params;
  const { communication_type, status, page = 1, limit = 10 } = req.query;

  let filter = { created_by: user_id };
  if (communication_type) filter.communication_type = communication_type;
  if (status) filter.status = status;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { created_at: -1 },
    populate: [
      { path: 'enquiry_id', select: 'enquiry_id name mobile' }
    ]
  };

  const communications = await CommunicationLog.paginate(filter, options);

  res.status(200).json({
    success: true,
    data: {
      docs: communications.docs,
      pagination: {
        total: communications.totalDocs,
        limit: communications.limit,
        page: communications.page,
        pages: communications.totalPages,
        hasNextPage: communications.hasNextPage,
        hasPrevPage: communications.hasPrevPage,
        nextPage: communications.nextPage,
        prevPage: communications.prevPage
      }
    }
  });
});

// @desc    Mark communication as read
// @route   PUT /api/v1/communication-logs/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const communicationLog = await CommunicationLog.findById(req.params.id);

  if (!communicationLog) {
    return next(new ErrorResponse('Communication log not found', 404));
  }

  communicationLog.read_status = true;
  communicationLog.read_at = new Date();
  communicationLog.read_by = req.user.id;

  await communicationLog.save();

  res.status(200).json({
    success: true,
    data: communicationLog
  });
});

// @desc    Export communication logs
// @route   GET /api/v1/communication-logs/export
// @access  Private (Admin, Sales Head)
exports.exportCommunicationLogs = asyncHandler(async (req, res, next) => {
  const { 
    start_date, 
    end_date, 
    communication_type, 
    direction, 
    status,
    enquiry_id,
    created_by
  } = req.query;

  let filter = {};
  
  if (start_date && end_date) {
    filter.created_at = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }
  
  if (communication_type) filter.communication_type = communication_type;
  if (direction) filter.direction = direction;
  if (status) filter.status = status;
  if (enquiry_id) filter.enquiry_id = enquiry_id;
  if (created_by) filter.created_by = created_by;

  const communicationLogs = await CommunicationLog.find(filter)
    .populate('enquiry_id', 'enquiry_id name mobile')
    .populate('created_by', 'name email')
    .sort({ created_at: -1 });

  res.status(200).json({
    success: true,
    count: communicationLogs.length,
    data: communicationLogs
  });
});
