import React, { useMemo, useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from 'recharts';
import type { ActiveLayer, RegionData, StatusType } from './types';

export function MaterialSymbolsLightBarChart4Bars(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M3 20v-1h18v1zm1-2.77V12h2v5.23zm4.654 0V7h2v10.23zm4.673 0V10h2v7.23zm4.673 0V4h2v13.23z"
      />
    </svg>
  );
}

const statusPill = (status: StatusType) => {
  if (status === 'high') return { label: 'КРИТИЧЕСКИЙ', bg: '#ef4444', fg: '#0b1020' };
  if (status === 'medium') return { label: 'ВНИМАНИЕ', bg: '#f59e0b', fg: '#0b1020' };
  return { label: 'В НОРМЕ', bg: '#22c55e', fg: '#0b1020' };
};

const statusColor = (status: StatusType) => {
  if (status === 'high') return '#ef4444';
  if (status === 'medium') return '#f59e0b';
  return '#22c55e';
};

const statusTag = (status: StatusType) => {
  if (status === 'high') return { text: 'HIGH', color: '#ef4444' };
  if (status === 'medium') return { text: 'MED', color: '#f59e0b' };
  return { text: 'LOW', color: '#22c55e' };
};

type TrendPoint = { month: string; value: number };

interface RegionPanelProps {
  open: boolean;
  region: RegionData | null;
  regionDisplayName: string;
  activeLayer: ActiveLayer;
  onClose: () => void;
  onAIRequest?: (regionName: string, activeLayer: ActiveLayer) => void;
}

export const RegionPanel: React.FC<RegionPanelProps> = ({
  open,
  region,
  regionDisplayName,
  activeLayer,
  onClose,
  onAIRequest,
}) => {
  const overallStatus = region ? region.overallStatus : ('low' as StatusType);
  const layerStatus = region ? region[activeLayer].status : ('low' as StatusType);
  const overallAccent = statusColor(overallStatus);
  const statusInline = statusPill(layerStatus);
  const [trendHoverIndex, setTrendHoverIndex] = useState<number | null>(null);

  const kpis = useMemo(() => {
    if (!region) return [];
    if (activeLayer === 'ecology') {
      return [
        { label: 'AQI', value: region.ecology.aqi, status: region.ecology.status },
        { label: 'CO2', value: `${region.ecology.co2} ppm`, status: region.ecology.status },
      ];
    }
    if (activeLayer === 'transport') {
      return [
        { label: 'Congestion', value: `${region.transport.congestion}%`, status: region.transport.status },
        { label: 'Accidents', value: region.transport.accidents, status: region.transport.status },
      ];
    }
    if (activeLayer === 'safety') {
      return [
        { label: 'Incidents', value: region.safety.incidents, status: region.safety.status },
        { label: 'Crime index', value: region.safety.crimeIndex, status: region.safety.status },
      ];
    }
    return [
      { label: 'Complaints', value: region.housing.complaints, status: region.housing.status },
      { label: 'Failures', value: region.housing.failures, status: region.housing.status },
    ];
  }, [region, activeLayer]);

  const trend: TrendPoint[] = ((region as any)?.trends?.[activeLayer] ?? []) as TrendPoint[];
  const avg = useMemo(() => {
    if (!trend.length) return 0;
    return trend.reduce((s, p) => s + p.value, 0) / trend.length;
  }, [trend]);

  const threatFillPct = layerStatus === 'high' ? 0.9 : layerStatus === 'medium' ? 0.55 : 0.2;

  const sectionCard: React.CSSProperties = {
    background: '#111827',
    border: '1px solid #1e293b',
    borderRadius: 12,
    padding: 12,
  };

  const kpiCardBase: React.CSSProperties = {
    background: '#111827',
    border: '1px solid #1e293b',
    borderRadius: 12,
    padding: 14,
    minHeight: 106,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    transition: 'border-color 160ms ease',
  };

  const fontMono =
    'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

  return (
    <aside
      className="region-panel"
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        height: '100%',
        width: 380,
        background: 'linear-gradient(180deg, #0d1426 0%, #0a0f1e 100%)',
        borderLeft: '1px solid #1a2744',
        borderTop: `2px solid ${overallAccent}`,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 300ms ease',
        zIndex: 1000,
        pointerEvents: open ? 'auto' : 'none',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        overflowY: 'auto',
      }}
      aria-hidden={!open}
    >
      <style>{`
        .region-panel::-webkit-scrollbar { width: 4px; }
        .region-panel::-webkit-scrollbar-track { background: transparent; }
        .region-panel::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 999px; }

        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.25); opacity: 0.55; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: fontMono,
              fontSize: 22,
              fontWeight: 600,
              color: '#f1f5f9',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {regionDisplayName || '—'}
          </div>
          <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: statusColor(layerStatus), fontSize: 11, fontFamily: fontMono }}>
              ● {statusInline.label}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            background: '#1a2744',
            border: '1px solid #1e293b',
            color: '#e2e8f0',
            borderRadius: 10,
            fontSize: 18,
            lineHeight: '26px',
            cursor: 'pointer',
            transition: 'background 150ms ease',
            flex: '0 0 auto',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1a2744';
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {kpis.map((k, idx) => {
          const tag = statusTag(k.status);
          const c = tag.color;
          const bars = idx % 2 === 0 ? [0.25, 0.55, 0.35, 0.7] : [0.4, 0.28, 0.6, 0.46];
          return (
            <div
              key={k.label}
              style={kpiCardBase}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = c;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#1e293b';
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: fontMono,
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1.1,
                  }}
                >
                  {k.value}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 4, alignItems: 'flex-end', height: 14 }}>
                  {bars.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: 14,
                        height: Math.round(3 + h * 10),
                        background: c,
                        opacity: 0.4,
                        borderRadius: 3,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {k.label}
              </div>

              <div
                style={{
                  position: 'absolute',
                  right: 10,
                  bottom: 10,
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: `1px solid ${c}`,
                  background: `rgba(${c === '#ef4444' ? '239,68,68' : c === '#f59e0b' ? '245,158,11' : '34,197,94'}, 0.20)`,
                  color: c,
                  fontFamily: fontMono,
                  lineHeight: 1.2,
                }}
              >
                {tag.text}
              </div>
            </div>
          );
        })}
      </div>

      <div style={sectionCard}>
        <div style={{ fontSize: 11, color: '#64748b', fontFamily: fontMono, marginBottom: 10 }}>Уровень угрозы</div>
        <div style={{ width: '100%', height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.round(threatFillPct * 100)}%`,
              height: '100%',
              background: statusColor(layerStatus),
              borderRadius: 3,
              opacity: 0.95,
            }}
          />
        </div>
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            justifyContent: 'flex-end',
            fontSize: 13,
            fontFamily: fontMono,
            color: statusColor(layerStatus),
          }}
        >
          {statusInline.label}
        </div>
      </div>

      <div style={{ ...sectionCard, padding: 12 }}>
        <div style={{ fontSize: 12, color: '#64748b', fontFamily: fontMono, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Динамика за 6 месяцев
        </div>
        <div style={{ marginTop: 10, width: '100%', height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trend}
              onMouseMove={(state: any) => {
                if (state?.isTooltipActive && typeof state?.activeTooltipIndex === 'number') {
                  setTrendHoverIndex(state.activeTooltipIndex);
                } else {
                  setTrendHoverIndex(null);
                }
              }}
              onMouseLeave={() => setTrendHoverIndex(null)}
            >
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(59,130,246,0.08)' }}
                contentStyle={{
                  background: '#0d1426',
                  border: '1px solid #1a2744',
                  borderRadius: 10,
                  color: '#e2e8f0',
                  fontSize: 12,
                }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <ReferenceLine
                y={avg}
                stroke="#3b82f6"
                strokeDasharray="4 4"
                label={{ value: 'avg', position: 'right', fill: '#3b82f6', fontSize: 10 }}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 4, 4]}
                fill={statusColor(layerStatus)}
                fillOpacity={0.8}
                isAnimationActive={false}
              >
                {trend.map((_, i) => (
                  <Cell key={i} fillOpacity={trendHoverIndex === i ? 1 : 0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ ...sectionCard, padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ fontFamily: fontMono, fontSize: 12, color: '#e2e8f0' }}>AI Прогнозирование</div>
          <div
            style={{
              fontFamily: fontMono,
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 999,
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid #3b82f6',
              color: '#93c5fd',
            }}
          >
            СКОРО
          </div>
        </div>
        <div
          style={{
            height: 120,
            background: '#111827',
            border: '1px dashed #1e293b',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            textAlign: 'center',
            padding: 12,
          }}
        >
          <div style={{ fontSize: 24, lineHeight: 1, color: '#3b82f6', display: 'inline-flex' }}>
            <MaterialSymbolsLightBarChart4Bars />
          </div>
          <div style={{ fontSize: 12, color: '#475569' }}>Прогноз и аномалии появятся здесь</div>
          <div style={{ fontSize: 11, color: '#334155' }}>Подключите AI-модуль в настройках</div>
        </div>
      </div>

      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
          border: '1px solid #3730a3',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontFamily: fontMono, fontSize: 13, color: '#818cf8' }}>AI Анализ</div>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: '#818cf8',
              animation: 'pulseDot 1.2s ease-in-out infinite',
            }}
          />
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
          Получите анализ ситуации и рекомендации по трём ключевым вопросам
        </div>

        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['Что происходит?', 'Насколько критично?', 'Что предпринять?'].map((q) => (
            <div
              key={q}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                background: '#1e1b4b',
                border: '1px solid #818cf8',
                color: '#a5b4fc',
                fontSize: 11,
                fontFamily: fontMono,
              }}
            >
              {q}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onAIRequest?.(regionDisplayName, activeLayer)}
          style={{
            marginTop: 14,
            width: '100%',
            background: '#4f46e5',
            border: '1px solid #4f46e5',
            color: '#ffffff',
            fontFamily: fontMono,
            fontSize: 13,
            borderRadius: 8,
            padding: 10,
            cursor: onAIRequest ? 'pointer' : 'default',
            transition: 'background 140ms ease, transform 140ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#6366f1';
            e.currentTarget.style.transform = 'scale(1.01)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#4f46e5';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Запустить AI анализ →
        </button>
      </div>
    </aside>
  );
};

