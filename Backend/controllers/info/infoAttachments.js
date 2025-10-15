const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const InfoAttachment = require('../../models/info/InfoAttachment');
const InfoProfile = require('../../models/info/InfoProfile');
const UserActivityLog = require('../../models/profile/UserActivityLog');
const path = require('path');
const fs = require('fs');

// @desc    Get all info attachments
// @route   GET /api/v1/info-attachments
// @access  Private
exports.getInfoAttachments = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single info attachment
// @route   GET /api/v1/info-attachments/:id
// @access  Private
exports.getInfoAttachment = asyncHandler(async (req, res, next) => {
  const infoAttachment = await InfoAttachment.findById(req.params.id)
    .populate({
      path: 'info_profile',
      select: 'info_id title status priority'
    })
    .populate({
      path: 'uploaded_by',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  if (!infoAttachment) {
    return next(
      new ErrorResponse(`Info attachment not found with id of ${req.params.id}`, 404)
    );
  }

  // Log the view activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'view',
    entity_type: 'info_attachment',
    entity_id: infoAttachment._id,
    description: `Viewed info attachment ${infoAttachment.attachment_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoAttachment
  });
});

// @desc    Create new info attachment
// @route   POST /api/v1/info-attachments
// @access  Private
exports.createInfoAttachment = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.created_by = req.user.id;
  req.body.uploaded_by = req.user.id;

  // Validate info profile exists
  if (req.body.info_profile) {
    const infoProfile = await InfoProfile.findById(req.body.info_profile);
    if (!infoProfile) {
      return next(
        new ErrorResponse(`Info profile not found with id of ${req.body.info_profile}`, 404)
      );
    }
  }

  const infoAttachment = await InfoAttachment.create(req.body);

  // Log the creation activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'create',
    entity_type: 'info_attachment',
    entity_id: infoAttachment._id,
    description: `Created info attachment ${infoAttachment.attachment_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: infoAttachment
  });
});

// @desc    Update info attachment
// @route   PUT /api/v1/info-attachments/:id
// @access  Private
exports.updateInfoAttachment = asyncHandler(async (req, res, next) => {
  let infoAttachment = await InfoAttachment.findById(req.params.id);

  if (!infoAttachment) {
    return next(
      new ErrorResponse(`Info attachment not found with id of ${req.params.id}`, 404)
    );
  }

  // Validate info profile if provided
  if (req.body.info_profile) {
    const infoProfile = await InfoProfile.findById(req.body.info_profile);
    if (!infoProfile) {
      return next(
        new ErrorResponse(`Info profile not found with id of ${req.body.info_profile}`, 404)
      );
    }
  }

  infoAttachment = await InfoAttachment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log the update activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_attachment',
    entity_id: infoAttachment._id,
    description: `Updated info attachment ${infoAttachment.attachment_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoAttachment
  });
});

// @desc    Delete info attachment
// @route   DELETE /api/v1/info-attachments/:id
// @access  Private
exports.deleteInfoAttachment = asyncHandler(async (req, res, next) => {
  const infoAttachment = await InfoAttachment.findById(req.params.id);

  if (!infoAttachment) {
    return next(
      new ErrorResponse(`Info attachment not found with id of ${req.params.id}`, 404)
    );
  }

  // Delete physical file if exists
  if (infoAttachment.file_details.file_path) {
    const filePath = path.join(process.cwd(), infoAttachment.file_details.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  await infoAttachment.deleteOne();

  // Log the deletion activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'info_attachment',
    entity_id: infoAttachment._id,
    description: `Deleted info attachment ${infoAttachment.attachment_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get attachments by info profile
// @route   GET /api/v1/info-attachments/profile/:profileId
// @access  Private
exports.getAttachmentsByProfile = asyncHandler(async (req, res, next) => {
  const attachments = await InfoAttachment.find({ info_profile: req.params.profileId })
    .populate({
      path: 'uploaded_by',
      select: 'name email'
    })
    .sort({ upload_date: -1 });

  res.status(200).json({
    success: true,
    count: attachments.length,
    data: attachments
  });
});

// @desc    Get attachments by type
// @route   GET /api/v1/info-attachments/type/:attachmentType
// @access  Private
exports.getAttachmentsByType = asyncHandler(async (req, res, next) => {
  const { attachmentType } = req.params;
  const { start_date, end_date } = req.query;

  const query = { attachment_type: attachmentType };

  if (start_date && end_date) {
    query.upload_date = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  const attachments = await InfoAttachment.find(query)
    .populate({
      path: 'info_profile',
      select: 'info_id title status priority'
    })
    .populate({
      path: 'uploaded_by',
      select: 'name email'
    })
    .sort({ upload_date: -1 });

  res.status(200).json({
    success: true,
    count: attachments.length,
    data: attachments
  });
});

// @desc    Download attachment
// @route   GET /api/v1/info-attachments/:id/download
// @access  Private
exports.downloadAttachment = asyncHandler(async (req, res, next) => {
  const infoAttachment = await InfoAttachment.findById(req.params.id);

  if (!infoAttachment) {
    return next(
      new ErrorResponse(`Info attachment not found with id of ${req.params.id}`, 404)
    );
  }

  const filePath = path.join(process.cwd(), infoAttachment.file_details.file_path);

  if (!fs.existsSync(filePath)) {
    return next(
      new ErrorResponse('File not found on server', 404)
    );
  }

  // Increment download count
  infoAttachment.download_count += 1;
  infoAttachment.last_downloaded = new Date();
  await infoAttachment.save();

  // Log the download activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'download',
    entity_type: 'info_attachment',
    entity_id: infoAttachment._id,
    description: `Downloaded info attachment ${infoAttachment.attachment_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  // Set appropriate headers
  res.setHeader('Content-Disposition', `attachment; filename="${infoAttachment.file_details.original_name}"`);
  res.setHeader('Content-Type', infoAttachment.file_details.mime_type);

  // Send file
  res.sendFile(filePath);
});

// @desc    Get attachment statistics
// @route   GET /api/v1/info-attachments/statistics
// @access  Private
exports.getAttachmentStatistics = asyncHandler(async (req, res, next) => {
  const { start_date, end_date } = req.query;

  const matchConditions = {};
  
  if (start_date && end_date) {
    matchConditions.upload_date = {
      $gte: new Date(start_date),
      $lte: new Date(end_date)
    };
  }

  const statistics = await InfoAttachment.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        total_attachments: { $sum: 1 },
        total_size_bytes: { $sum: '$file_details.file_size_bytes' },
        total_downloads: { $sum: '$download_count' },
        avg_file_size: { $avg: '$file_details.file_size_bytes' }
      }
    },
    {
      $project: {
        _id: 0,
        total_attachments: 1,
        total_size_mb: { $round: [{ $divide: ['$total_size_bytes', 1048576] }, 2] },
        total_downloads: 1,
        avg_file_size_mb: { $round: [{ $divide: ['$avg_file_size', 1048576] }, 2] }
      }
    }
  ]);

  const attachmentsByType = await InfoAttachment.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$attachment_type',
        count: { $sum: 1 },
        total_size_bytes: { $sum: '$file_details.file_size_bytes' },
        total_downloads: { $sum: '$download_count' }
      }
    },
    {
      $project: {
        attachment_type: '$_id',
        count: 1,
        total_size_mb: { $round: [{ $divide: ['$total_size_bytes', 1048576] }, 2] },
        total_downloads: 1
      }
    },
    { $sort: { count: -1 } }
  ]);

  const attachmentsByExtension = await InfoAttachment.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$file_details.file_extension',
        count: { $sum: 1 },
        total_size_bytes: { $sum: '$file_details.file_size_bytes' }
      }
    },
    {
      $project: {
        file_extension: '$_id',
        count: 1,
        total_size_mb: { $round: [{ $divide: ['$total_size_bytes', 1048576] }, 2] }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overall_statistics: statistics[0] || {
        total_attachments: 0,
        total_size_mb: 0,
        total_downloads: 0,
        avg_file_size_mb: 0
      },
      attachments_by_type: attachmentsByType,
      top_file_extensions: attachmentsByExtension
    }
  });
});

// @desc    Get expired attachments
// @route   GET /api/v1/info-attachments/expired
// @access  Private
exports.getExpiredAttachments = asyncHandler(async (req, res, next) => {
  const expiredAttachments = await InfoAttachment.find({
    auto_delete_date: { $lte: new Date() },
    is_deleted: { $ne: true }
  })
    .populate({
      path: 'info_profile',
      select: 'info_id title status'
    })
    .populate({
      path: 'uploaded_by',
      select: 'name email'
    })
    .sort({ auto_delete_date: 1 });

  res.status(200).json({
    success: true,
    count: expiredAttachments.length,
    data: expiredAttachments
  });
});

// @desc    Clean up expired attachments
// @route   DELETE /api/v1/info-attachments/cleanup-expired
// @access  Private
exports.cleanupExpiredAttachments = asyncHandler(async (req, res, next) => {
  const expiredAttachments = await InfoAttachment.find({
    auto_delete_date: { $lte: new Date() },
    is_deleted: { $ne: true }
  });

  let deletedCount = 0;
  let errorCount = 0;

  for (const attachment of expiredAttachments) {
    try {
      // Delete physical file
      if (attachment.file_details.file_path) {
        const filePath = path.join(process.cwd(), attachment.file_details.file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Mark as deleted instead of removing from database
      attachment.is_deleted = true;
      attachment.deleted_date = new Date();
      await attachment.save();

      deletedCount++;

      // Log the cleanup activity
      await UserActivityLog.create({
        user_id: req.user.id,
        action_type: 'delete',
        entity_type: 'info_attachment',
        entity_id: attachment._id,
        description: `Auto-deleted expired attachment ${attachment.attachment_id}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
    } catch (error) {
      console.error(`Error deleting attachment ${attachment.attachment_id}:`, error);
      errorCount++;
    }
  }

  res.status(200).json({
    success: true,
    data: {
      deleted_count: deletedCount,
      error_count: errorCount,
      message: `Successfully cleaned up ${deletedCount} expired attachments${errorCount > 0 ? ` with ${errorCount} errors` : ''}`
    }
  });
});

// @desc    Update attachment security settings
// @route   PUT /api/v1/info-attachments/:id/security
// @access  Private
exports.updateAttachmentSecurity = asyncHandler(async (req, res, next) => {
  const { access_level, password_protected, allowed_users } = req.body;

  const infoAttachment = await InfoAttachment.findById(req.params.id);

  if (!infoAttachment) {
    return next(
      new ErrorResponse(`Info attachment not found with id of ${req.params.id}`, 404)
    );
  }

  if (access_level) {
    infoAttachment.security_settings.access_level = access_level;
  }

  if (password_protected !== undefined) {
    infoAttachment.security_settings.password_protected = password_protected;
  }

  if (allowed_users) {
    infoAttachment.security_settings.allowed_users = allowed_users;
  }

  await infoAttachment.save();

  // Log the security update activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'info_attachment',
    entity_id: infoAttachment._id,
    description: `Updated security settings for attachment ${infoAttachment.attachment_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: infoAttachment
  });
});

// @desc    Get attachment versions
// @route   GET /api/v1/info-attachments/:id/versions
// @access  Private
exports.getAttachmentVersions = asyncHandler(async (req, res, next) => {
  const infoAttachment = await InfoAttachment.findById(req.params.id);

  if (!infoAttachment) {
    return next(
      new ErrorResponse(`Info attachment not found with id of ${req.params.id}`, 404)
    );
  }

  // Find all versions of this attachment
  const versions = await InfoAttachment.find({
    'version_info.parent_attachment': infoAttachment._id
  })
    .populate({
      path: 'uploaded_by',
      select: 'name email'
    })
    .sort({ 'version_info.version_number': -1 });

  res.status(200).json({
    success: true,
    count: versions.length,
    data: {
      original: infoAttachment,
      versions: versions
    }
  });
});