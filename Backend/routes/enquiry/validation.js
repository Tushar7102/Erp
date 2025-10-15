const express = require('express');
const router = express.Router();
const {
  getLeadsForValidation,
  getValidationStats,
  getValidationSettings,
  validateLead,
  mergeLeads,
  exportValidationData,
  batchValidate,
  getValidationHistory
} = require('../../controllers/enquiry/validation');

// Get leads for validation with filters
router.get('/', getLeadsForValidation);

// Get validation statistics
router.get('/statistics', getValidationStats);

// Get validation settings
router.get('/settings', getValidationSettings);

// Update lead validation status
router.put('/:leadId', validateLead);

// Merge leads
router.post('/merge', mergeLeads);

// Export validation data
router.get('/export', exportValidationData);

// Batch validate leads
router.post('/batch', batchValidate);

// Get validation history
router.get('/history', getValidationHistory);

module.exports = router;