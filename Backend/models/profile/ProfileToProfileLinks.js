const mongoose = require('mongoose');

const ProfileToProfileLinksSchema = new mongoose.Schema({
  link_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: LNK-YYYYMMDD-XXXX (where XXXX is sequential)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `LNK-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  source_profile_type: {
    type: String,
    required: true,
    enum: [
      'project',
      'product',
      'amc',
      'complaint',
      'info',
      'job',
      'site_visit'
    ]
  },
  source_profile_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // This is a dynamic reference based on source_profile_type
    refPath: 'source_profile_type_ref'
  },
  source_profile_type_ref: {
    type: String,
    required: true,
    enum: [
      'ProjectProfile',
      'ProductProfile',
      'AmcProfile',
      'ComplaintProfile',
      'InfoProfile',
      'JobProfile',
      'SiteVisitSchedule'
    ]
  },
  target_profile_type: {
    type: String,
    required: true,
    enum: [
      'project',
      'product',
      'amc',
      'complaint',
      'info',
      'job',
      'site_visit'
    ]
  },
  target_profile_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // This is a dynamic reference based on target_profile_type
    refPath: 'target_profile_type_ref'
  },
  target_profile_type_ref: {
    type: String,
    required: true,
    enum: [
      'ProjectProfile',
      'ProductProfile',
      'AmcProfile',
      'ComplaintProfile',
      'InfoProfile',
      'JobProfile',
      'SiteVisitSchedule'
    ]
  },
  relationship_type: {
    type: String,
    required: true,
    enum: [
      'parent',
      'dependent',
      'related',
      'follow-up'
    ]
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to generate sequential link_id
ProfileToProfileLinksSchema.pre('save', async function(next) {
  if (this.link_id.includes('XXXX')) {
    try {
      // Find the latest link with the same date prefix
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `LNK-${dateStr}`;
      
      const lastLink = await this.constructor.findOne(
        { link_id: { $regex: `^${prefix}` } },
        { link_id: 1 },
        { sort: { link_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastLink) {
        const lastNumber = parseInt(lastLink.link_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Pad with leading zeros to make it 4 digits
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.link_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('ProfileToProfileLinks', ProfileToProfileLinksSchema);