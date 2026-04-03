import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ActiveLayer } from './types';
import { useTheme } from './theme';

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

/** Material Symbols — Clear day (sun), rounded */
export function MaterialSymbolsClearDayRounded(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M12 5q-.425 0-.712-.288Q11 4.425 11 4V2q0-.425.288-.713Q11.575 1 12 1t.713.287Q13 1.575 13 2v2q0 .425-.287.712Q12.425 5 12 5Zm4.95 2.05q-.275-.275-.275-.688q0-.412.275-.712l1.4-1.425q.3-.3.712-.3q.413 0 .713.3q.275.275.275.7q0 .425-.275.7L18.35 7.05q-.275.275-.7.275q-.425 0-.7-.275ZM20 13q-.425 0-.712-.288Q19 12.425 19 12t.288-.713Q19.575 11 20 11h2q.425 0 .712.287q.288.288.288.713t-.288.712Q22.425 13 22 13Zm-8 10q-.425 0-.712-.288Q11 22.425 11 22v-2q0-.425.288-.712Q11.575 19 12 19t.713.288Q13 19.575 13 20v2q0 .425-.287.712Q12.425 23 12 23ZM5.65 7.05l-1.425-1.4q-.3-.3-.3-.725t.3-.7q.275-.275.7-.275q.425 0 .7.275L7.05 5.65q.275.275.275.7q0 .425-.275.7q-.3.275-.7.275q-.4 0-.7-.275Zm12.7 12.725l-1.4-1.425q-.275-.3-.275-.712q0-.413.275-.688q.275-.275.688-.275q.412 0 .712.275l1.425 1.4q.3.275.287.7q-.012.425-.287.725q-.3.3-.725.3t-.7-.3ZM2 13q-.425 0-.712-.288Q1 12.425 1 12t.288-.713Q1.575 11 2 11h2q.425 0 .713.287Q5 11.575 5 12t-.287.712Q4.425 13 4 13Zm2.225 6.775q-.275-.275-.275-.7q0-.425.275-.7L5.65 16.95q.275-.275.688-.275q.412 0 .712.275q.3.3.3.713q0 .412-.3.712l-1.4 1.4q-.3.3-.725.3t-.7-.3ZM12 18q-2.5 0-4.25-1.75T6 12q0-2.5 1.75-4.25T12 6q2.5 0 4.25 1.75T18 12q0 2.5-1.75 4.25T12 18Zm0-2q1.65 0 2.825-1.175Q16 13.65 16 12q0-1.65-1.175-2.825Q13.65 8 12 8q-1.65 0-2.825 1.175Q8 10.35 8 12q0 1.65 1.175 2.825Q10.35 16 12 16Z"
      />
    </svg>
  );
}

/** Material Symbols — Dark mode (moon) */
export function MaterialSymbolsDarkMode(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M12 21q-3.75 0-6.375-2.625T3 12t2.625-6.375T12 3q.35 0 .688.025t.662.075q-1.025.725-1.638 1.888T11.1 7.5q0 2.25 1.575 3.825T16.5 12.9q1.375 0 2.525-.613T20.9 10.65q.05.325.075.662T21 12q0 3.75-2.625 6.375T12 21"
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

function useNarrowHeader(breakpointPx: number) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [breakpointPx]);
  return narrow;
}

export function Header({ activeLayer, onLayerChange }: HeaderProps) {
  const { theme, toggleTheme, isDark } = useTheme();
  const narrowNav = useNarrowHeader(768);
  const [burgerOpen, setBurgerOpen] = useState(false);
  const burgerWrapRef = useRef<HTMLDivElement>(null);

  const tabs: { id: ActiveLayer; label: string; icon: React.ReactNode }[] = [
    { id: 'ecology', label: 'Экология', icon: <MaterialSymbolsPottedPlant /> },
    { id: 'transport', label: 'Транспорт', icon: <MaterialSymbolsDirectionsCar /> },
  ];

  const goBack = useCallback(() => {
    if (window.history.length > 1) window.history.back();
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!burgerOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (burgerWrapRef.current && !burgerWrapRef.current.contains(e.target as Node)) {
        setBurgerOpen(false);
      }
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [burgerOpen]);

  const tabBtnStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    fontFamily: mono,
    fontSize: 'clamp(11px, 1vw, 13px)',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    background: isActive ? '#1d4ed8' : isDark ? 'transparent' : 'rgba(255,255,255,0.9)',
    color: isActive ? '#ffffff' : 'var(--header-tab-inactive)',
    border: isActive ? '1px solid #3b82f6' : '1px solid transparent',
    boxShadow: isActive ? '0 0 12px rgba(59,130,246,0.3)' : 'none',
    flexShrink: 0,
  });

  const iconBtnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    flexShrink: 0,
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: mono,
    border: isDark ? '1px solid #1e293b' : '1px solid var(--header-badge-border)',
    background: isDark ? '#111827' : '#ffffff',
    color: isDark ? '#e2e8f0' : '#1a1a2e',
    transition: 'background 160ms ease, border-color 160ms ease',
  };

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
        @media (max-width: 768px) {
          .header-subtitle-line { display: none !important; }
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
          background: 'var(--header-bg)',
          borderBottom: '1px solid var(--header-border-bottom)',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: isDark ? '0 1px 20px rgba(59,130,246,0.08)' : '0 1px 12px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            minHeight: 64,
          }}
        >
          <button
            type="button"
            onClick={goBack}
            aria-label="Назад"
            style={{
              ...iconBtnBase,
              fontSize: 18,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ←
          </button>

          <div
            style={{
              minWidth: 0,
              flexShrink: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <svg
              width={28}
              height={20}
              viewBox="0 0 28 20"
              aria-hidden
              style={{
                color: '#3b82f6',
                animation: 'headerWavePulse 2s ease-in-out infinite',
                flexShrink: 0,
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, lineHeight: 1.15, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 'clamp(13px, 1.6vw, 18px)',
                  fontWeight: 700,
                  color: 'var(--header-title)',
                  letterSpacing: '0.05em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                СМАРТ-СИТИ ҚАЗАҚСТАН
              </div>
              <div className="header-subtitle-line" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 'clamp(9px, 0.8vw, 11px)',
                    color: 'var(--header-subtitle)',
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
                    color: 'var(--accent)',
                    background: 'var(--header-badge-bg)',
                    border: '1px solid var(--header-badge-border)',
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

          {!narrowNav && (
            <div
              className="header-center-status"
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                pointerEvents: 'auto',
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
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
                className="header-theme-toggle"
                style={{
                  ...iconBtnBase,
                  padding: 0,
                }}
              >
                {isDark ? (
                  <MaterialSymbolsDarkMode style={{ width: 20, height: 20 }} aria-hidden />
                ) : (
                  <MaterialSymbolsClearDayRounded style={{ width: 20, height: 20 }} aria-hidden />
                )}
              </button>
            </div>
          )}

          {!narrowNav && (
            <nav style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              {tabs.map((tab) => {
                const isActive = activeLayer === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className="header-tab-btn"
                    onClick={() => onLayerChange(tab.id)}
                    style={tabBtnStyle(isActive)}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--header-tab-hover)';
                        e.currentTarget.style.borderColor = 'var(--header-tab-hover-border)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--header-tab-inactive)';
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
          )}

          {narrowNav && (
            <div
              ref={burgerWrapRef}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
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
                aria-hidden
              />
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
                className="header-theme-toggle"
                style={{
                  ...iconBtnBase,
                  padding: 0,
                }}
              >
                {isDark ? (
                  <MaterialSymbolsDarkMode style={{ width: 20, height: 20 }} aria-hidden />
                ) : (
                  <MaterialSymbolsClearDayRounded style={{ width: 20, height: 20 }} aria-hidden />
                )}
              </button>
              <div style={{ position: 'relative' }}>
              <button
                type="button"
                aria-expanded={burgerOpen}
                aria-label="Меню"
                onClick={(e) => {
                  e.stopPropagation();
                  setBurgerOpen((o) => !o);
                }}
                style={{
                  ...iconBtnBase,
                  fontSize: 18,
                  padding: 0,
                }}
              >
                ☰
              </button>
              {burgerOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 6px)',
                    minWidth: 200,
                    padding: 8,
                    borderRadius: 10,
                    background: 'var(--header-bg)',
                    border: '1px solid var(--header-border-bottom)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    zIndex: 1002,
                  }}
                >
                  {tabs.map((tab) => {
                    const isActive = activeLayer === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          onLayerChange(tab.id);
                          setBurgerOpen(false);
                        }}
                        style={{
                          ...tabBtnStyle(isActive),
                          width: '100%',
                          justifyContent: 'flex-start',
                        }}
                      >
                        <span style={{ fontSize: 16, lineHeight: 1, display: 'inline-flex' }} aria-hidden>
                          {tab.icon}
                        </span>
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              </div>
            </div>
          )}
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
