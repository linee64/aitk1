import type { ActiveLayer } from './types';

const mono =
  'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

export function MaterialSymbolsPottedPlant(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M8.55 22q-.7 0-1.225-.425t-.7-1.1L5.5 16h13l-1.125 4.475q-.175.675-.7 1.1T15.45 22zM12 8q0-2.5 1.75-4.25T18 2q0 2.25-1.425 3.9T13 7.9V10h8v3q0 .825-.587 1.413T19 15H5q-.825 0-1.412-.587T3 13v-3h8V7.9q-2.15-.35-3.575-2T6 2q2.5 0 4.25 1.75T12 8"
      />
    </svg>
  );
}

export function MaterialSymbolsDirectionsCar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M6 19v1q0 .425-.288.713T5 21H4q-.425 0-.712-.288T3 20v-8l2.1-6q.15-.45.538-.725T6.5 5h11q.475 0 .863.275T18.9 6l2.1 6v8q0 .425-.287.713T20 21h-1q-.425 0-.712-.288T18 20v-1zm-.2-9h12.4l-1.05-3H6.85zm1.7 6q.625 0 1.063-.437T9 14.5t-.437-1.062T7.5 13t-1.062.438T6 14.5t.438 1.063T7.5 16m9 0q.625 0 1.063-.437T18 14.5t-.437-1.062T16.5 13t-1.062.438T15 14.5t.438 1.063T16.5 16"
      />
    </svg>
  );
}

const layerLabelRu: Record<ActiveLayer, string> = {
  ecology: 'ЭКОЛОГИЯ',
  transport: 'ТРАНСПОРТ',
  safety: 'БЕЗОПАСНОСТЬ',
  housing: 'ЖИЛЬЁ',
};

interface HeaderProps {
  activeLayer: ActiveLayer;
  onLayerChange: (layer: ActiveLayer) => void;
}

export function Header({ activeLayer, onLayerChange }: HeaderProps) {
  const tabs: { id: ActiveLayer; label: string; icon: React.ReactNode }[] = [
    { id: 'ecology', label: 'Экология', icon: <MaterialSymbolsPottedPlant /> },
    { id: 'transport', label: 'Транспорт', icon: <MaterialSymbolsDirectionsCar /> },
  ];

  return (
    <>
      <style>{`
        @keyframes headerWavePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes headerLiveDot {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        @media (max-width: 767px) {
          .header-center-status { display: none !important; }
          .header-tab-label { display: none !important; }
          .header-tab-btn { padding: 8px !important; }
        }
      `}</style>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          height: 64,
          background: '#0a0f1e',
          borderBottom: '1px solid #1a2744',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 20px rgba(59,130,246,0.08)',
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', minHeight: 64 }}>
          {/* Left: waveform + titles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <svg
              width={28}
              height={20}
              viewBox="0 0 28 20"
              aria-hidden
              style={{
                color: '#3b82f6',
                animation: 'headerWavePulse 2s ease-in-out infinite',
              }}
            >
              <path
                d="M2 10 L5 4 L8 16 L11 6 L14 14 L17 5 L20 15 L23 8 L26 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, lineHeight: 1.15 }}>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 'clamp(13px, 1.6vw, 18px)',
                  fontWeight: 700,
                  color: '#f1f5f9',
                  letterSpacing: '0.05em',
                }}
              >
                СМАРТ-СИТИ ҚАЗАҚСТАН
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 'clamp(9px, 0.8vw, 11px)',
                    color: '#334155',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  СИСТЕМА МОНИТОРИНГА РЕГИОНОВ
                </span>
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    color: '#3b82f6',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    padding: '2px 8px',
                    borderRadius: 4,
                    letterSpacing: '0.06em',
                  }}
                >
                  {layerLabelRu[activeLayer]}
                </span>
              </div>
            </div>
          </div>

          {/* Center: live status */}
          <div
            className="header-center-status"
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#22c55e',
                animation: 'headerLiveDot 1.5s ease-in-out infinite',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: mono,
                fontSize: 10,
                color: '#22c55e',
                letterSpacing: '0.1em',
                whiteSpace: 'nowrap',
              }}
            >
              СИСТЕМА АКТИВНА
            </span>
          </div>

          {/* Right: tabs */}
          <nav style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {tabs.map((tab) => {
              const isActive = activeLayer === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className="header-tab-btn"
                  onClick={() => onLayerChange(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontFamily: mono,
                    fontSize: 'clamp(11px, 1vw, 13px)',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    background: isActive ? '#1d4ed8' : 'transparent',
                    color: isActive ? '#ffffff' : '#475569',
                    border: isActive ? '1px solid #3b82f6' : '1px solid transparent',
                    boxShadow: isActive ? '0 0 12px rgba(59,130,246,0.3)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#94a3b8';
                      e.currentTarget.style.borderColor = '#1e293b';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#475569';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1, display: 'inline-flex' }} aria-hidden>
                    {tab.icon}
                  </span>
                  <span className="header-tab-label">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <div
        style={{
          height: 1,
          opacity: 0.3,
          background: 'linear-gradient(90deg, transparent, #3b82f6 30%, #3b82f6 70%, transparent)',
        }}
      />
    </>
  );
}
