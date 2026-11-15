'use strict';
// routes/admin.js
const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../db/database');
const { runSync, SyncAlreadyRunningError } = require('../services/ingestion');
const { ALL_SOURCES } = require('../services/firmsClient');
const settings = require('../config');

const router = express.Router();

// Admin token middleware
function verifyAdminToken(req, res, next) {
  if (!settings.adminTokenConfigured) {
    return res.status(503).json({ detail: 'Admin synchronization is not configured on this server.' });
  }
  const token = req.headers['x-admin-token'];
  if (!token) {
    return res.status(401).json({ detail: 'Invalid or missing X-Admin-Token.' });
  }
  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(settings.adminSyncToken);
  if (tokenBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
    return res.status(401).json({ detail: 'Invalid or missing X-Admin-Token.' });
  }
  next();
}

router.post('/api/v1/admin/sync', verifyAdminToken, async (req, res) => {
  const { west, south, east, north, start_date, end_date, sources } = req.body;

  if (!Array.isArray(sources) || sources.length === 0) {
    return res.status(400).json({ detail: 'sources must be a non-empty array.' });
  }
  const invalid = sources.filter(s => !ALL_SOURCES.has(s));
  if (invalid.length) return res.status(400).json({ detail: `Unsupported source product(s): ${JSON.stringify(invalid)}` });

  const w = parseFloat(west), s = parseFloat(south), e = parseFloat(east), n = parseFloat(north);
  if (!(-180 <= w && w < e && e <= 180 && -90 <= s && s < n && n <= 90)) {
    return res.status(400).json({ detail: 'Invalid bounding box.' });
  }
  if (Boolean(start_date) !== Boolean(end_date)) {
    return res.status(400).json({ detail: 'start_date and end_date must be provided together.' });
  }

  try {
    const syncRun = await runSync({ sources, west: w, south: s, east: e, north: n, startDate: start_date || null, endDate: end_date || null });
    return res.json({
      sync_run_id: syncRun.id,
      status: syncRun.sync_status,
      records_fetched: syncRun.records_fetched,
      records_inserted: syncRun.records_inserted,
      records_updated: syncRun.records_updated,
      error_message: syncRun.error_message || null,
      started_at_utc: syncRun.started_at_utc,
      completed_at_utc: syncRun.completed_at_utc || null,
    });
  } catch (err) {
    if (err instanceof SyncAlreadyRunningError) return res.status(409).json({ detail: err.message });
    throw err;
  }
});

module.exports = router;
