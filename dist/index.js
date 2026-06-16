import './db.js';
import './subscriber.js';
import express from 'express';
import router from './routes.js';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(router);
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API running on port ${port}`));
//# sourceMappingURL=index.js.map