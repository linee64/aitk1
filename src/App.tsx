import { useState, useMemo } from 'react';
import { KazakhstanMap } from './KazakhstanMap';
import { Header } from './Header';
import type { ActiveLayer } from './types';
import { motion } from 'framer-motion';
import { mockRegionData } from './mockRegionData';

function App() {
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('ecology');

  const selectedRegionData = useMemo(() => {
    if (!selectedRegionId) return null;
    return mockRegionData.find(r => r.id === selectedRegionId);
  }, [selectedRegionId]);

  return (
    <div className="relative flex flex-col w-screen h-screen bg-background text-text-primary overflow-hidden font-sans">
      <Header activeLayer={activeLayer} onLayerChange={setActiveLayer} />

      <div className="relative flex-1 min-h-0">
      {/* Scanline Overlay */}
      <div className="absolute inset-0 scanline z-50 mix-blend-overlay pointer-events-none"></div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute bottom-8 left-8 z-40 bg-panel/80 backdrop-blur-md border border-border p-4 rounded-xl font-mono text-xs pointer-events-none"
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
          selectedRegion={selectedRegionId}
          onRegionSelect={setSelectedRegionId}
          activeLayer={activeLayer}
        />
      </main>

      {/* Selected Region Info Panel */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: selectedRegionData ? 1 : 0, y: selectedRegionData ? 0 : 50 }}
        className="absolute bottom-8 right-8 z-40 bg-panel border border-accent/30 p-5 rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.15)] max-w-sm w-full pointer-events-none"
      >
        {selectedRegionData ? (
          <>
            <div className="flex justify-between items-start mb-4 border-b border-border pb-3">
              <div>
                <h3 className="text-xl font-bold text-accent font-mono">
                  {selectedRegionData.name}
                </h3>
                <p className="text-xs text-text-muted mt-1 uppercase tracking-widest">{selectedRegionData.nameKz}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-accent animate-ping"></div>
            </div>
            <p className="text-sm text-text-primary mb-2">Детальная аналитика загружается...</p>
            <div className="w-full bg-background rounded-full h-1.5 mt-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="bg-accent h-full"
              />
            </div>
          </>
        ) : (
          <div className="text-text-muted text-sm font-mono flex items-center justify-center h-full">
            Выберите регион на карте
          </div>
        )}
      </motion.div>
      </div>
    </div>
  );
}

export default App;
