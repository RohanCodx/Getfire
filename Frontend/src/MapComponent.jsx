import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = () => {
  // fake data
  const fires = [
    { id: 1, lat: -3.4653, lng: -62.2159, color: '#FF6B35', sensor: 'MODIS' }, // Amazon
    { id: 2, lat: 39.7392, lng: -104.9903, color: '#00B4D8', sensor: 'VIIRS' }, // Colorado
    { id: 3, lat: -33.8688, lng: 151.2093, color: '#9D4EDD', sensor: 'Harmonized' }, // Sydney
    { id: 4, lat: 35.6895, lng: 139.6917, color: '#FF6B35', sensor: 'MODIS' }, // Tokyo
    { id: 5, lat: -1.2921, lng: 36.8219, color: '#00B4D8', sensor: 'VIIRS' }, // Kenya
    { id: 6, lat: 55.7558, lng: 37.6173, color: '#9D4EDD', sensor: 'Harmonized' }, // Moscow
    { id: 7, lat: 28.6139, lng: 77.2090, color: '#FF6B35', sensor: 'MODIS' }, // Delhi
    { id: 8, lat: -22.9068, lng: -43.1729, color: '#00B4D8', sensor: 'VIIRS' }, // Rio
    { id: 9, lat: 51.5074, lng: -0.1278, color: '#9D4EDD', sensor: 'Harmonized' }, // London
  ];

  return (
    <MapContainer
      center={[20, 0]} 
      zoom={2} 
      minZoom={2}
      style={{ height: '100%', width: '100%', background: '#0B0F19' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      
      {fires.map((fire) => (
        <CircleMarker
          key={fire.id}
          center={[fire.lat, fire.lng]}
          pathOptions={{ 
            color: fire.color, 
            fillColor: fire.color, 
            fillOpacity: 0.9,
            weight: 2 
          }}
          radius={7} // Size of the dot
        >
          <Tooltip>{fire.sensor} Fire</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
