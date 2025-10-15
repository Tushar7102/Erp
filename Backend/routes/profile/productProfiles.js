const express = require('express');
const {
  getProductProfiles,
  getProductProfile,
  createProductProfile,
  updateProductProfile,
  deleteProductProfile,
  addNote,
  deleteNote,
  addDocument,
  deleteDocument,
  assignProduct,
  changeProductStatus,
  getProductsByStatus,
  getCustomerProducts,
  getTeamProducts,
  getSalesPersonProducts,
  searchProducts
} = require('../../controllers/profile/productProfiles');

const ProductProfile = require('../../models/profile/ProductProfile');

// Include other resource routers
const router = express.Router({ mergeParams: true });

// Bring in middleware
const { protect, authorize } = require('../../middleware/auth');
const advancedResults = require('../../middleware/advancedResults');

// Set up routes
router
  .route('/')
  .get(
    protect,
    advancedResults(ProductProfile, [
      { path: 'customer', select: 'name email phone company_name' },
      { path: 'assigned_team', select: 'name team_id' },
      { path: 'sales_person', select: 'name email' },
      { path: 'created_by', select: 'name email' }
    ]),
    getProductProfiles
  )
  .post(protect, createProductProfile);

router
  .route('/:id')
  .get(protect, getProductProfile)
  .put(protect, updateProductProfile)
  .delete(protect, authorize('admin', 'manager'), deleteProductProfile);

// Notes routes
router
  .route('/:id/notes')
  .post(protect, addNote);

router
  .route('/:id/notes/:noteId')
  .delete(protect, deleteNote);

// Document routes
router
  .route('/:id/documents')
  .post(protect, addDocument);

router
  .route('/:id/documents/:documentId')
  .delete(protect, deleteDocument);

// Assignment routes
router
  .route('/:id/assign')
  .put(protect, authorize('admin', 'manager'), assignProduct);

// Status change route
router
  .route('/:id/status')
  .put(protect, changeProductStatus);

// Filter routes
router
  .route('/status/:status')
  .get(protect, getProductsByStatus);

router
  .route('/customer/:customerId')
  .get(protect, getCustomerProducts);

// Team and sales person routes
router
  .route('/team/:teamId')
  .get(protect, getTeamProducts);

router
  .route('/sales-person/:userId')
  .get(protect, getSalesPersonProducts);

// Search route
router
  .route('/search')
  .get(protect, searchProducts);

module.exports = router;
