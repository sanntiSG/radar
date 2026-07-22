import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { healthRouter } from './routes/health';
import { signalsRouter } from './routes/signals';
import { trendsRouter } from './routes/trends';
import { hashtagsRouter } from './routes/hashtags';
import { productsRouter } from './routes/products';
import { historyRouter } from './routes/history';
import { insightsRouter } from './routes/insights';
import { alertsRouter } from './routes/alerts';
import { watchlistsRouter } from './routes/watchlists';
import { sourcesRouter } from './routes/sources';
import { authRouter } from './routes/auth';
import { meRouter } from './routes/me';
import { exportRouter } from './routes/exportCsv';
import { metaRouter } from './routes/meta';
import { errorHandler, notFound } from './middlewares/errorHandler';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.use('/health', healthRouter);
  app.use('/api/signals', signalsRouter);
  app.use('/api/trends', trendsRouter);
  app.use('/api/hashtags', hashtagsRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/history', historyRouter);
  app.use('/api/insights', insightsRouter);
  app.use('/api/alerts', alertsRouter);
  app.use('/api/watchlists', watchlistsRouter);
  app.use('/api/sources', sourcesRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/me', meRouter);
  app.use('/api/export', exportRouter);
  app.use('/api/meta', metaRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
