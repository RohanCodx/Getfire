import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { MAP_TILES } from './config';

const REGIONS = [
  { name: 'Global', center: [18, 10], zoom: 2 },
  { name: 'North America', center: [38, -102], zoom: 4 },
  { name: 'South America', center: [-12, -56], zoom: 4 },
  { name: 'Africa', center: [2, 22], zoom: 4 },
  { name: 'Europe', center: [46, 16], zoom: 4 },
  { name: 'Asia', center: [26, 96], zoom: 4 },
  { name: 'Australia', center: [-24, 134], zoom: 4 },
];

const MapController = ({ selectedFire, targetRegion }) => {
  const map = useMap();
  const prevFireId = useRef(null);

  useEffect(() => {
    if (selectedFire && selectedFire.lat !== undefined && selectedFire.lng !== undefined) {
      if (prevFireId.current !== selectedFire.id) {
        prevFireId.current = selectedFire.id;
        const targetZoom = Math.max(map.getZoom(), 7);
        map.flyTo([selectedFire.lat, selectedFire.lng], targetZoom, { duration: 1.1 });
      }
    }
  }, [selectedFire, map]);

  useEffect(() => {
    if (targetRegion) {
      map.flyTo(targetRegion.center, targetRegion.zoom, { duration: 1.2 });
    }
  }, [targetRegion, map]);

  return null;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer()?.parentNode;
    if (!container) return;
    const timer = setTimeout(() => map.invalidateSize(), 150);
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [map]);
  return null;
};

const HeatmapLayer = ({ fires, enabled }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (!enabled || !fires || fires.length === 0 || !L.heatLayer) return;

    const points = fires.map(f => [
      f.lat,
      f.lng,
      Math.min(1, Math.max(0.2, (Number(f.frp) || 10) / 80)),
    ]);

    layerRef.current = L.heatLayer(points, {
      radius: 20,
      blur: 16,
      maxZoom: 10,
      gradient: {
        0.2: '#1E3A8A',
        0.45: '#06B6D4',
        0.7: '#F59E0B',
        0.9: '#EF4444',
        1.0: '#FFFBEB',
      },
    }).addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, fires, enabled]);

  return null;
};

const MapHudControls = ({ onToast, onMouseCoords }) => {
  const map = useMap();

  useMapEvents({
    mousemove(e) {
      if (onMouseCoords) {
        onMouseCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });

  const handleLocate = (e) => {
    e.stopPropagation();
    map.locate({ setView: true, maxZoom: 7 });
    map.once('locationfound', (ev) => {
      L.circleMarker(ev.latlng, {
        radius: 8, color: '#10B981', fillColor: '#10B981', fillOpacity: 0.85, weight: 3,
      }).addTo(map).bindPopup('Observer Position').openPopup();
    });
    map.once('locationerror', () => onToast && onToast('Geolocation access denied or unavailable'));
  };

  return (
    <div className="map-zoom-stack">
      <button className="map-ctrl-btn" onClick={() => map.zoomIn()} title="Zoom In" aria-label="Zoom In">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
      <button className="map-ctrl-btn" onClick={() => map.zoomOut()} title="Zoom Out" aria-label="Zoom Out">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
      <button className="map-ctrl-btn" onClick={() => map.flyTo([20, 0], 2, { duration: 1 })} title="Reset Global View" aria-label="Reset Global View">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
      </button>
      <button className="map-ctrl-btn" onClick={handleLocate} title="Center on My Position" aria-label="Center on My Position">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
      </button>
    </div>
  );
};

const BoundsTracker = ({ onBoundsChange }) => {
  const map = useMap();
  useEffect(() => {
    const handleMove = () => {
      if (onBoundsChange) onBoundsChange(map.getBounds());
    };
    map.on('moveend', handleMove);
    handleMove();
    return () => map.off('moveend', handleMove);
  }, [map, onBoundsChange]);
  return null;
};

const getColor = (sensor) => {
  const s = (sensor || '').toUpperCase();
  if (s === 'MODIS') return '#F97316';
  if (s === 'VIIRS') return '#06B6D4';
  return '#A855F7';
};

const MapComponent = ({ fires, selectedFire, onSelectFire, mapStyle, onToast, onBoundsChange }) => {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [targetRegion, setTargetRegion] = useState(null);
  const [mouseCoords, setMouseCoords] = useState({ lat: 34.0522, lng: -118.2437 });

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Top Sector Quick Jump & Layer Bar */}
      <div className="map-sector-bar">
        <div className="sector-pills">
          {REGIONS.map((r) => (
            <button
              key={r.name}
              className={`sector-pill ${targetRegion?.name === r.name ? 'active' : ''}`}
              onClick={() => setTargetRegion({ ...r, ts: Date.now() })}
            >
              {r.name}
            </button>
          ))}
        </div>

        <div className="layer-pills">
          <button
            className={`layer-pill ${showMarkers ? 'active' : ''}`}
            onClick={() => setShowMarkers(!showMarkers)}
            title="Toggle Sensor Vector Markers"
          >
            Vectors ({fires.length})
          </button>
          <button
            className={`layer-pill ${showHeatmap ? 'active' : ''}`}
            onClick={() => setShowHeatmap(!showHeatmap)}
            title="Toggle Radiative Heat Plume Overlay"
          >
            Thermal Plume
          </button>
        </div>
      </div>

      <MapContainer
        center={[28, -40]}
        zoom={3}
        minZoom={2}
        maxZoom={18}
        worldCopyJump={true}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        preferCanvas={true}
        className={`map-canvas-root map-${mapStyle}`}
      >
        {mapStyle === 'dark' && (
          <>
            <TileLayer
              key="dark-base"
              url={MAP_TILES.dark}
              attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
            />
            <TileLayer
              key="dark-labels"
              url={MAP_TILES.darkLabels}
            />
          </>
        )}
        {mapStyle === 'satellite' && (
          <>
            <TileLayer
              key="sat"
              url={MAP_TILES.satellite}
              attribution="Tiles &copy; Esri"
            />
            <TileLayer url={MAP_TILES.labels} />
          </>
        )}
        {mapStyle === 'terrain' && (
          <TileLayer
            key="terrain"
            url={MAP_TILES.terrain}
            attribution="&copy; OpenTopoMap"
          />
        )}

        <MapController selectedFire={selectedFire} targetRegion={targetRegion} />
        <BoundsTracker onBoundsChange={onBoundsChange} />
        <MapHudControls onToast={onToast} onMouseCoords={setMouseCoords} />
        <MapResizer />
        <HeatmapLayer fires={fires} enabled={showHeatmap} />

        {showMarkers && fires.map((fire) => {
          const selected = selectedFire?.id === fire.id;
          const color = getColor(fire.sensor);
          return (
            <CircleMarker
              key={fire.id}
              center={[fire.lat, fire.lng]}
              radius={selected ? 10 : Math.min(4 + (Number(fire.frp) || 0) / 14, 13)}
              eventHandlers={{
                click: () => onSelectFire && onSelectFire(fire),
              }}
              pathOptions={{
                color: selected ? '#FFFFFF' : color,
                fillColor: color,
                fillOpacity: selected ? 0.95 : 0.65,
                weight: selected ? 2.5 : 1,
              }}
            >
              <Popup>
                <div className="popup-telemetry">
                  <div className="popup-head">
                    <span className="popup-sensor" style={{ color }}>{fire.sensor} // {fire.satellite}</span>
                    <span className="popup-pass">{fire.daynight === 'D' ? 'DAY PASS' : 'NIGHT PASS'}</span>
                  </div>
                  <div className="popup-coords">{fire.location}</div>
                  <div className="popup-metrics">
                    <div><span>FRP</span><strong>{fire.frp} MW</strong></div>
                    <div><span>CONFIDENCE</span><strong>{fire.confidence}%</strong></div>
                    {fire.brightness && <div><span>BRIGHTNESS</span><strong>{fire.brightness} K</strong></div>}
                  </div>
                  {fire.h3 && <div className="popup-h3">H3 INDEX: {fire.h3}</div>}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Bottom Right Coordinate Telemetry Readout */}
      <div className="map-coord-hud">
        <span>LAT {mouseCoords.lat.toFixed(4)}</span>
        <span className="hud-sep">|</span>
        <span>LON {mouseCoords.lng.toFixed(4)}</span>
        <span className="hud-sep">|</span>
        <span>DATUM WGS-84</span>
      </div>
    </div>
  );
};

export default React.memo(MapComponent);
