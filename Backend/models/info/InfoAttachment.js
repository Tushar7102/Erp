const mongoose = require('mongoose');
const path = require('path');

const InfoAttachmentSchema = new mongoose.Schema({
  attachment_id: {
    type: String,
    unique: true,
    default: function() {
      // Generate ID format: ATT-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      return `ATT-${dateStr}-XXXX`; // This will be replaced by pre-save hook
    }
  },
  info_profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfoProfile',
    required: [true, 'Info profile reference is required']
  },
  info_response: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfoResponse'
  },
  info_action: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfoAction'
  },
  attachment_type: {
    type: String,
    required: [true, 'Attachment type is required'],
    enum: [
      'Document',
      'Image',
      'Video',
      'Audio',
      'Spreadsheet',
      'Presentation',
      'PDF',
      'Text File',
      'Archive',
      'Other'
    ]
  },
  file_name: {
    type: String,
    required: [true, 'File name is required'],
    maxlength: [255, 'File name cannot exceed 255 characters']
  },
  original_file_name: {
    type: String,
    required: [true, 'Original file name is required']
  },
  file_path: {
    type: String,
    required: [true, 'File path is required']
  },
  file_url: {
    type: String
  },
  file_size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  file_size_formatted: {
    type: String
  },
  mime_type: {
    type: String,
    required: [true, 'MIME type is required']
  },
  file_extension: {
    type: String,
    required: [true, 'File extension is required']
  },
  file_hash: {
    type: String,
    unique: true
  },
  storage_type: {
    type: String,
    enum: ['Local', 'AWS S3', 'Google Cloud', 'Azure Blob', 'FTP', 'Other'],
    default: 'Local'
  },
  storage_details: {
    bucket_name: String,
    region: String,
    access_key: String,
    folder_path: String,
    cdn_url: String
  },
  upload_source: {
    type: String,
    enum: ['Web Portal', 'Email', 'WhatsApp', 'Mobile App', 'API', 'System', 'Bulk Upload'],
    default: 'Web Portal'
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader reference is required']
  },
  uploaded_by_customer: {
    type: Boolean,
    default: false
  },
  is_public: {
    type: Boolean,
    default: false
  },
  is_confidential: {
    type: Boolean,
    default: false
  },
  access_permissions: {
    view_roles: [String],
    download_roles: [String],
    edit_roles: [String],
    delete_roles: [String]
  },
  document_category: {
    type: String,
    enum: [
      'Identity Proof',
      'Address Proof',
      'Financial Document',
      'Legal Document',
      'Technical Specification',
      'User Manual',
      'Invoice',
      'Receipt',
      'Contract',
      'Agreement',
      'Report',
      'Screenshot',
      'Photo',
      'Video Recording',
      'Audio Recording',
      'Presentation',
      'Spreadsheet',
      'Other'
    ]
  },
  document_metadata: {
    title: String,
    description: String,
    author: String,
    subject: String,
    keywords: [String],
    creation_date: Date,
    modification_date: Date,
    page_count: Number,
    word_count: Number,
    language: String
  },
  processing_status: {
    type: String,
    enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Quarantined'],
    default: 'Pending'
  },
  virus_scan_status: {
    type: String,
    enum: ['Pending', 'Clean', 'Infected', 'Failed'],
    default: 'Pending'
  },
  virus_scan_result: {
    scan_engine: String,
    scan_date: Date,
    threats_found: [String],
    scan_details: String
  },
  ocr_status: {
    type: String,
    enum: ['Not Required', 'Pending', 'Completed', 'Failed'],
    default: 'Not Required'
  },
  ocr_text: {
    type: String,
    maxlength: [50000, 'OCR text cannot exceed 50000 characters']
  },
  thumbnail_path: String,
  preview_available: {
    type: Boolean,
    default: false
  },
  download_count: {
    type: Number,
    default: 0,
    min: 0
  },
  last_downloaded_at: Date,
  last_downloaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expiry_date: Date,
  is_archived: {
    type: Boolean,
    default: false
  },
  archived_at: Date,
  archived_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  retention_period_days: {
    type: Number,
    min: 1
  },
  auto_delete_at: Date,
  tags: [String],
  notes: String,
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  parent_attachment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InfoAttachment'
  },
  version_history: [{
    version: Number,
    file_path: String,
    file_size: Number,
    uploaded_at: Date,
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    change_notes: String
  }],
  ip_address: String,
  user_agent: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to generate sequential attachment_id
InfoAttachmentSchema.pre('save', async function(next) {
  if (this.attachment_id.includes('XXXX')) {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `ATT-${dateStr}`;
      
      const lastAttachment = await this.constructor.findOne(
        { attachment_id: { $regex: `^${prefix}` } },
        { attachment_id: 1 },
        { sort: { attachment_id: -1 } }
      );
      
      let nextNumber = 1;
      if (lastAttachment) {
        const lastNumber = parseInt(lastAttachment.attachment_id.split('-')[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.attachment_id = `${prefix}-${paddedNumber}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Pre-save hook to set file extension and formatted size
InfoAttachmentSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  
  // Extract file extension if not set
  if (!this.file_extension && this.original_file_name) {
    this.file_extension = path.extname(this.original_file_name).toLowerCase();
  }
  
  // Format file size
  if (this.file_size && !this.file_size_formatted) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (this.file_size === 0) {
      this.file_size_formatted = '0 Bytes';
    } else {
      const i = Math.floor(Math.log(this.file_size) / Math.log(1024));
      this.file_size_formatted = Math.round(this.file_size / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
  }
  
  // Set attachment type based on file extension if not set
  if (!this.attachment_type && this.file_extension) {
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
    const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    const audioExts = ['.mp3', '.wav', '.flac', '.aac', '.ogg'];
    const docExts = ['.doc', '.docx', '.txt', '.rtf'];
    const spreadsheetExts = ['.xls', '.xlsx', '.csv'];
    const presentationExts = ['.ppt', '.pptx'];
    const archiveExts = ['.zip', '.rar', '.7z', '.tar', '.gz'];
    
    if (this.file_extension === '.pdf') {
      this.attachment_type = 'PDF';
    } else if (imageExts.includes(this.file_extension)) {
      this.attachment_type = 'Image';
    } else if (videoExts.includes(this.file_extension)) {
      this.attachment_type = 'Video';
    } else if (audioExts.includes(this.file_extension)) {
      this.attachment_type = 'Audio';
    } else if (docExts.includes(this.file_extension)) {
      this.attachment_type = 'Text File';
    } else if (spreadsheetExts.includes(this.file_extension)) {
      this.attachment_type = 'Spreadsheet';
    } else if (presentationExts.includes(this.file_extension)) {
      this.attachment_type = 'Presentation';
    } else if (archiveExts.includes(this.file_extension)) {
      this.attachment_type = 'Archive';
    } else {
      this.attachment_type = 'Document';
    }
  }
  
  // Set auto delete date based on retention period
  if (this.retention_period_days && !this.auto_delete_at) {
    this.auto_delete_at = new Date(Date.now() + (this.retention_period_days * 24 * 60 * 60 * 1000));
  }
  
  next();
});

// Method to increment download count
InfoAttachmentSchema.methods.incrementDownloadCount = function(userId) {
  this.download_count += 1;
  this.last_downloaded_at = new Date();
  this.last_downloaded_by = userId;
  return this.save();
};

// Indexes for better performance
InfoAttachmentSchema.index({ info_profile: 1, created_at: -1 });
InfoAttachmentSchema.index({ attachment_type: 1 });
InfoAttachmentSchema.index({ uploaded_by: 1, created_at: -1 });
InfoAttachmentSchema.index({ file_hash: 1 });
InfoAttachmentSchema.index({ processing_status: 1 });
InfoAttachmentSchema.index({ virus_scan_status: 1 });
InfoAttachmentSchema.index({ expiry_date: 1 });
InfoAttachmentSchema.index({ auto_delete_at: 1 });

module.exports = mongoose.model('InfoAttachment', InfoAttachmentSchema);