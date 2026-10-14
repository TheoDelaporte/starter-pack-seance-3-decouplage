# Starter Pack — TP Découplage Temporel & Load Leveling

> **Module** : M1 — Architecture Logicielle, Design Patterns & Urbanisation SI  
> **Séance 3** : Boucle 4 — Résilience Distribuée & Load Leveling  
> **Durée** : 1h00  

---

## Architecture du Lab

Vous disposez d'un environnement pré-orchestré sous Docker Compose :

1. **`api-producer` (Port 3000)** : API Fastify chargée de l'ingestion non-bloquante (< 10 ms).
2. **`broker` (Port 6379)** : Redis 7 servant de tampon élastique FIFO.
3. **`gps-worker`** : Consommateur asynchrone simulant un traitement lourd (50 ms / message) avec traitement de l'idempotence.

```text
Chauffeurs Mobile (250 req/s)
         │
         ▼ (HTTP POST /api/positions)
┌──────────────────┐  Réponse immédiate (HTTP 202)
│   api-producer   │───────────────────────────────► 📱 Chauffeur libéré (< 10ms)
└────────┬─────────┘
         │ Empilement BullMQ
         ▼
┌──────────────────┐
│   Redis Broker   │ (Tampon élastique - Absorbe les pics)
└────────┬─────────┘
         │ Dépilage régulé
         ▼
┌──────────────────┐
│    gps-worker    │ (Traitement lourd 50ms + Déduplication idempotente)
└──────────────────┘
```

---

## Démarrage Rapide

```bash
# 1. Démarrer les conteneurs
docker compose up -d --build

# 2. Vérifier l'état de santé
docker compose ps

# 3. Ouvrir un terminal pour surveiller le worker
docker compose logs -f gps-worker
```

---

## Les 3 Épreuves du Crash-Test

### Épreuve 1 — Le Pic de Charge (Load Leveling)

---

### Épreuve 2 — Le Chaos Test (Panne du Worker)

---

### Épreuve 3 — L'Idempotence (Anti-Doublons)

---

### Épreuve 4 — Observabilité & Backlog Live 
