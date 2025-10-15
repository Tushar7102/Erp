const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/profile/User');
const Role = require('../models/auth/Role');
const Session = require('../models/auth/Session');
const LoginAttempt = require('../models/auth/LoginAttempt');
const EmployeeRoleAssignment = require('../models/auth/EmployeeRoleAssignment');
const TeamUserMap = require('../models/profile/TeamUserMap');
const Team = require('../models/profile/Team');
const sendEmail = require('../utils/sendEmail');
const { getDeviceAndLocationInfo, isSameDevice, isDifferentLocation } = require('../utils/deviceTracker');

// Helper function to get client IP
function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.ip;
}

// Helper function to validate password policy
function validatePasswordPolicy(password, policy = {}) {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true
  } = policy;

  if (password.length < minLength) return false;
  if (requireUppercase && !/[A-Z]/.test(password)) return false;
  if (requireLowercase && !/[a-z]/.test(password)) return false;
  if (requireNumbers && !/\d/.test(password)) return false;
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

  return true;
}

// @desc    Register user (Admin only)
// @route   POST /api/auth/register
// @access  Private/Admin
exports.register = asyncHandler(async (req, res, next) => {
  const { first_name, last_name, email, phone, role_name, password, team_id, department } = req.body;
  let { username } = req.body;

  // Validate required fields
  if (!first_name || !last_name || !email || !role_name || !team_id) {
    return next(new ErrorResponse('Please provide first name, last name, email, role and team_id', 400));
  }
   
  // Generate username if not provided
  if (!username) {
    username = `${first_name}${last_name}`.toLowerCase().replace(/\s+/g, '');
  }

  // Check if user already exists
  const existingUserQuery = [{ email }];
  
  // Only check phone if it's provided
  if (phone) {
    existingUserQuery.push({ phone });
  }
  
  // Only check username if it's provided
  if (username) {
    existingUserQuery.push({ username });
  }
  
  const existingUser = await User.findOne({ 
    $or: existingUserQuery
  });

  if (existingUser) {
    return next(new ErrorResponse('User with this email, phone, or username already exists', 400));
  }

  // Check if team exists
  const team = await Team.findById(team_id);
  if (!team) {
    return next(new ErrorResponse('Team not found', 404));
  }

  // Find the role by role_id, role_name, or MongoDB _id
  let role;
  
  // First try to find by role_id
  role = await Role.findOne({ role_id: role_name });
  
  // If not found, try to find by role_name (case-insensitive)
  if (!role) {
    role = await Role.findOne({ 
      role_name: { $regex: new RegExp(`^${role_name}$`, 'i') } 
    });
  }
  
  // If still not found, try to find by MongoDB _id
  if (!role && role_name.match(/^[0-9a-fA-F]{24}$/)) {
    role = await Role.findById(role_name);
  }
  
  if (!role) {
    console.log(`Role lookup failed for: "${role_name}"`);
    const availableRoles = await Role.find({}, 'role_name');
    console.log('Available roles:', availableRoles.map(r => r.role_name));
    return next(new ErrorResponse(`Invalid role specified: "${role_name}". Available roles: ${availableRoles.map(r => r.role_name).join(', ')}`, 400));
  }

  // Validate password if provided
  if (password && !validatePasswordPolicy(password)) {
    return next(new ErrorResponse('Password does not meet policy requirements', 400));
  }

  // Create user
  const userData = {
    first_name,
    last_name,
    email,
    phone,
    username,
    team_id,
    department,
    role_id: role._id,
    is_active: false, // User needs email verification
    created_by: req.user._id
  };

  if (password) {
    userData.password = password;
  }

// Create user
  const user = await User.create(userData);

  // Add user to team
  await TeamUserMap.create({
    user_id: user._id,
    team_id: team_id,
    role_within_team: 'member',
    active_flag: true,
    created_by: req.user.id
  });
  
  // Add user to team_members array
  await Team.findByIdAndUpdate(
    team_id,
    { $addToSet: { team_members: user._id } }
  );

  // Create role assignment
  await EmployeeRoleAssignment.create({
    user_id: user._id,
    role_id: role._id,
    assigned_by: req.user._id,
    effective_from: new Date(),
    is_active: true
  });

  // Generate email verification token
  const verifyToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Create verification URL
  const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verifyToken}`;

  // Send verification email
  const message = `
    <h2>Welcome to Our Platform!</h2>
    <p>Hello ${user.name},</p>
    <p>Your account has been created successfully. Please click the link below to verify your email and activate your account:</p>
    <a href="${verifyUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p>${verifyUrl}</p>
    <p>This link will expire in 24 hours.</p>
    ${password ? '' : '<p><strong>Note:</strong> You will need to set your password after email verification.</p>'}
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Email Verification - Account Created',
      message
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Verification email sent.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.is_active
        }
      }
    });
  } catch (err) {
    user.email_verification_token = undefined;
    user.email_verification_expire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    email_verification_token: emailVerificationToken,
    email_verification_expire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired verification token', 400));
  }

  // Activate user
  user.is_active = true;
  user.email_verified = true;
  user.email_verification_token = undefined;
  user.email_verification_expire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully. Your account is now active.'
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, phone, password } = req.body;

  // Validate email/phone & password
  if ((!email && !phone) || !password) {
    return next(new ErrorResponse('Please provide an email/phone and password', 400));
  }

  // Check for user by email or phone
  let user;
  if (email) {
    user = await User.findOne({ email }).select('+password');
  } else if (phone) {
    user = await User.findOne({ phone }).select('+password');
  }

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if user is active
  if (!user.is_active) {
    return next(new ErrorResponse('Your account is not verified. Please check your email for verification link.', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    // Get device and location info for failed attempt
    const deviceLocationInfo = await getDeviceAndLocationInfo(req);
    
    // Log failed login attempt
    await LoginAttempt.create({
      user_id: user._id,
      email: email || user.email,
      ip_address: deviceLocationInfo.ip_address,
      device_info: JSON.stringify(deviceLocationInfo.device_info),
      location: deviceLocationInfo.location,
      status: 'failed',
      reason: 'Invalid password'
    });
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Update last login
  user.last_login = Date.now();
  await user.save({ validateBeforeSave: false });

  // Get device and location info for successful attempt
  const deviceLocationInfo = await getDeviceAndLocationInfo(req);
  
  // Log successful login attempt
  await LoginAttempt.create({
    user_id: user._id,
    email: email || user.email,
    ip_address: deviceLocationInfo.ip_address,
    device_info: JSON.stringify(deviceLocationInfo.device_info),
    location: deviceLocationInfo.location,
    status: 'success'
  });

  sendTokenResponse(user, 200, res, req);
});

// @desc    Login with OTP
// @route   POST /api/auth/login/otp
// @access  Public
exports.loginWithOTP = asyncHandler(async (req, res, next) => {
  const { phone, email } = req.body;

  // Validate input - either phone or email must be provided
  if (!phone && !email) {
    return next(new ErrorResponse('Please provide either a phone number or email', 400));
  }

  // Check for user based on provided credentials
  let user;
  let contactMethod;
  let contactValue;

  if (phone) {
    user = await User.findOne({ phone });
    contactMethod = 'phone';
    contactValue = phone;
  } else {
    user = await User.findOne({ email });
    contactMethod = 'email';
    contactValue = email;
  }

  if (!user) {
    return next(new ErrorResponse(`No user found with this ${contactMethod}`, 404));
  }

  // Check if user is active
  if (!user.is_active) {
    return next(new ErrorResponse('Your account is not verified. Please check your email for verification link.', 401));
  }

  // Generate OTP
  const otp = user.generateOTP();
  await user.save({ validateBeforeSave: false });

  // Prepare OTP message
  const otpMessage = `Your OTP for login is: ${otp}. Valid for 10 minutes.`;

  // Send OTP via email (SMS implementation can be added later)
  if (contactMethod === 'email') {
    try {
      await sendEmail({
        email: user.email,
        subject: 'Login OTP Verification',
        message: `<h3>Login Verification</h3><p>Your OTP for login is: <strong>${otp}</strong></p><p>Valid for 10 minutes.</p>`
      });
    } catch (err) {
      return next(new ErrorResponse('OTP could not be sent', 500));
    }
  }

  res.status(200).json({
    success: true,
    message: `OTP sent to your ${contactMethod}`
  });
});

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = asyncHandler(async (req, res, next) => {
  const { phone, email, otp } = req.body;

  // Validate input - either phone or email must be provided along with OTP
  if ((!phone && !email) || !otp) {
    return next(new ErrorResponse('Please provide either phone number or email along with OTP', 400));
  }

  // Check for user based on provided credentials
  let user;
  let contactMethod;

  if (phone) {
    user = await User.findOne({ phone });
    contactMethod = 'phone';
  } else {
    user = await User.findOne({ email });
    contactMethod = 'email';
  }

  if (!user) {
    return next(new ErrorResponse(`No user found with this ${contactMethod}`, 404));
  }

  // Check if OTP exists and is valid
  if (!user.otp_token || !user.otp_expiry) {
    return next(new ErrorResponse('No OTP was generated for this user', 400));
  }

  // Check if OTP is expired
  if (user.otp_expiry < Date.now()) {
    return next(new ErrorResponse('OTP has expired', 400));
  }

  // Verify OTP
  const hashedOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  if (user.otp_token !== hashedOTP) {
    return next(new ErrorResponse('Invalid OTP', 401));
  }

  // Clear OTP fields
  user.otp_token = undefined;
  user.otp_expiry = undefined;
  user.last_login = Date.now();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res, req);
});

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  // Get token from req.user which is set by the protect middleware
  if (req.user) {
    // Invalidate all sessions for this user
    await Session.updateMany(
      { user_id: req.user.id, is_active: true },
      { is_active: false }
    );
  }

  // Clear the cookie
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    sameSite: 'lax'
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  // Get user with role assignment
  const assignment = await EmployeeRoleAssignment.getActiveAssignment(req.user._id);
  
  const userData = {
    id: req.user._id,
    name: `${req.user.first_name} ${req.user.last_name}`,
    email: req.user.email,
    phone: req.user.phone,
    role: req.user.role_id || 'user', // Default role if role_id is not populated
    is_active: req.user.is_active,
    last_login: req.user.last_login,
    created_at: req.user.created_at
  };

  if (assignment) {
    userData.role_assignment = {
      assignment_id: assignment.assignment_id,
      role_name: assignment.role_id.role_name,
      assigned_at: assignment.assigned_at,
      effective_from: assignment.effective_from,
      effective_until: assignment.effective_until
    };
  }

  res.status(200).json({
    success: true,
    data: userData
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    phone: req.body.phone
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  // Validate new password
  if (!validatePasswordPolicy(req.body.newPassword)) {
    return next(new ErrorResponse('New password does not meet policy requirements', 400));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, req);
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url using frontend URL from environment
  const resetUrl = `${process.env.RESET_PASSWORD_URL}?token=${resetToken}`;

  const message = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          background: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #eee;
        }
        .logo {
          font-size: 28px;
          color: #007bff;
          font-weight: bold;
        }
        .title {
          font-size: 24px;
          color: #333;
          margin: 15px 0;
        }
        .content {
          padding: 20px 0;
          color: #333;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #007bff;
          color: #fff;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        .security-note {
          background: #e7f3ff;
          border: 1px solid #b3d9ff;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .link-box {
          background: #f8f9fa;
          border-left: 4px solid #007bff;
          padding: 15px;
          margin: 20px 0;
          word-break: break-all;
          font-family: monospace;
        }
        .warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
          color: #856404;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔐 CRM System</div>
          <div class="title">Password Reset Request</div>
        </div>
        
        <div class="content">
          <p>Hello,</p>
          <p>We received a request to reset your password for your CRM account. If you made this request, please click the button below to reset your password:</p>
          
          <center><a href="${resetUrl}" class="button">🔑 Reset My Password</a></center>
          
          <div class="security-note">
            <strong>🛡️ Security Note:</strong> This link will expire in <strong>10 minutes</strong> for your security.
          </div>
          
          <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
          
          <div class="link-box">
            ${resetUrl}
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated message from CRM System.</p>
          <p>For security reasons, please do not reply to this email.</p>
          <p style="font-size: 12px; color: #999;">© ${new Date().getFullYear()} CRM System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Token',
      message
    });

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.log(err);
    user.reset_password_token = undefined;
    user.reset_password_expire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    reset_password_token: resetPasswordToken,
    reset_password_expire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired reset token', 400));
  }

  // Validate new password
  if (!validatePasswordPolicy(req.body.password)) {
    return next(new ErrorResponse('Password does not meet policy requirements', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.reset_password_token = undefined;
  user.reset_password_expire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, req);
});

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;

  // Build query
  let query = {};
  
  // Filter by role if specified
  if (req.query.role_name) {
    const role = await Role.findOne({ role_name: req.query.role_name });
    if (role) {
      query.role_id = role._id;
    }
  }

  // Filter by active status if specified
  if (req.query.is_active !== undefined) {
    query.is_active = req.query.is_active === 'true';
  }

  // Search by name or email
  if (req.query.search) {
    query.$or = [
      { first_name: { $regex: req.query.search, $options: 'i' } },
      { last_name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .populate('role_id', 'role_name description permissions')
    .populate('team_id', 'name team_id')
    .sort({ created_at: -1 })
    .limit(limit)
    .skip(startIndex)
    .select('-password');

  // Pagination result
  const pagination = {};

  if (startIndex + limit < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pagination,
    data: users
  });
});

// @desc    Get single user (Admin only)
// @route   GET /api/auth/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Get role assignment details
  const assignment = await EmployeeRoleAssignment.getActiveAssignment(user._id);

  // Convert user data to object and ensure team_id is properly handled
  const userObj = user.toObject();
  
  // If team_id exists, ensure it's returned as ObjectId
  if (userObj.team_id) {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(userObj.team_id)) {
      // If somehow team_id is not a valid ObjectId, try to find the correct one
      const Team = require('../models/profile/Team');
      const team = await Team.findOne({ team_id: userObj.team_id });
      if (team) {
        userObj.team_id = team._id;
      }
    }
  }
  
  const userData = {
    ...userObj,
    role_assignment: assignment ? {
      assignment_id: assignment.assignment_id,
      role_name: assignment.role_id.role_name,
      assigned_at: assignment.assigned_at,
      effective_from: assignment.effective_from,
      effective_until: assignment.effective_until
    } : null
  };

  res.status(200).json({
    success: true,
    data: userData
  });
});

// @desc    Update user (Admin only)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  const { role_name, team_id, ...otherFields } = req.body;
  
  // Store original team_id for comparison later
  const originalTeamId = user.team_id;
  
  // Ensure team_id is properly handled - use MongoDB ObjectId (_id) instead of display ID
  let newTeamId = null;
  if (team_id === '' || team_id === null || team_id === undefined) {
    otherFields.team_id = null;
  } else if (team_id) {
    const mongoose = require('mongoose');
    // If team_id is a valid MongoDB ObjectId, use it directly
    if (mongoose.Types.ObjectId.isValid(team_id) && team_id.match(/^[0-9a-fA-F]{24}$/)) {
      newTeamId = new mongoose.Types.ObjectId(team_id);
      otherFields.team_id = newTeamId;
    } else {
      // If team_id is provided as a display ID (like TEM-20250926-0001), find the actual ObjectId
      const Team = require('../models/profile/Team');
      const team = await Team.findOne({ team_id: team_id });
      if (team) {
        newTeamId = team._id;
        otherFields.team_id = newTeamId;
      } else {
        return next(new ErrorResponse(`Invalid team ID: ${team_id}`, 400));
      }
    }
  }

  // Update user fields
  user = await User.findByIdAndUpdate(req.params.id, otherFields, {
    new: true,
    runValidators: true
  }).select('-password');
  
  // Handle team change if team_id was provided and is different from original
  if (newTeamId && (!originalTeamId || newTeamId.toString() !== originalTeamId.toString())) {
    const TeamUserMap = require('../models/profile/TeamUserMap');
    
    // Deactivate user from previous team if exists
    if (originalTeamId) {
      await TeamUserMap.updateMany(
        { user_id: user._id, team_id: originalTeamId, active_flag: true },
        { active_flag: false }
      );
      
      // Remove user from previous team's team_members array
      const Team = require('../models/profile/Team');
      await Team.findByIdAndUpdate(
        originalTeamId,
        { $pull: { team_members: user._id } }
      );
    }
    
    // Add user to new team
    const newTeamUserMap = await TeamUserMap.create({
      user_id: user._id,
      team_id: newTeamId,
      role_within_team: 'member', // Default role
      active_flag: true,
      created_by: req.user.id
    });
    
    // Add user to new team's team_members array
    await Team.findByIdAndUpdate(
      newTeamId,
      { $addToSet: { team_members: user._id } }
    );
  }

  // Handle role change if specified
  if (role_name) {
    // Check if the provided value is a role_id or role_name
    let role;
    
    // First try to find by role_id
    role = await Role.findOne({ role_id: role_name });
    
    // If not found, try to find by role_name
    if (!role) {
      role = await Role.findOne({ role_name });
    }
    
    // If still not found, try to find by MongoDB _id
    if (!role && role_name.match(/^[0-9a-fA-F]{24}$/)) {
      role = await Role.findById(role_name);
    }
    
    if (!role) {
      return next(new ErrorResponse(`Invalid role specified: "${role_name}"`, 400));
    }

    // Check if role is actually changing
    if (user.role_id.toString() !== role._id.toString()) {
      // Deactivate current role assignment
      await EmployeeRoleAssignment.updateMany(
        { user_id: user._id, is_active: true },
        { is_active: false, effective_until: new Date() }
      );

      // Create new role assignment
      await EmployeeRoleAssignment.create({
        user_id: user._id,
        role_id: role._id,
        assigned_by: req.user._id,
        effective_from: new Date(),
        is_active: true
      });

      // Update user role_id
      user.role_id = role._id;
      await user.save();
    }
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Deactivate user (Admin only)
// @route   PUT /api/auth/users/:id/deactivate
// @access  Private/Admin
exports.deactivateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Prevent admin from deactivating themselves
  if (user._id.toString() === req.user._id.toString()) {
    return next(new ErrorResponse('You cannot deactivate your own account', 400));
  }

  user.is_active = false;
  await user.save();

  // Deactivate all active sessions
  await Session.updateMany(
    { user_id: user._id, is_active: true },
    { is_active: false }
  );

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully'
  });
});

// @desc    Activate user (Admin only)
// @route   PUT /api/auth/users/:id/activate
// @access  Private/Admin
exports.activateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  user.is_active = true;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User activated successfully'
  });
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user._id.toString()) {
    return next(new ErrorResponse('You cannot delete your own account', 400));
  }

  // Get user's team_id before deletion
  const userTeamId = user.team_id;

  // Remove user from TeamUserMap
  const TeamUserMap = require('../models/profile/TeamUserMap');
  await TeamUserMap.deleteMany({ user_id: user._id });

  // Remove user from team_members array in Team model
  if (userTeamId) {
    const Team = require('../models/profile/Team');
    await Team.findByIdAndUpdate(
      userTeamId,
      { $pull: { team_members: user._id } }
    );
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get user login history (Admin only)
// @route   GET /api/auth/users/:id/login-history
// @access  Private/Admin
exports.getUserLoginHistory = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;

  const total = await LoginAttempt.countDocuments({ user_id: user._id });
  const loginHistory = await LoginAttempt.find({ user_id: user._id })
    .sort({ attempted_at: -1 })
    .limit(limit)
    .skip(startIndex);

  // Pagination result
  const pagination = {};

  if (startIndex + limit < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: loginHistory.length,
    total,
    pagination,
    data: loginHistory
  });
});

// @desc    Get all login attempts (Admin only)
// @route   GET /api/auth/login-attempts
// @access  Private/Admin
exports.getLoginAttempts = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;

  // Build query filters
  let query = {};

  if (req.query.userId) {
  query.user_id = req.query.userId;
}
  
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  if (req.query.search) {
    query.$or = [
      { email: { $regex: req.query.search, $options: 'i' } },
      { ip_address: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  if (req.query.start_date || req.query.end_date) {
    query.timestamp = {};
    if (req.query.start_date) {
      query.timestamp.$gte = new Date(req.query.start_date);
    }
    if (req.query.end_date) {
      query.timestamp.$lte = new Date(req.query.end_date);
    }
  }

  const total = await LoginAttempt.countDocuments(query);
  const loginAttempts = await LoginAttempt.find(query)
    .populate('user_id', 'name email role')
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(startIndex);

  // Pagination result
  const pagination = {};

  if (startIndex + limit < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: loginAttempts.length,
    total,
    pagination,
    data: loginAttempts
  });
});

// @desc    Get active sessions (Admin only)
// @route   GET /api/auth/sessions
// @access  Private/Admin
exports.getActiveSessions = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;

  const total = await Session.countDocuments({ is_active: true });
  const sessions = await Session.find({ is_active: true })
    .populate('user_id', 'first_name last_name email role')
    .sort({ issued_at: -1 })
    .limit(limit)
    .skip(startIndex);

  // Pagination result
  const pagination = {};

  if (startIndex + limit < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: sessions.length,
    total,
    pagination,
    data: sessions
  });
});

// @desc    Get session by ID (Admin only)
// @route   GET /api/auth/sessions/:id
// @access  Private/Admin
exports.getSessionById = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id)
    .populate('user_id', 'first_name last_name email role');

  if (!session) {
    return next(new ErrorResponse(`Session not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: session
  });
});

// @desc    Revoke session (Admin only)
// @route   PUT /api/auth/sessions/:id/revoke
// @access  Private/Admin
exports.revokeSession = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    return next(new ErrorResponse(`Session not found with id of ${req.params.id}`, 404));
  }

  // Mark session as terminated
  session.is_active = false;
  session.is_terminated = true;
  session.terminated_at = new Date();
  session.terminated_by = req.user._id;
  session.termination_reason = req.body.reason || 'Terminated by administrator';
  
  await session.save();

  res.status(200).json({
    success: true,
    message: 'Session terminated successfully',
    data: session
  });
});

// @desc    Block session and create new session ID (Admin only)
// @route   PUT /api/auth/sessions/:id/block
// @access  Private/Admin
exports.blockSession = asyncHandler(async (req, res, next) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    return next(new ErrorResponse(`Session not found with id of ${req.params.id}`, 404));
  }

  // Block the current session
  session.is_active = false;
  session.is_terminated = true;
  session.terminated_at = new Date();
  session.terminated_by = req.user._id;
  session.termination_reason = req.body.reason || 'Blocked by administrator';
  await session.save();
  
  // Create a new session with the same user data but new session ID
  const newSession = new Session({
    token: session.token,
    user_id: session.user_id,
    device_info: session.device_info,
    ip_address: session.ip_address,
    location: session.location,
    issued_at: new Date(),
    expires_at: new Date(Date.now() + process.env.JWT_EXPIRE_TIME * 24 * 60 * 60 * 1000),
    is_active: true
  });
  
  await newSession.save();

  res.status(200).json({
    success: true,
    message: 'Session blocked and new session created',
    data: {
      blockedSession: session,
      newSession: newSession
    }
  });
});

// Get token from model, create cookie and send response
const sendTokenResponse = async (user, statusCode, res, req = null) => {
  // Create token
  const token = user.getSignedJwtToken();

  // Get device and location information
  const deviceLocationInfo = req ? await getDeviceAndLocationInfo(req) : {
    device_info: {
      browser: { name: null, version: null },
      os: { name: null, version: null },
      device: { type: null, vendor: null, model: null },
      user_agent: null
    },
    ip_address: null,
    location: {
      country: null,
      region: null,
      city: null,
      timezone: null,
      latitude: null,
      longitude: null,
      isp: null
    }
  };
  
  // Store location data properly in the session

  // Check for existing active sessions for this user
  const existingSessions = await Session.find({ 
    user_id: user._id, 
    is_active: true 
  }).sort({ issued_at: -1 });

  // Check if this device was previously terminated
  const wasTerminated = req ? await Session.findOne({
    user_id: user._id,
    is_terminated: true,
    device_info: { $elemMatch: { $eq: deviceLocationInfo.device_info } }
  }).sort({ terminated_at: -1 }) : null;

  let sessionToUpdate = null;
  let shouldCreateNewSession = true;

  // Check if we should update an existing session or create a new one
  // Always create a new session if the device was previously terminated
  if (existingSessions.length > 0 && req && !wasTerminated) {
    for (const session of existingSessions) {
      // Check if it's the same device
      if (isSameDevice(session.device_info, deviceLocationInfo.device_info)) {
        // Same device - update the existing session
        sessionToUpdate = session;
        shouldCreateNewSession = false;
        break;
      }
    }
  }

  let newSession;
  
  if (shouldCreateNewSession) {
    // Create new session record with complete device and location info
    const sessionData = {
      token,
      user_id: user._id,
      ...deviceLocationInfo,
      issued_at: new Date(),
      expires_at: new Date(Date.now() + process.env.JWT_EXPIRE_TIME * 24 * 60 * 60 * 1000),
      is_active: true
    };

    newSession = await Session.create(sessionData);
    console.log('Created new session for user:', user._id, 'with device:', deviceLocationInfo.device_info.device?.type);
  } else {
    // Update existing session with new token and location info (if different)
    sessionToUpdate.token = token;
    sessionToUpdate.issued_at = new Date();
    sessionToUpdate.expires_at = new Date(Date.now() + process.env.JWT_EXPIRE_TIME * 24 * 60 * 60 * 1000);
    
    // Update IP and location if different
    if (sessionToUpdate.ip_address !== deviceLocationInfo.ip_address) {
      sessionToUpdate.ip_address = deviceLocationInfo.ip_address;
      sessionToUpdate.location = deviceLocationInfo.location;
      console.log('Updated session location for user:', user._id, 'from', sessionToUpdate.location?.city, 'to', deviceLocationInfo.location?.city);
    }
    
    await sessionToUpdate.save();
    newSession = sessionToUpdate;
    console.log('Updated existing session for user:', user._id, 'same device detected');
  }

  // Get complete user data with populated role
  const userWithRole = await User.findById(user._id).populate('role_id');
  console.log('User with role:', JSON.stringify(userWithRole, null, 2));
  
  // Get user's active sessions
  const activeSessions = await Session.find({ 
    user_id: user._id, 
    is_active: true 
  }).select('device_info ip_address issued_at expires_at').sort({ issued_at: -1 });
  console.log('Active sessions:', JSON.stringify(activeSessions, null, 2));

  // Get role assignment details
  let roleAssignment = null;
  try {
    roleAssignment = await EmployeeRoleAssignment.getActiveAssignment(user._id);
    console.log('Role assignment:', JSON.stringify(roleAssignment, null, 2));
  } catch (error) {
    console.log('Error getting role assignment:', error.message);
  }

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: 'lax'
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  const responseData = {
    success: true,
    token,
    user: {
      id: user._id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      phone: user.phone,
      role: userWithRole.role_id || null, // Complete role object
      role_assignment: roleAssignment ? {
        assignment_id: roleAssignment.assignment_id,
        role_name: roleAssignment.role_id.role_name,
        assigned_at: roleAssignment.assigned_at,
        effective_from: roleAssignment.effective_from,
        effective_until: roleAssignment.effective_until
      } : null,
      is_active: user.is_active,
      last_login: user.last_login,
      created_at: user.created_at,
      sessions: activeSessions // Complete sessions array
    }
  };
  
  console.log('Final response data:', JSON.stringify(responseData, null, 2));
  
  res.status(statusCode).cookie('token', token, options).json(responseData);
};