const Product = require('../models/product.model');
const { sendProductEvent } = require('../kafka/producer');

// GET /api/products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: 'ID invalide' });
  }
};

// POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    const saved = await product.save();
    
    // Stocker le produit pour le middleware Kafka
    res.locals.product = saved;
    
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: 'Données invalides', error: err.message });
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    // Récupérer l'ancien produit pour comparaison
    const oldProduct = await Product.findById(req.params.id);
    if (!oldProduct) return res.status(404).json({ message: 'Produit non trouvé' });
    
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    // Stocker les données pour le middleware Kafka
    res.locals.product = updated;
    res.locals.oldProduct = oldProduct;
    
    // Vérifier si le stock a changé
    if (oldProduct.stock !== updated.stock) {
      res.locals.oldStock = oldProduct.stock;
      res.locals.newStock = updated.stock;
    }
    
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Erreur de mise à jour', error: err.message });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Produit non trouvé' });
    
    // Stocker le produit supprimé pour le middleware Kafka
    res.locals.product = deleted;
    
    res.json({ message: 'Produit supprimé', product: deleted });
  } catch (err) {
    res.status(400).json({ message: 'Erreur de suppression', error: err.message });
  }
};

// GET /api/products/search?q=motclé
exports.searchProducts = async (req, res) => {
  try {
    const query = req.query.q || '';
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/products/paginate?page=1&limit=10
exports.paginateProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const products = await Product.find().skip(skip).limit(limit);
    const total = await Product.countDocuments();
    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      products
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /api/products/:id/stock - Mise à jour spécifique du stock
exports.updateStock = async (req, res) => {
  try {
    const { stock } = req.body;
    
    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ message: 'Le stock doit être un nombre positif' });
    }
    
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    
    const oldStock = product.stock;
    product.stock = stock;
    const updated = await product.save();
    
    // Stocker les données pour le middleware Kafka
    res.locals.product = updated;
    res.locals.oldStock = oldStock;
    res.locals.newStock = stock;
    
    res.json({
      message: 'Stock mis à jour',
      product: updated,
      oldStock,
      newStock: stock
    });
  } catch (err) {
    res.status(400).json({ message: 'Erreur de mise à jour du stock', error: err.message });
  }
};

// GET /api/products/low-stock?threshold=10 - Produits avec stock faible
exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const products = await Product.find({ stock: { $lte: threshold } });
    res.json({
      threshold,
      count: products.length,
      products
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/products/:id/reserve - Réserver du stock
exports.reserveStock = async (req, res) => {
  try {
    const { quantity, commandeId } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'La quantité doit être positive' });
    }
    
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    
    if (product.stock < quantity) {
      return res.status(400).json({ 
        message: 'Stock insuffisant',
        available: product.stock,
        requested: quantity
      });
    }
    
    const oldStock = product.stock;
    product.stock -= quantity;
    const updated = await product.save();
    
    // Stocker les données pour le middleware Kafka
    res.locals.product = updated;
    res.locals.oldStock = oldStock;
    res.locals.newStock = updated.stock;
    res.locals.reservedQuantity = quantity;
    res.locals.commandeId = commandeId;
    
    res.json({
      message: 'Stock réservé',
      product: updated,
      reservedQuantity: quantity,
      remainingStock: updated.stock
    });
  } catch (err) {
    res.status(400).json({ message: 'Erreur de réservation', error: err.message });
  }
};

// POST /api/products/:id/release - Libérer du stock réservé
exports.releaseStock = async (req, res) => {
  try {
    const { quantity, commandeId } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'La quantité doit être positive' });
    }
    
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    
    const oldStock = product.stock;
    product.stock += quantity;
    const updated = await product.save();
    
    // Stocker les données pour le middleware Kafka
    res.locals.product = updated;
    res.locals.oldStock = oldStock;
    res.locals.newStock = updated.stock;
    res.locals.releasedQuantity = quantity;
    res.locals.commandeId = commandeId;
    
    res.json({
      message: 'Stock libéré',
      product: updated,
      releasedQuantity: quantity,
      newStock: updated.stock
    });
  } catch (err) {
    res.status(400).json({ message: 'Erreur de libération', error: err.message });
  }
};
