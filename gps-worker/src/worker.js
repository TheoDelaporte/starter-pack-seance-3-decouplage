import { Worker } from 'bullmq';
import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const processingDelayMs = parseInt(process.env.PROCESSING_DELAY_MS || '50', 10);

const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
});

console.log(`[Worker] Initialisation du consommateur asynchrone (${redisHost}:${redisPort})...`);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const worker = new Worker(
  'gps-pings',
  async (job) => {
    const { pingId, driverId, latitude, longitude, timestamp } = job.data;

    // Mission 2 (Dépilage asynchrone régulé) :
    // Simuler le traitement lourd d'un ping GPS (50 ms) sans bloquer l'API.

    // Mission 3 (Bonus M1 - Idempotence & Résistance aux doublons) :
    // Deux pings avec le même pingId peuvent arriver sur le réseau (livraison at-least-once).
    // Concevoir un mécanisme (ex: avec Redis) pour détecter et ignorer les doublons.

    // TODO Métier : exécuter le traitement à votre charge
    await sleep(processingDelayMs);
    console.log(`[Worker] Job #${job.id} reçu pour pingId: ${pingId}`);

    return { status: 'PROCESSED', pingId };
  },
  {
    connection: {
      host: redisHost,
      port: redisPort,
    },
    concurrency: 5, // Traitement parallèle maîtrisé de 5 jobs simultanés
  }
);

worker.on('completed', (job) => {
  // Acquittement effectué (ACK BullMQ)
});

worker.on('failed', (job, err) => {
  console.error(`❌ [Worker] Échec sur le Job #${job?.id}: ${err.message}`);
});

process.on('SIGTERM', async () => {
  console.log('[Worker] Arrêt gracieux (Graceful Shutdown)...');
  await worker.close();
  await redisClient.quit();
  process.exit(0);
});
