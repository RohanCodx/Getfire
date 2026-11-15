export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
);

export const NOMINATIM_SEARCH_URL = import.meta.env.VITE_NOMINATIM_SEARCH_URL || 'https://nominatim.openstreetmap.org/search';
export const NASA_FIRMS_MAP_URL = import.meta.env.VITE_NASA_FIRMS_MAP_URL || 'https://firms.modaps.eosdis.nasa.gov/map';
export const GOOGLE_MAPS_SEARCH_URL = import.meta.env.VITE_GOOGLE_MAPS_SEARCH_URL || 'https://www.google.com/maps/search/?api=1&query=';

export const MAP_TILES = {
  dark: import.meta.env.VITE_MAP_DARK_TILE_URL || 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  darkLabels: import.meta.env.VITE_MAP_DARK_LABELS_URL || 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
  satellite: import.meta.env.VITE_MAP_SAT_TILE_URL || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  labels: import.meta.env.VITE_MAP_LABELS_TILE_URL || 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  terrain: import.meta.env.VITE_MAP_TERRAIN_TILE_URL || 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
};
