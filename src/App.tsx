import { useState } from 'react';
import { KazakhstanMap } from './KazakhstanMap';
import { Header } from './Header';
import type { ActiveLayer } from './types';
import { motion } from 'framer-motion';
import { useTheme } from './theme';

function App() {
  const { theme } = useTheme();
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('ecology');

  return (
    <div
      className={`app-container theme-${theme} relative flex flex-col w-screen h-screen bg-background text-text-primary overflow-hidden font-sans`}
    >
      <Header activeLayer={activeLayer} onLayerChange={setActiveLayer} />

      <div className="relative flex-1 min-h-0">
      {/* Scanline Overlay */}
      <div className="absolute inset-0 scanline z-50 mix-blend-overlay pointer-events-none"></div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute bottom-8 left-8 z-40 backdrop-blur-md border border-border p-4 rounded-xl font-mono text-xs pointer-events-none"
        style={{ background: 'var(--legend-bg)' }}
      >
        <h4 className="text-text-muted mb-3 uppercase tracking-wider">Статус системы</h4>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-status-high shadow-[0_0_10px_#ef4444] animate-pulse"></div>
            <span className="text-status-high font-bold tracking-widest">КРИТИЧЕСКИЙ</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-status-medium shadow-[0_0_10px_#f59e0b]"></div>
            <span className="text-status-medium font-bold tracking-widest">ВНИМАНИЕ</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-status-low shadow-[0_0_10px_#22c55e]"></div>
            <span className="text-status-low font-bold tracking-widest">В НОРМЕ</span>
          </div>
        </div>
      </motion.div>

      {/* Main Map */}
      <main className="w-full h-full flex items-center justify-center">
        <KazakhstanMap
          theme={theme}
          selectedRegion={selectedRegionId}
          onRegionSelect={setSelectedRegionId}
          activeLayer={activeLayer}
        />
      </main>
      </div>
    </div>
  );
}

export default App;
