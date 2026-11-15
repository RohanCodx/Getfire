import React from 'react';
import logoImg from './assets/logo.png'; 

const LandingPage = ({ onEnter }) => {
  return (
    <div className="landing-container">
      <div className="landing-bg"></div>
      <div className="landing-content">
        <div className="landing-badge">NASA SPACE APPS 2026</div>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <img src={logoImg} alt="GetFire" style={{ height: '120px', objectFit: 'contain' , mixBlendMode: 'screen' }} />
        </div>

        <p className="landing-subtitle">
          A unified dashboard fusing MODIS and VIIRS satellite data to track global fire activity, 
          historical anomalies, and real-time telemetry.
        </p>
        <button className="landing-btn" onClick={onEnter}>
          LAUNCH WORKSPACE
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
