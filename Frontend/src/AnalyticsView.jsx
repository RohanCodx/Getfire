import React, { useMemo } from 'react';
import CalendarHeatmap from './CalendarHeatmap';

const AnalyticsView = ({ fires, stats }) => {
  // Dynamically calculate stats from the live data
  const analytics = useMemo(() => {
    if (!fires || fires.length === 0) return { topFires: [], modis: 0, viirs: 0, both: 0, extreme: 0, high: 0, mod: 0, low: 0 };
    
    const modis = fires.filter(f => f.sensor.toUpperCase() === 'MODIS').length;
    const viirs = fires.filter(f => f.sensor.toUpperCase() === 'VIIRS').length;
    const both = fires.length - modis - viirs;

    let extreme = 0, high = 0, mod = 0, low = 0;
    fires.forEach(f => {
      const frp = parseFloat(f.frp) || 0;
      if (frp > 50) extreme++;
      else if (frp > 20) high++;
      else if (frp > 10) mod++;
      else low++;
    });

    const topFires = [...fires].sort((a, b) => parseFloat(b.frp) - parseFloat(a.frp)).slice(0, 5);

    return { topFires, modis, viirs, both, extreme, high, mod, low };
  }, [fires]);

  const total = fires.length || 1;

  return (
    <div className="analytics-view">
      <div className="view-header">
        <h2>Historical & Current Activity</h2>
        <p>Analyzing {fires.length} active hotspots from the current dataset.</p>
      </div>

      <div className="bento-grid">
        {/* Calendar - Spans 2 columns */}
        <div className="analytics-card bento-col-span-2">
          <h3>Activity Calendar</h3>
          <CalendarHeatmap />
        </div>

        {/* Sensor Breakdown */}
        <div className="analytics-card">
          <h3>Sensor Ratio</h3>
          <div className="sensor-ratio-container">
            <div className="sensor-bar">
              <div style={{ width: `${(analytics.modis/total)*100}%`, backgroundColor: 'var(--sensor-modis)' }} />
              <div style={{ width: `${(analytics.viirs/total)*100}%`, backgroundColor: 'var(--sensor-viirs)' }} />
              <div style={{ width: `${(analytics.both/total)*100}%`, backgroundColor: 'var(--sensor-both)' }} />
            </div>
            <div className="sensor-legend">
              <div><span className="dot modis"></span> MODIS ({analytics.modis})</div>
              <div><span className="dot viirs"></span> VIIRS ({analytics.viirs})</div>
              <div><span className="dot harmonized"></span> BOTH ({analytics.both})</div>
            </div>
          </div>
        </div>

        {/* Intensity Distribution */}
        <div className="analytics-card">
          <h3>FRP Distribution</h3>
          <div className="distribution-list">
            <div className="dist-row"><span>Extreme (&gt;50 MW)</span> <strong>{analytics.extreme}</strong></div>
            <div className="dist-row"><span>High (20-50 MW)</span> <strong>{analytics.high}</strong></div>
            <div className="dist-row"><span>Moderate (10-20 MW)</span> <strong>{analytics.mod}</strong></div>
            <div className="dist-row"><span>Low (&lt;10 MW)</span> <strong>{analytics.low}</strong></div>
          </div>
        </div>

        {/* Top 5 Hotspots */}
        <div className="analytics-card bento-col-span-2">
          <h3>Top 5 Most Intense Fires</h3>
          <div className="top-fires-list">
            {analytics.topFires.map((fire, i) => (
              <div key={i} className="top-fire-row">
                <div className="top-fire-name">{fire.location}</div>
                <div className="top-fire-data">
                  <span className={`sensor-tag ${fire.sensor.toLowerCase()}`}>{fire.sensor}</span>
                  <span className="mono text-orange">{fire.frp} MW</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
