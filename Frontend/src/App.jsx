import React, { useState, useEffect, useCallback } from 'react';
import MapComponent from './MapComponent';
import CalendarHeatmap from './CalendarHeatmap';
import AnomalyChart from './AnomalyChart';
import LandingPage from './LandingPage';
import AIAssistant from './AIAssistant';
import { API_BASE_URL } from './config';
import './App.css';

const fallbackFires = [
  { id: 1, lat: 39.7392, lng: -104.9903, sensor: 'MODIS', confidence: 89, location: 'Colorado, USA', frp: 34.2, time: '18:20 UTC' },
  { id: 2, lat: -3.4653, lng: -62.2159, sensor: 'VIIRS', confidence: 92, location: 'Amazon Basin, Brazil', frp: 45.1, time: '04:48 UTC' },
  { id: 3, lat: -33.8688, lng: 151.2093, sensor: 'Both', confidence: 78, location: 'Sydney, Australia', frp: 22.5, time: '02:15 UTC' },
  { id: 4, lat: 27.8143, lng: -97.4318, sensor: 'VIIRS', confidence: 85, location: 'Texas, USA', frp: 12.8, time: '15:30 UTC' },
  { id: 5, lat: -1.2921, lng: 36.8219, sensor: 'MODIS', confidence: 95, location: 'Kenya', frp: 55.0, time: '11:00 UTC' },
];

const fallbackStats = { total_observations: 5120, modis_observations: 2301, viirs_observations: 2819, modis_frp_mw_total: 45210, viirs_frp_mw_total: 38012 };

function App() {
  const [isAppOpen, setIsAppOpen] = useState(false);
  const [activeView, setActiveView] = useState('map');
  const [activeSensor, setActiveSensor] = useState('Both');
  const [selectedFire, setSelectedFire] = useState(null);
  const [mapStyle, setMapStyle] = useState('dark');
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);

  const [liveFires, setLiveFires] = useState([]);
  const [stats, setStats] = useState(fallbackStats);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [sortBy, setSortBy] = useState('frp');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setSelectedFire({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), id: 'search-target', location: data[0].display_name.split(',')[0] });
      } else {
        showToast('Location not found');
      }
    } catch (error) {
      console.error(error);
      showToast('Search failed');
    }
    setIsSearching(false);
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/summary`)
      .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(data => {
        if (data.total_observations > 0) { setStats(data); setIsLive(true); }
      })
      .catch(() => console.warn('Backend offline.'));

    fetch(`${API_BASE_URL}/api/v1/hotspots?west=-180&south=-90&east=180&north=90`)
      .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(data => {
        if (data.features && data.features.length > 0) {
          const formatted = data.features.map((f, index) => ({
            id: index,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            sensor: f.properties.sensor || 'MODIS',
            confidence: f.properties.confidence || 0,
            location: f.properties.location || `Lat: ${f.geometry.coordinates[1].toFixed(2)}, Lng: ${f.geometry.coordinates[0].toFixed(2)}`,
            frp: f.properties.frp || 0,
            time: f.properties.time || 'Recent',
          }));
          setLiveFires(formatted);
          setIsLive(true);
          setLastUpdated(new Date().toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }));
        }
      })
      .catch(() => console.warn('Backend offline. Using demo fires.'))
      .finally(() => setIsLoading(false));
  }, []);

  const sourceData = liveFires.length > 0 ? liveFires : fallbackFires;
  const displayStats = isLive ? stats : fallbackStats;

  let filteredFires = activeSensor === 'Both'
    ? sourceData
    : sourceData.filter(f => {
        const s = f.sensor.toUpperCase();
        return s === activeSensor.toUpperCase() || s === 'BOTH';
      });

  filteredFires = filteredFires.filter(f => f.confidence >= confidenceThreshold);
  filteredFires = [...filteredFires].sort((a, b) => {
    if (sortBy === 'frp') return parseFloat(b.frp) - parseFloat(a.frp);
    if (sortBy === 'confidence') return b.confidence - a.confidence;
    return 0;
  });

  const downloadCSV = () => {
    const headers = 'ID,Latitude,Longitude,Sensor,Confidence,FRP,Location\n';
    const rows = filteredFires
      .map(f => `${f.id},${f.lat},${f.lng},${f.sensor},${f.confidence},${f.frp},"${String(f.location).replace(/"/g, '""')}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'harmonized_hotspots.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const copyCoordinates = (lat, lng) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`)
      .then(() => showToast(`Copied: ${lat.toFixed(4)}, ${lng.toFixed(4)}`))
      .catch(() => showToast('Copy failed'));
  };

  if (!isAppOpen) return <LandingPage onEnter={() => setIsAppOpen(true)} />;

  return (
    <div className="dashboard-container">
      <header className="top-bar">
        <div className="logo-area">
          <button className="icon-btn" onClick={() => setShowLeft(!showLeft)} aria-label="Toggle Filters">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          </button>
          <div className="logo">Earth Observation Workspace</div>
        </div>
        <div className="nav-tabs">
          <button className={`nav-tab ${activeView === 'map' ? 'active' : ''}`} onClick={() => setActiveView('map')}>Live Map</button>
          <button className={`nav-tab ${activeView === 'analytics' ? 'active' : ''}`} onClick={() => setActiveView('analytics')}>Analytics</button>
          <button className={`nav-tab ${activeView === 'data' ? 'active' : ''}`} onClick={() => setActiveView('data')}>Export Data</button>
        </div>
        <div className="status-indicator">
          <button className="icon-btn" onClick={() => setShowRight(!showRight)} aria-label="Toggle Detections">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <span style={{ fontSize: '0.8rem', color: '#A1A1AA' }}>
            {isLive ? `Fetched ${lastUpdated} UTC` : 'Demo Data'}
          </span>
          <div className={`status-dot ${isLive ? 'live' : 'demo'}`}></div>
        </div>
      </header>

      <div className="main-content">
        <aside className={`sidebar ${showLeft ? 'open' : 'closed'}`}>
          <div className="sidebar-section">
            <h3>Search Region</h3>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text" placeholder="City or Country..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} className="search-input"
              />
              <button type="submit" className="btn-secondary" disabled={isSearching}>
                {isSearching ? '...' : 'Go'}
              </button>
            </form>
          </div>

          <div className="sidebar-section">
            <h3>Observation Summary</h3>
            <div className="stat-grid">
              <div className="stat-box">
                <span className="stat-label">Total Detections</span>
                <span className="stat-value">{displayStats.total_observations.toLocaleString()}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Detections in View</span>
                <span className="stat-value text-cyan">{filteredFires.length.toLocaleString()}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total Radiative Power</span>
                <span className="stat-value text-orange">
                  {((displayStats.modis_frp_mw_total || 0) + (displayStats.viirs_frp_mw_total || 0)).toLocaleString()} MW
                </span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Min. Detection Confidence</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="range" min="0" max="100" value={confidenceThreshold} onChange={(e) => setConfidenceThreshold(Number(e.target.value))} className="confidence-slider" />
              <span className="stat-value text-cyan" style={{ fontSize: '0.9rem' }}>{confidenceThreshold}%</span>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Sensor Selection</h3>
            <div className="sensor-toggles">
              {['MODIS', 'VIIRS', 'Both'].map((sensor) => (
                <button key={sensor} className={`sensor-btn ${activeSensor === sensor ? 'active' : ''}`} onClick={() => setActiveSensor(sensor)}>
                  {sensor === 'Both' ? 'Both Sensors' : sensor}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Map Base Layer</h3>
            <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark')}>
              {mapStyle === 'dark' ? 'Switch to Satellite' : 'Switch to Dark Map'}
            </button>
          </div>

          <div className="sidebar-section credits">
            Data: NASA FIRMS (MODIS / VIIRS). Basemaps: © OpenStreetMap contributors, Esri.
          </div>
        </aside>

        <main className="map-area-container">
          {activeView === 'map' && (
            <div className={`map-area map-${mapStyle}`}>
              <MapComponent fires={filteredFires} selectedFire={selectedFire} mapStyle={mapStyle} onToast={showToast} />
              {isLoading && <div className="map-banner">Loading hotspots…</div>}
              {!isLoading && !isLive && <div className="map-banner warn">Backend offline – showing demo data</div>}
              <div className="legend">
                <div className="legend-title">Sensor Type</div>
                <div className="legend-item"><div className="dot modis"></div> MODIS</div>
                <div className="legend-item"><div className="dot viirs"></div> VIIRS</div>
                <div className="legend-item"><div className="dot harmonized"></div> BOTH</div>
                <div className="legend-note">Bigger circle = higher FRP</div>
              </div>
            </div>
          )}

          {activeView === 'analytics' && (
            <div className="analytics-view">
              <div className="view-header">
                <h2>Historical Activity</h2>
                <p>Visualizing hotspot patterns across the dataset.</p>
              </div>
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3>Activity Calendar (Last 365 Days)</h3>
                  <CalendarHeatmap />
                </div>
                <div className="analytics-card">
                  <h3>Observed Activity vs. Historical Baseline</h3>
                  <AnomalyChart current={displayStats.total_observations} />
                </div>
              </div>
            </div>
          )}

          {activeView === 'data' && (
            <div className="data-view">
              <div className="view-header flex-between">
                <div>
                  <h2>Data Export</h2>
                  <p>Download the filtered dataset.</p>
                </div>
                <button onClick={downloadCSV} className="btn-primary">Download CSV</button>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Sensor</th><th>Confidence</th><th>Radiative Power</th><th>Location</th></tr>
                  </thead>
                  <tbody>
                    {filteredFires.slice(0, 100).map(f => (
                      <tr key={f.id}>
                        <td><span className={`sensor-tag ${f.sensor.toLowerCase()}`}>{f.sensor}</span></td>
                        <td>{f.confidence}%</td>
                        <td>{f.frp} MW</td>
                        <td>{f.location}</td>
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
            <div className="panel-header">
              <h3>Detections</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="frp">Highest FRP</option>
                  <option value="confidence">Highest Confidence</option>
                </select>
                <span className="count-badge">{filteredFires.length}</span>
              </div>
            </div>

            <div className="fire-list">
              {filteredFires.length === 0 ? (
                <div className="empty-state">No hotspots match this filter.</div>
              ) : (
                filteredFires.slice(0, 100).map((fire) => (
                  <div
                    role="button" tabIndex={0}
                    className={`fire-card ${selectedFire?.id === fire.id ? 'selected' : ''}`}
                    key={fire.id}
                    onClick={() => setSelectedFire(fire)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedFire(fire)}
                  >
                    <div className="card-top">
                      <h4>{fire.location}</h4>
                      <span className={`sensor-tag ${fire.sensor.toLowerCase()}`}>{fire.sensor}</span>
                    </div>
                    <div className="card-mid" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="mono text-gray" style={{ fontSize: '0.75rem' }}>{fire.lat.toFixed(4)}, {fire.lng.toFixed(4)}</span>
                      <button className="btn-text" onClick={(e) => { e.stopPropagation(); copyCoordinates(fire.lat, fire.lng); }}>Copy</button>
                    </div>
                    <div className="card-bottom">
                      <div className="telemetry-data"><span className="data-label">Confidence</span><span className="data-value">{fire.confidence}%</span></div>
                      <div className="telemetry-data"><span className="data-label">Radiative Power</span><span className="data-value">{fire.frp} MW</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
      <AIAssistant selectedFire={selectedFire} fires={filteredFires} />
    </div>
  );
}

export default App;
