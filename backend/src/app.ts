import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { healthRouter } from './routes/health';
import { errorHandler, notFound } from './middlewares/errorHandler';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.use('/health', healthRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
