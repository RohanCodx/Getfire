'use strict';
// db/database.js — uses Node.js v22+ built-in node:sqlite (no native compilation needed)
const { DatabaseSync } = require('node:sqlite');
const settings = require('../config');

let _db = null;

function getDb() {
  if (!_db) {
    _db = new DatabaseSync(settings.databaseFilePath);
    // Mirror Python's SQLite PRAGMA setup
    _db.exec("PRAGMA journal_mode = WAL");
    _db.exec("PRAGMA foreign_keys = ON");
    _db.exec("PRAGMA busy_timeout = 30000");
    _db.exec("PRAGMA synchronous = NORMAL");
  }
  return _db;
}

function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS hotspot_observations (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      observation_key         TEXT    NOT NULL UNIQUE,
      source_product          TEXT    NOT NULL,
      sensor                  TEXT    NOT NULL,
      satellite               TEXT,
      instrument              TEXT,
      processing_version      TEXT,
      processing_level        TEXT,
      latitude                REAL    NOT NULL,
      longitude               REAL    NOT NULL,
      h3_cell                 TEXT    NOT NULL,
      acquired_at_utc         TEXT    NOT NULL,
      acquired_date_utc       TEXT    NOT NULL,
      acquired_time_utc       TEXT,
      brightness_primary_k    REAL,
      brightness_secondary_k  REAL,
      primary_brightness_band TEXT,
      secondary_brightness_band TEXT,
      scan                    REAL,
      track                   REAL,
      frp_mw                  REAL,
      confidence_raw          TEXT,
      confidence_class        TEXT,
      daynight                TEXT,
      detection_type          TEXT,
      raw_payload_json        TEXT    NOT NULL,
      ingested_at_utc         TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS ix_hotspot_h3_cell       ON hotspot_observations (h3_cell);
    CREATE INDEX IF NOT EXISTS ix_hotspot_acquired_at   ON hotspot_observations (acquired_at_utc);
    CREATE INDEX IF NOT EXISTS ix_hotspot_acquired_date ON hotspot_observations (acquired_date_utc);
    CREATE INDEX IF NOT EXISTS ix_hotspot_sensor        ON hotspot_observations (sensor);
    CREATE INDEX IF NOT EXISTS ix_hotspot_satellite     ON hotspot_observations (satellite);
    CREATE INDEX IF NOT EXISTS ix_hotspot_lat_lon       ON hotspot_observations (latitude, longitude);
    CREATE INDEX IF NOT EXISTS ix_hotspot_date_sensor   ON hotspot_observations (acquired_date_utc, sensor);

    CREATE TABLE IF NOT EXISTS daily_cell_activity (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_date       TEXT    NOT NULL,
      h3_cell             TEXT    NOT NULL,
      center_lat          REAL    NOT NULL,
      center_lon          REAL    NOT NULL,
      modis_detections    INTEGER NOT NULL DEFAULT 0,
      viirs_detections    INTEGER NOT NULL DEFAULT 0,
      total_observations  INTEGER NOT NULL DEFAULT 0,
      modis_frp_mw_sum    REAL    NOT NULL DEFAULT 0.0,
      viirs_frp_mw_sum    REAL    NOT NULL DEFAULT 0.0,
      multi_sensor_cell   INTEGER NOT NULL DEFAULT 0,
      updated_at_utc      TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE (activity_date, h3_cell)
    );
    CREATE INDEX IF NOT EXISTS ix_daily_activity_date ON daily_cell_activity (activity_date);
    CREATE INDEX IF NOT EXISTS ix_daily_activity_cell ON daily_cell_activity (h3_cell);

    CREATE TABLE IF NOT EXISTS sync_runs (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      sources            TEXT    NOT NULL,
      west               REAL    NOT NULL,
      south              REAL    NOT NULL,
      east               REAL    NOT NULL,
      north              REAL    NOT NULL,
      start_date         TEXT,
      end_date           TEXT,
      records_fetched    INTEGER NOT NULL DEFAULT 0,
      records_inserted   INTEGER NOT NULL DEFAULT 0,
      records_updated    INTEGER NOT NULL DEFAULT 0,
      sync_status        TEXT    NOT NULL DEFAULT 'pending',
      error_message      TEXT,
      started_at_utc     TEXT    NOT NULL DEFAULT (datetime('now')),
      completed_at_utc   TEXT
    );
    CREATE INDEX IF NOT EXISTS ix_sync_runs_started ON sync_runs (started_at_utc);

    CREATE TABLE IF NOT EXISTS dataset_availability_cache (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      source_product   TEXT NOT NULL UNIQUE,
      min_date         TEXT,
      max_date         TEXT,
      checked_at_utc   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log(`[DB] Database initialized at ${settings.databaseFilePath}`);
}

function databaseFileExists() {
  const fs = require('fs');
  return fs.existsSync(settings.databaseFilePath);
}

module.exports = { getDb, initDb, databaseFileExists };
