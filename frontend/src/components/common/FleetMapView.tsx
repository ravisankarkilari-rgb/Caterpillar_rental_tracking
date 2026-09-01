import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2, Layers, MapPin, Search, X, Zap, Truck, AlertTriangle } from 'lucide-react';
import { Equipment } from '../../types';
import { StatusBadge, IgnitionBadge } from './StatusBadge';

// Fix default Leaflet marker icon path issue in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Fictional but geographically plausible coordinates for anonymized sites.
 * Spread across a region to demonstrate real-world fleet distribution.
 */
const SITE_COORDINATES: Record<string, { lat: number; lng: number; label: string }> = {
  SITE001: { lat: 28.6139, lng: 77.2090, label: 'North Expressway Extension' },
  SITE002: { lat: 19.0760, lng: 72.8777, label: 'Valley Hydro Dam Project' },
  SITE003: { lat: 13.0827, lng: 80.2707, label: 'Metro Tunnel Shaft 4' },
  SITE004: { lat: 22.5726, lng: 88.3639, label: 'Harbor Deepwater Terminal' },
  SITE005: { lat: 17.3850, lng: 78.4867, label: 'East Quarry Open Pit' },
  SITE006: { lat: 12.9716, lng: 77.5946, label: 'Skyline Tower Complex' },
  SITE007: { lat: 23.0225, lng: 72.5714, label: 'Logistics Park Sector B' },
  SITE008: { lat: 26.9124, lng: 70.9100, label: 'Desert Solar Farm 500MW' },
};

// Central depot / fleet yard for Available equipment
const DEPOT_COORDS = { lat: 20.5937, lng: 78.9629 };

const STATUS_MARKER_COLORS: Record<string, string> = {
  AVAILABLE: '#10B981',
  RENTED: '#3B82F6',
  OVERDUE: '#F43F5E',
  DUE_SOON: '#F59E0B',
  UNDER_UTILIZED: '#F97316',
};

export type MapTileStyle = 'streets' | 'satellite' | 'dark' | 'voyager';

const TILE_LAYERS: Record<MapTileStyle, { name: string; url: string; attribution: string }> = {
  streets: {
    name: 'Street Map (Original)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  satellite: {
    name: 'Satellite Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
  dark: {
    name: 'Dark Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  },
  voyager: {
    name: 'Voyager Terrain',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{y}/{x}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
};

interface FleetMapViewProps {
  equipmentList: Equipment[];
  onSelectEquipment: (equipment: Equipment) => void;
}

interface SiteCluster {
  siteId: string;
  label: string;
  lat: number;
  lng: number;
  equipment: Equipment[];
}

// Component to handle map resize on fullscreen toggle
const MapResizeHandler: React.FC<{ isFullScreen: boolean }> = ({ isFullScreen }) => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [isFullScreen, map]);
  return null;
};

export const FleetMapView: React.FC<FleetMapViewProps> = ({
  equipmentList,
  onSelectEquipment,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [tileStyle, setTileStyle] = useState<MapTileStyle>('streets');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [mapSearch, setMapSearch] = useState('');

  // Handle ESC key to exit full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Group equipment by site_id; unassigned go to Depot
  const siteClusters = useMemo<SiteCluster[]>(() => {
    const map = new Map<string, SiteCluster>();

    map.set('DEPOT', {
      siteId: 'DEPOT',
      label: 'Caterpillar Depot / Fleet Yard',
      lat: DEPOT_COORDS.lat,
      lng: DEPOT_COORDS.lng,
      equipment: [],
    });

    for (const eq of equipmentList) {
      if (mapSearch.trim()) {
        const q = mapSearch.toLowerCase().trim();
        const match =
          eq.equipment_id.toLowerCase().includes(q) ||
          eq.equipment_type.toLowerCase().includes(q) ||
          (eq.customer_id && eq.customer_id.toLowerCase().includes(q)) ||
          (eq.site_id && eq.site_id.toLowerCase().includes(q));
        if (!match) continue;
      }

      const siteKey = eq.site_id || 'DEPOT';
      if (!map.has(siteKey)) {
        const coords = SITE_COORDINATES[siteKey];
        if (coords) {
          map.set(siteKey, {
            siteId: siteKey,
            label: coords.label,
            lat: coords.lat,
            lng: coords.lng,
            equipment: [],
          });
        } else {
          map.set(siteKey, {
            siteId: siteKey,
            label: siteKey,
            lat: DEPOT_COORDS.lat + (Math.random() - 0.5) * 2,
            lng: DEPOT_COORDS.lng + (Math.random() - 0.5) * 2,
            equipment: [],
          });
        }
      }
      map.get(siteKey)!.equipment.push(eq);
    }

    return Array.from(map.values()).filter((c) => c.equipment.length > 0);
  }, [equipmentList, mapSearch]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const eq of equipmentList) {
      counts[eq.status] = (counts[eq.status] || 0) + 1;
    }
    return counts;
  }, [equipmentList]);

  const activeTile = TILE_LAYERS[tileStyle];

  return (
    <div
      className={`relative transition-all duration-300 ${
        isFullScreen
          ? 'fixed inset-0 z-50 bg-[#0B0F17] w-screen h-screen flex flex-col p-0 m-0'
          : 'rounded-2xl overflow-hidden border border-gray-800 shadow-xl bg-gray-900/80'
      }`}
    >
      {/* MAP CONTROLS OVERLAY HEADER */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Title & Stats Pill */}
        <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700/80 rounded-xl px-3.5 py-2 shadow-xl pointer-events-auto flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-white tracking-wide block">
              Caterpillar Fleet GIS Telematics
            </span>
            <p className="text-[10px] text-gray-400">
              {siteClusters.length} Deployment Sites · {equipmentList.length} Units Active
            </p>
          </div>
        </div>

        {/* Right Side Action Controls (Search, Style Switcher, Fullscreen Toggle) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              value={mapSearch}
              onChange={(e) => setMapSearch(e.target.value)}
              placeholder="Search site, asset ID..."
              className="pl-8 pr-3 py-1.5 bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 font-mono w-44 sm:w-56 shadow-lg"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Map Layer Style Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="px-3 py-1.5 bg-gray-900/90 backdrop-blur-md hover:bg-gray-800 border border-gray-700 rounded-xl text-xs font-semibold text-gray-200 flex items-center gap-1.5 shadow-lg transition-colors"
              title="Change Map Style"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">{activeTile.name}</span>
            </button>

            {showLayerMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1">
                {(Object.keys(TILE_LAYERS) as MapTileStyle[]).map((style) => (
                  <button
                    key={style}
                    onClick={() => {
                      setTileStyle(style);
                      setShowLayerMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                      tileStyle === style
                        ? 'bg-amber-400 text-black font-bold'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    {TILE_LAYERS[style].name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Full Screen Toggle Button */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className={`px-3 py-1.5 border rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 ${
              isFullScreen
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500'
                : 'bg-amber-400 hover:bg-amber-300 text-black border-amber-400'
            }`}
            title={isFullScreen ? 'Exit Full Screen (ESC)' : 'Full Screen Map'}
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span>Exit Full Screen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span>Full Screen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Legend Overlay (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-gray-900/90 backdrop-blur-md border border-gray-700/80 rounded-xl p-3 shadow-xl space-y-1.5 max-w-xs">
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block">
          Fleet Telemetry Legend
        </span>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          {Object.entries(STATUS_MARKER_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full border border-gray-600 shrink-0"
                style={{ backgroundColor: color }}
              ></span>
              <span className="text-gray-300 capitalize text-[10px]">
                {status.replace('_', ' ')}
                {statusCounts[status] ? ` (${statusCounts[status]})` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={[DEPOT_COORDS.lat, DEPOT_COORDS.lng]}
        zoom={5}
        scrollWheelZoom={true}
        style={{
          height: isFullScreen ? '100vh' : '520px',
          width: '100%',
          background: '#0B0F17',
        }}
        className="z-0"
      >
        <MapResizeHandler isFullScreen={isFullScreen} />

        <TileLayer
          key={tileStyle}
          attribution={activeTile.attribution}
          url={activeTile.url}
          maxZoom={18}
        />

        {siteClusters.map((cluster) => {
          const hasOverdue = cluster.equipment.some((e) => e.status === 'OVERDUE');
          const hasUnderUtilized = cluster.equipment.some(
            (e) => e.status === 'UNDER_UTILIZED'
          );
          const isDepot = cluster.siteId === 'DEPOT';

          const ringColor = hasOverdue
            ? '#F43F5E'
            : hasUnderUtilized
            ? '#F97316'
            : isDepot
            ? '#10B981'
            : '#F59E0B';

          return (
            <React.Fragment key={cluster.siteId}>
              {/* Pulsing Site Outer Circle */}
              <CircleMarker
                center={[cluster.lat, cluster.lng]}
                radius={22 + cluster.equipment.length * 2}
                pathOptions={{
                  color: ringColor,
                  fillColor: ringColor,
                  fillOpacity: 0.12,
                  weight: 1.5,
                  dashArray: '4',
                }}
              />

              {/* Central Site Marker */}
              <CircleMarker
                center={[cluster.lat, cluster.lng]}
                radius={11 + Math.min(cluster.equipment.length, 8)}
                pathOptions={{
                  color: ringColor,
                  fillColor: ringColor,
                  fillOpacity: 0.45,
                  weight: 2,
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                  <div className="text-xs min-w-[160px]">
                    <div className="font-bold text-gray-900">{cluster.siteId}</div>
                    <div className="text-gray-600 text-[11px]">{cluster.label}</div>
                    <div className="text-gray-800 font-semibold mt-1">
                      {cluster.equipment.length} asset{cluster.equipment.length !== 1 ? 's' : ''} deployed
                    </div>
                  </div>
                </Tooltip>

                <Popup maxWidth={340} minWidth={240}>
                  <div className="space-y-2 py-1 text-xs">
                    <div className="border-b border-gray-200 pb-2">
                      <div className="font-extrabold text-sm text-gray-900 tracking-wide">
                        {cluster.siteId}
                      </div>
                      <div className="text-xs text-gray-600">{cluster.label}</div>
                      <div className="text-xs font-bold text-amber-600 mt-0.5">
                        {cluster.equipment.length} equipment unit{cluster.equipment.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {cluster.equipment.map((eq) => (
                        <button
                          key={eq.equipment_id}
                          onClick={() => {
                            onSelectEquipment(eq);
                            if (isFullScreen) setIsFullScreen(false);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-50/80 transition-colors text-left border border-gray-100 group"
                        >
                          <div>
                            <span className="font-mono text-xs font-extrabold text-amber-700 group-hover:text-amber-800">
                              {eq.equipment_id}
                            </span>
                            <span className="text-[11px] text-gray-600 ml-1.5">
                              {eq.equipment_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${STATUS_MARKER_COLORS[eq.status] || '#6B7280'}20`,
                                color: STATUS_MARKER_COLORS[eq.status] || '#6B7280',
                              }}
                            >
                              {eq.status.replace('_', ' ')}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>

              {/* Individual Equipment Spread Markers */}
              {cluster.equipment.map((eq, idx) => {
                const angle = (2 * Math.PI * idx) / cluster.equipment.length;
                const spread = 0.15 + cluster.equipment.length * 0.02;
                const eqLat = cluster.lat + Math.cos(angle) * spread;
                const eqLng = cluster.lng + Math.sin(angle) * spread;
                const markerColor = STATUS_MARKER_COLORS[eq.status] || '#6B7280';

                return (
                  <CircleMarker
                    key={eq.equipment_id}
                    center={[eqLat, eqLng]}
                    radius={6}
                    pathOptions={{
                      color: '#0B0F17',
                      fillColor: markerColor,
                      fillOpacity: 0.95,
                      weight: 1.5,
                    }}
                    eventHandlers={{
                      click: () => {
                        onSelectEquipment(eq);
                        if (isFullScreen) setIsFullScreen(false);
                      },
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                      <div className="text-[11px]">
                        <span className="font-mono font-extrabold text-amber-600">{eq.equipment_id}</span>
                        <span className="text-gray-500 ml-1">{eq.equipment_type}</span>
                        <div className="text-[10px] text-gray-700">
                          {eq.status.replace('_', ' ')} · {eq.ignition_status === 'ON' ? '⚡ Ignition On' : '🛑 Ignition Off'}
                        </div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};
