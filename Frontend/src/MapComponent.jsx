import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapController = ({ selectedFire }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedFire && selectedFire.lat && selectedFire.lng) {
      map.flyTo([selectedFire.lat, selectedFire.lng], 5, { duration: 1.5 });
    }
  }, [selectedFire, map]);
  return null;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      setTimeout(() => map.invalidateSize(), 300);
    });
    observer.observe(map.getContainer().parentNode);
    return () => observer.disconnect();
  }, [map]);
  return null;
};

const LocateControl = ({ onToast }) => {
  const map = useMap();
  const handleLocate = (e) => {
    e.stopPropagation();
    map.locate({ setView: true, maxZoom: 6 });
    map.once('locationfound', (ev) => {
      L.circleMarker(ev.latlng, {
        radius: 8, color: '#10B981', fillColor: '#10B981', fillOpacity: 0.8, weight: 3,
      }).addTo(map).bindPopup('You are here').openPopup();
    });
    map.once('locationerror', () => onToast && onToast('Could not access your location'));
  };

  return (
    <button className="locate-btn" onClick={handleLocate} title="Find my location" aria-label="Find my location">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    </button>
  );
};

const getColor = (sensor) => {
  if (sensor === 'MODIS') return '#F87171';
  if (sensor === 'VIIRS') return '#22D3EE';
  return '#C084FC';
};

const MapComponent = ({ fires, selectedFire, mapStyle, onToast }) => {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      preferCanvas={true}
      className={`map-${mapStyle}`}
    >
      {mapStyle === 'dark' && (
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
      )}
      {mapStyle === 'satellite' && (
        <>
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri"
          />
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />
        </>
      )}
      <MapController selectedFire={selectedFire} />
      <LocateControl onToast={onToast} />
      <MapResizer />
      {fires.map((fire) => {
        const selected = selectedFire?.id === fire.id;
        return (
          <CircleMarker
            key={fire.id}
            center={[fire.lat, fire.lng]}
            radius={Math.min(4 + (Number(fire.frp) || 0) / 10, 14)}
            pathOptions={{
              color: getColor(fire.sensor),
              fillColor: getColor(fire.sensor),
              fillOpacity: selected ? 0.8 : 0.45,
              weight: selected ? 3 : 1,
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '160px' }}>
                <strong style={{ color: getColor(fire.sensor), fontSize: '14px', textTransform: 'uppercase' }}>{fire.sensor}</strong><br />
                <span style={{ fontSize: '13px', color: '#D4D4D8', fontWeight: '600' }}>{fire.location}</span><br />
                <hr style={{ margin: '8px 0', borderColor: '#3F3F46' }} />
                <span style={{ fontSize: '12px', color: '#A1A1AA' }}>Confidence: <b style={{ color: '#FAFAFA' }}>{fire.confidence}%</b></span><br />
                <span style={{ fontSize: '12px', color: '#A1A1AA' }}>Radiative Power: <b style={{ color: '#FAFAFA' }}>{fire.frp} MW</b></span>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
};

export default MapComponent;
