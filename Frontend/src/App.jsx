import React, { useState } from 'react';
import MapComponent from './MapComponent';
import CalendarHeatmap from './CalendarHeatmap'; // Import the calendar
import './App.css';

const fakeFires = [
  { id: 1, lat: -3.4653, lng: -62.2159, sensor: 'MODIS', confidence: 85, location: 'Amazon Basin, Brazil' },
  { id: 2, lat: 39.7392, lng: -104.9903, sensor: 'VIIRS', confidence: 92, location: 'Colorado, USA' },
  { id: 3, lat: -33.8688, lng: 151.2093, sensor: 'MODIS', confidence: 78, location: 'Sydney, Australia' },
  { id: 4, lat: 35.6895, lng: 139.6917, sensor: 'VIIRS', confidence: 88, location: 'Tokyo, Japan' },
  { id: 5, lat: -1.2921, lng: 36.8219, sensor: 'Harmonized', confidence: 95, location: 'Kenya' },
];

function App() {
  const [activeSensor, setActiveSensor] = useState('Harmonized');
  const [selectedFire, setSelectedFire] = useState(null); // For clicking to fly

  const filteredFires = activeSensor === 'Harmonized' 
    ? fakeFires 
    : fakeFires.filter(fire => fire.sensor === activeSensor);

  // CSV Export Function
  const downloadCSV = () => {
    const headers = "ID,Latitude,Longitude,Sensor,Confidence,Location\n";
    const rows = filteredFires.map(f => `${f.id},${f.lat},${f.lng},${f.sensor},${f.confidence},${f.location}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'harmonized_hotspots.csv';
    a.click();
  };

  return (
    <div className="dashboard-container">
      <header className="top-bar">
        <div className="logo">Harmonized Hot Spots</div>
        <div className="toggles">
          {['MODIS', 'VIIRS', 'Harmonized'].map((sensor) => (
            <button 
              key={sensor}
              className={`toggle-btn ${activeSensor === sensor ? 'active' : ''}`}
              onClick={() => setActiveSensor(sensor)}
            >
              {sensor}
            </button>
          ))}
        </div>
        <div className="date">Nov 14, 2026</div>
      </header>

      {/* STATS BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 2rem', background: '#1F2937', borderBottom: '1px solid #374151', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ color: '#9CA3AF' }}>Total Obs: <strong style={{ color: 'white' }}>5,120</strong></div>
          <div style={{ color: '#9CA3AF' }}>Showing: <strong style={{ color: 'white' }}>{filteredFires.length} events</strong></div>
        </div>
        {/* CSV EXPORT BUTTON */}
        <button onClick={downloadCSV} style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Export CSV
        </button>
      </div>

      <div className="main-content">
        {/* LEFT SIDEBAR */}
        <aside className="sidebar">
          <h3>Filters</h3>
          <div className="filter-group">
            <label>Region (Draw or Lat/Lng)</label>
            <button style={{ padding: '8px', background: '#374151', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Draw Area on Map
            </button>
          </div>
          <div className="filter-group">
            <label>Time Range</label>
            <input type="date" defaultValue="2026-11-01" style={{ background: '#1F2937', color: 'white', border: '1px solid #374151', padding: '8px', borderRadius: '6px' }} />
            <input type="date" defaultValue="2026-11-14" style={{ background: '#1F2937', color: 'white', border: '1px solid #374151', padding: '8px', borderRadius: '6px' }} />
          </div>
          
          {/* ADD THE CALENDAR HERE */}
          <CalendarHeatmap />
        </aside>

        {/* CENTER MAP */}
        <main className="map-area">
          <MapComponent fires={filteredFires} selectedFire={selectedFire} />
          
          <div className="legend">
            <div className="legend-item"><span className="dot modis"></span> MODIS</div>
            <div className="legend-item"><span className="dot viirs"></span> VIIRS</div>
            <div className="legend-item"><span className="dot harmonized"></span> Harmonized</div>
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className="right-panel">
          <h3>Detected Hot Spots ({filteredFires.length})</h3>
          <div className="fire-list">
            {filteredFires.map((fire) => (
              <div 
                className="fire-card" 
                key={fire.id}
                onClick={() => setSelectedFire(fire)} // CLICK TO FLY TO MAP
                style={{ cursor: 'pointer', borderColor: selectedFire?.id === fire.id ? '#3B82F6' : '#374151' }}
              >
                <h4>{fire.location}</h4>
                <p>{fire.lat.toFixed(4)}, {fire.lng.toFixed(4)}</p>
                <div className="badges">
                  <span className={`badge ${fire.sensor.toLowerCase()}`}>
                    {fire.sensor}
                  </span>
                  <span>{fire.confidence}% Confidence</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
