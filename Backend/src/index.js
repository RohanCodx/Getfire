'use strict';
// src/index.js — Entry point, mirrors Python's app/main.py
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/database');
const settings = require('./config');

// Routes
const healthRouter   = require('./routes/health');
const datasetsRouter = require('./routes/datasets');
const hotspotsRouter = require('./routes/hotspots');
const calendarRouter = require('./routes/calendar');
const analyticsRouter = require('./routes/analytics');
const adminRouter    = require('./routes/admin');

// Initialize database on startup
initDb();

const app = express();

// CORS — permissive for all origins so any UI/web client can connect
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['*'],
}));

app.use(express.json());

// Root
app.get('/', (req, res) => {
  res.json({ name: 'GetFire API', docs: 'See API_CONTRACT.md', health: '/health' });
});

// Mount routers
app.use(healthRouter);
app.use(datasetsRouter);
app.use(hotspotsRouter);
app.use(calendarRouter);
app.use(analyticsRouter);
app.use(adminRouter);

// Global 404 handler returning JSON (never HTML)
app.use((req, res) => {
  res.status(404).json({ detail: `Not found: ${req.method} ${req.url}` });
});

// Global error handler returning JSON (never HTML)
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({ detail: err.message || 'Internal server error.' });
});

app.listen(settings.port, () => {
  console.log(`[GetFire] Server running on http://localhost:${settings.port}`);
  console.log(`[GetFire] FIRMS configured: ${settings.firmsConfigured}`);
});

module.exports = app;
