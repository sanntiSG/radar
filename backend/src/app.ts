import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import healthRouter from './routes/health';
import signalsRouter from './routes/signals';
import trendsRouter from './routes/trends';
import hashtagsRouter from './routes/hashtags';
import productsRouter from './routes/products';
import insightsRouter from './routes/insights';
import historyRouter from './routes/history';
import watchlistsRouter from './routes/watchlists';
import alertsRouter from './routes/alerts';

const app = express();

// Middlewares
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/signals', signalsRouter);
app.use('/api/trends', trendsRouter);
app.use('/api/hashtags', hashtagsRouter);
app.use('/api/products', productsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/entity', historyRouter);
app.use('/api/watchlists', watchlistsRouter);
app.use('/api/alerts', alertsRouter);

// Error handler (must be last)
app.use(errorHandler);

export default app;
