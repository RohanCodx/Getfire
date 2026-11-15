# GetFire Node.js Backend

A complete Node.js/Express conversion of the GetFire Python/FastAPI backend.

## Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: SQLite via `better-sqlite3`
- **Geospatial**: H3 hexagonal indexing via `h3-js`
- **HTTP Client**: `node-fetch` (NASA FIRMS API)

## Setup

```bash
cp .env.example .env
# Edit .env with your FIRMS_MAP_KEY
npm install
npm start
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Root info |
| GET | `/health` | Health check |
| GET | `/api/v1/datasets` | List ingested datasets |
| GET | `/api/v1/summary` | Observation statistics |
| GET | `/api/v1/hotspots` | GeoJSON hotspot features |
| GET | `/api/v1/hotspots/:id` | Single hotspot detail |
| GET | `/api/v1/analytics/trend` | Daily/weekly/monthly trend |
| GET | `/api/v1/analytics/anomaly` | Robust Z-score anomaly detection |
| GET | `/api/v1/calendar` | Activity calendar |
| POST | `/api/v1/admin/sync` | Trigger NASA sync (requires X-Admin-Token) |

## Cloudflare Tunnel

```bash
# Install cloudflared
# Then run:
cloudflared tunnel --url http://localhost:3000
```
