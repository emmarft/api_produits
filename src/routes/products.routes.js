const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  paginateProducts,
  updateStock,
  getLowStockProducts,
  reserveStock,
  releaseStock
} = require('../controllers/products.controller');
const auth = require('../middlewares/auth.middleware');
const { kafkaProductMiddleware, kafkaStockUpdateMiddleware } = require('../middlewares/kafkaProductMiddleware');

// Recherche et pagination (avant les routes avec paramètres)
router.get('/search', searchProducts);
router.get('/paginate', paginateProducts);
router.get('/low-stock', getLowStockProducts);

// CRUD avec événements Kafka
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', auth, createProduct, kafkaProductMiddleware('created'));
router.put('/:id', auth, updateProduct, kafkaProductMiddleware('updated'));
router.delete('/:id', auth, deleteProduct, kafkaProductMiddleware('deleted'));

// Gestion spécifique du stock avec événements Kafka
router.put('/:id/stock', auth, kafkaStockUpdateMiddleware(), updateStock, kafkaProductMiddleware('stock-updated'));
router.post('/:id/reserve', auth, kafkaStockUpdateMiddleware(), reserveStock, kafkaProductMiddleware('stock-updated'));
router.post('/:id/release', auth, kafkaStockUpdateMiddleware(), releaseStock, kafkaProductMiddleware('stock-updated'));

module.exports = router;
