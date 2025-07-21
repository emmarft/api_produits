const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { connectDB } = require('./config/database');

const app = express();
connectDB();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());

// Routes
const productRoutes = require('./routes/products.routes');
const authRoutes = require('./routes/auth.routes');
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

// Swagger config
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API MSPR2',
      version: '1.0.0',
      description: 'Documentation Swagger pour le projet MSPR2',
    },
    servers: [{ url: 'http://localhost:3001' }],
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      }
    }
  },
  security: [{ bearerAuth: [] }],
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware d’erreur
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur serveur', error: err.message });
});

module.exports = app;
