const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const JobProfile = require('../../models/profile/JobProfile');
const Team = require('../../models/profile/Team');
const User = require('../../models/profile/User');
const UserActivityLog = require('../../models/profile/UserActivityLog');
const path = require('path');
const fs = require('fs');

// @desc    Get all job profiles
// @route   GET /api/v1/job-profiles
// @access  Private
exports.getJobProfiles = asyncHandler(async (req, res, next) => {
  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'list',
    entity_type: 'JobProfile',
    description: 'Retrieved job profiles list',
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json(res.advancedResults);
});

// @desc    Get single job profile
// @route   GET /api/v1/job-profiles/:id
// @access  Private
exports.getJobProfile = asyncHandler(async (req, res, next) => {
  const jobProfile = await JobProfile.findById(req.params.id)
    .populate({
      path: 'hiring_manager',
      select: 'name email'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    })
    .populate({
      path: 'interview_rounds.interviewers',
      select: 'name email'
    })
    .populate({
      path: 'notes.created_by',
      select: 'name email'
    })
    .populate({
      path: 'applicants.interview_feedback.interviewer',
      select: 'name email'
    });

  if (!jobProfile) {
    return next(
      new ErrorResponse(`Job profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Log the view activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'view',
    entity_type: 'JobProfile',
    entity_id: jobProfile._id,
    description: `Viewed job profile ${jobProfile.job_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: jobProfile
  });
});

// @desc    Create new job profile
// @route   POST /api/v1/job-profiles
// @access  Private
exports.createJobProfile = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.created_by = req.user.id;

  // Check if hiring_manager exists if provided
  if (req.body.hiring_manager) {
    const hiringManager = await User.findById(req.body.hiring_manager);
    if (!hiringManager) {
      return next(
        new ErrorResponse(`User not found with id of ${req.body.hiring_manager}`, 404)
      );
    }
  }

  // Check if assigned_team exists if provided
  if (req.body.assigned_team) {
    const team = await Team.findById(req.body.assigned_team);
    if (!team) {
      return next(
        new ErrorResponse(`Team not found with id of ${req.body.assigned_team}`, 404)
      );
    }
  }

  // Check if interviewers exist if provided
  if (req.body.interview_rounds && req.body.interview_rounds.length > 0) {
    for (const round of req.body.interview_rounds) {
      if (round.interviewers && round.interviewers.length > 0) {
        for (const interviewerId of round.interviewers) {
          const interviewer = await User.findById(interviewerId);
          if (!interviewer) {
            return next(
              new ErrorResponse(`User not found with id of ${interviewerId}`, 404)
            );
          }
        }
      }
    }
  }

  const jobProfile = await JobProfile.create(req.body);

  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'create',
    entity_type: 'JobProfile',
    entity_id: jobProfile._id,
    description: `Created job profile ${jobProfile.job_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: jobProfile
  });
});

// @desc    Update job profile
// @route   PUT /api/v1/job-profiles/:id
// @access  Private
exports.updateJobProfile = asyncHandler(async (req, res, next) => {
  let jobProfile = await JobProfile.findById(req.params.id);

  if (!jobProfile) {
    return next(
      new ErrorResponse(`Job profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...jobProfile.toObject() };

  // Check if hiring_manager exists if being updated
  if (req.body.hiring_manager) {
    const hiringManager = await User.findById(req.body.hiring_manager);
    if (!hiringManager) {
      return next(
        new ErrorResponse(`User not found with id of ${req.body.hiring_manager}`, 404)
      );
    }
  }

  // Check if assigned_team exists if being updated
  if (req.body.assigned_team) {
    const team = await Team.findById(req.body.assigned_team);
    if (!team) {
      return next(
        new ErrorResponse(`Team not found with id of ${req.body.assigned_team}`, 404)
      );
    }
  }

  // Check if interviewers exist if being updated
  if (req.body.interview_rounds && req.body.interview_rounds.length > 0) {
    for (const round of req.body.interview_rounds) {
      if (round.interviewers && round.interviewers.length > 0) {
        for (const interviewerId of round.interviewers) {
          const interviewer = await User.findById(interviewerId);
          if (!interviewer) {
            return next(
              new ErrorResponse(`User not found with id of ${interviewerId}`, 404)
            );
          }
        }
      }
    }
  }

  jobProfile = await JobProfile.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'update',
    entity_type: 'JobProfile',
    entity_id: jobProfile._id,
    description: `Updated job profile ${jobProfile.job_id}`,
    previous_state: previousState,
    new_state: jobProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: jobProfile
  });
});

// @desc    Delete job profile
// @route   DELETE /api/v1/job-profiles/:id
// @access  Private/Admin
exports.deleteJobProfile = asyncHandler(async (req, res, next) => {
  const jobProfile = await JobProfile.findById(req.params.id);

  if (!jobProfile) {
    return next(
      new ErrorResponse(`Job profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is job owner or admin
  if (
    jobProfile.created_by.toString() !== req.user.id &&
    !['Admin', 'Manager'].includes(req.user.role)
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this job profile`,
        401
      )
    );
  }

  // Store the profile data for activity log
  const deletedProfile = { ...jobProfile.toObject() };

  // Delete all attachments associated with this profile
  if (jobProfile.applicants && jobProfile.applicants.length > 0) {
    jobProfile.applicants.forEach(applicant => {
      if (applicant.resume && applicant.resume.file_path) {
        const filePath = `${process.env.FILE_UPLOAD_PATH}${applicant.resume.file_path}`;
        fs.unlink(filePath, err => {
          if (err && err.code !== 'ENOENT') {
            console.error(`Error deleting file: ${filePath}`, err);
          }
        });
      }
    });
  }

  await jobProfile.deleteOne();

  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'delete',
    entity_type: 'JobProfile',
    entity_id: jobProfile._id,
    description: `Deleted job profile ${jobProfile.job_id}`,
    previous_state: deletedProfile,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add interview round
// @route   POST /api/v1/job-profiles/:id/interview-rounds
// @access  Private
exports.addInterviewRound = asyncHandler(async (req, res, next) => {
  const jobProfile = await JobProfile.findById(req.params.id);

  if (!jobProfile) {
    return next(
      new ErrorResponse(`Job profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if interviewers exist if provided
  if (req.body.interviewers && req.body.interviewers.length > 0) {
    for (const interviewerId of req.body.interviewers) {
      const interviewer = await User.findById(interviewerId);
      if (!interviewer) {
        return next(
          new ErrorResponse(`User not found with id of ${interviewerId}`, 404)
        );
      }
    }
  }

  // Store previous state for activity log
  const previousState = jobProfile.toObject();

  // Add interview round to job profile
  jobProfile.interview_rounds.push(req.body);

  await jobProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'add_interview_round',
    entity_type: 'JobProfile',
    entity_id: jobProfile._id,
    description: `Added interview round to job profile ${jobProfile.job_id}`,
    previous_state: previousState,
    new_state: jobProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: jobProfile.interview_rounds[jobProfile.interview_rounds.length - 1]
  });
});

// @desc    Update interview round
// @route   PUT /api/v1/job-profiles/:id/interview-rounds/:roundId
// @access  Private
exports.updateInterviewRound = asyncHandler(async (req, res, next) => {
  const jobProfile = await JobProfile.findById(req.params.id);

  if (!jobProfile) {
    return next(
      new ErrorResponse(`Job profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the interview round
  const round = jobProfile.interview_rounds.id(req.params.roundId);

  if (!round) {
    return next(
      new ErrorResponse(`Interview round not found with id of ${req.params.roundId}`, 404)
    );
  }

  // Check if interviewers exist if provided
  if (req.body.interviewers && req.body.interviewers.length > 0) {
    for (const interviewerId of req.body.interviewers) {
      const interviewer = await User.findById(interviewerId);
      if (!interviewer) {
        return next(
          new ErrorResponse(`User not found with id of ${interviewerId}`, 404)
        );
      }
    }
  }

  // Store previous state for activity log
  const previousState = jobProfile.toObject();

  // Update the round fields
  if (req.body.name) round.name = req.body.name;
  if (req.body.description !== undefined) round.description = req.body.description;
  if (req.body.interviewers) round.interviewers = req.body.interviewers;

  await jobProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'update_interview_round',
    entity_type: 'JobProfile',
    entity_id: jobProfile._id,
    description: `Updated interview round in job profile ${jobProfile.job_id}`,
    previous_state: previousState,
    new_state: jobProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: round
  });
});

// @desc    Delete interview round
// @route   DELETE /api/v1/job-profiles/:id/interview-rounds/:roundId
// @access  Private
exports.deleteInterviewRound = asyncHandler(async (req, res, next) => {
  const jobProfile = await JobProfile.findById(req.params.id);

  if (!jobProfile) {
    return next(
      new ErrorResponse(`Job profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the interview round
  const round = jobProfile.interview_rounds.id(req.params.roundId);

  if (!round) {
    return next(
      new ErrorResponse(`Interview round not found with id of ${req.params.roundId}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = jobProfile.toObject();
  const roundData = round.toObject();

  // Remove the round
  round.remove();

  await jobProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'delete_interview_round',
    entity_type: 'JobProfile',
    entity_id: jobProfile._id,
    description: `Deleted interview round from job profile ${jobProfile.job_id}`,
    previous_state: previousState,
    new_state: jobProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add applicant
// @route   POST /api/v1/job-profiles/:id/applicants
// @access  Private
exports.addApplicant = asyncHandler(async (req, res, next) => {
  const jobProfile = await JobProfile.findById(req.params.id);

  if (!jobProfile) {
    return next(
      new ErrorResponse(`Job profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = jobProfile.toObject();

  // Check if file was uploaded for resume
  if (req.files && req.files.resume) {
    const file = req.files.resume;

    // Make sure the file is an allowed type
    const fileTypes = /pdf|doc|docx/;
    const extname = fileTypes.test(path.extname(file.name).toLowerCase());

    if (!extname) {
      return next(new ErrorResponse(`Please upload a valid resume file (PDF, DOC, DOCX)`, 400));
    }

    // Create custom filename
    file.name = `${jobProfile.job_id}_${req.body.name.replace(/\s+/g, '_')}_${Date.now()}${path.parse(file.name).ext}`;

    // Upload file to server
    file.mv(`${process.env.FILE_UPLOAD_PATH}/resumes/${file.name}`, async err => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse(`Problem with resume upload`, 500));
      }

      // Add resume info to applicant data
      req.body.resume = {
        file_path: `/uploads/resumes/${file.name}`,
        file_type: path.extname(file.name).toLowerCase().substring(1)
      };

      // Add application date and initial status
      req.body.application_date = Date.now();
      req.body.current_stage = 'applied';
      req.body.status = 'under_review';

      // Add applicant to job profile
      jobProfile.applicants.push(req.body);
      
      // Increment applications count
      jobProfile.applications_count = jobProfile.applicants.length;

      await jobProfile.save();

      // Log the activity
      await UserActivityLog.create({
        user: req.user.id,
        action: 'add_applicant',
        entity_type: 'JobProfile',
        entity_id: jobProfile._id,
        description: `Added applicant ${req.body.name} to job profile ${jobProfile.job_id}`,
        previous_state: previousState,
        new_state: jobProfile.toObject(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.status(200).json({
        success: true,
        data: jobProfile.applicants[jobProfile.applicants.length - 1]
      });
    });
  } else {
    // Add application without resume
    req.body.application_date = Date.now();
    req.body.current_stage = 'applied';
    req.body.status = 'under_review';

    // Add applicant to job profile
    jobProfile.applicants.push(req.body);
    
    // Increment applications count
    jobProfile.applications_count = jobProfile.applicants.length;

    await jobProfile.save();

    // Log the activity
    await UserActivityLog.create({
      user: req.user.id,
      action: 'add_applicant',
      entity_type: 'JobProfile',
      entity_id: jobProfile._id,
      description: `Added applicant ${req.body.name} to job profile ${jobProfile.job_id}`,
      previous_state: previousState,
      new_state: jobProfile.toObject(),
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      data: jobProfile.applicants[jobProfile.applicants.length - 1]
    });
  }
});

// @desc    Update applicant
// @route   PUT /api/v1/job-profiles/:id/applicants/:applicantId
// @access  Private
exports.updateApplicant = asyncHandler(async (req, res, next) => {
  const jobProfile = await JobProfile.findById(req.params.id);

  if (!jobProfile) {
    return next(
      new ErrorResponse(`Job profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the applicant
  const applicant = jobProfile.applicants.id(req.params.applicantId);

  if (!applicant) {
    return next(
      new ErrorResponse(`Applicant not found with id of ${req.params.applicantId}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = jobProfile.toObject();

  // Update the applicant fields
  if (req.body.name) applicant.name = req.body.name;
  if (req.body.email) applicant.email = req.body.email;
  if (req.body.phone !== undefined) applicant.phone = req.body.phone;
  if (req.body.current_stage) applicant.current_stage = req.body.current_stage;
  if (req.body.status) applicant.status = req.body.status;
  if (req.body.interview_feedback) applicant.interview_feedback = req.body.interview_feedback;

  // Check if file was uploaded for resume
  if (req.files && req.files.resume) {
    const file = req.files.resume;

    // Make sure the file is an allowed type
    const fileTypes = /pdf|doc|docx/;
    const extname = fileTypes.test(path.extname(file.name).toLowerCase());

    if (!extname) {
      return next(new ErrorResponse(`Please upload a valid resume file (PDF, DOC, DOCX)`, 400));
    }

    // Delete old resume if exists
    if (applicant.resume && applicant.resume.file_path) {
      const oldFilePath = `${process.env.FILE_UPLOAD_PATH}${applicant.resume.file_path}`;
      fs.unlink(oldFilePath, err => {
        if (err && err.code !== 'ENOENT') {
          console.error(`Error deleting file: ${oldFilePath}`, err);
        }
      });
    }

    // Create custom filename
    file.name = `${jobProfile.job_id}_${applicant.name.replace(/\s+/g, '_')}_${Date.now()}${path.parse(file.name).ext}`;

    // Upload file to server
    file.mv(`${process.env.FILE_UPLOAD_PATH}/resumes/${file.name}`, async err => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse(`Problem with resume upload`, 500));
      }

      // Update resume info
      applicant.resume = {
        file_path: `/uploads/resumes/${file.name}`,
        file_type: path.extname(file.name).toLowerCase().substring(1)
      };

      await jobProfile.save();

      // Log the activity
      await UserActivityLog.create({
        user: req.user.id,
        action: 'update_applicant',
        entity_type: 'JobProfile',
        entity_id: jobProfile._id,
        description: `Updated applicant ${applicant.name} in job profile ${jobProfile.job_id}`,
        previous_state: previousState,
        new_state: jobProfile.toObject(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      res.status(200).json({
        success: true,
        data: applicant
      });
    });
  } else {
    await jobProfile.save();

    // Log the activity
    await UserActivityLog.create({
      user: req.user.id,
      action: 'update_applicant',
      entity_type: 'JobProfile',
      entity_id: jobProfile._id,
      description: `Updated applicant ${applicant.name} in job profile ${jobProfile.job_id}`,
      previous_state: previousState,
      new_state: jobProfile.toObject(),
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      data: applicant
    });
  }
});

// @desc    Delete applicant
// @route   DELETE /api/v1/job-profiles/:id/applicants/:applicantId
// @access  Private
exports.deleteApplicant = asyncHandler(async (req, res, next) => {
  const jobProfile = await JobProfile.findById(req.params.id);

  if (!jobProfile) {
    return next(
      new ErrorResponse(`Job profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the applicant
  const applicant = jobProfile.applicants.id(req.params.applicantId);

  if (!applicant) {
    return next(
      new ErrorResponse(`Applicant not found with id of ${req.params.applicantId}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = jobProfile.toObject();
  const applicantData = applicant.toObject();

  // Delete resume if exists
  if (applicant.resume && applicant.resume.file_path) {
    const filePath = `${process.env.FILE_UPLOAD_PATH}${applicant.resume.file_path}`;
    fs.unlink(filePath, err => {
      if (err && err.code !== 'ENOENT') {
        console.error(`Error deleting file: ${filePath}`, err);
      }
    });
  }

  // Remove the applicant
  applicant.remove();
  
  // Update applications count
  jobProfile.applications_count = jobProfile.applicants.length;

  await jobProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'delete_applicant',
    entity_type: 'JobProfile',
    entity_id: jobProfile._id,
    description: `Deleted applicant ${applicantData.name} from job profile ${jobProfile.job_id}`,
    previous_state: previousState,
    new_state: jobProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add note to job profile
// @route   POST /api/v1/job-profiles/:id/notes
// @access  Private
exports.addNote = asyncHandler(async (req, res, next) => {
  const jobProfile = await JobProfile.findById(req.params.id);

  if (!jobProfile) {
    return next(
      new ErrorResponse(`Job profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = jobProfile.toObject();

  // Add user to note
  req.body.created_by = req.user.id;

  // Add note to job profile
  jobProfile.notes.push(req.body);

  await jobProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'add_note',
    entity_type: 'JobProfile',
    entity_id: jobProfile._id,
    description: `Added note to job profile ${jobProfile.job_id}`,
    previous_state: previousState,
    new_state: jobProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: jobProfile.notes[jobProfile.notes.length - 1]
  });
});

// @desc    Delete note
// @route   DELETE /api/v1/job-profiles/:id/notes/:noteId
// @access  Private
exports.deleteNote = asyncHandler(async (req, res, next) => {
  const jobProfile = await JobProfile.findById(req.params.id);

  if (!jobProfile) {
    return next(
      new ErrorResponse(`Job profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the note
  const note = jobProfile.notes.id(req.params.noteId);

  if (!note) {
    return next(
      new ErrorResponse(`Note not found with id of ${req.params.noteId}`, 404)
    );
  }

  // Make sure user is note owner or admin
  if (
    note.created_by.toString() !== req.user.id &&
    req.user.role !== 'Admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this note`,
        401
      )
    );
  }

  // Store previous state for activity log
  const previousState = jobProfile.toObject();
  const noteData = note.toObject();

  // Remove the note
  note.remove();

  await jobProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'delete_note',
    entity_type: 'JobProfile',
    entity_id: jobProfile._id,
    description: `Deleted note from job profile ${jobProfile.job_id}`,
    previous_state: previousState,
    new_state: jobProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Assign job to hiring manager
// @route   PUT /api/v1/job-profiles/:id/assign-manager
// @access  Private/Admin/Manager
exports.assignHiringManager = asyncHandler(async (req, res, next) => {
  let jobProfile = await JobProfile.findById(req.params.id);

  if (!jobProfile) {
    return next(
      new ErrorResponse(`Job profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...jobProfile.toObject() };
  const previousManager = jobProfile.hiring_manager
    ? jobProfile.hiring_manager.toString()
    : null;

  // Check if hiring manager exists
  if (!req.body.hiring_manager) {
    return next(new ErrorResponse('Please provide hiring manager ID', 400));
  }

  const hiringManager = await User.findById(req.body.hiring_manager);
  if (!hiringManager) {
    return next(
      new ErrorResponse(`User not found with id of ${req.body.hiring_manager}`, 404)
    );
  }

  // Update hiring manager
  jobProfile = await JobProfile.findByIdAndUpdate(
    req.params.id,
    { hiring_manager: req.body.hiring_manager },
    {
      new: true,
      runValidators: true
    }
  );

  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'assign_hiring_manager',
    entity_type: 'JobProfile',
    entity_id: jobProfile._id,
    description: `Assigned hiring manager ${hiringManager.name} to job profile ${jobProfile.job_id}`,
    previous_state: previousState,
    new_state: jobProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: jobProfile
  });
});

// @desc    Assign job to team
// @route   PUT /api/v1/job-profiles/:id/assign-team
// @access  Private/Admin/Manager
exports.assignTeam = asyncHandler(async (req, res, next) => {
  let jobProfile = await JobProfile.findById(req.params.id);

  if (!jobProfile) {
    return next(
      new ErrorResponse(`Job profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...jobProfile.toObject() };
  const previousTeam = jobProfile.assigned_team
    ? jobProfile.assigned_team.toString()
    : null;

  // Check if team exists
  if (!req.body.assigned_team) {
    return next(new ErrorResponse('Please provide team ID', 400));
  }

  const team = await Team.findById(req.body.assigned_team);
  if (!team) {
    return next(
      new ErrorResponse(`Team not found with id of ${req.body.assigned_team}`, 404)
    );
  }

  // Update assigned team
  jobProfile = await JobProfile.findByIdAndUpdate(
    req.params.id,
    { assigned_team: req.body.assigned_team },
    {
      new: true,
      runValidators: true
    }
  );

  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'assign_team',
    entity_type: 'JobProfile',
    entity_id: jobProfile._id,
    description: `Assigned team ${team.name} to job profile ${jobProfile.job_id}`,
    previous_state: previousState,
    new_state: jobProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: jobProfile
  });
});

// @desc    Change job profile status
// @route   PUT /api/v1/job-profiles/:id/status
// @access  Private/Admin/Manager
exports.changeJobStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return next(new ErrorResponse('Please provide status', 400));
  }

  // Validate status
  const validStatuses = [
    'draft',
    'open',
    'in_progress',
    'on_hold',
    'closed',
    'cancelled'
  ];

  if (!validStatuses.includes(status)) {
    return next(
      new ErrorResponse(
        `Status must be one of: ${validStatuses.join(', ')}`,
        400
      )
    );
  }

  const jobProfile = await JobProfile.findById(req.params.id);

  if (!jobProfile) {
    return next(
      new ErrorResponse(`Job profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = jobProfile.toObject();
  const previousStatus = jobProfile.status;

  // Update status
  jobProfile.status = status;
  await jobProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'change_status',
    entity_type: 'JobProfile',
    entity_id: jobProfile._id,
    description: `Changed job profile ${jobProfile.job_id} status from ${previousStatus} to ${status}`,
    previous_state: previousState,
    new_state: jobProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: jobProfile
  });
});

// @desc    Get jobs by status
// @route   GET /api/v1/job-profiles/status/:status
// @access  Private
exports.getJobsByStatus = asyncHandler(async (req, res, next) => {
  // Validate status
  const validStatuses = ['draft', 'open', 'in_progress', 'on_hold', 'closed', 'cancelled'];
  if (!validStatuses.includes(req.params.status)) {
    return next(
      new ErrorResponse(`Status must be one of: ${validStatuses.join(', ')}`, 400)
    );
  }

  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'view',
    entity_type: 'JobProfile',
    description: `Viewed job profiles with status ${req.params.status}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  const jobs = await JobProfile.find({ status: req.params.status })
    .populate({
      path: 'hiring_manager',
      select: 'name email'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    })
    .populate({
      path: 'applicants.interview_feedback.interviewer',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});

// @desc    Get jobs by department
// @route   GET /api/v1/job-profiles/department/:department
// @access  Private
exports.getJobsByDepartment = asyncHandler(async (req, res, next) => {
  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'view',
    entity_type: 'JobProfile',
    description: `Viewed job profiles in department ${req.params.department}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  const jobs = await JobProfile.find({ department: req.params.department })
    .populate({
      path: 'hiring_manager',
      select: 'name email'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    })
    .populate({
      path: 'applicants.interview_feedback.interviewer',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});

// @desc    Get job profiles by manager (alias for getHiringManagerJobs)
// @route   GET /api/v1/job-profiles/manager/:managerId
// @access  Private
exports.getJobsByManager = exports.getHiringManagerJobs;

// @desc    Get job profiles by team (alias for getTeamJobs)
// @route   GET /api/v1/job-profiles/team/:teamId
// @access  Private
exports.getJobsByTeam = exports.getTeamJobs;

// @desc    Get jobs assigned to hiring manager
// @route   GET /api/v1/users/:userId/hiring-jobs
// @access  Private
exports.getHiringManagerJobs = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.userId}`, 404)
    );
  }

  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'view',
    entity_type: 'JobProfile',
    description: `Viewed job profiles assigned to hiring manager ${user.name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  const jobs = await JobProfile.find({ hiring_manager: user._id })
    .populate({
      path: 'hiring_manager',
      select: 'name email'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    })
    .populate({
      path: 'applicants.interview_feedback.interviewer',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});

// @desc    Get jobs assigned to team
// @route   GET /api/v1/teams/:teamId/jobs
// @access  Private
exports.getTeamJobs = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.teamId);

  if (!team) {
    return next(
      new ErrorResponse(`Team not found with id of ${req.params.teamId}`, 404)
    );
  }

  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'view',
    entity_type: 'JobProfile',
    description: `Viewed job profiles assigned to team ${team.name}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  const jobs = await JobProfile.find({ assigned_team: team._id })
    .populate({
      path: 'hiring_manager',
      select: 'name email'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    })
    .populate({
      path: 'applicants.interview_feedback.interviewer',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});

// @desc    Search job profiles
// @route   GET /api/v1/job-profiles/search
// @access  Private
exports.searchJobs = asyncHandler(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new ErrorResponse('Please provide a search query', 400));
  }

  // Log the activity
  await UserActivityLog.create({
    user: req.user.id,
    action: 'search',
    entity_type: 'JobProfile',
    description: `Searched job profiles with query: ${query}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  // Create a regex search pattern
  const searchPattern = new RegExp(query, 'i');

  // Search in multiple fields
  const jobs = await JobProfile.find({
    $or: [
      { title: searchPattern },
      { description: searchPattern },
      { job_id: searchPattern },
      { job_type: searchPattern },
      { department: searchPattern },
      { location: searchPattern },
      { skills_required: searchPattern },
      { qualifications: searchPattern }
    ]
  })
    .populate([
      { path: 'hiring_manager', select: 'name email' },
      { path: 'assigned_team', select: 'name team_id' },
      { path: 'created_by', select: 'name email' },
      { path: 'interview_rounds.interviewers', select: 'name email' },
      { path: 'notes.created_by', select: 'name email' },
      { path: 'applicants.interview_feedback.interviewer', select: 'name email' }
    ])
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});
