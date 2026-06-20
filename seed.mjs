// seed.mjs — insert fake readings and benchmark the history query.
//
// Run from your BACKEND directory (same place you start the API) so it writes
// to the same readings.db the server reads:
//
//   node seed.mjs
//
// better-sqlite3 is already a dependency, so there's no build step and nothing
// extra to install. Rename to .ts if you'd rather keep it in the TS toolchain.

import Database from 'better-sqlite3';

// ---- config ----
const DAYS = 7;               // how many days of history to generate
const INTERVAL_SECONDS = 10;  // gap between readings (~ what the device sends)
// 7 days @ 10s ≈ 60,480 rows. Bump DAYS to 30+ for a harsher test.

const db = new Database('./readings.db');

// Ensure schema + index exist (mirrors db.ts) so this runs standalone.
db.exec(`CREATE TABLE IF NOT EXISTS readings(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp_ms INTEGER, temp REAL, humidity REAL, eco2 REAL, tvoc REAL,
  alert_temp_high INTEGER, alert_temp_low INTEGER,
  alert_humidity_high INTEGER, alert_humidity_low INTEGER,
  alert_eco2_warn INTEGER, alert_eco2_bad INTEGER,
  alert_tvoc_warn INTEGER, alert_tvoc_bad INTEGER,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
)`);
db.exec('CREATE INDEX IF NOT EXISTS idx_readings_ts ON readings(timestamp_ms)');

const insert = db.prepare(`INSERT INTO readings
  (timestamp_ms, temp, humidity, eco2, tvoc,
   alert_temp_high, alert_temp_low, alert_humidity_high, alert_humidity_low,
   alert_eco2_warn, alert_eco2_bad, alert_tvoc_warn, alert_tvoc_bad)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const drift = (v, step) => v + (Math.random() - 0.5) * step;

const intervalMs = INTERVAL_SECONDS * 1000;
const count = Math.floor((DAYS * 24 * 60 * 60 * 1000) / intervalMs);
const start = Date.now() - count * intervalMs;

// Smooth-ish random walk so the charts look like real data, not white noise.
let temp = 22, humidity = 45, eco2 = 450, tvoc = 100;

const seed = db.transaction(() => {
  for (let i = 0; i < count; i++) {
    const ts = start + i * intervalMs;

    temp     = clamp(drift(temp, 0.3), 16, 30);
    humidity = clamp(drift(humidity, 0.6), 30, 65);
    eco2     = clamp(drift(eco2, 25), 380, 1400);
    tvoc     = clamp(drift(tvoc, 12), 30, 600);

    // Occasional spikes so the alerts table actually has entries.
    if (Math.random() < 0.004) eco2 = 1200 + Math.random() * 1500; // warn / bad
    if (Math.random() < 0.004) tvoc = 300 + Math.random() * 600;   // warn / bad
    if (Math.random() < 0.002) temp = 36 + Math.random() * 4;      // temp_high

    insert.run(
      ts,
      +temp.toFixed(2), +humidity.toFixed(2), +eco2.toFixed(0), +tvoc.toFixed(0),
      temp > 35 ? 1 : 0,
      temp < 10 ? 1 : 0,
      humidity > 60 ? 1 : 0,
      humidity < 30 ? 1 : 0,
      eco2 > 1000 ? 1 : 0,
      eco2 > 2000 ? 1 : 0,
      tvoc > 220 ? 1 : 0,
      tvoc > 660 ? 1 : 0,
    );
  }
});

const t0 = performance.now();
seed();
const t1 = performance.now();

console.log(`Inserted ${count.toLocaleString()} rows in ${(t1 - t0).toFixed(0)} ms`);
console.log(`Total rows now: ${db.prepare('SELECT COUNT(*) AS n FROM readings').get().n.toLocaleString()}`);

// ---- benchmark the history query at each range (same SQL as the route) ----
const historyStmt = db.prepare(`
  SELECT (timestamp_ms / :bucket) * :bucket AS timestamp_ms,
         AVG(temp) AS temp, AVG(humidity) AS humidity,
         AVG(eco2) AS eco2, AVG(tvoc) AS tvoc
  FROM readings
  WHERE timestamp_ms BETWEEN :from AND :to
  GROUP BY 1 ORDER BY 1 ASC
`);

const RANGES = {
  '1H':  1 * 60 * 60 * 1000,
  '6H':  6 * 60 * 60 * 1000,
  '24H': 24 * 60 * 60 * 1000,
  '7D':  7 * 24 * 60 * 60 * 1000,
};

console.log('\nHistory query latency:');
for (const [label, ms] of Object.entries(RANGES)) {
  const to = Date.now();
  const from = to - ms;
  const bucket = Math.max(1000, Math.ceil((to - from) / 500));
  const b0 = performance.now();
  const rows = historyStmt.all({ bucket, from, to });
  const b1 = performance.now();
  console.log(`  ${label.padEnd(4)} ${(b1 - b0).toFixed(1).padStart(6)} ms  →  ${rows.length} points`);
}

db.close();
