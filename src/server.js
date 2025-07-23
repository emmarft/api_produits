const app = require('./app');
const { initializeKafka, setupGracefulShutdown } = require('./kafka/index');

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  try {
    await initializeKafka();
    setupGracefulShutdown();
    console.log('Services Kafka initialisés avec succès');
  } catch (err) {
    console.error('Erreur de connexion aux services Kafka :', err);
  }
  console.log(`Serveur démarré sur le port ${PORT}`);
});
