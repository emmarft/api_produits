require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const productRoutes = require('./routes/products.routes');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
connectDB();

app.use(express.json());
app.use(cors());
app.use(helmet());

// Utilisation des routes produits
app.use('/api/products', productRoutes);

// Middleware de gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur serveur', error: err.message });
});

const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

module.exports = app;