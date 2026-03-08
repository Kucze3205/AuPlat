import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import routes from './routes/index.js';

const app = express();
const host = '0.0.0.0';

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', routes);
app.use(errorHandler);

app.listen(env.port, host, () => {
  console.log(`Auction server running on ${host}:${env.port}`);
});
