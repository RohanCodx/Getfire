import React from 'react';

const LandingPage = ({ onEnter }) => {
  return (
    <div className="landing-container">
      <div className="landing-bg"></div>
      <div className="landing-content">
        <div className="landing-badge">NASA SPACE APPS 2026</div>
        <h1 className="landing-title">HARMONIZED<br/>HOTSPOTS</h1>
        <p className="landing-subtitle">
          A unified dashboard fusing MODIS and VIIRS satellite data to track global fire activity, 
          historical anomalies, and real-time telemetry.
        </p>
        <button className="landing-btn" onClick={onEnter}>
          LAUNCH DASHBOARD
        </button>
      </div>
      <div className="landing-footer">
        <span>MODIS + VIIRS HARMONIZATION</span>
        <span>LIVE FIRMS DATA</span>
      </div>
    </div>
  );
};

export default LandingPage;
