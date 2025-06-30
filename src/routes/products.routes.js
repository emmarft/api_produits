const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products.controller');
const auth = require('../middlewares/auth.middleware');

// CRUD
router.get('/', productsController.getAllProducts);
router.get('/:id', productsController.getProductById);
router.post('/', productsController.createProduct);
router.put('/:id', productsController.updateProduct);
router.delete('/:id', productsController.deleteProduct);

// Recherche
router.get('/search', productsController.searchProducts);

// Pagination
router.get('/paginate', productsController.paginateProducts);


// User
router.post('/', auth, productsController.createProduct);
router.put('/:id', auth, updateProduct);
router.delete('/:id', auth, deleteProduct);

module.exports = router;
