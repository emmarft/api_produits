const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  paginateProducts
} = require('../controllers/products.controller');
const auth = require('../middlewares/auth.middleware');

// CRUD
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', auth, createProduct);
router.put('/:id', auth, updateProduct);
router.delete('/:id', auth, deleteProduct);

// Recherche
router.get('/search', searchProducts);

// Pagination
router.get('/paginate', paginateProducts);

module.exports = router;
