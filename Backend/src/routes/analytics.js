'use strict';
// routes/analytics.js
const express = require('express');
const { computeTrend } = require('../services/analytics');

const router = express.Router();

router.get(['/api/v1/analytics/trend', '/analytics/trend'], (req, res) => {
  const {
    west = -125,
    south = 25,
    east = -65,
    north = 50,
    start_date = '2026-11-01',
    end_date = '2026-11-14',
    sensor,
    group_by = 'day',
  } = req.query;

  const w = parseFloat(west), s = parseFloat(south), e = parseFloat(east), n = parseFloat(north);

  let points = computeTrend(w, s, e, n, start_date, end_date, group_by);

  if (sensor && ['MODIS', 'VIIRS'].includes(sensor.toUpperCase())) {
    const key = sensor.toLowerCase();
    points = points.map(p => ({
      ...p,
      modis_detections: key === 'modis' ? p.modis_detections : 0,
      viirs_detections: key === 'viirs' ? p.viirs_detections : 0,
      total_observations: key === 'modis' ? p.modis_detections : p.viirs_detections,
    }));
  }

  res.json({
    west: w, south: s, east: e, north: n,
    start_date, end_date, group_by,
    sensor_filter: sensor || null,
    points,
  });
});

router.get(['/api/v1/analytics/anomaly', '/analytics/anomaly'], (req, res) => {
  // Hardcoded mock baseline for demo so chart renders immediately
  res.json({
    current_value: 5120,
    historical_average: 3200
  });
});

module.exports = router;
