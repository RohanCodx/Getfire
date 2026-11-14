'use strict';
// config.js — mirrors Python's app/core/config.py
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const settings = {
  firmsMapKey: process.env.FIRMS_MAP_KEY || '',
  firmsAreaBaseUrl: process.env.FIRMS_AREA_BASE_URL || 'https://firms.modaps.eosdis.nasa.gov/api/area/csv',
  firmsAvailabilityUrl: process.env.FIRMS_AVAILABILITY_URL || 'https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv',
  nasaRequestTimeout: parseInt(process.env.NASA_REQUEST_TIMEOUT || '30', 10) * 1000, // ms
  databasePath: process.env.DATABASE_PATH || './data/getfire.db',
  adminSyncToken: process.env.ADMIN_SYNC_TOKEN || '',
  corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:5173',
  h3Resolution: parseInt(process.env.H3_RESOLUTION || '8', 10),
  maxHotspotLimit: parseInt(process.env.MAX_HOTSPOT_LIMIT || '5000', 10),
  port: parseInt(process.env.PORT || '3000', 10),

  get corsOriginList() {
    return this.corsOrigins.split(',').map(o => o.trim()).filter(Boolean);
  },
  get databaseFilePath() {
    return path.resolve(this.databasePath);
  },
  get firmsConfigured() {
    return Boolean(this.firmsMapKey);
  },
  get adminTokenConfigured() {
    return Boolean(this.adminSyncToken);
  },
};

// Ensure database directory exists on startup
const dbDir = path.dirname(settings.databaseFilePath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

module.exports = settings;
