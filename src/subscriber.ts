import 'dotenv/config';
import mqtt from 'mqtt';
import db from './db.js';


const client = mqtt.connect(process.env.MQTT_BROKER!, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
});

const insert = db.prepare('INSERT INTO readings (timestamp_ms, temp, humidity, eco2, tvoc, alert_temp_high, alert_temp_low, alert_humidity_high, alert_humidity_low, alert_eco2_warn, alert_eco2_bad, alert_tvoc_warn, alert_tvoc_bad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe('sentinel/readings', (err) => {
        if (err) {
            console.error('Subscribe failed:', err);
        } else {
            console.log('Subscribed to sentinel/readings');
        }
    });
});

client.on('error', (err) => {
    console.error('MQTT error:', err);
});

client.on('disconnect', () => {
    console.log('Disconnected from broker');
});

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