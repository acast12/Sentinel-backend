# Sentinel — Backend

Node.js/TypeScript backend for the Sentinel air quality monitor. Subscribes to live sensor readings from an MQTT broker, stores them in SQLite, and exposes a REST API for the dashboard.

## Stack

- **Node.js + TypeScript** — runtime and language
- **MQTT** — subscribes to HiveMQ Cloud broker
- **better-sqlite3** — SQLite database
- **Express** — REST API

## Architecture

HiveMQ Cloud → subscriber.ts → SQLite → routes.ts → Dashboard

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/readings/latest` | Most recent reading |
| GET | `/readings/history?from=&to=` | Readings in a Unix ms time range |
| GET | `/readings/alerts` | Last 20 readings with any alert triggered |

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials
2. `npm install`
3. `npm run dev`

## Environment Variables

MQTT_BROKER=mqtts://yourcluster.s1.eu.hivemq.cloud:8883
MQTT_USERNAME=
MQTT_PASSWORD=

## Database Schema

Readings are stored in a SQLite table with columns for all four sensor values, eight alert flags, a Unix millisecond timestamp from the ESP32, and a server-side `created_at` timestamp.

## Notes

- The database file `readings.db` is excluded from version control
- Alerts are evaluated on the firmware side and stored as integers (0/1) in SQLite
- CORS is enabled for local development and the deployed frontend URL

## Deployment

Deployed on Render. Connect your GitHub repo to a new Render project and add the environment variables from `.env.example` in the Render dashboard. Render automatically detects the start script from `package.json` and assigns a public URL.
