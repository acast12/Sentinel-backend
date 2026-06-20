import 'dotenv/config';
import mqtt from 'mqtt';
import db from './db.js';

const { MQTT_BROKER, MQTT_USERNAME, MQTT_PASSWORD } = process.env;

if (!MQTT_BROKER || !MQTT_USERNAME || !MQTT_PASSWORD) {
  throw new Error(`Missing MQTT env: broker=${!!MQTT_BROKER} user=${!!MQTT_USERNAME} pass=${!!MQTT_PASSWORD}`);
}
console.log(`MQTT target host: ${new URL(MQTT_BROKER).host}`);

const client = mqtt.connect(MQTT_BROKER, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    connectTimeout: 10_000,
    reconnectPeriod: 5_000,
});

const insert = db.prepare('INSERT INTO readings (timestamp_ms, temp, humidity, eco2, tvoc, alert_temp_high, alert_temp_low, alert_humidity_high, alert_humidity_low, alert_eco2_warn, alert_eco2_bad, alert_tvoc_warn, alert_tvoc_bad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

await new Promise(resolve => setTimeout(resolve, 3000));
client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe('sentinel/readings', (err) =>
        err ? console.error('Subscribe failed:', err) : console.log('Subscribed to sentinel/readings'));
});

client.on('error',   (err) => console.error('MQTT error:', err.message));
client.on('offline', ()    => console.warn('MQTT offline'));
client.on('close',   ()    => console.warn('MQTT connection closed'));

client.on('message', (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        insert.run(
        payload.ts,
        payload.temp,
        payload.humidity,
        payload.eco2,
        payload.tvoc,
        payload.alerts.temp_high ? 1 : 0,
        payload.alerts.temp_low ? 1 : 0,
        payload.alerts.humidity_high ? 1 : 0,
        payload.alerts.humidity_low ? 1 : 0,
        payload.alerts.eco2_warn ? 1 : 0,
        payload.alerts.eco2_bad ? 1 : 0,
        payload.alerts.tvoc_warn ? 1 : 0,
        payload.alerts.tvoc_bad ? 1 : 0
    );
    console.log('Inserted reading:', payload.ts);
        console.log('Inserted reading:', payload.ts);
    } catch (err) {
        console.error('Failed to process message:', err);
    }
});