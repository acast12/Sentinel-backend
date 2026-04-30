import Database from 'better-sqlite3';
const db = new Database('./readings.db');

const createTable = "CREATE TABLE IF NOT EXISTS readings(id INTEGER PRIMARY KEY AUTOINCREMENT , timestamp_ms INTEGER, temp REAL, humidity REAL, eco2 REAL, tvoc REAL, alert_temp_high INTEGER, alert_temp_low INTEGER, alert_humidity_high INTEGER, alert_humidity_low INTEGER, alert_eco2_warn INTEGER, alert_eco2_bad INTEGER, alert_tvoc_warn INTEGER, alert_tvoc_bad INTEGER, created_at TEXT DEFAULT (datetime('now')));"

db.exec(createTable);

console.log('Database created');

export default db;
