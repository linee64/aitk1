import React, { useMemo } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { ActiveLayer, RegionData, StatusType } from './types';

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

const cardStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid #1a2744',
  borderRadius: 12,
  padding: 12,
  minHeight: 84,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
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
  const layerStatus = region ? region[activeLayer].status : ('low' as StatusType);
  const pill = statusPill(layerStatus);

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
  const barColor = statusColor(layerStatus);

  return (
    <aside
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        height: '100%',
        width: 380,
        background: '#0d1426',
        borderLeft: '1px solid #1a2744',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 300ms ease',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: open ? 'auto' : 'none',
      }}
      aria-hidden={!open}
    >
      <div style={{ padding: 16, borderBottom: '1px solid #1a2744' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div
            style={{
              color: '#e2e8f0',
              fontSize: 20,
              fontFamily: 'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              lineHeight: 1.25,
            }}
          >
            {regionDisplayName || '—'}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              background: '#0d1426',
              border: '1px solid #1a2744',
              color: '#e2e8f0',
              borderRadius: 10,
              fontSize: 18,
              cursor: 'pointer',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {kpis.map((k) => (
            <div key={k.label} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div
                  style={{
                    color: '#e2e8f0',
                    fontSize: 22,
                    fontFamily: 'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  }}
                >
                  {k.value}
                </div>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: statusColor(k.status),
                    boxShadow: `0 0 10px ${statusColor(k.status)}`,
                  }}
                />
              </div>
              <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 8 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '10px 12px',
          }}
        >
          <div
            style={{
              background: pill.bg,
              color: pill.fg,
              borderRadius: 999,
              padding: '10px 16px',
              fontWeight: 800,
              letterSpacing: 1,
              fontFamily: 'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            {pill.label}
          </div>
        </div>

        <div style={{ ...cardStyle, padding: 14 }}>
          <div style={{ color: '#e2e8f0', fontSize: 12, marginBottom: 10, fontFamily: 'IBM Plex Mono, monospace' }}>
            Trend (6 months)
          </div>
          <div style={{ width: '100%', height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
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
                <Bar dataKey="value" fill={barColor} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAIRequest?.(regionDisplayName, activeLayer)}
          style={{
            ...cardStyle,
            textAlign: 'left',
            cursor: onAIRequest ? 'pointer' : 'default',
            padding: 14,
            borderColor: '#1a2744',
            transition: 'border-color 150ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a2744';
          }}
        >
          <div style={{ color: '#e2e8f0', fontSize: 12, marginBottom: 6, fontFamily: 'IBM Plex Mono, monospace' }}>
            AI Анализ
          </div>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>Нажмите для получения рекомендаций →</div>
        </button>
      </div>
    </aside>
  );
};

