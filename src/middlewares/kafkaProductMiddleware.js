const { sendProductEvent } = require('../kafka/producer');

/**
 * Middleware pour publier un événement Kafka après une action CRUD sur un produit.
 * 
 * @param {string} eventType - Type d'événement ('created', 'updated', 'deleted', 'stock-updated')
 * @returns {Function} Middleware Express
 */
const kafkaProductMiddleware = (eventType) => {
  const validEventTypes = ['created', 'updated', 'deleted', 'stock-updated'];
  
  if (!validEventTypes.includes(eventType)) {
    throw new Error(`Type d'événement invalide. Types valides: ${validEventTypes.join(', ')}`);
  }

  return async (req, res, next) => {
    try {
      // Attendre que la réponse soit envoyée avant de publier l'événement
      const originalSend = res.send;
      
      res.send = function(data) {
        // Appeler la méthode send originale
        originalSend.call(this, data);
        
        // Publier l'événement Kafka de manière asynchrone
        setImmediate(async () => {
          try {
            let eventData = {};
            
            // Construire les données de l'événement selon le type
            switch (eventType) {
              case 'created':
                eventData = {
                  typeEvenement: 'cree',
                  produit: res.locals.product || JSON.parse(data),
                  action: 'CREATE'
                };
                break;
                
              case 'updated':
                eventData = {
                  typeEvenement: 'modifie',
                  produit: res.locals.product || JSON.parse(data),
                  action: 'UPDATE',
                  anciennesDonnees: res.locals.oldProduct
                };
                break;
                
              case 'deleted':
                eventData = {
                  typeEvenement: 'supprime',
                  produit: res.locals.product,
                  action: 'DELETE'
                };
                break;
                
              case 'stock-updated':
                eventData = {
                  typeEvenement: 'stock-modifie',
                  produit: res.locals.product || JSON.parse(data),
                  action: 'STOCK_UPDATE',
                  ancienStock: res.locals.oldStock,
                  nouveauStock: res.locals.newStock
                };
                break;
            }
            
            // Publier sur le topic général des produits
            await sendProductEvent('produit-events', eventData);
            
            // Publier aussi sur des topics spécifiques selon le type
            if (eventType === 'stock-updated') {
              await sendProductEvent('produit-stock-updated', eventData);
            } else if (eventType === 'created') {
              await sendProductEvent('produit-created', eventData);
            }
            
            console.log(`✅ Événement Kafka publié: ${eventType}`);
          } catch (error) {
            console.error('❌ Erreur publication événement Kafka:', error);
          }
        });
      };
      
      next();
    } catch (error) {
      console.error('❌ Erreur middleware Kafka:', error);
      next(error);
    }
  };
};

/**
 * Middleware spécialisé pour les mises à jour de stock
 */
const kafkaStockUpdateMiddleware = () => {
  return async (req, res, next) => {
    try {
      // Sauvegarder l'ancien stock avant la modification
      if (req.product) {
        res.locals.oldStock = req.product.stock;
      }
      
      // Continuer vers le contrôleur
      next();
    } catch (error) {
      console.error('❌ Erreur middleware stock Kafka:', error);
      next(error);
    }
  };
};

module.exports = {
  kafkaProductMiddleware,
  kafkaStockUpdateMiddleware
};