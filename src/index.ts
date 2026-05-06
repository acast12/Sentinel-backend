import './db.js';
import './subscriber.js';
import express from 'express';
import router from './routes.js';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(router);
app.listen(3001, () => console.log('API running on port 3001'));
