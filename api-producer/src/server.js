import Fastify from 'fastify';
import { Queue } from 'bullmq';

const fastify = Fastify({ logger: true });

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

// File FIFO BullMQ connectée au broker Redis
const gpsQueue = new Queue('gps-pings', {
  connection: {
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: null,
  },
});

// Schéma de validation Fastify (rejet aux frontières réseau)
const pingSchema = {
  body: {
    type: 'object',
    required: ['driverId', 'latitude', 'longitude', 'timestamp'],
    properties: {
      pingId: { type: 'string' },
      driverId: { type: 'string' },
      latitude: { type: 'number', minimum: -90, maximum: 90 },
      longitude: { type: 'number', minimum: -180, maximum: 180 },
      timestamp: { type: 'integer' },
    },
  },
};

fastify.post('/api/positions', { schema: pingSchema }, async (request, reply) => {
  const ping = request.body;
  const pingId = ping.pingId || `ping_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Mission 1 (Découplage temporel & Load Leveling) :
  // 1. Ajouter le job dans la file BullMQ 'gps-pings'.
  // 2. Renvoyer immédiatement le statut HTTP 202 Accepted (< 10 ms) avec le pingId généré.
  // Objectif : libérer le client instantanément sans attendre le traitement lourd.
  
  return reply.code(501).send({ message: 'Not Implemented - À vous de concevoir le flux asynchrone' });
});

// Épreuve 4 (Observabilité & Backlog Monitor) :
// Exposer l'état en temps réel de la file BullMQ (waiting, active, completed, failed)
fastify.get('/metrics', async (request, reply) => {
  // Mission 4 : Récupérer les compteurs via gpsQueue.getJobCounts(...)
  return reply.code(501).send({ message: 'Not Implemented - À vous d’exposer les métriques de la queue' });
});

fastify.get('/health', async () => {
  return { status: 'OK', uptime: process.uptime() };
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`API Ingestion démarrée sur le port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
