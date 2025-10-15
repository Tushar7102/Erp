const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const Enquiry = require('../../models/enquiry/Enquiry');
const User = require('../../models/profile/User');
// const Call = require('../../models/enquiry/Call'); // Commented out - Call model not found
const AssignmentRule = require('../../models/enquiry/AssignmentRule');
const SourceChannel = require('../../models/enquiry/SourceChannel');
const validateEnquiryFields = (body) => {
  const errors = [];
  
  // Basic required fields
  if (!body.name) errors.push('Name is required');
  if (!body.mobile || !/^\d{10}$/.test(body.mobile)) errors.push('Mobile number must be 10 digits');
  if (body.email && !require('validator').isEmail(body.email)) errors.push('Invalid email address');
  if (!body.type_of_lead || !['B2B', 'B2C'].includes(body.type_of_lead)) errors.push('Type of Lead (B2B/B2C) is required and must be either B2B or B2C');
  if (!body.source_type) errors.push('Source Type is required');
  
  // B2B specific validations
  if (body.type_of_lead === 'B2B') {
    if (!body.business_model) errors.push('Business Model is required for B2B leads');
    if (!body.company_name) errors.push('Company Name is required for B2B leads');
    
    // Additional B2B validations (not required but validated if present)
    if (body.annual_revenue && typeof body.annual_revenue !== 'number') 
      errors.push('Annual Revenue must be a number');
    if (body.employee_count && typeof body.employee_count !== 'number') 
      errors.push('Employee Count must be a number');
  }
  
  // B2C specific validations
  if (body.type_of_lead === 'B2C') {
    if (!body.pv_capacity_kw) errors.push('PV Capacity (kW) is required for B2C leads');
    if (!body.category) errors.push('Category is required for B2C leads');
    
    // Additional B2C validations (not required but validated if present)
    if (body.aadhaar_number && !/^\d{12}$/.test(body.aadhaar_number)) 
      errors.push('Aadhaar Number must be 12 digits');
    if (body.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(body.pan_number)) 
      errors.push('PAN Number must be in valid format (e.g., ABCDE1234F)');
  }
  
  // Project details validations (not required but validated if present)
  if (body.area_sqft && isNaN(Number(body.area_sqft))) 
    errors.push('Area (sqft) must be a number');
  if (body.monthly_electricity_bill && isNaN(Number(body.monthly_electricity_bill))) 
    errors.push('Monthly Electricity Bill must be a number');
  
  // Loan document validations
  if (body.need_loan === true) {
    if (!body.aadhaar_file) errors.push('Aadhaar file is required for loan enquiries');
    if (!body.electricity_bill_file) errors.push('Electricity Bill file is required for loan enquiries');
    if (!body.bank_statement_file) errors.push('Bank Statement file is required for loan enquiries');
    if (!body.pan_file) errors.push('PAN file is required for loan enquiries');
    if (!body.project_proposal_file) errors.push('Project Proposal file is required for loan enquiries');
  }
  
  return errors;
};
const XLSX = require('xlsx');
const mongoose = require('mongoose');

// Get all enquiries with filters
exports.getEnquiries = asyncHandler(async (req, res) => {
  const { status, source_type, priority, assigned_to, page = 1, limit = 10 } = req.query

  // Role-based filter: If telecaller, only show assigned enquiries
  let filter = {};
  if (req.user && req.user.role && (req.user.role === 'telecaller' || req.user.role.role_name === 'Telecaller')) {
    filter.assigned_to = req.user.id;
  } else {
    if (status && status !== 'all') filter.status = status
    if (source_type && source_type !== 'all') filter.source_type = source_type
    if (priority && priority !== 'all') filter.priority = priority
    if (assigned_to && assigned_to !== 'all') {
      if (assigned_to === 'null') {
        filter.assigned_to = null
      } else {
        filter.assigned_to = assigned_to
      }
    }
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: 'assigned_to',
    sort: { created_at: -1 }
  }

  const enquiries = await Enquiry.paginate(filter, options)

  res.status(200).json({
    success: true,
    data: enquiries.docs,
    pagination: {
      page: enquiries.page,
      limit: enquiries.limit,
      totalDocs: enquiries.totalDocs,
      totalPages: enquiries.totalPages,
      hasNextPage: enquiries.hasNextPage,
      hasPrevPage: enquiries.hasPrevPage
    }
  })
})

// Get single enquiry by ID
exports.getEnquiryById = asyncHandler(async (req, res) => {
  // Try to find by enquiry_id first (for ENQXXXX format)
  let enquiry = await Enquiry.findOne({ enquiry_id: req.params.id }).populate('assigned_to');
  
  // If not found, try to find by MongoDB _id
  if (!enquiry) {
    try {
      enquiry = await Enquiry.findById(req.params.id).populate('assigned_to');
    } catch (err) {
      // Ignore CastError - we'll handle the not found case below
    }
  }
  
  if (!enquiry) {
    return res.status(404).json({
      success: false,
      message: 'Enquiry not found'
    })
  }

  res.status(200).json({
    success: true,
    data: enquiry
  })
})

// Update enquiry (always return latest data)
exports.updateEnquiry = asyncHandler(async (req, res) => {
  let enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) {
    return res.status(404).json({ success: false, message: 'Enquiry not found' });
  }
  const errors = validateEnquiryFields({ ...enquiry.toObject(), ...req.body });
  if (errors.length) {
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }
  // Validate type_of_lead
  if (!req.body.type_of_lead || !['B2B', 'B2C'].includes(req.body.type_of_lead)) {
    return res.status(400).json({ success: false, message: 'Type of Lead (B2B/B2C) is required and must be either B2B or B2C' });
  }
  // Check if status is changing
  const statusChanged = req.body.status && req.body.status !== enquiry.status;
  const oldStatus = enquiry.status;
  const newStatus = req.body.status;
  // Check if profile is changing from Unknown to something else
  const profileChanged = req.body.enquiry_profile && enquiry.enquiry_profile === 'Unknown' && req.body.enquiry_profile !== 'Unknown';
  // Update enquiry
  enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('assigned_to');
  // If profile changed from Unknown to identified, update status and stage
  if (profileChanged) {
    enquiry.status = 'New';
    enquiry.stage = 'Profile Identified';
    await enquiry.save();
    await autoAssignEnquiry(enquiry);
  }
  // Handle status change automations
  if (statusChanged) {
    await handleStatusChange(enquiry, oldStatus, newStatus, req.user.id);
  }
  res.status(200).json({ success: true, data: enquiry });
});

// Update status (always return latest data)
exports.updateEnquiryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }
  const enquiry = await Enquiry.findById(req.params.id)
  if (!enquiry) {
    return res.status(404).json({ success: false, message: 'Enquiry not found' });
  }
  enquiry.status = status
  await enquiry.save()
  res.status(200).json({ success: true, data: enquiry })
})

// Assign enquiry (always return latest data)
exports.assignEnquiry = asyncHandler(async (req, res) => {
  const { assigned_to } = req.body
  if (!assigned_to) {
    return res.status(400).json({ success: false, message: 'Assigned to is required' });
  }
  const enquiry = await Enquiry.findById(req.params.id)
  if (!enquiry) {
    return res.status(404).json({ success: false, message: 'Enquiry not found' });
  }
  enquiry.assigned_to = assigned_to
  await enquiry.save()
  const updatedEnquiry = await Enquiry.findById(req.params.id).populate('assigned_to')
  res.status(200).json({ success: true, data: updatedEnquiry })
})

// Add remark (always return latest data)
exports.addRemark = asyncHandler(async (req, res) => {
  const { text } = req.body
  if (!text) {
    return res.status(400).json({ success: false, message: 'Remark text is required' });
  }
  const enquiry = await Enquiry.findById(req.params.id)
  if (!enquiry) {
    return res.status(404).json({ success: false, message: 'Enquiry not found' });
  }
  if (!enquiry.remarks) { enquiry.remarks = [] }
  enquiry.remarks.push({ text, added_by: req.user.id, added_at: new Date() })
  await enquiry.save()
  res.status(200).json({ success: true, data: enquiry })
})

// Get enquiry remarks
exports.getEnquiryRemarks = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id)
  if (!enquiry) {
    return res.status(404).json({
      success: false,
      message: 'Enquiry not found'
    })
  }
  res.status(200).json({
    success: true,
    data: enquiry.remarks || []
  })
})

// Get enquiries by status
exports.getEnquiriesByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params
  const { page = 1, limit = 10 } = req.query

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: 'assigned_to',
    sort: { created_at: -1 }
  }

  const enquiries = await Enquiry.paginate({ status }, options)
  
  res.status(200).json({
    success: true,
    data: enquiries.docs,
    pagination: {
      page: enquiries.page,
      limit: enquiries.limit,
      totalDocs: enquiries.totalDocs,
      totalPages: enquiries.totalPages,
      hasNextPage: enquiries.hasNextPage,
      hasPrevPage: enquiries.hasPrevPage
    }
  })
})

// Get enquiries by stage
exports.getEnquiriesByStage = asyncHandler(async (req, res) => {
  const { stage } = req.params
  const { page = 1, limit = 10 } = req.query

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: 'assigned_to',
    sort: { created_at: -1 }
  }

  const enquiries = await Enquiry.paginate({ stage }, options)
  
  res.status(200).json({
    success: true,
    data: enquiries.docs,
    pagination: {
      page: enquiries.page,
      limit: enquiries.limit,
      totalDocs: enquiries.totalDocs,
      totalPages: enquiries.totalPages,
      hasNextPage: enquiries.hasNextPage,
      hasPrevPage: enquiries.hasPrevPage
    }
  })
})

// Get assigned enquiries
exports.getAssignedEnquiries = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { page = 1, limit = 10 } = req.query

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: 'assigned_to',
    sort: { created_at: -1 }
  }

  const enquiries = await Enquiry.paginate({ assigned_to: userId }, options)
  
  res.status(200).json({
    success: true,
    data: enquiries.docs,
    pagination: {
      page: enquiries.page,
      limit: enquiries.limit,
      totalDocs: enquiries.totalDocs,
      totalPages: enquiries.totalPages,
      hasNextPage: enquiries.hasNextPage,
      hasPrevPage: enquiries.hasPrevPage
    }
  })
})

// Get telecaller queue
exports.getTelecallerQueue = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: 'assigned_to',
    sort: { created_at: -1 }
  }

  // Get enquiries assigned to telecallers or unassigned
  const enquiries = await Enquiry.paginate({
    $or: [
      { assigned_to: { $in: await User.find({ role: 'telecaller' }).select('_id') } },
      { assigned_to: null }
    ],
    status: { $nin: ['Converted', 'Rejected'] }
  }, options)
  
  res.status(200).json({
    success: true,
    data: enquiries.docs,
    pagination: {
      page: enquiries.page,
      limit: enquiries.limit,
      totalDocs: enquiries.totalDocs,
      totalPages: enquiries.totalPages,
      hasNextPage: enquiries.hasNextPage,
      hasPrevPage: enquiries.hasPrevPage
    }
  })
})

// Get telecaller dashboard
exports.getTelecallerDashboard = asyncHandler(async (req, res) => {
  // Dummy data for now, implement as needed
  res.status(200).json({
    success: true,
    data: {
      message: 'Telecaller dashboard data here.'
    }
  })
});

// @desc    Create new enquiry
// @route   POST /api/v1/enquiries
// @access  Private
exports.createEnquiry = asyncHandler(async (req, res, next) => {
  req.body.created_by = req.user.id;
  const errors = validateEnquiryFields(req.body);
  if (errors.length) {
    return next(new ErrorResponse(errors.join(', '), 400));
  }

  // Check for duplicate enquiry (same mobile number in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const existingEnquiry = await Enquiry.findOne({
    mobile: req.body.mobile,
    created_at: { $gte: sevenDaysAgo }
  });

  if (existingEnquiry) {
    // Mark as duplicate and reference the original
    req.body.is_duplicate = true;
    req.body.duplicate_of = existingEnquiry._id;
    req.body.status = 'Duplicate';
    req.body.stage = 'Validation';
  }

  // Set default status and stage if not provided
  if (!req.body.status) {
    req.body.status = req.body.enquiry_profile === 'Unknown' ? 'Unknown' : 'New';
  }

  if (!req.body.stage) {
    req.body.stage = req.body.enquiry_profile === 'Unknown' ? 'Telecaller Queue' : 'Captured';
  }

  // Set default values for missing fields
  if (!req.body.priority) {
    req.body.priority = 'MEDIUM';
  }

  if (!req.body.enquiry_profile) {
    req.body.enquiry_profile = 'Unknown';
  }

  if (!req.body.channel_type) {
    req.body.channel_type = 'Manual';
  }

  // Get SLA configuration for calculating response and resolution due dates
  const slaConfig = {
    responseTimes: {
      high: 2,
      medium: 4,
      low: 8
    },
    resolutionTimes: {
      high: 24,
      medium: 48,
      low: 72
    }
  };
  
  // Calculate response_due and resolution_due based on priority
  const createdAt = new Date();
  const priority = req.body.priority.toLowerCase();
  
  // Set response_due and resolution_due using the SLA configuration
  const responseHours = slaConfig.responseTimes[priority] || slaConfig.responseTimes.medium;
  const resolutionHours = slaConfig.resolutionTimes[priority] || slaConfig.resolutionTimes.medium;
  
  req.body.response_due = new Date(createdAt.getTime() + responseHours * 60 * 60 * 1000);
  req.body.resolution_due = new Date(createdAt.getTime() + resolutionHours * 60 * 60 * 1000);
  
  // Create enquiry
  const enquiry = await Enquiry.create(req.body);

  // Auto-assign if profile is identified and not duplicate
  if (enquiry.enquiry_profile !== 'Unknown' && !enquiry.is_duplicate) {
    await autoAssignEnquiry(enquiry);
  }

  res.status(201).json({
    success: true,
    data: enquiry
  });
});

// @desc    Update enquiry
// @route   PUT /api/v1/enquiries/:id
// @access  Private
exports.updateEnquiry = asyncHandler(async (req, res, next) => {
  let enquiry = await Enquiry.findById(req.params.id);

  if (!enquiry) {
    return next(
      new ErrorResponse(`Enquiry not found with id of ${req.params.id}`, 404)
    );
  }

  const errors = validateEnquiryFields({ ...enquiry.toObject(), ...req.body });
  if (errors.length) {
    return next(new ErrorResponse(errors.join(', '), 400));
  }

  // Validate type_of_lead
  if (!req.body.type_of_lead || !['B2B', 'B2C'].includes(req.body.type_of_lead)) {
    return next(new ErrorResponse('Type of Lead (B2B/B2C) is required and must be either B2B or B2C', 400));
  }

  // Check if status is changing
  const statusChanged = req.body.status && req.body.status !== enquiry.status;
  const oldStatus = enquiry.status;
  const newStatus = req.body.status;

  // Check if profile is changing from Unknown to something else
  const profileChanged = 
    req.body.enquiry_profile && 
    enquiry.enquiry_profile === 'Unknown' && 
    req.body.enquiry_profile !== 'Unknown';
    
  // Check if priority is changing
  const priorityChanged = req.body.priority && req.body.priority !== enquiry.priority;
  
  // If priority is changing, recalculate SLA due dates
  if (priorityChanged) {
    // Get SLA configuration
    const slaConfig = {
      responseTimes: {
        high: 2,
        medium: 4,
        low: 8
      },
      resolutionTimes: {
        high: 24,
        medium: 48,
        low: 72
      }
    };
    
    const priority = req.body.priority.toLowerCase();
    const createdAt = enquiry.created_at;
    
    // Set response_due and resolution_due using the SLA configuration
    const responseHours = slaConfig.responseTimes[priority] || slaConfig.responseTimes.medium;
    const resolutionHours = slaConfig.resolutionTimes[priority] || slaConfig.resolutionTimes.medium;
    
    req.body.response_due = new Date(createdAt.getTime() + responseHours * 60 * 60 * 1000);
    req.body.resolution_due = new Date(createdAt.getTime() + resolutionHours * 60 * 60 * 1000);
  }
    req.body.enquiry_profile !== 'Unknown';

  // Update enquiry
  enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // If profile changed from Unknown to identified, update status and stage
  if (profileChanged) {
    enquiry.status = 'New';
    enquiry.stage = 'Profile Identified';
    await enquiry.save();

    // Auto-assign if profile is now identified
    await autoAssignEnquiry(enquiry);
  }

  // Handle status change automations
  if (statusChanged) {
    await handleStatusChange(enquiry, oldStatus, newStatus, req.user.id);
  }

  res.status(200).json({
    success: true,
    data: enquiry
  });
});

// @desc    Delete enquiry
// @route   DELETE /api/v1/enquiries/:id
// @access  Private/Admin
exports.deleteEnquiry = asyncHandler(async (req, res, next) => {
  const enquiry = await Enquiry.findById(req.params.id);

  if (!enquiry) {
    return next(
      new ErrorResponse(`Enquiry not found with id of ${req.params.id}`, 404)
    );
  }

  await enquiry.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add remark to enquiry
// @route   POST /api/v1/enquiries/:id/remarks
// @access  Private
exports.addRemark = asyncHandler(async (req, res, next) => {
  const { text } = req.body;

  if (!text) {
    return next(new ErrorResponse('Please add a remark text', 400));
  }

  // Try to find by enquiry_id first (for ENQXXXX format)
  let enquiry = await Enquiry.findOne({ enquiry_id: req.params.id });
  
  // If not found, try to find by MongoDB _id
  if (!enquiry) {
    try {
      enquiry = await Enquiry.findById(req.params.id);
    } catch (err) {
      // Ignore CastError - we'll handle the not found case below
    }
  }

  if (!enquiry) {
    return next(
      new ErrorResponse(`Enquiry not found with id of ${req.params.id}`, 404)
    );
  }

  // Add remark
  enquiry.remarks.push({
    user_id: req.user.id,
    text
  });

  await enquiry.save();

  res.status(200).json({
    success: true,
    data: enquiry.remarks[enquiry.remarks.length - 1]
  });
});

// @desc    Assign enquiry to user
// @route   PUT /api/v1/enquiries/:id/assign
// @access  Private
exports.assignEnquiry = asyncHandler(async (req, res, next) => {
  const { assigned_to, assigned_team } = req.body;

  if (!assigned_to) {
    return next(new ErrorResponse('Please provide a user to assign to', 400));
  }

  // Check if user exists
  const user = await User.findById(assigned_to);
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${assigned_to}`, 404));
  }

  let enquiry = await Enquiry.findById(req.params.id);

  if (!enquiry) {
    return next(
      new ErrorResponse(`Enquiry not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous assignment for logging
  const previousAssignedTo = enquiry.assigned_to;

  // Update assignment
  enquiry.assigned_to = assigned_to;
  if (assigned_team) {
    enquiry.assigned_team = assigned_team;
  } else if (user.team) {
    enquiry.assigned_team = user.team;
  }

  // Update stage if not already assigned
  if (enquiry.stage === 'Assignment Pending') {
    enquiry.stage = 'Assigned';
  }

  await enquiry.save();

  // Create assignment log
  const AssignmentLog = require('../../models/enquiry/AssignmentLog');
  await AssignmentLog.create({
    enquiry_id: enquiry._id,
    assignment_type: req.body.assignment_type || 'manual_assignment',
    assignment_method: req.body.assignment_method || 'manual',
    new_assignee: {
      user_id: assigned_to
    },
    old_assignee: {
      user_id: previousAssignedTo
    },
    assigned_by: req.user.id,
    assignment_reason: req.body.assignment_reason || 'manual_override',
    remarks: req.body.remarks || 'Manual assignment by user',
    metadata: {
      user_agent: req.get('User-Agent'),
      ip_address: req.ip,
      assigned_user_team: user.team
    },
    ip_address: req.ip,
    user_agent: req.get('User-Agent')
  });

  res.status(200).json({
    success: true,
    data: enquiry
  });
});

// @desc    Update enquiry priority
// @route   PUT /api/v1/enquiries/:id/priority
// @access  Private
exports.updatePriority = asyncHandler(async (req, res, next) => {
  const { priority } = req.body;

  if (!priority || !['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
    return next(new ErrorResponse('Please provide a valid priority', 400));
  }

  let enquiry = await Enquiry.findById(req.params.id);

  if (!enquiry) {
    return next(
      new ErrorResponse(`Enquiry not found with id of ${req.params.id}`, 404)
    );
  }

  // Update priority
  enquiry.priority = priority;
  await enquiry.save();

  res.status(200).json({
    success: true,
    data: enquiry
  });
});

// @desc    Get enquiry call history
// @route   GET /api/v1/enquiries/:id/calls
// @access  Private
exports.getEnquiryCalls = asyncHandler(async (req, res, next) => {
  const enquiry = await Enquiry.findById(req.params.id);

  if (!enquiry) {
    return next(
      new ErrorResponse(`Enquiry not found with id of ${req.params.id}`, 404)
    );
  }

  // const calls = await Call.find({ enquiry_id: req.params.id })
  //   .populate('caller_id', 'first_name last_name')
  //   .sort({ created_at: -1 });

  res.status(200).json({
    success: true,
    count: 0, // calls.length,
    data: [] // calls
  });
});

// @desc    Log a call for enquiry
// @route   POST /api/v1/enquiries/:id/calls
// @access  Private
exports.logCall = asyncHandler(async (req, res, next) => {
  req.body.enquiry_id = req.params.id;
  req.body.caller_id = req.user.id;

  const enquiry = await Enquiry.findById(req.params.id);

  if (!enquiry) {
    return next(
      new ErrorResponse(`Enquiry not found with id of ${req.params.id}`, 404)
    );
  }

  // Create call log
  // const call = await Call.create(req.body); // Commented out - Call model not found

  // Update enquiry with call status and last called time
  enquiry.call_status = req.body.call_status;
  enquiry.last_called_at = Date.now();
  
  // Set next follow up if provided
  if (req.body.next_follow_up) {
    enquiry.next_follow_up = req.body.next_follow_up;
  }

  await enquiry.save();

  res.status(201).json({
    success: true,
    data: call
  });
});

// Start a call (telecaller)
exports.startCall = asyncHandler(async (req, res) => {
  const { enquiry_id } = req.body;
  const call = await require('../../models/enquiry/Call').create({
    enquiry_id,
    caller_id: req.user.id,
    start_time: new Date(),
    status: 'active'
  });
  res.status(201).json({ success: true, data: call });
});

// End a call (telecaller)
exports.endCall = asyncHandler(async (req, res) => {
  const { call_id } = req.body;
  // const Call = require('../../models/enquiry/Call'); // Commented out - Call model not found
  // const call = await Call.findById(call_id);
  // if (!call) return res.status(404).json({ success: false, message: 'Call not found' });
  // call.end_time = new Date();
  // call.status = 'completed';
  // call.duration_seconds = Math.floor((call.end_time - call.start_time) / 1000);
  // await call.save();
  res.status(200).json({ success: true, data: null }); // call
});

// Get call history for an enquiry
exports.getEnquiryCalls = asyncHandler(async (req, res) => {
  // const Call = require('../../models/enquiry/Call'); // Commented out - Call model not found
  // const calls = await Call.find({ enquiry_id: req.params.id }).sort({ start_time: -1 });
  res.status(200).json({ success: true, data: [] }); // calls
});

// @desc    Get SLA configuration
// @route   GET /api/enquiries/sla/config
// @access  Private
exports.getSLAConfiguration = asyncHandler(async (req, res, next) => {
  // Default SLA configuration
  const slaConfig = {
    responseTimes: {
      high: 2,
      medium: 4,
      low: 8
    },
    resolutionTimes: {
      high: 24,
      medium: 48,
      low: 72
    },
    warningThreshold: 0.25 // 25% of time remaining
  };

  res.status(200).json({
    success: true,
    data: slaConfig
  });
});

// @desc    Update SLA configuration
// @route   PUT /api/enquiries/sla/config
// @access  Private (Admin, Manager)
exports.updateSLAConfiguration = asyncHandler(async (req, res, next) => {
  const { responseTimes, resolutionTimes, warningThreshold } = req.body;

  // Validate input
  if (!responseTimes || !resolutionTimes) {
    return next(new ErrorResponse('Please provide response and resolution times', 400));
  }

  // Validate that response and resolution times are provided for all priority levels
  const priorities = ['high', 'medium', 'low'];
  for (const priority of priorities) {
    if (!responseTimes[priority] || !resolutionTimes[priority]) {
      return next(new ErrorResponse(`Please provide response and resolution times for ${priority} priority`, 400));
    }
  }

  // Create the updated configuration object
  const updatedConfig = {
    responseTimes,
    resolutionTimes,
    warningThreshold: warningThreshold || 0.25
  };

  // Store the configuration in memory for now
  // In a production environment, this would be stored in a database
  global.slaConfig = updatedConfig;

  // Log the updated configuration
  console.log('Updated SLA Configuration:', updatedConfig);

  res.status(200).json({
    success: true,
    message: 'SLA configuration updated successfully',
    data: updatedConfig
  });
});

// @desc    Get SLA notification settings
// @route   GET /api/enquiries/sla/notifications
// @access  Private
exports.getSLANotificationSettings = asyncHandler(async (req, res, next) => {
  // Default notification settings
  const notificationSettings = {
    enableEmailNotifications: true,
    enableSmsNotifications: false,
    notifyOnBreach: true,
    notifyOnWarning: true,
    notifyAssignedUser: true,
    notifyManager: true,
    reminderInterval: 60 // minutes
  };

  res.status(200).json({
    success: true,
    data: notificationSettings
  });
});

// @desc    Update SLA notification settings
// @route   PUT /api/enquiries/sla/notifications
// @access  Private (Admin, Manager)
exports.updateSLANotificationSettings = asyncHandler(async (req, res, next) => {
  const { 
    enableEmailNotifications,
    enableSmsNotifications,
    notifyOnBreach,
    notifyOnWarning,
    notifyAssignedUser,
    notifyManager,
    reminderInterval
  } = req.body;

  // In a real implementation, you would save this to a database
  // For now, we'll just return the updated settings
  const updatedSettings = {
    enableEmailNotifications: enableEmailNotifications !== undefined ? enableEmailNotifications : true,
    enableSmsNotifications: enableSmsNotifications !== undefined ? enableSmsNotifications : false,
    notifyOnBreach: notifyOnBreach !== undefined ? notifyOnBreach : true,
    notifyOnWarning: notifyOnWarning !== undefined ? notifyOnWarning : true,
    notifyAssignedUser: notifyAssignedUser !== undefined ? notifyAssignedUser : true,
    notifyManager: notifyManager !== undefined ? notifyManager : true,
    reminderInterval: reminderInterval || 60
  };

  res.status(200).json({
    success: true,
    data: updatedSettings
  });
});

// @desc    Bulk import enquiries
// @route   POST /api/v1/enquiries/import
// @access  Private/Admin
exports.importEnquiries = asyncHandler(async (req, res, next) => {
  if (!req.files || !req.files.file) {
    return next(new ErrorResponse('No file uploaded', 400));
  }
  const file = req.files.file;
  let workbook;
  try {
    workbook = XLSX.read(file.data, { type: 'buffer' });
  } catch (err) {
    return next(new ErrorResponse('Invalid file format. Please upload a valid Excel file.', 400));
  }
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!rows.length) {
    return next(new ErrorResponse('No data found in the uploaded file', 400));
  }
  const errors = [];
  const validEnquiries = [];
  rows.forEach((row, idx) => {
    const rowErrors = validateEnquiryFields(row);
    if (rowErrors.length) {
      errors.push({ row: idx + 2, errors: rowErrors }); // +2 for header + 1-indexed
    } else {
      validEnquiries.push(row);
    }
  });
  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors in uploaded file',
      errors
    });
  }
  // Insert all valid enquiries atomically
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const inserted = await Enquiry.insertMany(validEnquiries, { session });
    await session.commitTransaction();
    session.endSession();
    res.status(201).json({
      success: true,
      message: `${inserted.length} enquiries imported successfully`,
      data: inserted
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new ErrorResponse('Bulk import failed: ' + err.message, 500));
  }
});

// @desc    Check for duplicate enquiry
// @route   POST /api/v1/enquiries/check-duplicate
// @access  Private
exports.checkDuplicate = asyncHandler(async (req, res, next) => {
  const { mobile, email } = req.body;

  if (!mobile && !email) {
    return next(new ErrorResponse('Please provide mobile or email to check for duplicates', 400));
  }

  // Check for duplicates in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const query = {
    created_at: { $gte: sevenDaysAgo }
  };

  if (mobile) {
    query.mobile = mobile;
  }

  if (email) {
    query.email = email;
  }

  const existingEnquiry = await Enquiry.findOne(query);

  res.status(200).json({
    success: true,
    isDuplicate: !!existingEnquiry,
    data: existingEnquiry
  });
});

// Get unique filter options for enquiries (with assigned user names, status sorted, 'Unknown' last)
exports.getEnquiryFilters = asyncHandler(async (req, res) => {
  let statuses = await Enquiry.distinct('status');
  statuses = statuses.filter(s => s && s !== 'Unknown').sort((a, b) => a.localeCompare(b));
  if (await Enquiry.countDocuments({ status: 'Unknown' })) {
    statuses.push('Unknown');
  }
  const sources = await Enquiry.distinct('source_type');
  const priorities = await Enquiry.distinct('priority');
  const assignedUserIds = (await Enquiry.distinct('assigned_to')).filter(Boolean);
  const users = await User.find({ _id: { $in: assignedUserIds } }, 'first_name last_name');
  res.status(200).json({
    success: true,
    data: {
      statuses,
      sources,
      priorities,
      users: users.map(u => ({ _id: u._id, first_name: u.first_name, last_name: u.last_name }))
    }
  });
});


// Bulk update status
exports.bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { ids, status } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of enquiry IDs'
    });
  }
  
  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a status'
    });
  }
  
  const result = await Enquiry.updateMany(
    { _id: { $in: ids } },
    { $set: { status } }
  );
  
  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} enquiries updated successfully`,
    data: {
      modifiedCount: result.modifiedCount
    }
  });
});

    // Bulk assign enquiries
exports.bulkAssignEnquiries = asyncHandler(async (req, res) => {
  const { ids, assigned_to } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of enquiry IDs'
    });
  }
  
  if (!assigned_to) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a user ID to assign to'
    });
  }
  
  // Check if user exists
  const user = await User.findById(assigned_to);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User not found with id of ${assigned_to}`
    });
  }
  
  const result = await Enquiry.updateMany(
    { _id: { $in: ids } },
    { 
      $set: { 
        assigned_to,
        stage: 'Assigned' // Update stage if not already assigned
      } 
    }
  );
  
  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} enquiries assigned successfully`,
    data: {
      modifiedCount: result.modifiedCount
    }
  });
});


// Helper function to auto-assign enquiry based on rules
const autoAssignEnquiry = async (enquiry) => {
  try {
    // Find applicable assignment rules
    const rules = await AssignmentRule.find({ is_active: true })
      .sort({ priority: -1 }); // Highest priority first
      
    // Find matching rule
    let matchedRule = null;
    for (const rule of rules) {
      // Check if all conditions match
      const allConditionsMatch = rule.conditions.every(condition => {
        const enquiryValue = enquiry[condition.field];
        
        switch (condition.operator) {
          case 'equals':
            return enquiryValue === condition.value;
          case 'not_equals':
            return enquiryValue !== condition.value;
          case 'contains':
            return enquiryValue && enquiryValue.includes(condition.value);
          case 'not_contains':
            return !enquiryValue || !enquiryValue.includes(condition.value);
          case 'greater_than':
            return enquiryValue > condition.value;
          case 'less_than':
            return enquiryValue < condition.value;
          case 'in':
            return Array.isArray(condition.value) && condition.value.includes(enquiryValue);
          case 'not_in':
            return !Array.isArray(condition.value) || !condition.value.includes(enquiryValue);
          default:
            return false;
        }
      });

      if (allConditionsMatch) {
        matchedRule = rule;
        break;
      }
    }

    if (!matchedRule) {
      // No matching rule, set to Assignment Pending
      enquiry.stage = 'Assignment Pending';
      await enquiry.save();
      return;
    }

    // Apply the rule based on rule_type
    switch (matchedRule.rule_type) {
      case 'round-robin':
        await applyRoundRobinAssignment(enquiry, matchedRule);
        break;
      case 'load-based':
        await applyLoadBasedAssignment(enquiry, matchedRule);
        break;
      case 'manual':
        // Set to Assignment Pending for manual assignment
        enquiry.stage = 'Assignment Pending';
        await enquiry.save();
        break;
      case 'fallback':
        // Assign to fallback user
        if (matchedRule.fallback_user_id) {
          enquiry.assigned_to = matchedRule.fallback_user_id;
          enquiry.stage = 'Assigned';
          await enquiry.save();
        }
        break;
    }
  } catch (err) {
    console.error('Error in auto-assignment:', err);
    // Set to Assignment Pending on error
    enquiry.stage = 'Assignment Pending';
    await enquiry.save();
  }
};

// Helper function for round-robin assignment
const applyRoundRobinAssignment = async (enquiry, rule) => {
  // Get users from rule
  const users = rule.assignment_to;
  
  if (!users || users.length === 0) {
    enquiry.stage = 'Assignment Pending';
    await enquiry.save();
    return;
  }

  // Get the last assigned user index from the rule (could be stored in a separate collection)
  // For simplicity, we'll just pick a random user here
  const randomIndex = Math.floor(Math.random() * users.length);
  const selectedUser = users[randomIndex];

  // Assign to the selected user
  enquiry.assigned_to = selectedUser.user_id;
  enquiry.stage = 'Assigned';
  await enquiry.save();
};

// Helper function for load-based assignment
const applyLoadBasedAssignment = async (enquiry, rule) => {
  // Get users from rule
  const users = rule.assignment_to;
  
  if (!users || users.length === 0) {
    enquiry.stage = 'Assignment Pending';
    await enquiry.save();
    return;
  }

  // Get current load for each user
  const userLoads = [];
  for (const user of users) {
    const count = await Enquiry.countDocuments({
      assigned_to: user.user_id,
      status: { $in: ['New', 'In Progress'] }
    });

    userLoads.push({
      user_id: user.user_id,
      count,
      weight: user.weight || 1,
      max_daily_assignments: user.max_daily_assignments || 0
    });
  }

  // Calculate weighted load and find user with lowest load
  let lowestLoadUser = null;
  let lowestWeightedLoad = Infinity;

  for (const userLoad of userLoads) {
    // Skip if user has reached max daily assignments
    if (userLoad.max_daily_assignments > 0) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todayAssignments = await Enquiry.countDocuments({
        assigned_to: userLoad.user_id,
        created_at: { $gte: todayStart }
      });

      if (todayAssignments >= userLoad.max_daily_assignments) {
        continue;
      }
    }

    const weightedLoad = userLoad.count / userLoad.weight;
    if (weightedLoad < lowestWeightedLoad) {
      lowestWeightedLoad = weightedLoad;
      lowestLoadUser = userLoad.user_id;
    }
  }

  if (lowestLoadUser) {
    // Assign to the user with lowest weighted load
    enquiry.assigned_to = lowestLoadUser;
    enquiry.stage = 'Assigned';
    await enquiry.save();
  } else {
    // No eligible user found
    enquiry.stage = 'Assignment Pending';
    await enquiry.save();
  }
};

// @desc    Update enquiry status
// @route   PUT /api/v1/enquiries/:id/status
// @access  Private
exports.updateStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return next(new ErrorResponse('Please provide a status', 400));
  }

  let enquiry = await Enquiry.findById(req.params.id);

  if (!enquiry) {
    return next(
      new ErrorResponse(`Enquiry not found with id of ${req.params.id}`, 404)
    );
  }

  const oldStatus = enquiry.status;
  
  // Update status
  enquiry.status = status;
  
  // Handle status change automations
  await handleStatusChange(enquiry, oldStatus, status, req.user.id);

  res.status(200).json({
    success: true,
    data: enquiry
  });
});

// Helper function to handle status change automations
const handleStatusChange = async (enquiry, oldStatus, newStatus, userId) => {
  // Update stage based on status change
  switch (newStatus) {
    case 'New':
      enquiry.stage = 'Captured';
      break;
    case 'Unknown':
      enquiry.stage = 'Telecaller Queue';
      break;
    case 'In Progress':
      enquiry.stage = 'Action in Progress';
      break;
    case 'Quoted':
      enquiry.stage = 'Quoted';
      break;
    case 'Converted':
      enquiry.stage = 'Closed - Converted';
      enquiry.closed_at = Date.now();
      break;
    case 'Rejected':
      enquiry.stage = 'Closed - Rejected';
      enquiry.closed_at = Date.now();
      break;
    case 'Archived':
      enquiry.stage = 'Archived';
      break;
  }

  // Add a remark about the status change
  enquiry.remarks.push({
    user_id: userId,
    text: `Status changed from ${oldStatus} to ${newStatus}`
  });

  await enquiry.save();

  // Additional automations based on status change could be added here
  // For example, sending notifications, creating tasks, etc.
};

// @desc    Get dynamic enquiry form config
// @route   GET /api/v1/enquiries/form-config
// @access  Private
exports.getEnquiryFormConfig = asyncHandler(async (req, res, next) => {
  // This config should match the Enquiry model and business logic
  const config = [
    // Basic Information Section
    { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter full name' },
    { name: 'mobile', label: 'Mobile Number', type: 'text', required: true, pattern: '^\\d{10}$', placeholder: 'Enter 10 digit mobile number' },
    { name: 'email', label: 'Email Address', type: 'email', required: false, placeholder: 'Enter email address' },
    
    // Lead Type Section
    { name: 'type_of_lead', label: 'Type of Lead', type: 'select', required: true, options: ['B2B', 'B2C'], optionLabels: ['Business to Business', 'Business to Consumer'] },
    
    // B2B Specific Fields
    { name: 'business_model', label: 'Business Model', type: 'select', required: false, options: ['Capex', 'Opex'], optionLabels: ['Capital Expenditure', 'Operational Expenditure'], showIf: { type_of_lead: 'B2B' } },
    { name: 'company_name', label: 'Company Name', type: 'text', required: false, placeholder: 'Enter company name', showIf: { type_of_lead: 'B2B' } },
    
    // B2C Specific Fields
    { name: 'pv_capacity_kw', label: 'PV Capacity (kW)', type: 'number', required: false, placeholder: 'Enter capacity in kW', showIf: { type_of_lead: 'B2C' } },
    { name: 'category', label: 'Category', type: 'select', required: false, options: ['Residential', 'Industrial', 'Commercial', 'Government'], showIf: { type_of_lead: 'B2C' } },
    
    // Project Details
    { name: 'project_type', label: 'Project Type', type: 'text', required: false, placeholder: 'Enter project type' },
    { name: 'project_location', label: 'Project Location', type: 'text', required: false, placeholder: 'Enter project location' },
    { name: 'connection_type', label: 'Connection Type', type: 'select', required: false, options: ['Yes', 'No'], optionLabels: ['Has Connection', 'No Connection'] },
    { name: 'project_enhancement', label: 'Project Enhancement', type: 'select', required: false, options: ['Yes', 'No'], optionLabels: ['Enhancement Required', 'No Enhancement'] },
    { name: 'subsidy_type', label: 'Subsidy Type', type: 'select', required: false, options: ['Subsidy', 'Non Subsidy'] },
    { name: 'metering', label: 'Metering Type', type: 'select', required: false, options: ['Net Metering', 'Open Access', 'Gross Metering'] },
    
    // Location Information
    { name: 'pincode', label: 'Pincode', type: 'text', required: false, placeholder: 'Enter pincode' },
    { name: 'state', label: 'State', type: 'text', required: false, placeholder: 'Enter state' },
    { name: 'district', label: 'District', type: 'text', required: false, placeholder: 'Enter district' },
    { name: 'branch', label: 'Branch', type: 'text', required: false, placeholder: 'Enter branch' },
    
    // Lead Information
    { name: 'source_type', label: 'Source Type', type: 'select', required: true, options: ['Website', 'WhatsApp', 'Meta Ads', 'JustDial', 'IndiaMART', 'Walk-in', 'Referral', 'Cold Call', 'Other'] },
    { name: 'channel_type', label: 'Channel Type', type: 'select', required: false, options: ['Online', 'Offline', 'API', 'Manual', 'Bulk Upload'] },
    { name: 'enquiry_profile', label: 'Enquiry Profile', type: 'select', required: false, options: ['Project', 'Product', 'AMC/Service', 'Complaint', 'Job', 'Info Request', 'Installation', 'Unknown'], optionLabels: ['Project', 'Product', 'AMC/Service', 'Complaint', 'Job', 'Info Request', 'Installation', 'Unknown'] },
    { name: 'source_of_lead', label: 'Source of Lead', type: 'text', required: false, placeholder: 'Enter source of lead' },
    { name: 'source_of_reference', label: 'Source of Reference', type: 'text', required: false, placeholder: 'Enter reference source' },
    
    // Priority and Status
    { name: 'priority', label: 'Priority', type: 'select', required: false, options: ['HIGH', 'MEDIUM', 'LOW'], optionLabels: ['High', 'Medium', 'Low'] },
    { name: 'status_of_lead', label: 'Status of Lead', type: 'text', required: false, placeholder: 'Enter lead status' },
    
    // Loan Requirements
    { name: 'need_loan', label: 'Do you need a loan?', type: 'select', required: false, options: [true, false], optionLabels: ['Yes', 'No'] },
    
    // Loan Documents (conditional)
    { name: 'aadhaar_file', label: 'Aadhaar File', type: 'file', required: false, showIf: { need_loan: true } },
    { name: 'electricity_bill_file', label: 'Electricity Bill File', type: 'file', required: false, showIf: { need_loan: true } },
    { name: 'bank_statement_file', label: 'Bank Statement File', type: 'file', required: false, showIf: { need_loan: true } },
    { name: 'pan_file', label: 'PAN File', type: 'file', required: false, showIf: { need_loan: true } },
    { name: 'project_proposal_file', label: 'Project Proposal File', type: 'file', required: false, showIf: { need_loan: true } },
    
    // Additional Information
    { name: 'add_remarks', label: 'Additional Remarks', type: 'textarea', required: false, placeholder: 'Enter any additional remarks or notes' }
  ];
  
  res.status(200).json({ success: true, data: config });
});

// @desc    Export enquiry template
// @route   GET /api/v1/enquiries/export-template
// @access  Private
exports.exportTemplate = asyncHandler(async (req, res, next) => {
  // Create CSV template with all required fields
  const templateHeaders = [
    'name',
    'mobile', 
    'email',
    'type_of_lead',
    'business_model',
    'company_name',
    'pv_capacity_kw',
    'category',
    'project_type',
    'project_location',
    'connection_type',
    'project_enhancement',
    'subsidy_type',
    'metering',
    'pincode',
    'state',
    'district',
    'branch',
    'source_type',
    'channel_type',
    'enquiry_profile',
    'source_of_lead',
    'source_of_reference',
    'priority',
    'status_of_lead',
    'need_loan',
    'add_remarks'
  ]
  
  const templateRow = templateHeaders.map(header => {
    switch(header) {
      case 'type_of_lead':
        return 'B2C'
      case 'business_model':
        return 'Capex'
      case 'category':
        return 'Residential'
      case 'connection_type':
        return 'Yes'
      case 'project_enhancement':
        return 'No'
      case 'subsidy_type':
        return 'Non Subsidy'
      case 'metering':
        return 'Net Metering'
      case 'source_type':
        return 'Website'
      case 'channel_type':
        return 'Manual'
      case 'enquiry_profile':
        return 'Project'
      case 'priority':
        return 'MEDIUM'
      case 'need_loan':
        return 'false'
      default:
        return ''
    }
  })
  
  const csvContent = [templateHeaders.join(','), templateRow.join(',')].join('\n')
  
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=enquiry-template.csv')
  res.send(csvContent)
})

// @desc    Get enquiry history
// @route   GET /api/v1/enquiries/history
// @access  Private
exports.getEnquiryHistory = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1
  const limit = parseInt(req.query.limit, 10) || 10
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const total = await Enquiry.countDocuments()

  let query = {}
  
  // Add filters if provided
  if (req.query.status) {
    query.status = req.query.status
  }
  if (req.query.source_type) {
    query.source_type = req.query.source_type
  }
  if (req.query.type_of_lead) {
    query.type_of_lead = req.query.type_of_lead
  }
  if (req.query.assigned_to) {
    query.assigned_to = req.query.assigned_to
  }
  if (req.query.date_from && req.query.date_to) {
    query.created_at = {
      $gte: new Date(req.query.date_from),
      $lte: new Date(req.query.date_to)
    }
  }

  const enquiries = await Enquiry.find(query)
    .populate('assigned_to', 'first_name last_name email')
    .sort({ created_at: -1 })
    .limit(limit)
    .skip(startIndex)

  // Pagination result
  const pagination = {}

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    }
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    }
  }

  res.status(200).json({
    success: true,
    count: enquiries.length,
    pagination,
    total,
    data: enquiries
  })
})

// @desc    Export enquiries to CSV
// @route   GET /api/v1/enquiries/export
// @access  Private
exports.exportEnquiries = asyncHandler(async (req, res, next) => {
  let query = {}
  
  // Add filters if provided
  if (req.query.status) {
    query.status = req.query.status
  }
  if (req.query.source_type) {
    query.source_type = req.query.source_type
  }
  if (req.query.type_of_lead) {
    query.type_of_lead = req.query.type_of_lead
  }
  if (req.query.assigned_to) {
    query.assigned_to = req.query.assigned_to
  }
  if (req.query.date_from && req.query.date_to) {
    query.created_at = {
      $gte: new Date(req.query.date_from),
      $lte: new Date(req.query.date_to)
    }
  }

  const enquiries = await Enquiry.find(query)
    .populate('assigned_to', 'first_name last_name email')
    .sort({ created_at: -1 })

  // Convert to CSV
  const headers = [
    'Enquiry ID',
    'Name',
    'Mobile',
    'Email',
    'Type of Lead',
    'Source Type',
    'Status',
    'Stage',
    'Priority',
    'Assigned To',
    'Created At',
    'Project Type',
    'Category',
    'Location',
    'Remarks'
  ]

  const csvRows = enquiries.map(enquiry => [
    enquiry.enquiry_id,
    enquiry.name,
    enquiry.mobile,
    enquiry.email,
    enquiry.type_of_lead,
    enquiry.source_type,
    enquiry.status,
    enquiry.stage,
    enquiry.priority,
    enquiry.assigned_to ? `${enquiry.assigned_to.first_name} ${enquiry.assigned_to.last_name}` : '',
    new Date(enquiry.created_at).toLocaleDateString(),
    enquiry.project_type,
    enquiry.category,
    enquiry.project_location,
    enquiry.add_remarks
  ])

  const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n')
  
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=enquiries-export.csv')
  res.send(csvContent)
})

