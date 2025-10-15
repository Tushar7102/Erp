const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const AssignmentLog = require('../../models/enquiry/AssignmentLog');
const Enquiry = require('../../models/enquiry/Enquiry');
const User = require('../../models/profile/User');

// @desc    Get all assignment logs
// @route   GET /api/v1/assignment-logs
// @access  Private
exports.getAssignmentLogs = asyncHandler(async (req, res, next) => {
  const { enquiry_id, assigned_to, assigned_by, assignment_type, page = 1, limit = 10 } = req.query;

  let filter = {};
  
  if (enquiry_id) filter.enquiry_id = enquiry_id;
  if (assigned_to) filter.assigned_to = assigned_to;
  if (assigned_by) filter.assigned_by = assigned_by;
  if (assignment_type) filter.assignment_type = assignment_type;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { created_at: -1 },
    lean: false, // Ensure we get Mongoose documents, not plain objects
    populate: [
      { 
        path: 'enquiry_id', 
        select: '_id enquiry_id name mobile customer_details status',
        model: 'Enquiry'
      },
      { 
        path: 'new_assignee.user_id', 
        select: '_id first_name last_name name email team profile_image role',
        model: 'User'
      },
      { 
        path: 'old_assignee.user_id', 
        select: '_id first_name last_name name email team profile_image role',
        model: 'User'
      },
      { 
        path: 'assigned_by', 
        select: '_id first_name last_name name email profile_image role',
        model: 'User'
      }
    ]
  };

  const assignmentLogs = await AssignmentLog.paginate(filter, options);

  // Format the response to match what the frontend expects
  const formattedLogs = {
    ...assignmentLogs,
    docs: assignmentLogs.docs.map(log => {
      // Use toObject with proper options to preserve all objects
      const logObj = log.toObject ? log.toObject({ virtuals: true, getters: true }) : log;
      
      // Format user names by concatenating first_name and last_name
      const formatUserName = (user) => {
        if (!user) return '';
        if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
        if (user.name) return user.name;
        return user._id ? user._id.toString().substring(0, 8) + '...' : '';
      };
      
      // Get user display info
      const getUserDisplayInfo = (user) => {
        if (!user) return { name: '', email: '', id: '' };
        return {
          name: formatUserName(user),
          email: user.email || '',
          id: user._id || '',
          role: user.role || '',
          profile_image: user.profile_image || '',
          team: user.team || ''
        };
      };
      
      // Get enquiry object and info
      const enquiryObj = logObj.enquiry_id || {};
      const customerName = enquiryObj.name || 'Unknown';
      
      // Get user objects and display info
      const prevAssigneeObj = logObj.old_assignee?.user_id || null;
      const prevAssigneeInfo = getUserDisplayInfo(prevAssigneeObj);
      
      const newAssigneeObj = logObj.new_assignee?.user_id || null;
      const newAssigneeInfo = getUserDisplayInfo(newAssigneeObj);
      
      const assignedByObj = logObj.assigned_by || null;
      const assignedByInfo = getUserDisplayInfo(assignedByObj);
      
      return {
        ...logObj,
        id: logObj._id,
        // Preserve all MongoDB objects
        enquiry_id: enquiryObj,
        enquiry_id_str: enquiryObj._id ? enquiryObj._id.toString() : '',
        customer_name: customerName,
        
        // Previous assignee data
        previous_assignee_obj: prevAssigneeObj,
        previous_assignee: prevAssigneeInfo.name,
        previous_assignee_email: prevAssigneeInfo.email,
        previous_assignee_info: prevAssigneeInfo,
        
        // New assignee data
        new_assignee_obj: newAssigneeObj,
        new_assignee: newAssigneeInfo.name,
        new_assignee_email: newAssigneeInfo.email,
        new_assignee_info: newAssigneeInfo,
        
        // Assigned by data
        assigned_by_obj: assignedByObj,
        assigned_by: assignedByInfo.name,
        assigned_by_email: assignedByInfo.email,
        assigned_by_info: assignedByInfo,
        
        // Other fields
        assigned_at: logObj.created_at || logObj.timestamp,
        reason: logObj.assignment_reason || 'Manual Assignment',
        notes: logObj.remarks || ''
      };
    })
  };

  res.status(200).json({
    success: true,
    data: formattedLogs
  });
});

// @desc    Get assignment log by ID
// @route   GET /api/v1/assignment-logs/:id
// @access  Private
exports.getAssignmentLogById = asyncHandler(async (req, res, next) => {
  const assignmentLog = await AssignmentLog.findById(req.params.id)
    .populate('enquiry_id', 'enquiry_id name mobile')
    .populate('assigned_to', 'name email team')
    .populate('assigned_by', 'name email');

  if (!assignmentLog) {
    return next(new ErrorResponse('Assignment log not found', 404));
  }

  res.status(200).json({
    success: true,
    data: assignmentLog
  });
});

// @desc    Create assignment log
// @route   POST /api/v1/assignment-logs
// @access  Private
exports.createAssignmentLog = asyncHandler(async (req, res, next) => {
  const { enquiry_id, assigned_to, assignment_type, reason } = req.body;

  // Validate enquiry exists
  const enquiry = await Enquiry.findById(enquiry_id);
  if (!enquiry) {
    return next(new ErrorResponse('Enquiry not found', 404));
  }

  // Validate assigned user exists
  const assignedUser = await User.findById(assigned_to);
  if (!assignedUser) {
    return next(new ErrorResponse('Assigned user not found', 404));
  }

  const assignmentLog = await AssignmentLog.create({
    enquiry_id,
    assigned_to,
    assigned_by: req.user.id,
    previous_assigned_to: enquiry.assigned_to,
    assignment_type: assignment_type || 'manual',
    reason,
    metadata: {
      user_agent: req.get('User-Agent'),
      ip_address: req.ip,
      assigned_user_team: assignedUser.team
    }
  });

  // Update enquiry assignment
  enquiry.assigned_to = assigned_to;
  enquiry.assigned_team = assignedUser.team;
  await enquiry.save();

  await assignmentLog.populate([
    { path: 'enquiry_id', select: 'enquiry_id name mobile' },
    { path: 'assigned_to', select: 'name email team' },
    { path: 'assigned_by', select: 'name email' }
  ]);

  res.status(201).json({
    success: true,
    data: assignmentLog
  });
});

// @desc    Get enquiry assignment history
// @route   GET /api/v1/assignment-logs/enquiry/:enquiry_id/history
// @access  Private
exports.getEnquiryAssignmentHistory = asyncHandler(async (req, res, next) => {
  const { enquiry_id } = req.params;
  const { limit = 50 } = req.query;

  const assignmentHistory = await AssignmentLog.getEnquiryAssignmentHistory(enquiry_id, parseInt(limit));

  res.status(200).json({
    success: true,
    data: assignmentHistory
  });
});

// @desc    Get user assignment statistics
// @route   GET /api/v1/assignment-logs/user/:user_id/stats
// @access  Private
exports.getUserAssignmentStats = asyncHandler(async (req, res, next) => {
  const { user_id } = req.params;
  const { start_date, end_date } = req.query;

  const stats = await AssignmentLog.getUserAssignmentStats(user_id, start_date, end_date);

  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    Get team workload distribution
// @route   GET /api/v1/assignment-logs/team/workload
// @access  Private
exports.getTeamWorkloadDistribution = asyncHandler(async (req, res, next) => {
  const { team, start_date, end_date } = req.query;

  const workload = await AssignmentLog.getTeamWorkloadDistribution(team, start_date, end_date);

  res.status(200).json({
    success: true,
    data: workload
  });
});

// @desc    Complete assignment
// @route   PATCH /api/v1/assignment-logs/:id/complete
// @access  Private
exports.completeAssignment = asyncHandler(async (req, res, next) => {
  const { completion_notes } = req.body;

  const assignmentLog = await AssignmentLog.findById(req.params.id);

  if (!assignmentLog) {
    return next(new ErrorResponse('Assignment log not found', 404));
  }

  // Only assigned user or admin can complete assignment
  if (assignmentLog.assigned_to.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to complete this assignment', 403));
  }

  await assignmentLog.completeAssignment(completion_notes);

  res.status(200).json({
    success: true,
    data: assignmentLog
  });
});

// @desc    Reassign enquiry
// @route   POST /api/v1/assignment-logs/reassign
// @access  Private
exports.reassignEnquiry = asyncHandler(async (req, res, next) => {
  const { enquiry_id, new_assigned_to, reason } = req.body;

  // Validate enquiry exists
  const enquiry = await Enquiry.findById(enquiry_id);
  if (!enquiry) {
    return next(new ErrorResponse('Enquiry not found', 404));
  }

  // Validate new assigned user exists
  const newAssignedUser = await User.findById(new_assigned_to);
  if (!newAssignedUser) {
    return next(new ErrorResponse('New assigned user not found', 404));
  }

  // Complete current assignment if exists
  const currentAssignment = await AssignmentLog.findOne({
    enquiry_id,
    status: 'active'
  });

  if (currentAssignment) {
    await currentAssignment.completeAssignment('Reassigned to another user');
  }

  // Create new assignment
  const newAssignment = await AssignmentLog.create({
    enquiry_id,
    assigned_to: new_assigned_to,
    assigned_by: req.user.id,
    previous_assigned_to: enquiry.assigned_to,
    assignment_type: 'reassignment',
    reason,
    metadata: {
      user_agent: req.get('User-Agent'),
      ip_address: req.ip,
      assigned_user_team: newAssignedUser.team,
      previous_assignment_id: currentAssignment?._id
    }
  });

  // Update enquiry assignment
  enquiry.assigned_to = new_assigned_to;
  enquiry.assigned_team = newAssignedUser.team;
  await enquiry.save();

  await newAssignment.populate([
    { path: 'enquiry_id', select: 'enquiry_id name mobile' },
    { path: 'assigned_to', select: 'name email team' },
    { path: 'assigned_by', select: 'name email' }
  ]);

  res.status(201).json({
    success: true,
    data: newAssignment
  });
});

// @desc    Get assignment analytics
// @route   GET /api/v1/assignment-logs/analytics
// @access  Private
exports.getAssignmentAnalytics = asyncHandler(async (req, res, next) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return next(new ErrorResponse('Start date and end date are required', 400));
  }

  const analytics = await AssignmentLog.aggregate([
    {
      $match: {
        created_at: {
          $gte: new Date(start_date),
          $lte: new Date(end_date)
        }
      }
    },
    {
      $group: {
        _id: {
          assignment_type: '$assignment_type',
          status: '$status'
        },
        count: { $sum: 1 },
        avg_duration: { $avg: '$duration' },
        total_duration: { $sum: '$duration' }
      }
    },
    {
      $project: {
        assignment_type: '$_id.assignment_type',
        status: '$_id.status',
        count: 1,
        avg_duration_hours: { $round: [{ $divide: ['$avg_duration', 3600000] }, 2] },
        total_duration_hours: { $round: [{ $divide: ['$total_duration', 3600000] }, 2] }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  res.status(200).json({
    success: true,
    data: analytics
  });
});

// @desc    Delete assignment log
// @route   DELETE /api/v1/assignment-logs/:id
// @access  Private (Admin only)
exports.deleteAssignmentLog = asyncHandler(async (req, res, next) => {
  const assignmentLog = await AssignmentLog.findById(req.params.id);

  if (!assignmentLog) {
    return next(new ErrorResponse('Assignment log not found', 404));
  }

  // Only allow admin to delete assignment logs
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete assignment logs', 403));
  }

  await assignmentLog.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Update assignment log
// @route   PUT /api/v1/assignment-logs/:id
// @access  Private (Admin, Sales Head)
exports.updateAssignmentLog = asyncHandler(async (req, res, next) => {
  let assignmentLog = await AssignmentLog.findById(req.params.id);

  if (!assignmentLog) {
    return next(new ErrorResponse('Assignment log not found', 404));
  }

  assignmentLog = await AssignmentLog.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate([
    { path: 'enquiry_id', select: 'enquiry_id name mobile' },
    { path: 'assigned_to', select: 'name email team' },
    { path: 'assigned_by', select: 'name email' }
  ]);

  res.status(200).json({
    success: true,
    data: assignmentLog
  });
});

// @desc    Get user assignments
// @route   GET /api/v1/assignment-logs/user/:user_id
// @access  Private (Admin, Sales Head)
exports.getUserAssignments = asyncHandler(async (req, res, next) => {
  const { user_id } = req.params;
  const { status, page = 1, limit = 10 } = req.query;

  let filter = { assigned_to: user_id };
  if (status) filter.status = status;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { created_at: -1 },
    populate: [
      { path: 'enquiry_id', select: 'enquiry_id name mobile status' },
      { path: 'assigned_by', select: 'name email' }
    ]
  };

  const assignments = await AssignmentLog.paginate(filter, options);

  res.status(200).json({
    success: true,
    data: assignments
  });
});

// @desc    Get workload distribution
// @route   GET /api/v1/assignment-logs/workload-distribution
// @access  Private (Admin, Sales Head)
exports.getWorkloadDistribution = asyncHandler(async (req, res, next) => {
  const workloadData = await AssignmentLog.aggregate([
    {
      $match: {
        status: { $in: ['active', 'pending'] }
      }
    },
    {
      $group: {
        _id: '$assigned_to',
        activeAssignments: { $sum: 1 },
        assignmentTypes: { $addToSet: '$assignment_type' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        userId: '$_id',
        userName: '$user.name',
        userEmail: '$user.email',
        team: '$user.team',
        activeAssignments: 1,
        assignmentTypes: 1
      }
    },
    {
      $sort: { activeAssignments: -1 }
    }
  ]);

  res.status(200).json({
    success: true,
    data: workloadData
  });
});

// @desc    Export assignment logs
// @route   GET /api/v1/assignment-logs/export
// @access  Private (Admin, Sales Head)
exports.exportAssignmentLogs = asyncHandler(async (req, res, next) => {
  const { start_date, end_date, assigned_to, assignment_type } = req.query;

  let filter = {};
  
  if (start_date && end_date) {
    filter.created_at = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }
  
  if (assigned_to) filter.assigned_to = assigned_to;
  if (assignment_type) filter.assignment_type = assignment_type;

  const assignmentLogs = await AssignmentLog.find(filter)
    .populate('enquiry_id', 'enquiry_id name mobile')
    .populate('assigned_to', 'name email team')
    .populate('assigned_by', 'name email')
    .sort({ created_at: -1 });

  res.status(200).json({
    success: true,
    count: assignmentLogs.length,
    data: assignmentLogs
  });
});
