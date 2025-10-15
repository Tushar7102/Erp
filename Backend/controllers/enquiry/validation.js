const asyncHandler = require('../../middleware/async');
const ErrorResponse = require('../../utils/errorResponse');
const Lead = require('../../models/enquiry/lead');

/**
 * @desc    Get leads for validation
 * @route   GET /api/validation
 * @access  Private
 */
exports.getLeadsForValidation = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  // Build query
  const query = {};
  
  // Search filter
  if (req.query.search) {
    const searchTerm = req.query.search;
    query.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { phone: { $regex: searchTerm, $options: 'i' } },
      { company: { $regex: searchTerm, $options: 'i' } }
    ];
  }
  
  // Status filter
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  // Validation issues filter
  if (req.query.validation_issues) {
    const issues = req.query.validation_issues.split(',');
    query.validation_issues = { $in: issues };
  }
  
  // Score filters
  if (req.query.min_validation_score) {
    query.validation_score = { 
      ...query.validation_score || {},
      $gte: parseInt(req.query.min_validation_score)
    };
  }
  
  if (req.query.max_validation_score) {
    query.validation_score = { 
      ...query.validation_score || {},
      $lte: parseInt(req.query.max_validation_score)
    };
  }
  
  if (req.query.min_duplicate_score) {
    query.duplicate_score = { 
      ...query.duplicate_score || {},
      $gte: parseInt(req.query.min_duplicate_score)
    };
  }
  
  if (req.query.max_duplicate_score) {
    query.duplicate_score = { 
      ...query.duplicate_score || {},
      $lte: parseInt(req.query.max_duplicate_score)
    };
  }
  
  // Date range filter
  if (req.query.start_date || req.query.end_date) {
    query.created_at = {};
    
    if (req.query.start_date) {
      query.created_at.$gte = new Date(req.query.start_date);
    }
    
    if (req.query.end_date) {
      query.created_at.$lte = new Date(req.query.end_date);
    }
  }
  
  // Sorting
  let sort = { created_at: -1 }; // Default sort
  
  if (req.query.sort_by) {
    sort = {};
    sort[req.query.sort_by] = req.query.sort_order === 'desc' ? -1 : 1;
  }
  
  // Execute query with pagination
  const options = {
    page,
    limit,
    sort,
    populate: {
      path: 'potential_duplicates validated_by',
      select: 'name email phone company match_score'
    }
  };
  
  const leads = await Lead.paginate(query, options);

  res.status(200).json({
    success: true,
    data: leads.docs,
    pagination: {
      page: leads.page,
      limit: leads.limit,
      total: leads.totalDocs,
      pages: leads.totalPages
    }
  });
});

/**
 * @desc    Get validation statistics
 * @route   GET /api/validation/statistics
 * @access  Private
 */
exports.getValidationStats = asyncHandler(async (req, res, next) => {
  // Get counts for each status
  const totalLeads = await Lead.countDocuments();
  const validatedLeads = await Lead.countDocuments({ status: 'validated' });
  const rejectedLeads = await Lead.countDocuments({ status: 'rejected' });
  const pendingLeads = await Lead.countDocuments({ status: 'pending' });
  
  // Calculate validation rate
  const validationRate = totalLeads > 0 ? Math.round((validatedLeads / totalLeads) * 100) : 0;
  
  // Get average scores
  const avgScores = await Lead.aggregate([
    {
      $group: {
        _id: null,
        avgValidationScore: { $avg: '$validation_score' },
        avgDuplicateScore: { $avg: '$duplicate_score' }
      }
    }
  ]);
  
  // Get common validation issues
  const issuesAgg = await Lead.aggregate([
    { $unwind: '$validation_issues' },
    { $group: { _id: '$validation_issues', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  
  const commonIssues = issuesAgg.map(item => ({
    issue: item._id,
    count: item.count
  }));
  
  // Calculate duplicate rate (leads with potential duplicates)
  const leadsWithDuplicates = await Lead.countDocuments({
    potential_duplicates: { $exists: true, $ne: [] }
  });
  const duplicateRate = totalLeads > 0 ? Math.round((leadsWithDuplicates / totalLeads) * 100) : 0;
  
  res.status(200).json({
    success: true,
    data: {
      total_leads: totalLeads,
      validated_leads: validatedLeads,
      rejected_leads: rejectedLeads,
      pending_leads: pendingLeads,
      validation_rate: validationRate,
      average_validation_score: avgScores.length > 0 ? Math.round(avgScores[0].avgValidationScore) : 0,
      average_duplicate_score: avgScores.length > 0 ? Math.round(avgScores[0].avgDuplicateScore) : 0,
      common_issues: commonIssues,
      duplicate_rate: duplicateRate
    }
  });
});

/**
 * @desc    Get validation settings
 * @route   GET /api/validation/settings
 * @access  Private
 */
exports.getValidationSettings = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {
      duplicate_threshold: 80,
      validation_threshold: 60,
      auto_merge: false,
      auto_approve: false,
      auto_reject: false,
      email_validation: true,
      phone_validation: true,
      company_validation: false,
      spam_detection: true,
      matching_rules: [
        {
          field: 'email',
          match_type: 'exact',
          enabled: true,
          weight: 40
        },
        {
          field: 'phone',
          match_type: 'exact',
          enabled: true,
          weight: 30
        },
        {
          field: 'name',
          match_type: 'fuzzy',
          enabled: true,
          threshold: 80,
          weight: 20
        },
        {
          field: 'company',
          match_type: 'fuzzy',
          enabled: true,
          threshold: 70,
          weight: 10
        }
      ],
      lookback_period: 30
    }
  });
});

/**
 * @desc    Validate a lead
 * @route   PUT /api/validation/:leadId
 * @access  Private
 */
exports.validateLead = asyncHandler(async (req, res, next) => {
  const { leadId } = req.params;
  const { status, notes } = req.body;
  
  // Find the lead
  const lead = await Lead.findById(leadId);
  
  if (!lead) {
    return next(new ErrorResponse(`Lead not found with id of ${leadId}`, 404));
  }
  
  // Update lead validation status
  lead.status = status;
  lead.notes = notes;
  lead.validated_at = Date.now();
  lead.validated_by = req.user ? req.user._id : null;
  
  await lead.save();
  
  res.status(200).json({
    success: true,
    data: lead
  });
});

/**
 * @desc    Merge duplicate leads
 * @route   POST /api/validation/merge
 * @access  Private
 */
exports.mergeLeads = asyncHandler(async (req, res, next) => {
  const { primaryLeadId, secondaryLeadIds, mergeFields } = req.body;
  
  // Find the primary lead
  const primaryLead = await Lead.findById(primaryLeadId);
  
  if (!primaryLead) {
    return next(new ErrorResponse(`Primary lead not found with id of ${primaryLeadId}`, 404));
  }
  
  // Find all secondary leads
  const secondaryLeads = await Lead.find({ _id: { $in: secondaryLeadIds } });
  
  if (secondaryLeads.length !== secondaryLeadIds.length) {
    return next(new ErrorResponse('One or more secondary leads not found', 404));
  }
  
  // Merge fields from secondary leads to primary lead
  if (mergeFields && mergeFields.length > 0) {
    for (const field of mergeFields) {
      if (field.source === 'secondary') {
        const secondaryLead = secondaryLeads.find(lead => lead._id.toString() === field.leadId);
        if (secondaryLead && secondaryLead[field.fieldName]) {
          primaryLead[field.fieldName] = secondaryLead[field.fieldName];
        }
      }
    }
  }
  
  // Mark secondary leads as merged
  for (const secondaryLead of secondaryLeads) {
    secondaryLead.status = 'merged';
    secondaryLead.notes = `Merged into lead ${primaryLeadId}`;
    await secondaryLead.save();
  }
  
  // Update primary lead
  primaryLead.merged_leads = secondaryLeadIds;
  primaryLead.merged_at = Date.now();
  primaryLead.merged_by = req.user ? req.user._id : null;
  
  await primaryLead.save();
  
  res.status(200).json({
    success: true,
    data: primaryLead
  });
});

/**
 * @desc    Export validation data
 * @route   GET /api/validation/export
 * @access  Private
 */
exports.exportValidationData = asyncHandler(async (req, res, next) => {
  // Get query parameters for filtering
  const { status, start_date, end_date } = req.query;
  
  // Build query
  const query = {};
  
  if (status) {
    query.status = status;
  }
  
  if (start_date || end_date) {
    query.created_at = {};
    
    if (start_date) {
      query.created_at.$gte = new Date(start_date);
    }
    
    if (end_date) {
      query.created_at.$lte = new Date(end_date);
    }
  }
  
  // Get leads for export
  const leads = await Lead.find(query)
    .select('name email phone company status validation_score duplicate_score validation_issues created_at')
    .sort({ created_at: -1 });
  
  // In a real implementation, this would generate a CSV file
  // For now, we'll just return the data and a mock export URL
  
  res.status(200).json({
    success: true,
    data: {
      export_url: `https://example.com/exports/validation_data_${Date.now()}.csv`,
      export_date: new Date(),
      export_by: req.user ? req.user._id : 'system',
      record_count: leads.length,
      leads
    }
  });
});

/**
 * @desc    Batch validate leads
 * @route   POST /api/validation/batch
 * @access  Private
 */
exports.batchValidate = asyncHandler(async (req, res, next) => {
  const { leadIds, status, notes } = req.body;
  
  if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
    return next(new ErrorResponse('Please provide an array of lead IDs', 400));
  }
  
  if (!status) {
    return next(new ErrorResponse('Please provide a status', 400));
  }
  
  // Update all leads
  const result = await Lead.updateMany(
    { _id: { $in: leadIds } },
    { 
      status,
      notes,
      validated_at: Date.now(),
      validated_by: req.user ? req.user._id : null
    }
  );
  
  // Get the updated leads
  const updatedLeads = await Lead.find({ _id: { $in: leadIds } });
  
  // Count successful updates
  const successful = updatedLeads.filter(lead => lead.status === status).length;
  
  res.status(200).json({
    success: true,
    data: {
      message: 'Batch validation completed',
      processed: leadIds.length,
      successful: successful
    }
  });
});

/**
 * @desc    Get validation history
 * @route   GET /api/validation/history
 * @access  Private
 */
exports.getValidationHistory = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  // Get validation history - using the Lead model to find recently validated leads
  const validatedLeads = await Lead.find({
    validated_at: { $exists: true, $ne: null }
  })
    .select('name email phone company status validation_score validated_at validated_by notes')
    .sort({ validated_at: -1 })
    .skip(startIndex)
    .limit(limit)
    .populate('validated_by', 'name email');
  
  // Get total count
  const total = await Lead.countDocuments({
    validated_at: { $exists: true, $ne: null }
  });
  
  res.status(200).json({
    success: true,
    count: validatedLeads.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: validatedLeads
  });
});