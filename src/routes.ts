import { Router } from "express";
import db from './db.js';

const router = Router();


// GET /readings/latest
router.get('/readings/latest', (req, res) => {
    const row = db.prepare('SELECT * FROM readings ORDER BY id DESC LIMIT 1').get();
    res.json(row);
});

// GET /readings/history?from=&to=
router.get('/readings/history', (req, res) => {
    const from = Number(req.query.from) || Date.now() - 60 * 60 * 1000;
    const to = Number(req.query.to) || Date.now();
    const range = to - from;

    // Sample rate based on range
    let nth = 1;
    if (range > 6 * 60 * 60 * 1000)  nth = 10;   // 6H+: every 5th
    if (range > 24 * 60 * 60 * 1000) nth = 30;  // 24H+: every 20th
    if (range > 3 * 24 * 60 * 60 * 1000) nth =120; // 3D+: every 60th

    const rows = db.prepare(
        'SELECT * FROM readings WHERE timestamp_ms BETWEEN ? AND ? ORDER BY timestamp_ms ASC'
    ).all(from, to) as any[];

    const thinned = rows.filter((_, i) => i % nth === 0);
    res.json(thinned);
});

// GET /readings/alerts
router.get('/readings/alerts', (req, res) => {
    const row = db.prepare('SELECT * FROM readings WHERE alert_temp_high = 1 OR alert_temp_low = 1 OR alert_humidity_high = 1 OR alert_humidity_low = 1 OR alert_eco2_warn = 1 OR alert_eco2_bad = 1 OR alert_tvoc_warn = 1 OR alert_tvoc_bad = 1 ORDER BY id DESC LIMIT 20').all();
    res.json(row);
});

export default router;
