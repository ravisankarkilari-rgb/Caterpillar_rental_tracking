import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Equipment } from '../../types';
import { StatusBadge } from './StatusBadge';

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

// The central depot / fleet yard for Available equipment
const DEPOT_COORDS = { lat: 20.5937, lng: 78.9629 };

const STATUS_MARKER_COLORS: Record<string, string> = {
  AVAILABLE: '#10B981',
  RENTED: '#3B82F6',
  OVERDUE: '#F43F5E',
  DUE_SOON: '#F59E0B',
  UNDER_UTILIZED: '#F97316',
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

export const FleetMapView: React.FC<FleetMapViewProps> = ({
  equipmentList,
  onSelectEquipment,
}) => {
  // Group equipment by site_id; unassigned go to Depot
  const siteClusters = useMemo<SiteCluster[]>(() => {
    const map = new Map<string, SiteCluster>();

    // Initialize depot cluster for Available equipment
    map.set('DEPOT', {
      siteId: 'DEPOT',
      label: 'Fleet Yard / Depot',
      lat: DEPOT_COORDS.lat,
      lng: DEPOT_COORDS.lng,
      equipment: [],
    });

    for (const eq of equipmentList) {
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
          // Unknown site – place near depot with offset
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
  }, [equipmentList]);

  // Count statuses across all sites for the legend
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const eq of equipmentList) {
      counts[eq.status] = (counts[eq.status] || 0) + 1;
    }
    return counts;
  }, [equipmentList]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-800 shadow-xl bg-gray-900/80">
      {/* Legend overlay */}
      <div className="absolute top-3 right-3 z-[1000] bg-gray-900/90 backdrop-blur-md border border-gray-700/80 rounded-xl p-3 shadow-lg space-y-1.5">
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
          Fleet Status Legend
        </span>
        {Object.entries(STATUS_MARKER_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2 text-[11px]">
            <span
              className="w-3 h-3 rounded-full border border-gray-600 shrink-0"
              style={{ backgroundColor: color }}
            ></span>
            <span className="text-gray-300 capitalize">
              {status.replace('_', ' ')}
              {statusCounts[status] ? ` (${statusCounts[status]})` : ''}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-[11px] pt-1 border-t border-gray-700">
          <span className="w-3 h-3 rounded-full border-2 border-amber-400 bg-amber-400/30 shrink-0"></span>
          <span className="text-gray-400">Site Cluster</span>
        </div>
      </div>

      {/* Title overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-gray-900/90 backdrop-blur-md border border-gray-700/80 rounded-xl px-3.5 py-2 shadow-lg">
        <span className="text-xs font-bold text-white">🗺️ Fleet Deployment Map</span>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {siteClusters.length} active site{siteClusters.length !== 1 ? 's' : ''} · {equipmentList.length} units
        </p>
      </div>

      <MapContainer
        center={[DEPOT_COORDS.lat, DEPOT_COORDS.lng]}
        zoom={5}
        scrollWheelZoom={true}
        style={{ height: '480px', width: '100%', background: '#0B0F17' }}
        className="z-0"
      >
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, OpenStreetMap'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />

        {siteClusters.map((cluster) => {
          const hasOverdue = cluster.equipment.some((e) => e.status === 'OVERDUE');
          const hasUnderUtilized = cluster.equipment.some(
            (e) => e.status === 'UNDER_UTILIZED'
          );
          const isDepot = cluster.siteId === 'DEPOT';

          // Outer ring color: red if overdue present, orange if under-utilized, amber default
          const ringColor = hasOverdue
            ? '#F43F5E'
            : hasUnderUtilized
            ? '#F97316'
            : isDepot
            ? '#10B981'
            : '#F59E0B';

          return (
            <React.Fragment key={cluster.siteId}>
              {/* Outer pulsing ring for site cluster */}
              <CircleMarker
                center={[cluster.lat, cluster.lng]}
                radius={20 + cluster.equipment.length * 2}
                pathOptions={{
                  color: ringColor,
                  fillColor: ringColor,
                  fillOpacity: 0.1,
                  weight: 1.5,
                  dashArray: '4',
                }}
              />

              {/* Site marker with tooltip */}
              <CircleMarker
                center={[cluster.lat, cluster.lng]}
                radius={10 + Math.min(cluster.equipment.length, 8)}
                pathOptions={{
                  color: ringColor,
                  fillColor: ringColor,
                  fillOpacity: 0.35,
                  weight: 2,
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -10]}
                  opacity={0.95}
                  permanent={false}
                >
                  <div className="text-xs min-w-[160px]">
                    <div className="font-bold text-gray-900">
                      {cluster.siteId}
                    </div>
                    <div className="text-gray-600 text-[11px]">{cluster.label}</div>
                    <div className="text-gray-700 font-semibold mt-1">
                      {cluster.equipment.length} unit{cluster.equipment.length !== 1 ? 's' : ''} deployed
                    </div>
                  </div>
                </Tooltip>

                <Popup maxWidth={320} minWidth={220}>
                  <div className="space-y-2 py-1">
                    <div className="border-b border-gray-200 pb-2">
                      <div className="font-extrabold text-sm text-gray-900 tracking-wide">
                        {cluster.siteId}
                      </div>
                      <div className="text-xs text-gray-500">{cluster.label}</div>
                      <div className="text-xs font-semibold text-amber-600 mt-0.5">
                        {cluster.equipment.length} equipment unit{cluster.equipment.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      {cluster.equipment.map((eq) => (
                        <button
                          key={eq.equipment_id}
                          onClick={() => onSelectEquipment(eq)}
                          className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-left group"
                        >
                          <div>
                            <span className="font-mono text-xs font-bold text-amber-600 group-hover:text-amber-700">
                              {eq.equipment_id}
                            </span>
                            <span className="text-[11px] text-gray-500 ml-1.5">
                              {eq.equipment_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${STATUS_MARKER_COLORS[eq.status] || '#6B7280'}20`,
                                color: STATUS_MARKER_COLORS[eq.status] || '#6B7280',
                              }}
                            >
                              {eq.status.replace('_', ' ')}
                            </span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              eq.ignition_status === 'ON' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {eq.ignition_status === 'ON' ? 'Ignition On' : 'Ignition Off'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {cluster.equipment.some((e) => e.customer_id) && (
                      <div className="text-[10px] text-gray-400 border-t border-gray-200 pt-1.5">
                        Customer:{' '}
                        <span className="font-mono font-semibold text-gray-600">
                          {cluster.equipment.find((e) => e.customer_id)?.customer_id}
                        </span>
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>

              {/* Individual equipment dot markers around the site */}
              {cluster.equipment.map((eq, idx) => {
                // Fan equipment dots around the cluster center
                const angle = (2 * Math.PI * idx) / cluster.equipment.length;
                const spread = 0.15 + cluster.equipment.length * 0.02;
                const eqLat = cluster.lat + Math.cos(angle) * spread;
                const eqLng = cluster.lng + Math.sin(angle) * spread;
                const markerColor = STATUS_MARKER_COLORS[eq.status] || '#6B7280';

                return (
                  <CircleMarker
                    key={eq.equipment_id}
                    center={[eqLat, eqLng]}
                    radius={5}
                    pathOptions={{
                      color: '#1F2937',
                      fillColor: markerColor,
                      fillOpacity: 0.9,
                      weight: 1.5,
                    }}
                    eventHandlers={{
                      click: () => onSelectEquipment(eq),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                      <div className="text-[11px]">
                        <span className="font-mono font-bold text-amber-600">{eq.equipment_id}</span>
                        <span className="text-gray-500 ml-1">{eq.equipment_type}</span>
                        <div className="text-[10px] text-gray-600">
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
