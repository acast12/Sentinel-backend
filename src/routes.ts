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
    const { from, to } = req.query;
    const rows = db.prepare('SELECT * FROM readings where timestamp_ms BETWEEN ? AND ? ORDER BY timestamp_ms ASC').all(from, to);
    res.json(rows);
});

// GET /readings/alerts
router.get('/readings/alerts', (req, res) => {
    const row = db.prepare('SELECT * FROM readings WHERE alert_temp_high = 1 OR alert_temp_low = 1 OR alert_humidity_high = 1 OR alert_humidity_low = 1 OR alert_eco2_warn = 1 OR alert_eco2_bad = 1 OR alert_tvoc_warn = 1 OR alert_tvoc_bad = 1').all();
    res.json(row);
});

export default router;
