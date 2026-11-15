import React, { useState, useEffect, useCallback, useMemo } from 'react';
import logoImg from './assets/logo.png';
import nasaMeatball from './assets/nasa-logo.svg';
import nasaWorm from './assets/nasa-worm.svg';
import MapComponent from './MapComponent';
import AnalyticsView from './AnalyticsView';
import LandingPage from './LandingPage';
import AIAssistant from './AIAssistant';
import {
  API_BASE_URL,
  NOMINATIM_SEARCH_URL,
  NASA_FIRMS_MAP_URL,
  GOOGLE_MAPS_SEARCH_URL,
} from './config';
import './App.css';

const emptyStats = {
  total_observations: 0,
  modis_observations: 0,
  viirs_observations: 0,
  active_h3_cells: 0,
  modis_frp_mw_total: 0,
  viirs_frp_mw_total: 0,
};

function parseConfidencePct(raw, cls) {
  const num = Number(raw);
  if (!isNaN(num) && raw !== null && raw !== '') return Math.min(100, Math.max(0, Math.round(num)));
  const c = String(cls || raw || '').toLowerCase();
  if (c === 'high' || c === 'h') return 95;
  if (c === 'nominal' || c === 'n') return 75;
  if (c === 'low' || c === 'l') return 35;
  return 75;
}

function formatFeatures(features) {
  return features.map((f, index) => {
    const coords = f.geometry?.coordinates || [0, 0];
    const props = f.properties || {};
    const confPct = parseConfidencePct(props.confidence_raw, props.confidence_class);
    return {
      id: props.observation_id || index,
      lat: coords[1],
      lng: coords[0],
      sensor: props.sensor || 'MODIS',
      satellite: props.satellite || 'Satellite',
      confidence: confPct,
      confidenceClass: props.confidence_class || 'nominal',
      location: `${coords[1].toFixed(3)}°N, ${coords[0].toFixed(3)}°E`,
      frp: Number(props.frp_mw) || 0,
      brightness: props.brightness_primary_k ? Math.round(props.brightness_primary_k * 10) / 10 : null,
      daynight: props.daynight || 'D',
      h3: props.h3_cell || null,
      time: props.acquired_at_utc ? props.acquired_at_utc.slice(11, 16) + ' UTC' : 'Live',
      date: props.acquired_at_utc ? props.acquired_at_utc.slice(0, 10) : '',
    };
  });
}

function App() {
  const [isAppOpen, setIsAppOpen] = useState(false);
  const [activeView, setActiveView] = useState('map');
  const [activeSensor, setActiveSensor] = useState('Both');
  const [selectedFire, setSelectedFire] = useState(null);
  const [mapStyle, setMapStyle] = useState('dark');
  const [mapBounds, setMapBounds] = useState(null);
  const [showLeft, setShowLeft] = useState(() => window.innerWidth > 920);
  const [showRight, setShowRight] = useState(() => window.innerWidth > 1120);
  const [liveFires, setLiveFires] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dbStorageMb, setDbStorageMb] = useState(null);

  const [sortBy, setSortBy] = useState('frp');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [toast, setToast] = useState('');

  const [briefingModalOpen, setBriefingModalOpen] = useState(false);
  const [briefingData, setBriefingData] = useState(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  }, []);

  const fetchAllTelemetry = useCallback(async () => {
    const [summaryRes, dbRes, hotspotsRes] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/api/v1/summary`),
      fetch(`${API_BASE_URL}/api/v1/system/db-stats`),
      fetch(`${API_BASE_URL}/api/v1/hotspots?west=-180&south=-90&east=180&north=90&limit=3500`),
    ]);

    let summaryData = null;
    let dbData = null;
    let hsData = null;

    if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
      summaryData = await summaryRes.value.json();
    }
    if (dbRes.status === 'fulfilled' && dbRes.value.ok) {
      dbData = await dbRes.value.json();
    }
    if (hotspotsRes.status === 'fulfilled' && hotspotsRes.value.ok) {
      hsData = await hotspotsRes.value.json();
    }

    return { summaryData, dbData, hsData };
  }, []);

  useEffect(() => {
    let active = true;
    fetchAllTelemetry()
      .then(({ summaryData, dbData, hsData }) => {
        if (!active) return;
        if (summaryData) {
          setStats(summaryData);
          setIsLive(true);
        }
        if (dbData && dbData.disk_size_mb !== undefined) {
          setDbStorageMb(dbData.disk_size_mb);
        }
        if (hsData && hsData.features) {
          setLiveFires(formatFeatures(hsData.features));
          setIsLive(true);
          setLastUpdated(new Date().toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [fetchAllTelemetry]);

  const handleSyncData = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    showToast('Synchronizing live NASA EOSDIS telemetry (MODIS + VIIRS)...');

    let bbox = { west: -180, south: -90, east: 180, north: 90 };
    if (mapBounds && mapBounds.getWest && mapBounds.getEast) {
      const w = Math.max(-180, Math.round(mapBounds.getWest() * 100) / 100);
      const s = Math.max(-90, Math.round(mapBounds.getSouth() * 100) / 100);
      const e = Math.min(180, Math.round(mapBounds.getEast() * 100) / 100);
      const n = Math.min(90, Math.round(mapBounds.getNorth() * 100) / 100);
      if (w < e && s < n) {
        bbox = { west: w, south: s, east: e, north: n };
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bbox,
          sources: ['MODIS_NRT', 'VIIRS_NOAA20_NRT'],
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      const { summaryData, dbData, hsData } = await fetchAllTelemetry();
      if (summaryData) setStats(summaryData);
      if (dbData && dbData.disk_size_mb !== undefined) setDbStorageMb(dbData.disk_size_mb);
      if (hsData && hsData.features) {
        setLiveFires(formatFeatures(hsData.features));
        setIsLive(true);
        setLastUpdated(new Date().toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }));
      }

      showToast(`Synchronized ${result.records_fetched || 0} NASA detections (${result.records_inserted || 0} new)`);
    } catch {
      showToast('Synchronization error: Verify backend API connection');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenBriefing = async () => {
    setBriefingModalOpen(true);
    setIsGeneratingBriefing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ai/briefing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          west: mapBounds?.getWest ? Math.max(-180, mapBounds.getWest()) : -180,
          south: mapBounds?.getSouth ? Math.max(-90, mapBounds.getSouth()) : -90,
          east: mapBounds?.getEast ? Math.min(180, mapBounds.getEast()) : 180,
          north: mapBounds?.getNorth ? Math.min(90, mapBounds.getNorth()) : 90,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBriefingData(data);
      }
    } catch {
      // Handled in UI
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`${NOMINATIM_SEARCH_URL}?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setSelectedFire({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          id: `search-${Date.now()}`,
          location: data[0].display_name.split(',')[0],
          sensor: 'TARGET',
          confidence: 100,
          frp: 0,
        });
        setActiveView('map');
        showToast(`Centered on ${data[0].display_name.split(',')[0]}`);
      } else {
        showToast('Coordinates or region not found');
      }
    } catch {
      showToast('Geocoding service unreachable');
    } finally {
      setIsSearching(false);
    }
  };

  const filteredFires = useMemo(() => {
    let list = activeSensor === 'Both'
      ? liveFires
      : liveFires.filter(f => f.sensor?.toUpperCase() === activeSensor.toUpperCase());

    if (confidenceThreshold > 0) {
      list = list.filter(f => (f.confidence || 0) >= confidenceThreshold);
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'frp') return b.frp - a.frp;
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      return 0;
    });
  }, [liveFires, activeSensor, confidenceThreshold, sortBy]);

  const topVisibleFires = useMemo(() => {
    return filteredFires
      .filter(fire => {
        if (!mapBounds || !mapBounds.contains) return true;
        return mapBounds.contains([fire.lat, fire.lng]);
      })
      .slice(0, 20);
  }, [filteredFires, mapBounds]);

  const totalFrpMw = useMemo(() => {
    return Math.round(((stats.modis_frp_mw_total || 0) + (stats.viirs_frp_mw_total || 0)) * 10) / 10;
  }, [stats]);

  const biomassBurnRateKgSec = useMemo(() => {
    return Math.round(totalFrpMw * 0.368 * 10) / 10;
  }, [totalFrpMw]);

  const downloadCSV = () => {
    const headers = 'ID,Latitude,Longitude,Sensor,Satellite,Confidence_Pct,FRP_MW,Brightness_K,DayNight,H3_Cell,Acquired_UTC\n';
    const rows = filteredFires
      .map(f => `${f.id},${f.lat},${f.lng},${f.sensor},${f.satellite},${f.confidence},${f.frp},${f.brightness || ''},${f.daynight},${f.h3 || ''},${f.date} ${f.time}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nasa_getfire_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const copyCoordinates = (lat, lng) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`)
      .then(() => showToast(`Copied coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`))
      .catch(() => showToast('Clipboard copy failed'));
  };

  const handleJumpFromAnalytics = (target) => {
    setSelectedFire(target);
    setActiveView('map');
    if (window.innerWidth <= 900) {
      setShowLeft(false);
    }
  };

  const handleSelectFireOnMap = useCallback((fire) => {
    setSelectedFire(fire);
    if (window.innerWidth <= 900) {
      setShowLeft(false);
      setShowRight(true);
    }
  }, []);

  const toggleLeftDrawer = () => {
    const next = !showLeft;
    setShowLeft(next);
    if (next && window.innerWidth <= 900) {
      setShowRight(false);
    }
  };

  const toggleRightDrawer = () => {
    const next = !showRight;
    setShowRight(next);
    if (next && window.innerWidth <= 900) {
      setShowLeft(false);
    }
  };

  if (!isAppOpen) return <LandingPage onEnter={() => setIsAppOpen(true)} />;

  return (
    <div className="dashboard-container">
      <header className="top-bar">
        <div className="logo-area">
          <button className="icon-btn" onClick={toggleLeftDrawer} aria-label="Toggle Telemetry Sidebar" title="Toggle Telemetry Controls">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          </button>

          <div className="brand-group" onClick={() => setIsAppOpen(false)} title="Return to Mission Intro">
            <div className="header-getfire-wrap">
              <img src={logoImg} alt="GetFire" className="brand-logo" />
            </div>
            <div className="brand-divider"></div>
            <img src={nasaMeatball} alt="NASA Insignia" className="nasa-header-logo" />
            <img src={nasaWorm} alt="NASA Worm" className="nasa-worm-header" />
          </div>
        </div>

        <div className="nav-tabs">
          <button className={`nav-tab ${activeView === 'map' ? 'active' : ''}`} onClick={() => setActiveView('map')}>
            ORBITAL MAP
          </button>
          <button className={`nav-tab ${activeView === 'analytics' ? 'active' : ''}`} onClick={() => setActiveView('analytics')}>
            ANALYTICS
          </button>
          <button className={`nav-tab ${activeView === 'data' ? 'active' : ''}`} onClick={() => setActiveView('data')}>
            DATA ({filteredFires.length})
          </button>
        </div>

        <div className="status-indicator">
          <button
            className={`btn-sync ${isSyncing ? 'syncing' : ''}`}
            onClick={handleSyncData}
            disabled={isSyncing}
            title="Ingest Live NASA EOSDIS FIRMS Data (MODIS + VIIRS)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span className="sync-text-full">{isSyncing ? 'SYNCING...' : 'SYNC NASA'}</span>
          </button>

          <button
            className="btn-briefing"
            onClick={handleOpenBriefing}
            title="Generate AI Incident Commander Briefing"
          >
            <span>BRIEFING</span>
          </button>

          {dbStorageMb !== null && (
            <span className="db-cap-pill" title="SQLite storage cap with automatic FIFO pruning at 100 MB">
              DB: {dbStorageMb}/100 MB
            </span>
          )}

          {activeView === 'map' && (
            <button className="icon-btn" onClick={toggleRightDrawer} aria-label="Toggle Target List" title="Toggle Anomalies List">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          )}

          <span className="live-time-label">
            {isLive ? `${lastUpdated || 'LIVE'} UTC` : 'OFFLINE'}
          </span>
          <div className={`status-dot ${isLive ? 'live' : 'demo'}`}></div>
        </div>
      </header>

      <div className="main-content">
        {(showLeft || (showRight && activeView === 'map')) && (
          <div
            className="mobile-drawer-backdrop"
            onClick={() => { setShowLeft(false); setShowRight(false); }}
          />
        )}

        <aside className={`sidebar ${showLeft ? 'open' : 'closed'}`}>
          <div className="mobile-drawer-head">
            <span>TELEMETRY CONTROLS</span>
            <button className="icon-btn" onClick={() => setShowLeft(false)} aria-label="Close Sidebar">✕</button>
          </div>
          <div className="sidebar-section">
            <h3>Search Region / Coordinates</h3>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="City, state, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="btn-secondary" disabled={isSearching}>
                {isSearching ? '...' : 'GO'}
              </button>
            </form>
          </div>

          <div className="sidebar-section">
            <h3>NASA Orbital Telemetry</h3>
            <div className="stat-grid">
              <div className="stat-box">
                <span className="stat-label">Total Synced Hotspots</span>
                <span className="stat-value">{(stats.total_observations || 0).toLocaleString()}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Filtered in View</span>
                <span className="stat-value text-cyan">{filteredFires.length.toLocaleString()}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total Radiative Power</span>
                <span className="stat-value text-orange">{totalFrpMw.toLocaleString()} MW</span>
              </div>
              <div className="stat-box" title="Estimated via Wooster et al. (2005) FRP-Biomass relation (0.368 kg/MJ)">
                <span className="stat-label">Est. Biomass Combusted</span>
                <span className="stat-value" style={{ color: '#FBBF24', fontSize: '0.92rem' }}>{biomassBurnRateKgSec.toLocaleString()} kg/s</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Sensor Harmonization</h3>
            <div className="sensor-toggles">
              {[
                { key: 'Both', label: 'HARMONIZED (MODIS + VIIRS)' },
                { key: 'VIIRS', label: 'VIIRS 375m (SNPP / NOAA-20)' },
                { key: 'MODIS', label: 'MODIS 1km (TERRA / AQUA)' },
              ].map((s) => (
                <button
                  key={s.key}
                  className={`sensor-btn ${activeSensor === s.key ? 'active' : ''}`}
                  onClick={() => setActiveSensor(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Min. Detection Confidence: <span className="text-cyan">{confidenceThreshold}%</span></h3>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="confidence-slider"
            />
          </div>

          <div className="sidebar-section">
            <h3>Sort Priority</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`btn-secondary ${sortBy === 'frp' ? 'active-sort' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setSortBy('frp')}
              >
                PEAK FRP
              </button>
              <button
                className={`btn-secondary ${sortBy === 'confidence' ? 'active-sort' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setSortBy('confidence')}
              >
                CONFIDENCE
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Basemap Telemetry Layer</h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['dark', 'satellite', 'terrain'].map((st) => (
                <button
                  key={st}
                  className={`btn-secondary ${mapStyle === st ? 'active-sort' : ''}`}
                  style={{ flex: 1, textTransform: 'uppercase', fontSize: '0.72rem', padding: '8px 4px' }}
                  onClick={() => setMapStyle(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section credits">
            <strong>FEED:</strong> NASA EOSDIS FIRMS (MODIS C6.1 &amp; VIIRS C2).<br />
            <strong>DB CAP:</strong> 100 MB Auto-Pruned SQLite WAL.
          </div>
        </aside>

        <main className="map-area-container">
          {activeView === 'map' && (
            <div className={`map-area map-${mapStyle}`}>
              <MapComponent
                fires={filteredFires}
                selectedFire={selectedFire}
                onSelectFire={handleSelectFireOnMap}
                mapStyle={mapStyle}
                onToast={showToast}
                onBoundsChange={setMapBounds}
              />
              {isLoading && <div className="map-banner">LOADING NASA ORBITAL TELEMETRY...</div>}
              {!isLoading && liveFires.length === 0 && (
                <div className="map-banner warn">
                  NO HOTSPOTS IN LOCAL CACHE — CLICK &ldquo;SYNC NASA LIVE&rdquo; TO INGEST SATELLITE FEED
                </div>
              )}
              <div className="legend">
                <div className="legend-title">INSTRUMENT CHANNELS</div>
                <div className="legend-item"><div className="dot modis"></div> MODIS (1km IR)</div>
                <div className="legend-item"><div className="dot viirs"></div> VIIRS (375m I-Band)</div>
                <div className="legend-note">Vector radius proportional to FRP (MW)</div>
              </div>
            </div>
          )}

          {activeView === 'analytics' && (
            <AnalyticsView fires={filteredFires} onJumpToLocation={handleJumpFromAnalytics} />
          )}

          {activeView === 'data' && (
            <div className="data-view">
              <div className="view-header flex-between">
                <div>
                  <div className="eyebrow-tag">STANDARDIZED ARCHIVE // CSV &amp; GEOJSON TELEMETRY</div>
                  <h2>NASA FIRMS Harmonized Dataset Export</h2>
                  <p>Displaying {Math.min(200, filteredFires.length)} of {filteredFires.length.toLocaleString()} verified satellite detections.</p>
                </div>
                <button onClick={downloadCSV} className="btn-primary">EXPORT CSV ({filteredFires.length})</button>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sensor</th>
                      <th>Spacecraft</th>
                      <th>Confidence</th>
                      <th>FRP (MW)</th>
                      <th>Temp (K)</th>
                      <th>Pass</th>
                      <th>Coordinates</th>
                      <th>H3 Index</th>
                      <th>Acquired UTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFires.slice(0, 200).map(f => (
                      <tr key={f.id} onClick={() => { setSelectedFire(f); setActiveView('map'); }} style={{ cursor: 'pointer' }}>
                        <td><span className={`sensor-tag ${f.sensor?.toLowerCase()}`}>{f.sensor}</span></td>
                        <td className="mono">{f.satellite}</td>
                        <td className="mono">{f.confidence}%</td>
                        <td className="mono text-orange">{f.frp} MW</td>
                        <td className="mono">{f.brightness ? `${f.brightness} K` : '—'}</td>
                        <td className="mono">{f.daynight === 'D' ? 'DAY' : 'NIGHT'}</td>
                        <td className="mono">{f.lat.toFixed(4)}, {f.lng.toFixed(4)}</td>
                        <td className="mono" style={{ fontSize: '0.74rem', color: '#71717A' }}>{f.h3 || '—'}</td>
                        <td className="mono">{f.date} {f.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {activeView === 'map' && (
          <aside className={`right-panel ${showRight ? 'open' : 'closed'}`}>
            {selectedFire ? (
              <div className="target-deep-dive">
                <div className="panel-header">
                  <h3>TARGET TELEMETRY</h3>
                  <button className="btn-secondary" onClick={() => setSelectedFire(null)}>CLOSE</button>
                </div>
                <div className="deep-dive-content">
                  <div className="dd-location">{selectedFire.location}</div>
                  <div className="dd-coords mono">
                    LAT {selectedFire.lat.toFixed(5)}° // LON {selectedFire.lng.toFixed(5)}°
                  </div>

                  <div className="dd-grid">
                    <div className="dd-stat">
                      <span className="dd-label">Instrument</span>
                      <span className={`sensor-tag ${selectedFire.sensor?.toLowerCase()}`}>{selectedFire.sensor}</span>
                    </div>
                    <div className="dd-stat">
                      <span className="dd-label">Spacecraft</span>
                      <span className="dd-value" style={{ fontSize: '0.92rem' }}>{selectedFire.satellite || 'NASA Polar'}</span>
                    </div>
                    <div className="dd-stat">
                      <span className="dd-label">Confidence</span>
                      <span className="dd-value">{selectedFire.confidence}% ({selectedFire.confidenceClass || 'nominal'})</span>
                    </div>
                    <div className="dd-stat">
                      <span className="dd-label">Radiative Power</span>
                      <span className="dd-value text-orange">{selectedFire.frp} MW</span>
                    </div>
                    {selectedFire.brightness && (
                      <div className="dd-stat">
                        <span className="dd-label">Brightness Temp</span>
                        <span className="dd-value" style={{ color: '#FBBF24' }}>{selectedFire.brightness} K</span>
                      </div>
                    )}
                    <div className="dd-stat">
                      <span className="dd-label">Orbital Pass</span>
                      <span className="dd-value" style={{ fontSize: '0.88rem' }}>{selectedFire.daynight === 'D' ? 'DAYTIME (ASC)' : 'NIGHTTIME (DESC)'}</span>
                    </div>
                    {selectedFire.h3 && (
                      <div className="dd-stat">
                        <span className="dd-label">H3 Grid Index</span>
                        <span className="dd-value" style={{ fontSize: '0.76rem', color: '#A1A1AA' }}>{selectedFire.h3}</span>
                      </div>
                    )}
                  </div>

                  <div className="dd-actions">
                    <button className="btn-primary" onClick={() => copyCoordinates(selectedFire.lat, selectedFire.lng)}>
                      COPY COORDINATES
                    </button>
                    <a
                      href={`${NASA_FIRMS_MAP_URL}/#d:24hrs;@${selectedFire.lng.toFixed(2)},${selectedFire.lat.toFixed(2)},10z`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{ textDecoration: 'none', textAlign: 'center' }}
                    >
                      VERIFY ON NASA FIRMS MAP
                    </a>
                    <a
                      href={`${GOOGLE_MAPS_SEARCH_URL}${selectedFire.lat},${selectedFire.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{ textDecoration: 'none', textAlign: 'center' }}
                    >
                      OPEN SATELLITE IMAGERY
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="panel-header">
                  <h3>PEAK ANOMALIES IN VIEW</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="count-badge">{topVisibleFires.length}</span>
                    <button className="icon-btn mobile-only-close" onClick={() => setShowRight(false)} aria-label="Close Panel">✕</button>
                  </div>
                </div>
                <div className="fire-list">
                  {topVisibleFires.length === 0 ? (
                    <div className="empty-state">No active thermal anomalies in current viewport.</div>
                  ) : (
                    topVisibleFires.map((fire, index) => (
                      <div
                        role="button"
                        tabIndex={0}
                        className={`fire-card priority-card ${selectedFire?.id === fire.id ? 'selected' : ''}`}
                        key={fire.id}
                        onClick={() => setSelectedFire(fire)}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedFire(fire)}
                      >
                        <div className="card-top">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="priority-rank">{index + 1}</span>
                            <h4>{fire.location}</h4>
                          </div>
                          <span className={`sensor-tag ${fire.sensor?.toLowerCase()}`}>{fire.sensor}</span>
                        </div>
                        <div className="card-bottom">
                          <div className="telemetry-data">
                            <span className="data-label">FRP</span>
                            <span className="data-value text-orange">{fire.frp} MW</span>
                          </div>
                          <div className="telemetry-data">
                            <span className="data-label">CONF</span>
                            <span className="data-value">{fire.confidence}%</span>
                          </div>
                          <div className="telemetry-data">
                            <span className="data-label">TEMP</span>
                            <span className="data-value" style={{ color: '#FBBF24' }}>{fire.brightness ? `${fire.brightness}K` : '—'}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </aside>
        )}
      </div>

      {briefingModalOpen && (
        <div className="modal-backdrop" onClick={() => setBriefingModalOpen(false)}>
          <div className="briefing-modal" onClick={(e) => e.stopPropagation()}>
            <div className="briefing-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={nasaMeatball} alt="NASA" style={{ height: '36px' }} />
                <div>
                  <h2 style={{ fontSize: '1.02rem', fontWeight: 800, letterSpacing: '0.5px' }}>NASA INCIDENT COMMANDER BRIEFING</h2>
                  <span style={{ fontSize: '0.72rem', color: '#A1A1AA' }}>MODIS C6.1 + VIIRS C2 ORBITAL TELEMETRY SYNTHESIS</span>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setBriefingModalOpen(false)}>✕</button>
            </div>

            {isGeneratingBriefing ? (
              <div style={{ padding: '44px', textAlign: 'center', color: '#A1A1AA', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>
                SYNTHESIZING ORBITAL OBSERVATIONS...
              </div>
            ) : briefingData ? (
              <div className="briefing-body">
                <div className="briefing-metrics-row">
                  <div className={`briefing-metric-card ${briefingData.alert_level === 'CRITICAL' ? 'critical' : 'elevated'}`}>
                    <span className="bm-label">ALERT CLASSIFICATION</span>
                    <strong className="bm-val">{briefingData.alert_level}</strong>
                  </div>
                  <div className="briefing-metric-card">
                    <span className="bm-label">ACTIVE ANOMALIES</span>
                    <strong className="bm-val">{briefingData.total_hotspots}</strong>
                  </div>
                  <div className="briefing-metric-card">
                    <span className="bm-label">CUMULATIVE FRP</span>
                    <strong className="bm-val" style={{ color: 'var(--sensor-modis)' }}>{briefingData.total_frp_mw} MW</strong>
                  </div>
                  <div className="briefing-metric-card">
                    <span className="bm-label">PEAK INTENSITY</span>
                    <strong className="bm-val" style={{ color: '#EF4444' }}>{briefingData.peak_frp_mw} MW</strong>
                  </div>
                </div>

                <div className="briefing-text-box">
                  {briefingData.briefing_text}
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button className="btn-secondary" onClick={() => {
                    navigator.clipboard.writeText(briefingData.briefing_text);
                    showToast('Incident briefing copied to clipboard');
                  }}>
                    COPY REPORT
                  </button>
                  <button className="btn-primary" onClick={() => setBriefingModalOpen(false)}>
                    CLOSE
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#A1A1AA' }}>
                Unable to synthesize briefing. Verify backend is online at {API_BASE_URL}.
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
      <AIAssistant selectedFire={selectedFire} fires={filteredFires} />
    </div>
  );
}

export default App;
