import React from 'react';
import MapComponent from './MapComponent'; 
import './App.css'; 

function App() {
  return (
    <div className="dashboard-container">
      {/* TOP BAR */}
      <header className="top-bar">
        <div className="logo">Harmonized Hot Spots</div>
        <div className="toggles">
          <button className="toggle-btn">MODIS</button>
          <button className="toggle-btn">VIIRS</button>
          <button className="toggle-btn active">Harmonized</button>
        </div>
        <div className="date">Nov 14, 2026</div>
      </header>

      <div className="main-content">
        {/* LEFT SIDEBAR */}
        <aside className="sidebar">
          <h3>Filters</h3>
          <div className="filter-group">
            <label>Region</label>
            <select><option>Global</option></select>
          </div>
          <div className="filter-group">
            <label>Confidence Threshold</label>
            <input type="range" min="0" max="100" value="70" />
          </div>
        </aside>

        {/* CENTER MAP (THE LEAFLET MAP) */}
        <main className="map-area">
          <MapComponent /> 
          
          {/* Legend */}
          <div className="legend">
            <div className="legend-item"><span className="dot modis"></span> MODIS</div>
            <div className="legend-item"><span className="dot viirs"></span> VIIRS</div>
            <div className="legend-item"><span className="dot harmonized"></span> Harmonized</div>
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className="right-panel">
          <h3>Detected Hot Spots (128)</h3>
          <div className="fire-list">
            {/* Fake Data Cards */}
            <div className="fire-card">
              <h4>Amazon Basin, Brazil</h4>
              <p>-3.4653, -62.2159</p>
              <div className="badges">
                <span className="badge harmonized">Both</span>
                <span>85% Confidence</span>
              </div>
            </div>
            <div className="fire-card">
              <h4>Northern Territory, AUS</h4>
              <p>-12.4634, 130.8456</p>
              <div className="badges">
                <span className="badge modis">MODIS</span>
                <span>92% Confidence</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
