'use strict';
// services/firmsClient.js — mirrors Python's app/services/firms_client.py
const fetch = require('node-fetch');
const settings = require('../config');

const RECENT_SOURCES = new Set(['MODIS_NRT', 'VIIRS_SNPP_NRT', 'VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT']);
const HISTORICAL_SOURCES = new Set(['MODIS_SP', 'VIIRS_SNPP_SP', 'VIIRS_NOAA20_SP', 'VIIRS_NOAA21_SP']);
const ALL_SOURCES = new Set([...RECENT_SOURCES, ...HISTORICAL_SOURCES]);

const MAX_RETRIES = 4;
const BASE_BACKOFF_MS = 1500;

class FirmsAuthError extends Error {}
class FirmsRequestError extends Error {}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestWithRetries(url) {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), settings.nasaRequestTimeout);
      let response;
      try {
        response = await fetch(url, { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }

      const body = await response.text();
      if (body.includes('Invalid MAP_KEY') || body.includes('Invalid key')) {
        throw new FirmsAuthError('NASA FIRMS rejected the configured MAP_KEY.');
      }

      if (response.ok) {
        return body;
      }
      if (response.status === 429) {
        lastError = new FirmsRequestError('Rate limited by NASA FIRMS (429).');
        console.warn(`[FIRMS] 429 rate limit (attempt ${attempt}/${MAX_RETRIES})`);
      } else if (response.status >= 500 && response.status < 600) {
        lastError = new FirmsRequestError(`NASA FIRMS server error ${response.status}.`);
        console.warn(`[FIRMS] server error ${response.status} (attempt ${attempt}/${MAX_RETRIES})`);
      } else if (response.status === 401 || response.status === 403) {
        throw new FirmsAuthError(`NASA FIRMS rejected the request (${response.status}): ${body.slice(0, 100)}`);
      } else {
        throw new FirmsRequestError(`Unexpected NASA FIRMS response (HTTP ${response.status}): ${body.slice(0, 100)}`);
      }
    } catch (err) {
      if (err instanceof FirmsAuthError) throw err;
      if (err.name === 'AbortError') {
        lastError = new FirmsRequestError('NASA FIRMS request timed out.');
        console.warn(`[FIRMS] timeout (attempt ${attempt}/${MAX_RETRIES})`);
      } else if (err instanceof FirmsRequestError) {
        lastError = err;
      } else {
        lastError = new FirmsRequestError(`Transport error: ${err.message}`);
        console.warn(`[FIRMS] transport error (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`);
      }
    }

    if (attempt < MAX_RETRIES) {
      const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt - 1) + Math.random() * 500;
      await sleep(backoff);
    }
  }
  throw new FirmsRequestError(`NASA FIRMS request failed after ${MAX_RETRIES} attempts: ${lastError}`);
}

function parseCsv(body) {
  body = body.trim();
  if (!body) return [];
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] !== undefined ? vals[i].trim() : ''; });
    return obj;
  });
}

async function fetchAreaCsv(source, west, south, east, north, dayRange = 1, date = null) {
  if (!settings.firmsMapKey) throw new FirmsAuthError('FIRMS_MAP_KEY is not configured on this server.');
  if (!ALL_SOURCES.has(source)) throw new Error(`Unsupported FIRMS source product: ${source}`);
  if (dayRange < 1 || dayRange > 5) throw new Error('day_range must be between 1 and 5.');
  if (!(west < east && south < north)) throw new Error('Invalid bounding box.');

  const bbox = `${west},${south},${east},${north}`;
  let url = `${settings.firmsAreaBaseUrl}/${settings.firmsMapKey}/${source}/${bbox}/${dayRange}`;
  if (date) url += `/${date}`;

  const body = await requestWithRetries(url);
  return parseCsv(body);
}

async function fetchAvailability(source) {
  if (!settings.firmsMapKey) throw new FirmsAuthError('FIRMS_MAP_KEY is not configured on this server.');
  const url = `${settings.firmsAvailabilityUrl}/${settings.firmsMapKey}/${source}`;
  const body = await requestWithRetries(url);
  const rows = parseCsv(body);
  if (!rows.length) return null;
  const row = rows[0];
  const minDate = row.min_date || row.start_date;
  const maxDate = row.max_date || row.end_date;
  if (!minDate || !maxDate) return null;
  return { min_date: minDate, max_date: maxDate };
}

function splitDateRangeIntoBatches(startDate, endDate, maxDays = 5) {
  // startDate, endDate are Date objects
  if (endDate < startDate) throw new Error('endDate must not be before startDate.');
  const batches = [];
  let cursor = new Date(startDate);
  while (cursor <= endDate) {
    const remaining = Math.floor((endDate - cursor) / 86400000) + 1;
    const dayRange = Math.min(maxDays, remaining);
    batches.push([new Date(cursor), dayRange]);
    cursor.setDate(cursor.getDate() + dayRange);
  }
  return batches;
}

module.exports = {
  RECENT_SOURCES, HISTORICAL_SOURCES, ALL_SOURCES,
  FirmsAuthError, FirmsRequestError,
  fetchAreaCsv, fetchAvailability, splitDateRangeIntoBatches,
};
