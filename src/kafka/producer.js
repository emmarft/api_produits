const { kafka, KAFKA_TOPICS } = require('../config/kafka');

/**
 * Service Kafka pour la production de messages du microservice Produits
 *
 * Ce service gère la connexion au broker Kafka et l'envoi de messages
 * pour les événements liés aux produits.
 */
class KafkaProducerService {
  constructor() {
    this.producer = kafka.producer();
    this.isConnected = false;
  }

  /**
   * Établit la connexion avec le broker Kafka
   */
  async connect() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log('✅ Kafka Producer connecté');
    } catch (error) {
      console.error('❌ Erreur connexion Kafka Producer:', error);
      throw error;
    }
  }

  /**
   * Ferme la connexion avec le broker Kafka
   */
  async disconnect() {
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log('🔌 Kafka Producer déconnecté');
    } catch (error) {
      console.error('❌ Erreur déconnexion Kafka Producer:', error);
    }
  }

  /**
   * Publie un événement de création de produit
   * @param {Object} productData Données du produit créé
   */
  async publishProductCreated(productData) {
    try {
      await this.producer.send({
        topic: KAFKA_TOPICS.PRODUCED.PRODUIT_CREATED,
        messages: [
          {
            key: productData._id.toString(),
            value: JSON.stringify(productData),
            headers: {
              'event-type': 'produit-created',
              'source': 'produits-service',
              'timestamp': Date.now().toString(),
            },
          },
        ],
      });
      console.log(`📤 Événement produit-created envoyé pour le produit ${productData._id}`);
    } catch (error) {
      console.error('❌ Erreur envoi événement produit-created:', error);
      throw error;
    }
  }

  /**
   * Publie un événement de mise à jour de produit
   * @param {Object} productData Données du produit mis à jour
   */
  async publishProductUpdated(productData) {
    try {
      await this.producer.send({
        topic: KAFKA_TOPICS.PRODUCED.PRODUIT_UPDATED,
        messages: [
          {
            key: productData._id.toString(),
            value: JSON.stringify(productData),
            headers: {
              'event-type': 'produit-updated',
              'source': 'produits-service',
              'timestamp': Date.now().toString(),
            },
          },
        ],
      });
      console.log(`📤 Événement produit-updated envoyé pour le produit ${productData._id}`);
    } catch (error) {
      console.error('❌ Erreur envoi événement produit-updated:', error);
      throw error;
    }
  }

  /**
   * Publie un événement de mise à jour de stock
   * @param {Object} stockData Données du stock mis à jour
   */
  async publishStockUpdated(stockData) {
    try {
      await this.producer.send({
        topic: KAFKA_TOPICS.PRODUCED.PRODUIT_STOCK_UPDATED,
        messages: [
          {
            key: stockData.produitId.toString(),
            value: JSON.stringify({
              ...stockData,
              timestamp: new Date().toISOString(),
              service: 'produits',
            }),
            headers: {
              'event-type': 'produit-stock-updated',
              'source': 'produits-service',
              'timestamp': Date.now().toString(),
            },
          },
        ],
      });
      console.log(`📤 Événement stock-updated envoyé pour le produit ${stockData.produitId}`);
    } catch (error) {
      console.error('❌ Erreur envoi événement stock-updated:', error);
      throw error;
    }
  }

  /**
   * Publie un événement de suppression de produit
   * @param {string} productId ID du produit supprimé
   */
  async publishProductDeleted(productId) {
    try {
      await this.producer.send({
        topic: KAFKA_TOPICS.PRODUCED.PRODUIT_DELETED,
        messages: [
          {
            key: productId.toString(),
            value: JSON.stringify({ id: productId }),
            headers: {
              'event-type': 'produit-deleted',
              'source': 'produits-service',
              'timestamp': Date.now().toString(),
            },
          },
        ],
      });
      console.log(`📤 Événement produit-deleted envoyé pour le produit ${productId}`);
    } catch (error) {
      console.error('❌ Erreur envoi événement produit-deleted:', error);
      throw error;
    }
  }

  /**
   * Méthode générique pour envoyer des événements (rétrocompatibilité)
   * @param {string} topic Topic Kafka
   * @param {Object} message Message à envoyer
   */
  async sendProductEvent(topic, message) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: message.produitId || message.id,
            value: JSON.stringify({
              ...message,
              timestamp: new Date().toISOString(),
              service: 'produits',
            }),
          },
        ],
      });
      console.log(`📤 Événement envoyé sur ${topic}:`, message);
    } catch (error) {
      console.error('❌ Erreur envoi événement Kafka:', error);
      throw error;
    }
  }
}

// Instance singleton
const kafkaProducerService = new KafkaProducerService();

// Fonctions d'export pour rétrocompatibilité
const connectProducer = () => kafkaProducerService.connect();
const sendProductEvent = (topic, message) => kafkaProducerService.sendProductEvent(topic, message);
const disconnectProducer = () => kafkaProducerService.disconnect();

module.exports = {
  KafkaProducerService,
  kafkaProducerService,
  connectProducer,
  sendProductEvent,
  disconnectProducer,
};