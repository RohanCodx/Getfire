import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// A helper component to handle the map flying
const MapController = ({ selectedFire }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedFire) {
      map.flyTo([selectedFire.lat, selectedFire.lng], 6, { duration: 1.5 });
    }
  }, [selectedFire, map]);
  return null;
};

const MapComponent = ({ fires, selectedFire }) => {
  const getColor = (sensor) => {
    if (sensor === 'MODIS') return '#FF6B35';
    if (sensor === 'VIIRS') return '#00B4D8';
    return '#9D4EDD';
  };

  return (
    <MapContainer center={[20, 0]} zoom={3} minZoom={2} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      <MapController selectedFire={selectedFire} />

      {fires.map((fire) => (
        <Circle
          key={fire.id}
          center={[fire.lat, fire.lng]}
          radius={250000}
          pathOptions={{ 
            color: getColor(fire.sensor), 
            fillColor: getColor(fire.sensor), 
            fillOpacity: 0.15, 
            weight: 3 
          }}
        >
          <Popup>
            <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '150px' }}>
              <strong style={{ color: getColor(fire.sensor), fontSize: '14px' }}>{fire.sensor} Hotspot</strong><br/>
              <span style={{color: '#666', fontSize: '12px'}}>{fire.location}</span><br/><hr style={{margin: '5px 0'}}/>
              Confidence: <b>{fire.confidence}%</b>
            </div>
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
