import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';

const db: DatabaseType = new Database('./readings.db');

const createTable = "CREATE TABLE IF NOT EXISTS readings(id INTEGER PRIMARY KEY AUTOINCREMENT , timestamp_ms INTEGER, temp REAL, humidity REAL, eco2 REAL, tvoc REAL, alert_temp_high INTEGER, alert_temp_low INTEGER, alert_humidity_high INTEGER, alert_humidity_low INTEGER, alert_eco2_warn INTEGER, alert_eco2_bad INTEGER, alert_tvoc_warn INTEGER, alert_tvoc_bad INTEGER, created_at TEXT DEFAULT (datetime('now', 'localtime')));"

db.exec(createTable);
db.exec('DROP INDEX IF EXISTS idx_readings_ts');
db.exec('CREATE INDEX IF NOT EXISTS idx_readings_cover ON readings(timestamp_ms, temp, humidity, eco2, tvoc)');

console.log('Database created');

export default db;
