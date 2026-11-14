import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapController = ({ selectedFire }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedFire) map.flyTo([selectedFire.lat, selectedFire.lng], 7, { duration: 1.5 });
  }, [selectedFire, map]);
  return null;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(map.getContainer().parentNode);
    return () => observer.disconnect();
  }, [map]);
  return null;
};

const MapComponent = ({ fires, selectedFire, mapStyle }) => {
  const getColor = (sensor) => {
    if (sensor === 'MODIS') return '#FF4B4B';   
    if (sensor === 'VIIRS') return '#00E5FF';   
    return '#B388FF';                           
  };

  return (
    <MapContainer center={[20, 0]} zoom={2} minZoom={2} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      {mapStyle === 'dark' && (
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      )}
      {mapStyle === 'satellite' && (
        <>
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />
        </>
      )}
      
      <MapController selectedFire={selectedFire} />
      <MapResizer />
      
      {fires.map((fire) => (
        <Circle
          key={fire.id}
          center={[fire.lat, fire.lng]}
          radius={35000} 
          className="pulse-marker"
          pathOptions={{ color: getColor(fire.sensor), fillColor: getColor(fire.sensor), fillOpacity: 0.4, weight: 2 }}
        >
          <Popup>
            <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '150px' }}>
              <strong style={{ color: getColor(fire.sensor), fontSize: '14px', textTransform: 'uppercase' }}>{fire.sensor} DETECTION</strong><br/>
              <hr style={{margin: '5px 0', borderColor: '#333'}}/>
              <span style={{fontSize: '12px', color: '#aaa'}}>CONF: <b>{fire.confidence}%</b></span><br/>
              <span style={{fontSize: '12px', color: '#aaa'}}>FRP: <b>{fire.frp} MW</b></span>
            </div>
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
