# Investo Backend

This backend implements the Personal Investment Advisor core services.

Available endpoints:
- `POST /api/analyze` — run full agent (SSE stream of progress, final result includes `traceId`).
- `POST /api/score` — stateless quick scoring endpoint that returns recommendations fast.
- `GET /api/traces` — list persisted trace files and feature snapshots.
- `GET /api/trace/:sessionId` — retrieve persisted reasoning trace.
- `POST /api/scrape` — trigger a one-off scrape + normalization (saves feature snapshot).
- `GET /api/features/:sessionId` — load feature snapshot saved for a scrape run.

Storage:
- Traces are persisted to `data/traces/` as JSON files.
- Feature snapshots are stored in `data/features/`.

Quick start:

1. Install dependencies in project root if needed.
2. Start backend: `cd backend && node server.js`
3. Call quick scoring:

```powershell
$body='{"location":"Lahore","budget":5000000,"riskTolerance":"Moderate","targetReturn":10}';
Invoke-RestMethod -Uri 'http://localhost:3001/api/score' -Method POST -Body $body -ContentType 'application/json'
```

Notes:
- A small in-memory cache is used for `POST /api/score` to speed repeated requests.
- The system uses local parsers in `src/ingestion` to create insights for scoring. These are stubs that read files in `data/sources`.

