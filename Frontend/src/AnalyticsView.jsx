import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from './config';

const AnalyticsView = ({ fires = [], onJumpToLocation }) => {
  const [sensorComp, setSensorComp] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [dbStats, setDbStats] = useState(null);
  const [breakdown, setBreakdown] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      fetch(`${API_BASE_URL}/api/v1/analytics/sensor-comparison`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE_URL}/api/v1/ai/clusters`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE_URL}/api/v1/system/db-stats`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE_URL}/api/v1/analytics/telemetry-breakdown`).then(r => r.ok ? r.json() : null),
    ]).then(([scRes, clRes, dbRes, bdRes]) => {
      if (scRes.status === 'fulfilled' && scRes.value) setSensorComp(scRes.value);
      if (clRes.status === 'fulfilled' && clRes.value?.clusters) setClusters(clRes.value.clusters);
      if (dbRes.status === 'fulfilled' && dbRes.value) setDbStats(dbRes.value);
      if (bdRes.status === 'fulfilled' && bdRes.value) setBreakdown(bdRes.value);
    });
  }, [fires.length]);

  const metrics = useMemo(() => {
    const total = fires.length;
    if (total === 0) {
      return {
        total: 0, modis: 0, viirs: 0, dayCount: 0, nightCount: 0,
        totalFrp: 0, avgFrp: 0, peakFrp: 0, avgTemp: 0, biomassRate: 0,
        frpBins: [
          { label: '<5 MW', count: 0, frp: 0 },
          { label: '5-15 MW', count: 0, frp: 0 },
          { label: '15-30 MW', count: 0, frp: 0 },
          { label: '30-60 MW', count: 0, frp: 0 },
          { label: '60-120 MW', count: 0, frp: 0 },
          { label: '>120 MW', count: 0, frp: 0 },
        ],
        hourlyData: Array.from({ length: 24 }, (_, h) => ({ hour: h, modis: 0, viirs: 0, frp: 0 })),
        scatterPoints: [],
        topFires: [],
      };
    }

    let modis = 0, viirs = 0, dayCount = 0, nightCount = 0;
    let totalFrp = 0, peakFrp = 0, tempSum = 0, tempCount = 0;

    const bins = [
      { label: '<5 MW', count: 0, frp: 0 },
      { label: '5-15 MW', count: 0, frp: 0 },
      { label: '15-30 MW', count: 0, frp: 0 },
      { label: '30-60 MW', count: 0, frp: 0 },
      { label: '60-120 MW', count: 0, frp: 0 },
      { label: '>120 MW', count: 0, frp: 0 },
    ];

    const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, modis: 0, viirs: 0, frp: 0 }));

    fires.forEach((f) => {
      const s = (f.sensor || '').toUpperCase();
      if (s === 'MODIS') modis++;
      else viirs++;

      if (f.daynight === 'N') nightCount++;
      else dayCount++;

      const frp = Number(f.frp) || 0;
      totalFrp += frp;
      if (frp > peakFrp) peakFrp = frp;

      if (f.brightness) {
        tempSum += Number(f.brightness);
        tempCount++;
      }

      if (frp < 5) { bins[0].count++; bins[0].frp += frp; }
      else if (frp < 15) { bins[1].count++; bins[1].frp += frp; }
      else if (frp < 30) { bins[2].count++; bins[2].frp += frp; }
      else if (frp < 60) { bins[3].count++; bins[3].frp += frp; }
      else if (frp < 120) { bins[4].count++; bins[4].frp += frp; }
      else { bins[5].count++; bins[5].frp += frp; }

      const hr = f.time ? parseInt(f.time.slice(0, 2), 10) : 0;
      if (!isNaN(hr) && hr >= 0 && hr < 24) {
        if (s === 'MODIS') hourly[hr].modis++;
        else hourly[hr].viirs++;
        hourly[hr].frp += frp;
      }
    });

    const scatterPoints = fires
      .filter(f => f.brightness && f.frp > 0)
      .slice(0, 350)
      .map(f => ({
        temp: Math.min(420, Math.max(285, Number(f.brightness))),
        frp: Math.min(250, Math.max(1, Number(f.frp))),
        sensor: (f.sensor || 'VIIRS').toUpperCase(),
      }));

    const topFires = [...fires].sort((a, b) => b.frp - a.frp).slice(0, 8);

    return {
      total,
      modis,
      viirs,
      dayCount,
      nightCount,
      totalFrp: Math.round(totalFrp * 10) / 10,
      avgFrp: Math.round((totalFrp / total) * 10) / 10,
      peakFrp: Math.round(peakFrp * 10) / 10,
      avgTemp: tempCount ? Math.round((tempSum / tempCount) * 10) / 10 : 324.5,
      biomassRate: Math.round(totalFrp * 0.368 * 10) / 10,
      frpBins: bins,
      hourlyData: hourly,
      scatterPoints,
      topFires,
    };
  }, [fires]);

  // Hourly SVG Line/Area Chart Coordinates
  const hourlyChart = useMemo(() => {
    const hrs = breakdown?.hourly || metrics.hourlyData;
    const maxCount = Math.max(...hrs.map(h => (h.modis || 0) + (h.viirs || 0)), 1);
    const width = 680;
    const height = 180;
    const padX = 32;
    const padY = 18;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;

    const getX = (i) => padX + (i / 23) * innerW;
    const getY = (val) => padY + innerH - (val / maxCount) * innerH;

    const totalPts = hrs.map((h, i) => `${getX(i)},${getY((h.modis || 0) + (h.viirs || 0))}`).join(' ');
    const viirsPts = hrs.map((h, i) => `${getX(i)},${getY(h.viirs || 0)}`).join(' ');
    const modisPts = hrs.map((h, i) => `${getX(i)},${getY(h.modis || 0)}`).join(' ');
    const areaPts = `${getX(0)},${padY + innerH} ${totalPts} ${getX(23)},${padY + innerH}`;

    return { width, height, padX, padY, innerH, maxCount, hrs, getX, getY, totalPts, viirsPts, modisPts, areaPts };
  }, [breakdown, metrics.hourlyData]);

  const maxBinCount = Math.max(...metrics.frpBins.map(b => b.count), 1);
  const dayPct = metrics.total ? Math.round((metrics.dayCount / metrics.total) * 100) : 50;
  const viirsPct = metrics.total ? Math.round((metrics.viirs / metrics.total) * 100) : 50;

  return (
    <div className="analytics-view">
      {/* Header & Storage Bar */}
      <div className="analytics-top-bar">
        <div>
          <div className="eyebrow-tag">ORBITAL TELEMETRY DIAGNOSTICS // MODIS C6.1 + VIIRS C2</div>
          <h2>Multi-Sensor Scientific Analytics</h2>
        </div>

        {dbStats && (
          <div className="storage-telemetry-box">
            <div className="stb-header">
              <span>SQLITE WAL STORAGE ENGINE</span>
              <span className="stb-badge">AUTO-PRUNE ACTIVE</span>
            </div>
            <div className="stb-bar-track">
              <div className="stb-bar-fill" style={{ width: `${Math.max(2, dbStats.used_percent)}%` }} />
            </div>
            <div className="stb-meta">
              <span>USED: {dbStats.disk_size_mb} MB</span>
              <span>LIMIT: {dbStats.max_size_mb} MB</span>
              <span>RECORDS: {dbStats.records?.hotspots?.toLocaleString() || 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* KPI Summary Strip */}
      <div className="kpi-strip">
        <div className="kpi-card">
          <span className="kpi-label">ACTIVE ANOMALIES</span>
          <strong className="kpi-value">{metrics.total.toLocaleString()}</strong>
          <span className="kpi-sub">MODIS: {metrics.modis} | VIIRS: {metrics.viirs}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">CUMULATIVE RADIATIVE POWER</span>
          <strong className="kpi-value text-orange">{metrics.totalFrp.toLocaleString()} MW</strong>
          <span className="kpi-sub">Mean: {metrics.avgFrp} MW | Peak: {metrics.peakFrp} MW</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">MEAN BRIGHTNESS TEMP</span>
          <strong className="kpi-value" style={{ color: '#FBBF24' }}>{metrics.avgTemp} K</strong>
          <span className="kpi-sub">IR Channel I4 / Band 21</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">EST. BIOMASS COMBUSTION</span>
          <strong className="kpi-value text-cyan">{metrics.biomassRate.toLocaleString()} kg/s</strong>
          <span className="kpi-sub">Wooster et al. Coefficient (0.368 kg/MJ)</span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="bento-grid">
        {/* CHART 1: 24-Hour Orbital Overpass Timeline */}
        <div className="analytics-card bento-col-span-2">
          <div className="card-header-row">
            <div>
              <h3>24-Hour UTC Orbital Acquisition Profile</h3>
              <p className="card-sub">Hourly hotspot detection density across polar-orbiting satellite passes (UTC)</p>
            </div>
            <div className="chart-inline-legend">
              <span><i className="dot viirs"></i> VIIRS (375m)</span>
              <span><i className="dot modis"></i> MODIS (1km)</span>
            </div>
          </div>

          <div className="svg-chart-wrap">
            <svg viewBox={`0 0 ${hourlyChart.width} ${hourlyChart.height}`} className="telemetry-svg">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
                const y = hourlyChart.padY + t * hourlyChart.innerH;
                const val = Math.round(hourlyChart.maxCount * (1 - t));
                return (
                  <g key={idx}>
                    <line x1={hourlyChart.padX} y1={y} x2={hourlyChart.width - hourlyChart.padX} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <text x={hourlyChart.padX - 6} y={y + 3} textAnchor="end" fill="#71717A" fontSize="9" fontFamily="JetBrains Mono">{val}</text>
                  </g>
                );
              })}

              {/* Area and Lines */}
              <polygon points={hourlyChart.areaPts} fill="url(#areaGrad)" />
              <polyline fill="none" stroke="#06B6D4" strokeWidth="2.2" points={hourlyChart.viirsPts} />
              <polyline fill="none" stroke="#F97316" strokeWidth="2" points={hourlyChart.modisPts} />

              {/* X-axis hour labels */}
              {hourlyChart.hrs.map((h, i) => (
                i % 3 === 0 ? (
                  <text key={i} x={hourlyChart.getX(i)} y={hourlyChart.height - 3} textAnchor="middle" fill="#A1A1AA" fontSize="9" fontFamily="JetBrains Mono">
                    {String(i).padStart(2, '0')}Z
                  </text>
                ) : null
              ))}
            </svg>
          </div>
        </div>

        {/* CHART 2: FRP Intensity Spectrum Histogram */}
        <div className="analytics-card">
          <h3>FRP Intensity Histogram</h3>
          <p className="card-sub">Distribution by Fire Radiative Power (MW)</p>
          <div className="histogram-bars">
            {metrics.frpBins.map((b, i) => {
              const pct = Math.round((b.count / maxBinCount) * 100);
              const colors = ['#38BDF8', '#06B6D4', '#10B981', '#FBBF24', '#F97316', '#EF4444'];
              return (
                <div key={i} className="hist-row">
                  <div className="hist-label mono">{b.label}</div>
                  <div className="hist-track">
                    <div className="hist-fill" style={{ width: `${Math.max(pct, b.count > 0 ? 4 : 0)}%`, background: colors[i] }} />
                  </div>
                  <div className="hist-count mono">{b.count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 3: Brightness Temperature (K) vs FRP Scatter Matrix */}
        <div className="analytics-card bento-col-span-2">
          <div className="card-header-row">
            <div>
              <h3>Thermal Brightness (Kelvin) vs. Radiative Power (MW)</h3>
              <p className="card-sub">Radiometric correlation across active fire pixels (285K – 420K vs. 0 – 250 MW)</p>
            </div>
            <div className="chart-inline-legend">
              <span>X: Brightness Temp (K)</span>
              <span>Y: FRP (MW)</span>
            </div>
          </div>

          <div className="svg-chart-wrap">
            <svg viewBox="0 0 680 185" className="telemetry-svg">
              {/* Axes */}
              <line x1="40" y1="15" x2="40" y2="160" stroke="rgba(255,255,255,0.15)" />
              <line x1="40" y1="160" x2="660" y2="160" stroke="rgba(255,255,255,0.15)" />
              {[300, 330, 360, 390, 420].map((temp) => {
                const x = 40 + ((temp - 285) / (420 - 285)) * 620;
                return (
                  <g key={temp}>
                    <line x1={x} y1="15" x2={x} y2="160" stroke="rgba(255,255,255,0.05)" strokeDasharray="2 3" />
                    <text x={x} y="176" textAnchor="middle" fill="#A1A1AA" fontSize="9" fontFamily="JetBrains Mono">{temp}K</text>
                  </g>
                );
              })}
              {[0, 50, 100, 150, 200, 250].map((frp) => {
                const y = 160 - (frp / 250) * 145;
                return (
                  <g key={frp}>
                    <line x1="40" y1={y} x2="660" y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 3" />
                    <text x="34" y={y + 3} textAnchor="end" fill="#71717A" fontSize="9" fontFamily="JetBrains Mono">{frp}</text>
                  </g>
                );
              })}

              {metrics.scatterPoints.map((pt, idx) => {
                const cx = 40 + ((pt.temp - 285) / (420 - 285)) * 620;
                const cy = 160 - (pt.frp / 250) * 145;
                return (
                  <circle
                    key={idx}
                    cx={cx}
                    cy={cy}
                    r="3.2"
                    fill={pt.sensor === 'MODIS' ? '#F97316' : '#06B6D4'}
                    fillOpacity="0.72"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* CHART 4: Diurnal Day/Night & Sensor Resolution Split */}
        <div className="analytics-card">
          <h3>Sensor & Diurnal Split</h3>
          <p className="card-sub">Instrument share & Day/Night cycle</p>

          <div className="split-meters">
            <div className="meter-block">
              <div className="meter-head">
                <span>VIIRS (375m) vs MODIS (1km)</span>
                <span className="mono">{viirsPct}% / {100 - viirsPct}%</span>
              </div>
              <div className="sensor-bar">
                <div style={{ width: `${viirsPct}%`, backgroundColor: 'var(--sensor-viirs)' }} />
                <div style={{ width: `${100 - viirsPct}%`, backgroundColor: 'var(--sensor-modis)' }} />
              </div>
              <div className="meter-foot">
                <span>VIIRS: {metrics.viirs.toLocaleString()}</span>
                <span>MODIS: {metrics.modis.toLocaleString()}</span>
              </div>
            </div>

            <div className="meter-block">
              <div className="meter-head">
                <span>Daytime vs Nighttime Combustion</span>
                <span className="mono">{dayPct}% / {100 - dayPct}%</span>
              </div>
              <div className="sensor-bar">
                <div style={{ width: `${dayPct}%`, backgroundColor: '#FBBF24' }} />
                <div style={{ width: `${100 - dayPct}%`, backgroundColor: '#6366F1' }} />
              </div>
              <div className="meter-foot">
                <span>Day (D): {metrics.dayCount.toLocaleString()}</span>
                <span>Night (N): {metrics.nightCount.toLocaleString()}</span>
              </div>
            </div>

            {sensorComp?.harmonization && (
              <div className="harmonization-callout">
                <div className="hc-row">
                  <span>Active H3 Hex Cells</span>
                  <strong className="mono">{sensorComp.harmonization.total_active_cells}</strong>
                </div>
                <div className="hc-row">
                  <span>Dual-Sensor Confirmed</span>
                  <strong className="mono text-cyan">{sensorComp.harmonization.dual_sensor_confirmed_cells} Cells</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CHART 5: Latitudinal Zonal Profile */}
        <div className="analytics-card">
          <h3>Planetary Latitude Zones</h3>
          <p className="card-sub">Fire density by geographic belt</p>
          <div className="zone-list">
            {(breakdown?.lat_zones || []).map((z, idx) => {
              const maxZ = Math.max(...(breakdown?.lat_zones || []).map(x => x.count), 1);
              const pct = Math.round((z.count / maxZ) * 100);
              return (
                <div key={idx} className="zone-item">
                  <div className="zone-top">
                    <span>{z.zone}</span>
                    <strong className="mono">{z.count} ({z.frp} MW)</strong>
                  </div>
                  <div className="hist-track">
                    <div className="hist-fill" style={{ width: `${pct}%`, background: '#10B981' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 6: AI Identified Wildfire Complexes */}
        <div className="analytics-card bento-col-span-2">
          <div className="card-header-row">
            <div>
              <h3>Spatial Wildfire Complexes ({clusters.length})</h3>
              <p className="card-sub">Euclidean & H3 proximity clustering — click any complex to inspect on Live Map</p>
            </div>
          </div>

          {clusters.length === 0 ? (
            <div className="empty-state">No multi-point fire complexes detected in current filter.</div>
          ) : (
            <div className="cluster-cards-grid">
              {clusters.slice(0, 6).map((c) => (
                <div
                  key={c.id}
                  className={`cluster-item-card sev-${c.severity.toLowerCase()}`}
                  onClick={() => onJumpToLocation && onJumpToLocation({
                    id: c.id,
                    lat: c.centroid.latitude,
                    lng: c.centroid.longitude,
                    location: `${c.name} (${c.centroid.latitude.toFixed(3)}, ${c.centroid.longitude.toFixed(3)})`,
                    sensor: c.dual_sensor ? 'BOTH' : 'VIIRS',
                    frp: c.peak_frp_mw,
                    confidence: 95,
                  })}
                >
                  <div className="cic-top">
                    <strong>{c.name}</strong>
                    <span className={`sev-pill ${c.severity.toLowerCase()}`}>{c.severity}</span>
                  </div>
                  <div className="cic-stats mono">
                    <div><span>ANOMALIES</span><strong>{c.hotspot_count}</strong></div>
                    <div><span>TOTAL FRP</span><strong className="text-orange">{c.total_frp_mw} MW</strong></div>
                    <div><span>PEAK FRP</span><strong>{c.peak_frp_mw} MW</strong></div>
                  </div>
                  <div className="cic-foot mono">
                    <span>CENTROID: {c.centroid.latitude.toFixed(3)}, {c.centroid.longitude.toFixed(3)}</span>
                    <span className="inspect-link">LOCATE →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
