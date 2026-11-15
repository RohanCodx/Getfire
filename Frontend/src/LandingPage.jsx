import React from 'react';
import logoImg from './assets/logo.png';
import nasaMeatball from './assets/nasa-logo.svg';
import nasaWorm from './assets/nasa-worm.svg';

const LandingPage = ({ onEnter }) => {
  return (
    <div className="landing-container">
      <div className="landing-bg"></div>

      <div className="landing-content">
        <div className="landing-badge">
          <img src={nasaMeatball} alt="NASA Insignia" className="landing-badge-icon" />
          <span>EARTH OBSERVATION SYSTEM // NASA SPACE APPS CHALLENGE</span>
        </div>

        {/* Hero Logos: Large Cropped GetFire + Official NASA Meatball & Worm */}
        <div className="landing-brand-showcase">
          <img src={logoImg} alt="GetFire" className="landing-getfire-logo" />
          <div className="landing-brand-sep"></div>
          <div className="landing-nasa-group">
            <img src={nasaMeatball} alt="NASA Meatball" className="landing-nasa-meatball" />
            <img src={nasaWorm} alt="NASA Worm" className="landing-nasa-worm" />
          </div>
        </div>

        <h1 className="landing-headline">
          ORBITAL ACTIVE-FIRE HARMONIZATION &amp; TELEMETRY
        </h1>

        <p className="landing-subtitle">
          Enterprise geospatial intelligence fusing <strong>NASA MODIS (1km Terra/Aqua)</strong> and <strong>VIIRS (375m Suomi-NPP / NOAA-20)</strong> satellite observations with Uber H3 spatial indexing and autonomous radiative power analytics.
        </p>

        <div className="landing-cta-row">
          <button className="landing-btn" onClick={onEnter}>
            <span>INITIALIZE MISSION CONTROL</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>

        <div className="landing-specs-grid">
          <div className="spec-card">
            <span className="spec-label">MULTI-SENSOR FUSION</span>
            <strong className="spec-val" style={{ color: '#F97316' }}>MODIS C6.1 + VIIRS C2</strong>
            <span className="spec-desc">Cross-validated 1km &amp; 375m infrared radiometry</span>
          </div>
          <div className="spec-card">
            <span className="spec-label">SPATIAL INDEXING</span>
            <strong className="spec-val" style={{ color: '#22D3EE' }}>UBER H3 RES-8 DGGS</strong>
            <span className="spec-desc">Hexagonal discrete global grid harmonization</span>
          </div>
          <div className="spec-card">
            <span className="spec-label">STORAGE ARCHITECTURE</span>
            <strong className="spec-val" style={{ color: '#10B981' }}>100 MB AUTO-PRUNING</strong>
            <span className="spec-desc">Deterministic WAL FIFO retention &amp; vacuuming</span>
          </div>
        </div>

        <div className="landing-footer">
          <span>SOURCE: NASA EOSDIS FIRMS</span>
          <span>DATUM: WGS-84 / H3</span>
          <span>RADIOMETRIC UNIT: FRP (MW) &amp; KELVIN</span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
