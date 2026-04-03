import { motion, AnimatePresence } from 'framer-motion';
import type { RegionData, ActiveLayer } from './types';
import { Car, ShieldAlert, Home, Leaf } from 'lucide-react';

interface MapTooltipProps {
  region: RegionData | null;
  activeLayer: ActiveLayer;
  x: number;
  y: number;
}

const layerIcons = {
  ecology: <Leaf className="w-4 h-4" />,
  transport: <Car className="w-4 h-4" />,
  safety: <ShieldAlert className="w-4 h-4" />,
  housing: <Home className="w-4 h-4" />,
};

const layerColors = {
  high: 'text-status-high',
  medium: 'text-status-medium',
  low: 'text-status-low',
};

const layerBorders = {
  high: 'border-status-high/50',
  medium: 'border-status-medium/50',
  low: 'border-status-low/50',
};

export const MapTooltip = ({ region, activeLayer, x, y }: MapTooltipProps) => {
  if (!region) return null;

  const currentLayerData = region[activeLayer];
  const statusColor = layerColors[currentLayerData.status];
  const borderColor = layerBorders[currentLayerData.status];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.2 }}
        className={`absolute z-50 pointer-events-none p-4 rounded-xl bg-panel/90 backdrop-blur-md border ${borderColor} shadow-2xl`}
        style={{ left: x + 15, top: y + 15, minWidth: '240px' }}
      >
        <div className="flex justify-between items-start mb-3 border-b border-border pb-2">
          <div>
            <h3 className="text-lg font-bold text-text-primary tracking-tight">{region.name}</h3>
            <p className="text-xs text-text-muted uppercase font-mono">{region.nameKz}</p>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/50 ${statusColor} border ${borderColor}`}>
            {layerIcons[activeLayer]}
            <span className="text-xs font-bold uppercase tracking-wider">{currentLayerData.status}</span>
          </div>
        </div>

        <div className="space-y-2 font-mono text-sm">
          {activeLayer === 'ecology' && (
            <>
              <div className="flex justify-between">
                <span className="text-text-muted">AQI Index</span>
                <span className={region.ecology.aqi > 100 ? 'text-status-high font-bold' : 'text-text-primary'}>{region.ecology.aqi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">CO2 Emissions</span>
                <span className="text-text-primary">{region.ecology.co2} ppm</span>
              </div>
            </>
          )}

          {activeLayer === 'transport' && (
            <>
              <div className="flex justify-between">
                <span className="text-text-muted">Congestion</span>
                <span className={region.transport.congestion > 80 ? 'text-status-high font-bold' : 'text-text-primary'}>{region.transport.congestion}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Accidents</span>
                <span className="text-text-primary">{region.transport.accidents}</span>
              </div>
            </>
          )}

          {activeLayer === 'safety' && (
            <>
              <div className="flex justify-between">
                <span className="text-text-muted">Crime Index</span>
                <span className={region.safety.crimeIndex > 60 ? 'text-status-high font-bold' : 'text-text-primary'}>{region.safety.crimeIndex}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Daily Incidents</span>
                <span className="text-text-primary">{region.safety.incidents}</span>
              </div>
            </>
          )}

          {activeLayer === 'housing' && (
            <>
              <div className="flex justify-between">
                <span className="text-text-muted">Utility Failures</span>
                <span className={region.housing.failures > 70 ? 'text-status-high font-bold' : 'text-text-primary'}>{region.housing.failures}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Complaints</span>
                <span className="text-text-primary">{region.housing.complaints}</span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
