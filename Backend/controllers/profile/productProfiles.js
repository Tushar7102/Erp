const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const ProductProfile = require('../../models/profile/ProductProfile');
const CustomerMaster = require('../../models/profile/CustomerMaster');
const Team = require('../../models/profile/Team');
const User = require('../../models/profile/User');
const UserActivityLog = require('../../models/profile/UserActivityLog');
const path = require('path');
const fs = require('fs');

// @desc    Get all product profiles
// @route   GET /api/v1/product-profiles
// @access  Private
exports.getProductProfiles = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single product profile
// @route   GET /api/v1/product-profiles/:id
// @access  Private
exports.getProductProfile = asyncHandler(async (req, res, next) => {
  const productProfile = await ProductProfile.findById(req.params.id)
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_sales_person',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    })
    .populate({
      path: 'documents.uploaded_by',
      select: 'name email'
    })
    .populate({
      path: 'notes.created_by',
      select: 'name email'
    });

  if (!productProfile) {
    return next(
      new ErrorResponse(`Product profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Log the view activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'view',
    entity_type: 'product_profile',
    entity_id: productProfile._id,
    description: `Viewed product profile ${productProfile.product_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: productProfile
  });
});

// @desc    Create new product profile
// @route   POST /api/v1/product-profiles
// @access  Private
exports.createProductProfile = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.created_by = req.user.id;

  // Check if customer exists
  if (req.body.customer) {
    const customer = await CustomerMaster.findById(req.body.customer);
    if (!customer) {
      return next(
        new ErrorResponse(`Customer not found with id of ${req.body.customer}`, 404)
      );
    }
  }

  // Check if assigned_team exists
  if (req.body.assigned_team) {
    const team = await Team.findById(req.body.assigned_team);
    if (!team) {
      return next(
        new ErrorResponse(`Team not found with id of ${req.body.assigned_team}`, 404)
      );
    }
  }

  // Check if assigned_sales_person exists
  if (req.body.assigned_sales_person) {
    const salesPerson = await User.findById(req.body.assigned_sales_person);
    if (!salesPerson) {
      return next(
        new ErrorResponse(`User not found with id of ${req.body.assigned_sales_person}`, 404)
      );
    }
  }

  // Calculate total_price if quantity and unit_price are provided
  if (req.body.quantity && req.body.unit_price) {
    req.body.total_price = req.body.quantity * req.body.unit_price;
  }

  const productProfile = await ProductProfile.create(req.body);

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'create',
    entity_type: 'product_profile',
    entity_id: productProfile._id,
    description: `Created product profile ${productProfile.product_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({
    success: true,
    data: productProfile
  });
});

// @desc    Update product profile
// @route   PUT /api/v1/product-profiles/:id
// @access  Private
exports.updateProductProfile = asyncHandler(async (req, res, next) => {
  let productProfile = await ProductProfile.findById(req.params.id);

  if (!productProfile) {
    return next(
      new ErrorResponse(`Product profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...productProfile.toObject() };

  // Check if customer exists if being updated
  if (req.body.customer) {
    const customer = await CustomerMaster.findById(req.body.customer);
    if (!customer) {
      return next(
        new ErrorResponse(`Customer not found with id of ${req.body.customer}`, 404)
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

  // Check if assigned_sales_person exists if being updated
  if (req.body.assigned_sales_person) {
    const salesPerson = await User.findById(req.body.assigned_sales_person);
    if (!salesPerson) {
      return next(
        new ErrorResponse(`User not found with id of ${req.body.assigned_sales_person}`, 404)
      );
    }
  }

  // Calculate total_price if quantity and unit_price are provided
  if (req.body.quantity && req.body.unit_price) {
    req.body.total_price = req.body.quantity * req.body.unit_price;
  } else if (req.body.quantity && !req.body.unit_price) {
    req.body.total_price = req.body.quantity * productProfile.unit_price;
  } else if (!req.body.quantity && req.body.unit_price) {
    req.body.total_price = productProfile.quantity * req.body.unit_price;
  }

  productProfile = await ProductProfile.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'product_profile',
    entity_id: productProfile._id,
    description: `Updated product profile ${productProfile.product_id}`,
    previous_state: previousState,
    new_state: productProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: productProfile
  });
});

// @desc    Delete product profile
// @route   DELETE /api/v1/product-profiles/:id
// @access  Private/Admin
exports.deleteProductProfile = asyncHandler(async (req, res, next) => {
  const productProfile = await ProductProfile.findById(req.params.id);

  if (!productProfile) {
    return next(
      new ErrorResponse(`Product profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store the profile data for activity log
  const deletedProfile = { ...productProfile.toObject() };

  // Delete all documents associated with this profile
  if (productProfile.documents && productProfile.documents.length > 0) {
    productProfile.documents.forEach(doc => {
      const filePath = `${process.env.FILE_UPLOAD_PATH}${doc.file_path}`;
      fs.unlink(filePath, err => {
        if (err && err.code !== 'ENOENT') {
          console.error(`Error deleting file: ${filePath}`, err);
        }
      });
    });
  }

  await productProfile.remove();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'delete',
    entity_type: 'product_profile',
    entity_id: productProfile._id,
    description: `Deleted product profile ${productProfile.product_id}`,
    previous_state: deletedProfile,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add note to product
// @route   POST /api/v1/product-profiles/:id/notes
// @access  Private
exports.addNote = asyncHandler(async (req, res, next) => {
  const productProfile = await ProductProfile.findById(req.params.id);

  if (!productProfile) {
    return next(
      new ErrorResponse(`Product profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Add user to note
  req.body.created_by = req.user.id;

  // Add note to product
  productProfile.notes.push(req.body);

  await productProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'product_profile',
    entity_id: productProfile._id,
    description: `Added note to product ${productProfile.product_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: productProfile.notes[productProfile.notes.length - 1]
  });
});

// @desc    Delete note
// @route   DELETE /api/v1/product-profiles/:id/notes/:noteId
// @access  Private
exports.deleteNote = asyncHandler(async (req, res, next) => {
  const productProfile = await ProductProfile.findById(req.params.id);

  if (!productProfile) {
    return next(
      new ErrorResponse(`Product profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the note
  const note = productProfile.notes.id(req.params.noteId);

  if (!note) {
    return next(
      new ErrorResponse(`Note not found with id of ${req.params.noteId}`, 404)
    );
  }

  // Remove the note
  note.remove();

  await productProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'product_profile',
    entity_id: productProfile._id,
    description: `Deleted note from product ${productProfile.product_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add document to product
// @route   POST /api/v1/product-profiles/:id/documents
// @access  Private
exports.addDocument = asyncHandler(async (req, res, next) => {
  const productProfile = await ProductProfile.findById(req.params.id);

  if (!productProfile) {
    return next(
      new ErrorResponse(`Product profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if file was uploaded
  if (!req.files || !req.files.file) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Make sure the file is an allowed type
  const fileTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
  const extname = fileTypes.test(path.extname(file.name).toLowerCase());

  if (!extname) {
    return next(new ErrorResponse(`Please upload a valid file`, 400));
  }

  // Create custom filename
  file.name = `${productProfile.product_id}_${Date.now()}${path.parse(file.name).ext}`;

  // Upload file to server
  file.mv(`${process.env.FILE_UPLOAD_PATH}/products/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    // Add document to product
    productProfile.documents.push({
      name: req.body.name || file.name,
      file_path: `/uploads/products/${file.name}`,
      document_type: req.body.document_type || 'other',
      uploaded_by: req.user.id
    });

    await productProfile.save();

    // Log the activity
    await UserActivityLog.create({
      user_id: req.user.id,
      action_type: 'update',
      entity_type: 'product_profile',
      entity_id: productProfile._id,
      description: `Added document to product ${productProfile.product_id}`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      data: productProfile.documents[productProfile.documents.length - 1]
    });
  });
});

// @desc    Delete document
// @route   DELETE /api/v1/product-profiles/:id/documents/:documentId
// @access  Private
exports.deleteDocument = asyncHandler(async (req, res, next) => {
  const productProfile = await ProductProfile.findById(req.params.id);

  if (!productProfile) {
    return next(
      new ErrorResponse(`Product profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Find the document
  const document = productProfile.documents.id(req.params.documentId);

  if (!document) {
    return next(
      new ErrorResponse(`Document not found with id of ${req.params.documentId}`, 404)
    );
  }

  // Delete file from server
  const filePath = `${process.env.FILE_UPLOAD_PATH}${document.file_path}`;
  fs.unlink(filePath, err => {
    if (err && err.code !== 'ENOENT') {
      console.error(err);
      return next(new ErrorResponse(`Problem with file deletion`, 500));
    }
  });

  // Remove the document
  document.remove();

  await productProfile.save();

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'update',
    entity_type: 'product_profile',
    entity_id: productProfile._id,
    description: `Deleted document from product ${productProfile.product_id}`,
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Assign product to team or sales person
// @route   PUT /api/v1/product-profiles/:id/assign
// @access  Private
exports.assignProduct = asyncHandler(async (req, res, next) => {
  let productProfile = await ProductProfile.findById(req.params.id);

  if (!productProfile) {
    return next(
      new ErrorResponse(`Product profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...productProfile.toObject() };

  // Check if team exists if assigned_team is provided
  if (req.body.assigned_team) {
    const team = await Team.findById(req.body.assigned_team);
    if (!team) {
      return next(
        new ErrorResponse(`Team not found with id of ${req.body.assigned_team}`, 404)
      );
    }
  }

  // Check if sales person exists if assigned_sales_person is provided
  if (req.body.assigned_sales_person) {
    const salesPerson = await User.findById(req.body.assigned_sales_person);
    if (!salesPerson) {
      return next(
        new ErrorResponse(`User not found with id of ${req.body.assigned_sales_person}`, 404)
      );
    }
  }

  // Update assignment fields
  const updateData = {};
  if (req.body.assigned_team) updateData.assigned_team = req.body.assigned_team;
  if (req.body.assigned_sales_person) updateData.assigned_sales_person = req.body.assigned_sales_person;

  productProfile = await ProductProfile.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'assign',
    entity_type: 'product_profile',
    entity_id: productProfile._id,
    description: `Assigned product ${productProfile.product_id}`,
    previous_state: previousState,
    new_state: productProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: productProfile
  });
});

// @desc    Change product status
// @route   PUT /api/v1/product-profiles/:id/status
// @access  Private
exports.changeProductStatus = asyncHandler(async (req, res, next) => {
  let productProfile = await ProductProfile.findById(req.params.id);

  if (!productProfile) {
    return next(
      new ErrorResponse(`Product profile not found with id of ${req.params.id}`, 404)
    );
  }

  // Store previous state for activity log
  const previousState = { ...productProfile.toObject() };
  const previousStatus = productProfile.status;

  // Validate status
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(req.body.status)) {
    return next(
      new ErrorResponse(`Invalid status: ${req.body.status}`, 400)
    );
  }

  // Update status
  productProfile = await ProductProfile.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    {
      new: true,
      runValidators: true
    }
  );

  // Log the activity
  await UserActivityLog.create({
    user_id: req.user.id,
    action_type: 'status_change',
    entity_type: 'product_profile',
    entity_id: productProfile._id,
    description: `Changed product ${productProfile.product_id} status from ${previousStatus} to ${productProfile.status}`,
    previous_state: previousState,
    new_state: productProfile.toObject(),
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    data: productProfile
  });
});

// @desc    Get products by status
// @route   GET /api/v1/product-profiles/status/:status
// @access  Private
exports.getProductsByStatus = asyncHandler(async (req, res, next) => {
  // Validate status
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(req.params.status)) {
    return next(
      new ErrorResponse(`Invalid status: ${req.params.status}`, 400)
    );
  }

  const products = await ProductProfile.find({ status: req.params.status })
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_sales_person',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get products by customer
// @route   GET /api/v1/customers/:customerId/products
// @access  Private
exports.getCustomerProducts = asyncHandler(async (req, res, next) => {
  const customer = await CustomerMaster.findById(req.params.customerId);

  if (!customer) {
    return next(
      new ErrorResponse(`Customer not found with id of ${req.params.customerId}`, 404)
    );
  }

  const products = await ProductProfile.find({ customer: customer._id })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_sales_person',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get products assigned to team
// @route   GET /api/v1/teams/:teamId/products
// @access  Private
exports.getTeamProducts = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.teamId);

  if (!team) {
    return next(
      new ErrorResponse(`Team not found with id of ${req.params.teamId}`, 404)
    );
  }

  const products = await ProductProfile.find({ assigned_team: team._id })
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'assigned_sales_person',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get products assigned to sales person
// @route   GET /api/v1/users/:userId/sales-products
// @access  Private
exports.getSalesPersonProducts = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.userId}`, 404)
    );
  }

  const products = await ProductProfile.find({ assigned_sales_person: user._id })
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Search products
// @route   GET /api/v1/product-profiles/search
// @access  Private
exports.searchProducts = asyncHandler(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new ErrorResponse('Please provide a search query', 400));
  }

  // Create search query
  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { product_id: { $regex: query, $options: 'i' } },
      { product_type: { $regex: query, $options: 'i' } },
      { specifications: { $regex: query, $options: 'i' } }
    ]
  };

  const products = await ProductProfile.find(searchQuery)
    .populate({
      path: 'customer',
      select: 'full_name company_name customer_id'
    })
    .populate({
      path: 'assigned_team',
      select: 'name team_id'
    })
    .populate({
      path: 'assigned_sales_person',
      select: 'name email'
    })
    .populate({
      path: 'created_by',
      select: 'name email'
    });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});
