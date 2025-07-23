const { kafka, KAFKA_TOPICS } = require('../config/kafka');
const Product = require('../models/product.model');
const { kafkaProducerService } = require('./producer');

/**
 * Service consommateur Kafka pour le microservice Produits
 *
 * Ce service gère la connexion au broker Kafka et la consommation des messages
 * provenant des autres microservices.
 */
class KafkaConsumerService {
  constructor() {
    this.consumer = kafka.consumer({
      groupId: process.env.KAFKA_GROUP_ID || 'produits-service-group',
    });
    this.isConnected = false;
  }

  /**
   * Établit la connexion avec le broker Kafka
   */
  async connect() {
    try {
      await this.consumer.connect();
      this.isConnected = true;
      console.log('✅ Kafka Consumer connecté');
    } catch (error) {
      console.error('❌ Erreur connexion Kafka Consumer:', error);
      throw error;
    }
  }

  /**
   * S'abonne aux topics Kafka pertinents pour le microservice Produits
   */
  async subscribeToTopics() {
    try {
      // Abonnement aux topics des commandes
      await this.consumer.subscribe({ topic: KAFKA_TOPICS.CONSUMED.COMMANDE_EVENTS, fromBeginning: false });
      await this.consumer.subscribe({ topic: KAFKA_TOPICS.CONSUMED.COMMANDE_CREATED, fromBeginning: false });
      await this.consumer.subscribe({ topic: KAFKA_TOPICS.CONSUMED.COMMANDE_UPDATED, fromBeginning: false });
      await this.consumer.subscribe({ topic: KAFKA_TOPICS.CONSUMED.COMMANDE_DELETED, fromBeginning: false });

      // Abonnement aux topics des clients
      await this.consumer.subscribe({ topic: KAFKA_TOPICS.CONSUMED.CLIENT_EVENTS, fromBeginning: false });
      await this.consumer.subscribe({ topic: KAFKA_TOPICS.CONSUMED.CLIENT_CREATED, fromBeginning: false });

      // Configuration du gestionnaire de messages
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const key = message.key?.toString();
            const value = message.value ? JSON.parse(message.value.toString()) : null;
            const headers = this.parseHeaders(message.headers);

            console.log(`📨 Message reçu sur ${topic}:`, {
              key,
              eventType: headers['event-type'],
              source: headers.source,
              partition,
              offset: message.offset,
            });

            // Traitement des messages selon le topic
            switch (topic) {
              case KAFKA_TOPICS.CONSUMED.COMMANDE_CREATED:
                await this.handleCommandeCreated(value, headers);
                break;
              case KAFKA_TOPICS.CONSUMED.COMMANDE_UPDATED:
                await this.handleCommandeUpdated(value, headers);
                break;
              case KAFKA_TOPICS.CONSUMED.COMMANDE_DELETED:
                await this.handleCommandeDeleted(value, headers);
                break;
              case KAFKA_TOPICS.CONSUMED.CLIENT_CREATED:
                await this.handleClientCreated(value, headers);
                break;
              default:
                console.log(`ℹ️ Topic non géré: ${topic}`);
            }
          } catch (error) {
            console.error(`❌ Erreur traitement message sur ${topic}:`, error);
          }
        },
      });

      console.log('🎧 Consumer en écoute des événements...');
      console.log('📡 Topics écoutés:');
      Object.values(KAFKA_TOPICS.CONSUMED).forEach((topic) => {
        console.log(`  - ${topic}`);
      });
    } catch (error) {
      console.error('❌ Erreur souscription topics:', error);
      throw error;
    }
  }

  /**
   * Ferme la connexion avec le broker Kafka
   */
  async disconnect() {
    try {
      await this.consumer.disconnect();
      this.isConnected = false;
      console.log('🔌 Kafka Consumer déconnecté');
    } catch (error) {
      console.error('❌ Erreur déconnexion Kafka Consumer:', error);
    }
  }

  /**
   * Parse les en-têtes du message Kafka
   * @param {Object} headers En-têtes du message
   * @returns {Object} En-têtes parsés
   */
  parseHeaders(headers) {
    const result = {};
    for (const [key, value] of Object.entries(headers || {})) {
      if (value !== null && value !== undefined) {
        result[key] = value.toString();
      }
    }
    return result;
  }

  /**
   * Gère les événements de création de commande
   * @param {Object} data Données de la commande créée
   * @param {Object} headers En-têtes du message
   */
  async handleCommandeCreated(data, headers) {
    try {
      console.log('📥 Traitement événement commande-created:', { commandeId: data._id || data.id });

      // Réserver le stock pour chaque produit de la commande
      if (data.produits && Array.isArray(data.produits)) {
        for (const item of data.produits) {
          await this.reserverStock(item, data._id || data.id);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du traitement de commande-created:', error);
    }
  }

  /**
   * Gère les événements de mise à jour de commande
   * @param {Object} data Données de la commande mise à jour
   * @param {Object} headers En-têtes du message
   */
  async handleCommandeUpdated(data, headers) {
    try {
      console.log('📥 Traitement événement commande-updated:', { commandeId: data._id || data.id });
      // Logique métier pour traiter la mise à jour d'une commande
      // Par exemple, ajuster le stock si la quantité a changé
    } catch (error) {
      console.error('❌ Erreur lors du traitement de commande-updated:', error);
    }
  }

  /**
   * Gère les événements de suppression/annulation de commande
   * @param {Object} data Données de la commande supprimée
   * @param {Object} headers En-têtes du message
   */
  async handleCommandeDeleted(data, headers) {
    try {
      console.log('📥 Traitement événement commande-deleted:', { commandeId: data._id || data.id });

      // Restaurer le stock pour chaque produit de la commande annulée
      if (data.produits && Array.isArray(data.produits)) {
        for (const item of data.produits) {
          await this.restaurerStock(item, data._id || data.id);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du traitement de commande-deleted:', error);
    }
  }

  /**
   * Gère les événements de création de client
   * @param {Object} data Données du client créé
   * @param {Object} headers En-têtes du message
   */
  async handleClientCreated(data, headers) {
    try {
      console.log('📥 Traitement événement client-created:', { clientId: data._id || data.id });
      // Logique métier pour traiter la création d'un client
      // Par exemple, initialiser des données spécifiques au client
    } catch (error) {
      console.error('❌ Erreur lors du traitement de client-created:', error);
    }
  }

  /**
   * Réserve le stock pour un produit lors d'une commande
   * @param {Object} item Item de la commande
   * @param {string} commandeId ID de la commande
   */
  async reserverStock(item, commandeId) {
    try {
      const product = await Product.findById(item.produitId);
      if (product) {
        if (product.stock >= item.quantite) {
          product.stock -= item.quantite;
          await product.save();
          console.log(`📦 Stock réservé pour ${product.name}: ${product.stock}`);

          // Publier événement de mise à jour du stock
          await kafkaProducerService.publishStockUpdated({
            produitId: product._id,
            name: product.name,
            nouveauStock: product.stock,
            quantiteReservee: item.quantite,
            commandeId: commandeId,
          });
        } else {
          console.warn(`⚠️ Stock insuffisant pour ${product.name}`);
          // Ici on pourrait envoyer un événement d'erreur
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la réservation de stock:', error);
    }
  }

  /**
   * Restaure le stock pour un produit lors d'une annulation de commande
   * @param {Object} item Item de la commande
   * @param {string} commandeId ID de la commande
   */
  async restaurerStock(item, commandeId) {
    try {
      const product = await Product.findById(item.produitId);
      if (product) {
        product.stock += item.quantite;
        await product.save();
        console.log(`🔄 Stock restauré pour ${product.name}: ${product.stock}`);

        // Publier événement de mise à jour du stock
        await kafkaProducerService.publishStockUpdated({
          produitId: product._id,
          name: product.name,
          nouveauStock: product.stock,
          quantiteRestauree: item.quantite,
          commandeId: commandeId,
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la restauration de stock:', error);
    }
  }

  /**
   * Méthode legacy pour gérer les événements de commande (rétrocompatibilité)
   * @param {Object} message Message Kafka
   */
  async handleCommandeEvent(message) {
    try {
      const data = JSON.parse(message.value.toString());
      console.log('📥 Événement commande reçu (legacy):', data);

      switch (data.typeEvenement) {
        case 'cree':
          await this.handleCommandeCreated(data.commande);
          break;
        case 'annule':
          await this.handleCommandeDeleted(data.commande);
          break;
        default:
          console.log(`ℹ️ Événement non géré: ${data.typeEvenement}`);
      }
    } catch (error) {
      console.error('❌ Erreur traitement événement commande:', error);
    }
  }
}

// Instance singleton
const kafkaConsumerService = new KafkaConsumerService();

// Fonctions d'export pour rétrocompatibilité
const connectConsumer = () => kafkaConsumerService.connect();
const subscribeToTopics = () => kafkaConsumerService.subscribeToTopics();
const disconnectConsumer = () => kafkaConsumerService.disconnect();

module.exports = {
  KafkaConsumerService,
  kafkaConsumerService,
  connectConsumer,
  subscribeToTopics,
  disconnectConsumer,
};