const mongoose = require('mongoose');
require('dotenv').config();

let mongoServer;
let currentUri = null;

const connectDB = async () => {
  try {
    let uri;
    // Utilisation de mongodb-memory-server pour les tests
    if (process.env.NODE_ENV === 'test') {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      if (!mongoServer) {
        mongoServer = await MongoMemoryServer.create();
      }
      uri = mongoServer.getUri();
    } else {
      uri = process.env.MONGO_URI;
    }

    // Si déjà connecté mais sur un autre URI, ferme la connexion
    if (mongoose.connection.readyState === 1 && currentUri !== uri) {
      await mongoose.disconnect();
    }

    // Si pas connecté, connecte-toi
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(uri);
      currentUri = uri;
      console.log('MongoDB connected');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Pour fermer la connexion lors des tests
const closeDB = async () => {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = { connectDB, closeDB };
