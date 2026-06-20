import Database from 'better-sqlite3';
const db = new Database('./readings.db');

// How much data are we actually scanning?
const total = db.prepare('SELECT COUNT(*) AS n FROM readings').get().n;
const win7d = db.prepare('SELECT COUNT(*) AS n FROM readings WHERE timestamp_ms >= ?')
  .get(Date.now() - 7 * 24 * 60 * 60 * 1000).n;
console.log(`Total rows: ${total.toLocaleString()}`);
console.log(`Rows in last 7 days: ${win7d.toLocaleString()}  (expect ~60k for ONE seed run @10s)`);

// The actual fix — covering index (safe to re-run).
db.exec(`CREATE INDEX IF NOT EXISTS idx_readings_cover
  ON readings(timestamp_ms, temp, humidity, eco2, tvoc)`);

const sql = `
  SELECT (timestamp_ms / :bucket) * :bucket AS timestamp_ms,
         AVG(temp) AS temp, AVG(humidity) AS humidity,
         AVG(eco2) AS eco2, AVG(tvoc) AS tvoc
  FROM readings WHERE timestamp_ms BETWEEN :from AND :to
  GROUP BY 1 ORDER BY 1 ASC`;
const stmt = db.prepare(sql);

const RANGES = { '1H': 3600e3, '6H': 6 * 3600e3, '24H': 24 * 3600e3, '7D': 7 * 24 * 3600e3 };
const p = (ms) => { const to = Date.now(); return { bucket: Math.max(1000, Math.ceil(ms / 500)), from: to - ms, to }; };

console.log('\nPlan (7D):');
for (const r of db.prepare('EXPLAIN QUERY PLAN ' + sql).all(p(RANGES['7D']))) console.log('  ' + r.detail);

console.log('\nLatency (best of 5):');
for (const [label, ms] of Object.entries(RANGES)) {
  const params = p(ms); let best = Infinity, n = 0;
  for (let i = 0; i < 5; i++) { const t = performance.now(); n = stmt.all(params).length; best = Math.min(best, performance.now() - t); }
  console.log(`  ${label.padEnd(4)} ${best.toFixed(1).padStart(6)} ms  →  ${n} points`);
}
db.close();