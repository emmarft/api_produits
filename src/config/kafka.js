const { Kafka } = require('kafkajs');

/**
 * Configuration Kafka pour le microservice Produits
 *
 * Cette configuration définit les paramètres de connexion à Kafka
 * pour le microservice Produits dans l'architecture microservices.
 */
const kafkaConfig = {
  // Brokers Kafka - par défaut localhost:9092, mais configurable via variable d'environnement
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),

  // ID client pour ce microservice
  clientId: process.env.KAFKA_CLIENT_ID || 'produits-service',

  // Configuration de retry
  retry: {
    initialRetryTime: 300,
    retries: 10,
  },

  // Décommentez et configurez si vous utilisez SSL en production
  // ssl: true,

  // Décommentez et configurez si vous utilisez SASL en production
  // sasl: {
  //   mechanism: 'plain',
  //   username: process.env.KAFKA_SASL_USERNAME,
  //   password: process.env.KAFKA_SASL_PASSWORD,
  // },
};

// Topics Kafka utilisés par ce microservice
const KAFKA_TOPICS = {
  // Topics produits par ce microservice
  PRODUCED: {
    PRODUIT_EVENTS: 'produit-events',
    PRODUIT_STOCK_UPDATED: 'produit-stock-updated',
    PRODUIT_CREATED: 'produit-created',
    PRODUIT_UPDATED: 'produit-updated',
    PRODUIT_DELETED: 'produit-deleted',
  },

  // Topics consommés par ce microservice
  CONSUMED: {
    COMMANDE_EVENTS: 'commande-events',
    COMMANDE_CREATED: 'commande-created',
    COMMANDE_UPDATED: 'commande-updated',
    COMMANDE_DELETED: 'commande-deleted',
    CLIENT_EVENTS: 'client-events',
    CLIENT_CREATED: 'client-created',
  },
};

// Instance Kafka
const kafka = new Kafka(kafkaConfig);

module.exports = {
  kafka,
  kafkaConfig,
  KAFKA_TOPICS,
};