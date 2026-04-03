import { useState, useMemo } from 'react';
import { KazakhstanMap } from './KazakhstanMap';
import type { ActiveLayer } from './types';
import { motion } from 'framer-motion';
import { Leaf, Car, Activity } from 'lucide-react';
import { mockRegionData } from './mockRegionData';

function App() {
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('ecology');

  const selectedRegionData = useMemo(() => {
    if (!selectedRegionId) return null;
    return mockRegionData.find(r => r.id === selectedRegionId);
  }, [selectedRegionId]);

  const tabs = [
    { id: 'ecology', label: 'Экология', icon: <Leaf style={{ width: 18, height: 18 }} /> },
    { id: 'transport', label: 'Транспорт', icon: <Car style={{ width: 18, height: 18 }} /> },
  ];

  return (
    <div className="relative w-screen h-screen bg-background text-text-primary overflow-hidden font-sans">
      <style>{`
        @media (max-width: 768px) {
          .tab-label { display: none; }
        }
      `}</style>
      {/* Scanline Overlay */}
      <div className="absolute inset-0 scanline z-50 mix-blend-overlay"></div>

      {/* Header */}
      <header
        className="absolute top-0 left-0 right-0 z-40 pointer-events-none"
        style={{
          height: 64,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#0a0f1e',
          borderBottom: '1px solid #1a2744',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <Activity className="text-accent animate-pulse" style={{ width: 24, height: 24 }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <div
              style={{
                fontFamily: 'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontWeight: 800,
                fontSize: 'clamp(14px, 2vw, 22px)',
                color: '#e2e8f0',
              }}
            >
              СМАРТ-СИТИ ҚАЗАҚСТАН
            </div>
            <div
              style={{
                fontFamily: 'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: 'clamp(9px, 1vw, 12px)',
                color: '#94a3b8',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              Система мониторинга регионов // Уровень: {activeLayer.toUpperCase()}
            </div>
          </div>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="pointer-events-auto"
          style={{ display: 'flex', gap: 4 }}
        >
          {tabs.map((tab) => {
            const isActive = activeLayer === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveLayer(tab.id as ActiveLayer)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  fontSize: 'clamp(11px, 1.2vw, 14px)',
                  borderRadius: 8,
                  background: isActive ? '#3b82f6' : 'transparent',
                  color: isActive ? '#ffffff' : '#64748b',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  fontFamily: 'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  transition: 'background 150ms ease, color 150ms ease',
                }}
              >
                {tab.icon}
                <span className="tab-label">{tab.label}</span>
              </button>
            );
          })}
        </motion.nav>
      </header>

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
      <main className="w-full h-full flex items-center justify-center pt-16">
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
  );
}

export default App;
