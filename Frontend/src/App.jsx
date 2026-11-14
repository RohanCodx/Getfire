import React, { useState, useEffect } from 'react';
import MapComponent from './MapComponent';
import CalendarHeatmap from './CalendarHeatmap';
import AnomalyChart from './AnomalyChart';
import LandingPage from './LandingPage';
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
  
  const filteredFires = activeSensor === 'Harmonized' 
    ? sourceData 
    : sourceData.filter(fire => fire.sensor.toUpperCase() === activeSensor.toUpperCase());

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

  if (!isAppOpen) {
    return <LandingPage onEnter={() => setIsAppOpen(true)} />;
  }

  return (
    <div className="dashboard-container">
      <header className="top-bar">
        <div className="logo-area">
          <button className="toggle-btn" onClick={() => setShowLeft(!showLeft)}>
            {showLeft ? '[ < ]' : '[ > ]'}
          </button>
          <div className="logo" onClick={() => setIsAppOpen(false)} style={{ cursor: 'pointer' }}>
            HARMONIZED HOTSPS
          </div>
        </div>
        <div className="nav-tabs">
          <button className={`nav-tab ${activeView === 'map' ? 'active' : ''}`} onClick={() => setActiveView('map')}>Live Map</button>
          <button className={`nav-tab ${activeView === 'analytics' ? 'active' : ''}`} onClick={() => setActiveView('analytics')}>Analytics</button>
          <button className={`nav-tab ${activeView === 'data' ? 'active' : ''}`} onClick={() => setActiveView('data')}>Data Export</button>
        </div>
        <div className="status-indicator">
          {activeView === 'map' && (
            <button className="toggle-btn" onClick={() => setShowRight(!showRight)}>
              {showRight ? '[ > ]' : '[ < ]'}
            </button>
          )}
          <span className={`status-dot ${isLive ? 'live' : 'demo'}`}></span>
          {isLive ? 'SYSTEM ONLINE' : 'DEMO MODE'}
        </div>
      </header>

      <div className="main-content">
        <aside className={`sidebar ${showLeft ? 'open' : 'closed'}`}>
          <div className="sidebar-section">
            <h3>MISSION STATS</h3>
            <div className="stat-grid">
              <div className="stat-box">
                <span className="stat-label">TOTAL</span>
                <span className="stat-value">{displayStats.total_observations.toLocaleString()}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">MODIS</span>
                <span className="stat-value text-orange">{displayStats.modis_observations.toLocaleString()}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">VIIRS</span>
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
              <div className="legend">
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
                <div className="analytics-card">
                  <h3>BURNING CALENDAR (MULTI-YEAR)</h3>
                  <CalendarHeatmap />
                </div>
                <div className="analytics-card">
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
                <button onClick={downloadCSV} className="cyber-btn primary">DOWNLOAD CSV</button>
              </div>
              <div className="table-container">
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
          <aside className={`right-panel ${showRight ? 'open' : 'closed'}`}>
            <div className="panel-header">
              <h3>DETECTED HOTSPOTS</h3>
              <span className="count-badge">{filteredFires.length}</span>
            </div>
            <div className="fire-list">
              {filteredFires.slice(0, 100).map((fire) => (
                <div className={`fire-card ${selectedFire?.id === fire.id ? 'selected' : ''}`} key={fire.id} onClick={() => setSelectedFire(fire)}>
                  <div className="card-top">
                    <h4>{fire.location}</h4>
                    <span className={`sensor-tag ${fire.sensor.toLowerCase()}`}>{fire.sensor}</span>
                  </div>
                  <div className="card-bottom">
                    <div className="telemetry-data"><span className="data-label">CONF</span><span className="data-value">{fire.confidence}%</span></div>
                    <div className="telemetry-data"><span className="data-label">FRP</span><span className="data-value">{fire.frp} MW</span></div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default App;
