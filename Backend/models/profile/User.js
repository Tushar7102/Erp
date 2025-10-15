const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  user_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: USR-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `USR-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  username: {
    type: String,
    required: [true, 'Please add a username'],
    unique: true,
    trim: true,
    maxlength: [50, 'Username cannot be more than 50 characters']
  },
  first_name: {
    type: String,
    required: [true, 'Please add a first name']
  },
  last_name: {
    type: String,
    required: [true, 'Please add a last name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    match: [
      /^\+?[1-9]\d{9,14}$/,
      'Please add a valid phone number'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  password_plain: {
    type: String,
    select: false,
    default: undefined
  },
  role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  is_team_lead: {
    type: Boolean,
    default: false
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department name cannot be more than 100 characters']
  },
  is_active: {
    type: Boolean,
    default: false
  },
  email_verification_token: {
    type: String,
    default: null
  },
  email_verification_expire: {
    type: Date,
    default: null
  },
  last_login: {
    type: Date,
    default: null
  },
  otp_token: {
    type: String,
    default: null
  },
  otp_expiry: {
    type: Date,
    default: null
  },
  reset_password_token: {
    type: String,
    default: null
  },
  reset_password_expire: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  dailyTarget: {
    type: Number,
    default: 20
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // Do not hash password_plain, just leave as is for welcome email
  next();
});

// Update the updated_at field
UserSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Create user_id before saving
UserSchema.pre('save', async function(next) {
  // Only generate ID for new documents
  if (!this.isNew || this.user_id.indexOf('XXXX') === -1) {
    return next();
  }
  
  // Generate ID format: USR-YYYYMMDD-XXXX (where XXXX is sequential)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the highest user_id for today
  const lastUser = await this.constructor.findOne(
    { user_id: new RegExp(`^USR-${dateStr}`) },
    { user_id: 1 },
    { sort: { user_id: -1 } }
  );
  
  let sequence = 1;
  if (lastUser && lastUser.user_id) {
    const lastSequence = parseInt(lastUser.user_id.split('-')[2]);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  // Pad sequence with leading zeros
  const paddedSequence = sequence.toString().padStart(4, '0');
  this.user_id = `USR-${dateStr}-${paddedSequence}`;
  
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.reset_password_token = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.reset_password_expire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Generate OTP
UserSchema.methods.generateOTP = function() {
  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP and set to otp_token field
  this.otp_token = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  // Set expire
  this.otp_expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  return otp;
};

// Generate email verification token
UserSchema.methods.getEmailVerificationToken = function() {
  // Generate token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to email_verification_token field
  this.email_verification_token = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Set expire
  this.email_verification_expire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);