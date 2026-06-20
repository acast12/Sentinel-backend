import { Router } from "express";
import db from './db.js';

const router = Router();


// GET /readings/latest
router.get('/readings/latest', (req, res) => {
    const row = db.prepare('SELECT * FROM readings ORDER BY id DESC LIMIT 1').get();
    res.json(row);
});

// GET /readings/history?from=&to=
const historyStmt = db.prepare(`
  SELECT
    (timestamp_ms / :bucket) * :bucket AS timestamp_ms,
    AVG(temp)     AS temp,
    AVG(humidity) AS humidity,
    AVG(eco2)     AS eco2,
    AVG(tvoc)     AS tvoc
  FROM readings
  WHERE timestamp_ms BETWEEN :from AND :to
  GROUP BY 1
  ORDER BY 1 ASC
`);

router.get('/readings/history', (req, res) => {
  const now  = Date.now();
  const from = Number(req.query.from) || now - 60 * 60 * 1000;
  const to   = Number(req.query.to)   || now;
  if (from >= to) return res.status(400).json({ error: 'from must be before to' });

  const bucketMs = Math.max(1000, Math.ceil((to - from) / 500));

  res.json(historyStmt.all({ bucket: bucketMs, from, to }));
});

// GET /readings/alerts
router.get('/readings/alerts', (req, res) => {
    const row = db.prepare('SELECT * FROM readings WHERE alert_temp_high = 1 OR alert_temp_low = 1 OR alert_humidity_high = 1 OR alert_humidity_low = 1 OR alert_eco2_warn = 1 OR alert_eco2_bad = 1 OR alert_tvoc_warn = 1 OR alert_tvoc_bad = 1 ORDER BY id DESC LIMIT 20').all();
    res.json(row);
});

export default router;
