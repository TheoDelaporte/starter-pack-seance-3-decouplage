import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    burst_injection: {
      executor: 'per-vu-iterations',
      vus: 100,             // 100 chauffeurs virtuels simultanés
      iterations: 1,        // 1 ping par chauffeur (total 100 requêtes en rafale)
      maxDuration: '10s',
    },
  },
  thresholds: {
    // 100% des requêtes doivent répondre avec HTTP 202 en moins de 50 ms (p95 < 20 ms)
    http_req_duration: ['p(95)<50', 'p(99)<100'],
    http_req_failed: ['rate==0'],
  },
};

export default function () {
  const driverId = `DRV-${Math.floor(Math.random() * 1500) + 1}`;
  const payload = JSON.stringify({
    driverId: driverId,
    latitude: 48.8566 + (Math.random() - 0.5) * 0.1,
    longitude: 2.3522 + (Math.random() - 0.5) * 0.1,
    timestamp: Date.now(),
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post('http://localhost:3000/api/positions', payload, params);

  check(res, {
    'statut est 202 Accepted': (r) => r.status === 202,
    'temps réponse < 20ms': (r) => r.timings.duration < 20,
  });
}
