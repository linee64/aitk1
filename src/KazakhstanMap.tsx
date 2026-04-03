import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

/** Carto Positron (light) + CSS filter on tilePane → readable dark basemap with clear streets */
const CARTO_LIGHT_ALL =
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

const TILE_ATTRIBUTION = '© OpenStreetMap contributors © CARTO';

const TILE_PANE_FILTER = 'invert(1) hue-rotate(180deg) brightness(0.85) contrast(0.9)';

const kazakhstanBounds = L.latLngBounds([40.5, 49.5], [55.5, 87.5]);
const kazakhstanMaxBounds = kazakhstanBounds.pad(0.1);

const worldOuterRing: [number, number][] = [
  [85, -180],
  [85, 180],
  [-85, 180],
  [-85, -180],
];

const normalizeRegionName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+region$/i, '')
    .replace(/\s+облысы$/i, '')
    .replace(/\s+облыс$/i, '');

const getFeatureRegionName = (feature: Feature<Geometry, any>) =>
  String(feature?.properties?.name || feature?.properties?.NAME_1 || feature?.properties?.NAME || feature?.id || '');

/** Map GADM-style oblast names to keys that match `normalizeRegionName(mockRegionData.name)` */
const normalizeGeoNameToMockKey = (geoName: string) => {
  const n = normalizeRegionName(geoName);
  const aliases: Record<string, string> = {
    aqmola: 'akmola',
    aqtöbe: 'aktobe',
    aqtobe: 'aktobe',
    mangghystau: 'mangystau',
    qaraghandy: 'karaganda',
    qostanay: 'kostanay',
    qyzylorda: 'kyzylorda',
    zhambyl: 'jambyl',
    'south kazakhstan': 'turkistan',
  };
  return aliases[n] ?? n;
};

const toLatLngRing = (ring: number[][]) => ring.map(([lng, lat]) => [lat, lng] as [number, number]);

const statusBorderColor = (status: 'high' | 'medium' | 'low') =>
  status === 'high' ? '#ef4444' : status === 'medium' ? '#f59e0b' : '#22c55e';

function PositronTileLayer({ onLoadingChange }: { onLoadingChange: (loading: boolean) => void }) {
  const pendingRef = useRef(0);
  const onLoadingChangeRef = useRef(onLoadingChange);
  onLoadingChangeRef.current = onLoadingChange;

  const handlers = useMemo(
    () => ({
      loading: () => {
        pendingRef.current += 1;
        onLoadingChangeRef.current(true);
      },
      load: () => {
        pendingRef.current = Math.max(0, pendingRef.current - 1);
        onLoadingChangeRef.current(pendingRef.current > 0);
      },
    }),
    [],
  );

  return (
    <TileLayer
      url={CARTO_LIGHT_ALL}
      attribution={TILE_ATTRIBUTION}
      subdomains="abcd"
      minZoom={0}
      maxZoom={19}
      maxNativeZoom={20}
      updateWhenZooming={false}
      updateWhenIdle={true}
      eventHandlers={handlers}
    />
  );
}

const KazakhstanMap: React.FC<KazakhstanMapProps> = ({
  selectedRegion,
  onRegionSelect,
  activeLayer,
  onAIRequest,
  onActiveLayerChange: _onActiveLayerChange,
}) => {
  const [geojsonData, setGeojsonData] = useState<FeatureCollection<Geometry, any> | null>(null);
  const [tilesLoading, setTilesLoading] = useState(false);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
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
    const byId = mockRegionData.find((r) => r.id === selectedRegionSafe);
    if (byId) return byId;
    const byName = mockRegionData.find((r) => r.name === selectedRegionSafe);
    if (byName) return byName;
    const normalized = normalizeRegionName(selectedRegionSafe);
    return mockRegionData.find((r) => normalizeRegionName(r.name) === normalized) ?? null;
  }, [selectedRegionSafe]);

  const selectedMockKey = selectedRegionData ? normalizeRegionName(selectedRegionData.name) : null;

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

  const getRegionStyle = useCallback(
    (feature: Feature<Geometry, any>): PathOptions => {
      const geoName = getFeatureRegionName(feature);
      const mockKey = normalizeGeoNameToMockKey(geoName);

      if (selectedMockKey && mockKey === selectedMockKey) {
        return {
          fillColor: 'transparent',
          fillOpacity: 0,
          color: '#60a5fa',
          weight: 2,
          opacity: 1,
        };
      }

      const region = regionByName.get(mockKey);
      if (!region) {
        return {
          fillColor: 'transparent',
          fillOpacity: 0,
          color: '#1a3a6b',
          weight: 2,
          opacity: 1,
        };
      }

      const status = region[activeLayer].status;
      return {
        fillColor: 'transparent',
        fillOpacity: 0,
        color: statusBorderColor(status),
        weight: 2,
        opacity: 1,
      };
    },
    [activeLayer, selectedMockKey, regionByName],
  );

  const getRegionStyleRef = useRef(getRegionStyle);
  getRegionStyleRef.current = getRegionStyle;

  const isPanelOpen = !!selectedRegionSafe;

  const MapLayers = () => {
    const map = useMap();

    useEffect(() => {
      map.setMaxBounds(kazakhstanMaxBounds);
      map.fitBounds(kazakhstanBounds);
      map.setView([48.0, 68.0], 5);
    }, [map]);

    useEffect(() => {
      const pane = map.getPane('tilePane');
      if (pane) pane.style.filter = TILE_PANE_FILTER;
      return () => {
        if (pane) pane.style.filter = '';
      };
    }, [map]);

    useEffect(() => {
      const onMapClick = () => {
        onRegionSelect('');
      };
      map.on('click', onMapClick);
      return () => {
        map.off('click', onMapClick);
      };
    }, [map, onRegionSelect]);

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
        } as PathOptions).addTo(map);
      }

      if (!geoJsonLayerRef.current) {
        geoJsonLayerRef.current = L.geoJSON(geojsonData as any, {
          interactive: true,
          bubblingMouseEvents: false,
          style: (feature) => getRegionStyleRef.current(feature as Feature<Geometry, any>),
          onEachFeature: (feature: any, layer: L.Layer) => {
            const pathLayer = layer as L.Path;
            const geoName = getFeatureRegionName(feature as Feature<Geometry, any>);
            const mock = regionByName.get(normalizeGeoNameToMockKey(geoName));

            pathLayer.on('mouseover', () => {
              const base = getRegionStyleRef.current(feature as Feature<Geometry, any>);
              const border = typeof base.color === 'string' ? base.color : '#3b82f6';
              pathLayer.setStyle({
                ...base,
                fillColor: border,
                fillOpacity: 0.08,
              });
            });

            pathLayer.on('mouseout', () => {
              pathLayer.setStyle(getRegionStyleRef.current(feature as Feature<Geometry, any>));
            });

            pathLayer.on('click', () => {
              onRegionSelect(mock?.id ?? '');
            });
          },
        }).addTo(map);
      }
    }, [map, geojsonData, maskPolygon, onRegionSelect]);

    useEffect(() => {
      if (!geoJsonLayerRef.current) return;
      geoJsonLayerRef.current.setStyle((feature) =>
        getRegionStyleRef.current(feature as Feature<Geometry, any>),
      );
    }, [activeLayer, selectedMockKey, regionByName]);

    return null;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: 600 }}>
      <style>{`
        .leaflet-control-attribution {
          background: rgba(10, 15, 30, 0.85) !important;
          color: rgba(226, 232, 240, 0.75) !important;
          font-size: 10px !important;
          max-width: 50%;
        }
        .leaflet-control-attribution a { color: #93c5fd !important; }
      `}</style>

      <div
        style={{
          width: isPanelOpen ? 'calc(100% - 380px)' : '100%',
          height: 600,
          borderRadius: 12,
          overflow: 'hidden',
          transition: 'width 300ms ease',
          position: 'relative',
        }}
      >
        {tilesLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              background: 'linear-gradient(to bottom, rgba(10,15,30,0.15), rgba(10,15,30,0.35))',
            }}
            aria-busy
            aria-label="Загрузка карты"
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '3px solid rgba(59, 130, 246, 0.25)',
                borderTopColor: '#3b82f6',
                animation: 'kzMapSpin 0.7s linear infinite',
              }}
            />
            <style>{`
              @keyframes kzMapSpin { to { transform: rotate(360deg); } }
            `}</style>
          </div>
        )}

        <MapContainer
          center={[48.0, 68.0]}
          zoom={5}
          minZoom={5}
          maxZoom={19}
          maxBounds={kazakhstanMaxBounds}
          maxBoundsViscosity={1}
          preferCanvas
          zoomSnap={0.1}
          zoomDelta={1}
          wheelPxPerZoomLevel={40}
          style={{ width: '100%', height: '600px' }}
        >
          <PositronTileLayer onLoadingChange={setTilesLoading} />
          <MapLayers />
        </MapContainer>
      </div>

      <RegionPanel
        open={isPanelOpen}
        region={selectedRegionData}
        regionDisplayName={selectedRegionData?.name ?? selectedRegionSafe ?? ''}
        activeLayer={activeLayer}
        onClose={() => onRegionSelect('')}
        onAIRequest={onAIRequest}
      />
    </div>
  );
};

export { KazakhstanMap };
