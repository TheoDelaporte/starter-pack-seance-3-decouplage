# Starter Pack — TP Découplage Temporel & Load Leveling

> **Module** : M1 — Architecture Logicielle, Design Patterns & Urbanisation SI  
> **Séance 3** : Boucle 4 — Résilience Distribuée & Load Leveling  
> **Durée** : 1h00  

---

## 🎯 Architecture du Lab

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

## 🚀 Démarrage Rapide

```bash
# 1. Démarrer les conteneurs
docker compose up -d --build

# 2. Vérifier l'état de santé
docker compose ps

# 3. Ouvrir un terminal pour surveiller le worker
docker compose logs -f gps-worker
```

---

## 🧪 Les 3 Épreuves du Crash-Test

### Épreuve 1 — Le Pic de Charge (Load Leveling)
Injectez 100 pings GPS simultanés sur votre API :
```bash
node scripts/inject-load-node.js
```
*Critères d'évaluation :* 100% de réponses `202 Accepted`, latence p95 < 20 ms. Observer le décalage temporel : l'API se libère en une fraction de seconde pendant que le worker traite les messages à sa cadence propre.

---

### Épreuve 2 — Le Chaos Test (Panne du Worker)
Testez le découplage en tuant le consommateur :
```bash
docker compose stop gps-worker
```
Envoyez à nouveau 50 pings GPS :
```bash
node scripts/inject-load-node.js
```
*Questions d'analyse :*
- L'API d'ingestion est-elle tombée ?
- Que deviennent les messages dans Redis ?

Relancez le worker :
```bash
docker compose start gps-worker
docker compose logs -f gps-worker
```
*Observation :* Le worker rattrape le retard sans aucune perte de données.

---

### Épreuve 3 — L'Idempotence (Anti-Doublons)
Deux pings avec un identifiant identique (`pingId`) arrivent à 1 seconde d'intervalle :
```bash
node scripts/test-idempotence.js
```
Vérifiez dans les logs du worker que le second message est détecté comme doublon et neutralisé sans réexécuter le traitement métier.

---

### Épreuve 4 — Observabilité & Backlog Live (Tech Lead Challenge)
Exposez un endpoint de supervision du broker :
* **Route :** `GET /metrics` sur l'API (`api-producer`).
* **Objectif :** Renvoyer en temps réel le décompte des jobs BullMQ (`waiting`, `active`, `completed`, `failed`).
* **Validation :** Lancez une salve d'injection (`node scripts/inject-load-node.js`) et interrogez `curl http://localhost:3000/metrics` pour observer le backlog se résorber en direct.
