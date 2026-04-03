import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import L from 'leaflet';
import type { PathOptions } from 'leaflet';

import 'leaflet/dist/leaflet.css';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { mockRegionData } from './mockRegionData';
import type { ActiveLayer } from './types';
import { RegionPanel } from './RegionPanel';

interface KazakhstanMapProps {
  selectedRegion: string | null;
  onRegionSelect: (regionId: string) => void;
  activeLayer: 'ecology' | 'transport' | 'safety' | 'housing';
  onAIRequest?: (regionName: string, activeLayer: ActiveLayer) => void;
  onActiveLayerChange?: (layer: ActiveLayer) => void;
}

L.Icon.Default.mergeOptions({ iconUrl, shadowUrl: iconShadow });

const transparentFill: Pick<PathOptions, 'fillColor' | 'fillOpacity'> = {
  fillColor: 'transparent',
  fillOpacity: 0,
};

const normalizeRegionName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+region$/i, '')
    .replace(/\s+облысы$/i, '')
    .replace(/\s+облыс$/i, '');

const getFeatureRegionName = (feature: Feature<Geometry, any>) =>
  String(feature?.properties?.name || feature?.properties?.NAME_1 || feature?.properties?.NAME || feature?.id || '');

const toLatLngRing = (ring: number[][]) => ring.map(([lng, lat]) => [lat, lng] as [number, number]);

const worldOuterRing: [number, number][] = [
  [85, -180],
  [85, 180],
  [-85, 180],
  [-85, -180],
];

const KazakhstanMap: React.FC<KazakhstanMapProps> = ({
  selectedRegion,
  onRegionSelect,
  activeLayer,
  onAIRequest,
  onActiveLayerChange: _onActiveLayerChange,
}) => {
  const [geojsonData, setGeojsonData] = useState<FeatureCollection<Geometry, any> | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const baseBorderLayerRef = useRef<L.GeoJSON | null>(null);
  const maskLayerRef = useRef<L.Polygon | null>(null);

  useEffect(() => {
    fetch('/kazakhstanOblasts.json')
      .then((r) => r.json())
      .then((data) => setGeojsonData(data))
      .catch((err) => console.error('Error loading Kazakhstan map:', err));
  }, []);

  const selectedRegionSafe = selectedRegion && selectedRegion.trim().length > 0 ? selectedRegion : null;

  const selectedRegionData = useMemo(() => {
    if (!selectedRegionSafe) return null;
    const byName = mockRegionData.find((r) => r.name === selectedRegionSafe);
    if (byName) return byName;
    const normalized = normalizeRegionName(selectedRegionSafe);
    return mockRegionData.find((r) => normalizeRegionName(r.name) === normalized) ?? null;
  }, [selectedRegionSafe]);

  const regionByName = useMemo(() => {
    const m = new Map<string, (typeof mockRegionData)[number]>();
    for (const r of mockRegionData) m.set(normalizeRegionName(r.name), r);
    return m;
  }, []);

  const maskPolygon = useMemo(() => {
    if (!geojsonData) return null;
    const holes: [number, number][][] = [];
    for (const f of geojsonData.features as Feature<Geometry, any>[]) {
      const g = f.geometry;
      if (!g) continue;
      if (g.type === 'Polygon') {
        const coords = g.coordinates as number[][][];
        if (coords?.[0]) holes.push(toLatLngRing(coords[0]));
      } else if (g.type === 'MultiPolygon') {
        const coords = g.coordinates as number[][][][];
        for (const poly of coords) {
          if (poly?.[0]) holes.push(toLatLngRing(poly[0]));
        }
      }
    }
    return { outer: worldOuterRing, holes };
  }, [geojsonData]);

  const isPanelOpen = !!selectedRegionSafe;

  const MapLayers = () => {
    const map = useMap();

    useEffect(() => {
      if (!geojsonData) return;

      if (!maskLayerRef.current && maskPolygon) {
        maskLayerRef.current = L.polygon([maskPolygon.outer, ...maskPolygon.holes], {
          fillColor: 'rgba(0,0,0,0.45)',
          fillOpacity: 0.45,
          color: 'rgba(0,0,0,0)',
          weight: 0,
          opacity: 0,
          interactive: false,
        } as any).addTo(map);
      }

      if (!baseBorderLayerRef.current) {
        baseBorderLayerRef.current = L.geoJSON(geojsonData as any, {
          style: {
            ...transparentFill,
            color: '#3b82f6',
            weight: 2,
            opacity: 1,
          },
          interactive: false,
        }).addTo(map);
      }

      if (!geoJsonLayerRef.current) {
        geoJsonLayerRef.current = L.geoJSON(geojsonData as any, {
          style: () => ({
            ...transparentFill,
            color: '#1a3a6b',
            weight: 0.8,
            opacity: 0.6,
          }),
          onEachFeature: (feature: any, layer: any) => {
            const name = getFeatureRegionName(feature as any);
            layer.bindTooltip(name, { sticky: true, direction: 'top' });

            layer.on('mouseover', (e: any) => {
              e.target.setStyle({ ...transparentFill, color: '#3b82f6', weight: 2, opacity: 0.9 });
            });

            layer.on('mouseout', (e: any) => {
              geoJsonLayerRef.current?.resetStyle(e.target);
            });

            layer.on('click', () => {
              onRegionSelect(name);
            });
          },
        }).addTo(map);

        const bounds = geoJsonLayerRef.current.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
      }
    }, [map, geojsonData, maskPolygon]);

    useEffect(() => {
      if (!geoJsonLayerRef.current) return;
      geoJsonLayerRef.current.setStyle((feature: any) => {
        const name = getFeatureRegionName(feature as any);
        if (selectedRegionSafe && name === selectedRegionSafe) {
          return { ...transparentFill, color: '#3b82f6', weight: 3, opacity: 0.95 };
        }

        const region = regionByName.get(normalizeRegionName(name));
        if (!region) {
          return { ...transparentFill, color: '#1a3a6b', weight: 0.8, opacity: 0.6 };
        }

        const status = region[activeLayer].status;
        const borderColor = status === 'high' ? '#ef4444' : status === 'medium' ? '#f59e0b' : '#22c55e';
        return { ...transparentFill, color: borderColor, weight: 1.5, opacity: 0.8 };
      });
    }, [activeLayer, selectedRegionSafe, regionByName]);

    return null;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: 600 }}>
      <style>{`
        .leaflet-control-attribution { display: none !important; }
      `}</style>

      <div
        style={{
          width: isPanelOpen ? 'calc(100% - 380px)' : '100%',
          height: 600,
          borderRadius: 12,
          overflow: 'hidden',
          transition: 'width 300ms ease',
        }}
      >
        <MapContainer
          center={[48.0196, 66.9237]}
          zoom={5}
          minZoom={4}
          maxZoom={16}
          preferCanvas
          style={{ width: '100%', height: '600px' }}
        >
          <TileLayer
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            attribution="&copy; Stadia Maps, &copy; OpenMapTiles &copy; OpenStreetMap"
          />
          <MapLayers />
        </MapContainer>
      </div>

      <RegionPanel
        open={isPanelOpen}
        region={selectedRegionData}
        regionDisplayName={selectedRegionSafe ?? ''}
        activeLayer={activeLayer}
        onClose={() => onRegionSelect('')}
        onAIRequest={onAIRequest}
      />
    </div>
  );
};

export { KazakhstanMap };
