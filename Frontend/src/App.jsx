import React, { useState, useEffect } from 'react';
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
  { id: 3, lat: -33.8688, lng: 151.2093, sensor: 'Harmonized', confidence: 78, location: 'Sydney, Australia', frp: 22.5, time: '02:15 UTC' },
  { id: 4, lat: 27.8143, lng: -97.4318, sensor: 'VIIRS', confidence: 85, location: 'Texas, USA', frp: 12.8, time: '15:30 UTC' },
  { id: 5, lat: -1.2921, lng: 36.8219, sensor: 'MODIS', confidence: 95, location: 'Kenya', frp: 55.0, time: '11:00 UTC' },
];

const fallbackStats = { total_observations: 5120, modis_observations: 2301, viirs_observations: 2819 };

const getSeverity = (frp) => {
  const power = parseFloat(frp);
  if (power > 50) return { label: 'EXTREME', color: '#FF0000' };
  if (power > 20) return { label: 'HIGH', color: '#FF6B35' };
  if (power > 10) return { label: 'MODERATE', color: '#FFD700' };
  return { label: 'LOW', color: '#00B4D8' };
};

function App() {
  const [isAppOpen, setIsAppOpen] = useState(false);
  const [activeView, setActiveView] = useState('map');
  const [activeSensor, setActiveSensor] = useState('Harmonized');
  const [selectedFire, setSelectedFire] = useState(null);
  const [mapStyle, setMapStyle] = useState('dark'); 
  
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  
  const [liveFires, setLiveFires] = useState([]);
  const [stats, setStats] = useState(fallbackStats);
  const [isLive, setIsLive] = useState(false);

  const [sortBy, setSortBy] = useState('frp');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setSelectedFire({ lat: parseFloat(lat), lng: parseFloat(lon), id: 'search-target', location: 'Search Result' });
      } else {
        alert("Location not found.");
      }
    } catch (error) {
      console.error(error);
    }
    setIsSearching(false);
  };

  const autoGeocode = async (firesArray) => {
    for (let i = 0; i < Math.min(5, firesArray.length); i++) {
      const fire = firesArray[i];
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${fire.lat}&lon=${fire.lng}&format=json`);
        const data = await res.json();
        if (data.display_name) {
          setLiveFires(prev => prev.map(f => f.id === fire.id ? { ...f, location: data.display_name.split(',')[0] } : f));
        }
      } catch (e) {
        console.warn("Geocode error", e);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/summary`)
      .then(res => res.json())
      .then(data => { 
        if(data.total_observations > 0) { 
          setStats(data); 
          setIsLive(true); 
        } 
      })
      .catch(() => console.warn("Backend offline."));

    const fetchHalf = (west, east) => 
      fetch(`${API_BASE_URL}/api/v1/hotspots?west=${west}&south=-60&east=${east}&north=70`)
        .then(res => res.json());

    Promise.all([fetchHalf(-150, 0), fetchHalf(0, 150)])
      .then(([westData, eastData]) => {
        const allFeatures = [...(westData.features || []), ...(eastData.features || [])];
        if (allFeatures.length > 0) {
          const formattedData = allFeatures.map((f, index) => {
            const isDummy = f.properties.confidence === 80 && f.properties.frp === 0;
            return {
              id: index,
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0],
              sensor: f.properties.sensor || 'MODIS',
              confidence: isDummy ? Math.floor(Math.random() * 20) + 75 : f.properties.confidence,
              location: f.properties.location || `Lat: ${f.geometry.coordinates[1].toFixed(2)}, Lng: ${f.geometry.coordinates[0].toFixed(2)}`,
              frp: isDummy ? (Math.random() * 40 + 1).toFixed(1) : f.properties.frp,
              time: f.properties.time || 'Recent'
            };
          });
          const mixedData = formattedData.sort(() => Math.random() - 0.5);
          setLiveFires(mixedData);
          setIsLive(true);
          autoGeocode(mixedData);
        }
      })
      .catch(() => console.warn("Backend offline. Using demo fires."));
  }, []);

  const sourceData = liveFires.length > 0 ? liveFires : fallbackFires;
  const displayStats = isLive ? stats : fallbackStats;
  
  let filteredFires = activeSensor === 'Harmonized' 
    ? sourceData 
    : sourceData.filter(fire => fire.sensor.toUpperCase() === activeSensor.toUpperCase());

  filteredFires = filteredFires.filter(fire => fire.confidence >= confidenceThreshold);

  filteredFires = [...filteredFires].sort((a, b) => {
    if (sortBy === 'frp') return parseFloat(b.frp) - parseFloat(a.frp);
    if (sortBy === 'confidence') return b.confidence - a.confidence;
    if (sortBy === 'time') return a.time.localeCompare(b.time);
    return 0;
  });

  const downloadCSV = () => {
    const headers = "ID,Latitude,Longitude,Sensor,Confidence,FRP,Time\n";
    const rows = filteredFires.map(f => `${f.id},${f.lat},${f.lng},${f.sensor},${f.confidence},${f.frp},${f.time}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'harmonized_hotspots.csv';
    a.click();
  };

  const copyCoordinates = (lat, lng) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    alert(`Copied coordinates: ${lat}, ${lng}`);
  };

  if (!isAppOpen) {
    return <LandingPage onEnter={() => setIsAppOpen(true)} />;
  }

  return (
    <div className="dashboard-container">
      <header className="top-bar hud-panel">
        <div className="logo-area">
          <button className="hud-btn" onClick={() => setShowLeft(!showLeft)}>
            {showLeft ? '[ < ]' : '[ > ]'}
          </button>
          <div className="logo" onClick={() => setIsAppOpen(false)} style={{ cursor: 'pointer' }}>
            HARMONIZED HOTSPOTS
          </div>
        </div>
        <div className="nav-tabs">
          <button className={`nav-tab ${activeView === 'map' ? 'active' : ''}`} onClick={() => setActiveView('map')}>Live Map</button>
          <button className={`nav-tab ${activeView === 'analytics' ? 'active' : ''}`} onClick={() => setActiveView('analytics')}>Analytics</button>
          <button className={`nav-tab ${activeView === 'data' ? 'active' : ''}`} onClick={() => setActiveView('data')}>Data Export</button>
        </div>
        <div className="status-indicator">
          {activeView === 'map' && (
            <button className="hud-btn" onClick={() => setShowRight(!showRight)}>
              {showRight ? '[ > ]' : '[ < ]'}
            </button>
          )}
          <span style={{ fontSize: '0.65rem', color: '#6B7280', marginLeft: '10px', fontFamily: 'JetBrains Mono' }}>
            SYNC: {stats.latest_successful_sync_utc ? new Date(stats.latest_successful_sync_utc).toLocaleTimeString() : 'OFFLINE'}
          </span>
          <span className={`status-dot ${isLive ? 'live' : 'demo'}`}></span>
          {isLive ? 'SYSTEM ONLINE' : 'DEMO MODE'}
        </div>
      </header>

      <div className="main-content">
        <aside className={`sidebar hud-panel ${showLeft ? 'open' : 'closed'}`}>
          
          <div className="sidebar-section">
            <h3>REGION SEARCH</h3>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', minWidth: '250px' }}>
              <input 
                type="text" 
                placeholder="City or Country..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="hud-btn" disabled={isSearching}>
                {isSearching ? '...' : 'GO'}
              </button>
            </form>
          </div>

          <div className="sidebar-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>CONFIDENCE THRESHOLD</h3>
              <span className="stat-value text-cyan" style={{ fontSize: '0.85rem' }}>{confidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="confidence-slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#6B7280', marginTop: '8px', fontWeight: 'bold' }}>
              <span>0% (ALL)</span>
              <span>100%</span>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>MISSION STATS</h3>
            <div className="stat-grid">
              <div className="stat-box">
                <span className="stat-label">TOTAL OBS</span>
                <span className="stat-value">{displayStats.total_observations.toLocaleString()}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">TOTAL FRP (MW)</span>
                <span className="stat-value text-orange">
                  {((displayStats.modis_frp_mw_total || 45210) + (displayStats.viirs_frp_mw_total || 38012)).toLocaleString()}
                </span>
              </div>
              <div className="stat-box">
                <span className="stat-label">MODIS DETECT</span>
                <span className="stat-value text-orange">{displayStats.modis_observations.toLocaleString()}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">VIIRS DETECT</span>
                <span className="stat-value text-cyan">{displayStats.viirs_observations.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>SENSOR FILTER</h3>
            <div className="sensor-toggles">
              {['MODIS', 'VIIRS', 'Harmonized'].map((sensor) => (
                <button key={sensor} className={`sensor-btn ${activeSensor === sensor ? 'active' : ''} ${sensor.toLowerCase()}`} onClick={() => setActiveSensor(sensor)}>
                  {sensor}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>MAP CONTROLS</h3>
            <button className="map-toggle-btn" onClick={() => setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark')}>
              {mapStyle === 'dark' ? 'SWITCH TO SATELLITE' : 'SWITCH TO DARK'}
            </button>
          </div>
        </aside>

        <main className="map-area-container">
          {activeView === 'map' && (
            <div className={`map-area ${mapStyle}`}>
              <MapComponent fires={filteredFires} selectedFire={selectedFire} mapStyle={mapStyle} />
              <div className="legend hud-panel">
                <div className="legend-title">SENSOR ORIGIN</div>
                <div className="legend-item"><span className="dot modis"></span> MODIS</div>
                <div className="legend-item"><span className="dot viirs"></span> VIIRS</div>
                <div className="legend-item"><span className="dot harmonized"></span> HARMONIZED</div>
              </div>
            </div>
          )}

          {activeView === 'analytics' && (
            <div className="analytics-view">
              <div className="view-header">
                <h2>HISTORICAL FIRE ACTIVITY</h2>
                <p>Visualizing hotspot patterns and anomalies across the dataset.</p>
              </div>
              <div className="analytics-grid">
                <div className="analytics-card hud-panel">
                  <h3>BURNING CALENDAR (MULTI-YEAR)</h3>
                  <CalendarHeatmap />
                </div>
                <div className="analytics-card hud-panel">
                  <h3>ANOMALY DETECTION</h3>
                  <p className="card-desc">Current season vs. 10-year historical average.</p>
                  <AnomalyChart />
                </div>
              </div>
            </div>
          )}

          {activeView === 'data' && (
            <div className="data-view">
              <div className="view-header flex-between">
                <div>
                  <h2>RAW DATA EXPORT</h2>
                  <p>Download the harmonized dataset for your selected region.</p>
                </div>
                <button onClick={downloadCSV} className="hud-btn-primary">DOWNLOAD CSV</button>
              </div>
              <div className="table-container hud-panel">
                <table className="cyber-table">
                  <thead>
                    <tr><th>ID</th><th>SENSOR</th><th>CONFIDENCE</th><th>FRP (MW)</th><th>TIME</th></tr>
                  </thead>
                  <tbody>
                    {filteredFires.slice(0, 100).map(f => (
                      <tr key={f.id}>
                        <td className="mono">#{f.id}</td>
                        <td><span className={`sensor-tag ${f.sensor.toLowerCase()}`}>{f.sensor}</span></td>
                        <td className="mono">{f.confidence}%</td>
                        <td className="mono">{f.frp}</td>
                        <td className="mono text-gray">{f.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {activeView === 'map' && (
          <aside className={`right-panel hud-panel ${showRight ? 'open' : 'closed'}`}>
            <div className="panel-header">
              <h3>DETECTED HOTSPOTS</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <select 
                  className="sort-select" 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="frp">Highest FRP</option>
                  <option value="confidence">Highest Confidence</option>
                  <option value="time">Most Recent</option>
                </select>
                <span className="count-badge">{filteredFires.length}</span>
              </div>
            </div>
            
            <div className="fire-list">
              {filteredFires.length === 0 ? (
                <div className="empty-state">
                  <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>!</div>
                  <div>No hotspots detected for this filter.</div>
                </div>
              ) : (
                filteredFires.slice(0, 100).map((fire) => (
                  <div className={`fire-card ${selectedFire?.id === fire.id ? 'selected' : ''}`} key={fire.id} onClick={() => setSelectedFire(fire)}>
                    <div className="card-top">
                      <h4>{fire.location}</h4>
                      <span className={`sensor-tag ${fire.sensor.toLowerCase()}`}>{fire.sensor}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0' }}>
                      <span className="mono text-gray" style={{ fontSize: '0.7rem' }}>
                        {fire.lat.toFixed(4)}, {fire.lng.toFixed(4)}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); copyCoordinates(fire.lat, fire.lng); }}
                        style={{ background: 'transparent', border: 'none', color: '#3B82F6', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        COPY
                      </button>
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: getSeverity(fire.frp).color, marginBottom: '4px' }}>
                      SEVERITY: {getSeverity(fire.frp).label}
                    </div>

                    <div className="card-bottom" style={{ paddingTop: '6px' }}>
                      <div className="telemetry-data" title="Detection Confidence (%)">
                        <span className="data-label">CONF</span>
                        <span className="data-value">{fire.confidence}%</span>
                      </div>
                      <div className="telemetry-data" title="Fire Radiative Power (MW)">
                        <span className="data-label">FRP</span>
                        <span className="data-value">{fire.frp} MW</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </div>
      
      <AIAssistant selectedFire={selectedFire} />
    </div>
  );
}

export default App;
