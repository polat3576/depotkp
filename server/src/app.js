const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const env = require('./config/env');
const healthRoutes = require('./routes/health.routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();

const corsOrigins = env.CORS_ORIGIN === '*'
  ? '*'
  : env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(cors({ origin: corsOrigins, credentials: corsOrigins !== '*' }));
app.use(express.json());

// Demo/deploy kontrolü için kısa health endpoint'leri.
app.use('/health', healthRoutes);

// Tüm API route'ları buradan bağlanır.
app.use('/api', routes);

// Tanımsız route'lar ve hatalar için middleware'ler (her zaman en sonda olmalı)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
