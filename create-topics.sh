#!/bin/bash

# Attendre que Kafka soit prêt
echo "Attente du démarrage de Kafka..."
sleep 30

# Créer les topics pour la communication entre microservices
docker exec kafka kafka-topics --create --topic client-events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
docker exec kafka kafka-topics --create --topic commande-events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
docker exec kafka kafka-topics --create --topic produit-events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1

# Topics pour les événements cross-service
docker exec kafka kafka-topics --create --topic client-created --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
docker exec kafka kafka-topics --create --topic commande-created --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
docker exec kafka kafka-topics --create --topic commande-updated --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
docker exec kafka kafka-topics --create --topic produit-stock-updated --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1

echo "Topics créés avec succès!"

# Lister les topics créés
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092