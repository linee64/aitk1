import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from 'recharts';
import type { ActiveLayer, RegionData, StatusType } from './types';
import { useAnomalyDetection } from './hooks/useAnomalyDetection';
import type { AppTheme } from './theme';

type PanelPalette = {
  panelBg: string;
  panelBorderLeft: string;
  panelShadow: string;
  title: string;
  closeBg: string;
  closeBorder: string;
  closeColor: string;
  closeHoverBg: string;
  kpiCardBg: string;
  kpiCardBorder: string;
  kpiValue: string;
  muted: string;
  sectionBg: string;
  sectionBorder: string;
  barTrack: string;
  chartGrid: string;
  chartTick: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipColor: string;
  tooltipLabel: string;
  tooltipCursor: string;
  scrollThumb: string;
  aiSub: string;
  aiChipBg: string;
  aiChipBorder: string;
  aiChipColor: string;
  aiBoxFrom: string;
  aiBoxTo: string;
  aiBoxBorder: string;
  aiDot: string;
};

function panelPalette(theme: AppTheme): PanelPalette {
  if (theme === 'light') {
    return {
      panelBg: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      panelBorderLeft: '1px solid rgba(0,0,0,0.1)',
      panelShadow: '-8px 0 32px rgba(0,0,0,0.08)',
      title: '#1a1a2e',
      closeBg: '#f1f5f9',
      closeBorder: 'rgba(0,0,0,0.12)',
      closeColor: '#1a1a2e',
      closeHoverBg: '#ef4444',
      kpiCardBg: '#f8fafc',
      kpiCardBorder: '#e2e8f0',
      kpiValue: '#1a1a2e',
      muted: '#64748b',
      sectionBg: '#f8fafc',
      sectionBorder: '#e2e8f0',
      barTrack: '#e2e8f0',
      chartGrid: '#e2e8f0',
      chartTick: '#64748b',
      tooltipBg: '#ffffff',
      tooltipBorder: 'rgba(0,0,0,0.12)',
      tooltipColor: '#1a1a2e',
      tooltipLabel: '#64748b',
      tooltipCursor: 'rgba(37,99,235,0.12)',
      scrollThumb: '#cbd5e1',
      aiSub: '#64748b',
      aiChipBg: '#eef2ff',
      aiChipBorder: '#818cf8',
      aiChipColor: '#4f46e5',
      aiBoxFrom: '#eef2ff',
      aiBoxTo: '#f8fafc',
      aiBoxBorder: '#c7d2fe',
      aiDot: '#6366f1',
    };
  }
  return {
    panelBg: 'linear-gradient(180deg, #0d1426 0%, #0a0f1e 100%)',
    panelBorderLeft: '1px solid #1a2744',
    panelShadow: 'none',
    title: '#f1f5f9',
    closeBg: '#1a2744',
    closeBorder: '#1e293b',
    closeColor: '#e2e8f0',
    closeHoverBg: '#ef4444',
    kpiCardBg: '#111827',
    kpiCardBorder: '#1e293b',
    kpiValue: '#ffffff',
    muted: '#64748b',
    sectionBg: '#111827',
    sectionBorder: '#1e293b',
    barTrack: '#1e293b',
    chartGrid: '#1e293b',
    chartTick: '#475569',
    tooltipBg: '#0d1426',
    tooltipBorder: '#1a2744',
    tooltipColor: '#e2e8f0',
    tooltipLabel: '#94a3b8',
    tooltipCursor: 'rgba(59,130,246,0.08)',
    scrollThumb: '#1e293b',
    aiSub: '#64748b',
    aiChipBg: '#1e1b4b',
    aiChipBorder: '#818cf8',
    aiChipColor: '#a5b4fc',
    aiBoxFrom: '#0f172a',
    aiBoxTo: '#1e1b4b',
    aiBoxBorder: '#3730a3',
    aiDot: '#818cf8',
  };
}

export function MaterialSymbolsClose(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z"
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

const metricLabelRu: Record<string, string> = {
  aqi: 'AQI',
  congestion: 'Пробки',
  co2: 'CO₂',
};

const CATEGORY_LABELS: Record<ActiveLayer, string> = {
  ecology: 'Экология',
  transport: 'Транспорт',
  safety: 'Безопасность',
  housing: 'Жильё',
};

type AiForecast = {
  summary: string;
  trend: 'worsening' | 'stable' | 'improving';
  predictedValues?: { aqi?: number | null; congestion?: number | null };
  riskLevel: string;
  timeframe: string;
};

export type AiAnalysisResult = {
  situation?: string;
  criticality?: string;
  criticalityColor?: string;
  explanation?: string;
  recommendations?: string[];
  forecast?: AiForecast;
};

type TrendPoint = { month: string; value: number };

type ChatMessage = { role: 'user' | 'assistant'; content: string };

interface RegionPanelProps {
  theme: AppTheme;
  open: boolean;
  region: RegionData | null;
  regionDisplayName: string;
  activeLayer: ActiveLayer;
  onClose: () => void;
  onAIRequest?: (regionName: string, activeLayer: ActiveLayer) => void;
}

export const RegionPanel: React.FC<RegionPanelProps> = ({
  theme,
  open,
  region,
  regionDisplayName,
  activeLayer,
  onClose,
  onAIRequest,
}) => {
  const pt = panelPalette(theme);
  const overallStatus = region ? region.overallStatus : ('low' as StatusType);
  const layerStatus = region ? region[activeLayer].status : ('low' as StatusType);
  const overallAccent = statusColor(overallStatus);
  const statusInline = statusPill(layerStatus);
  const [trendHoverIndex, setTrendHoverIndex] = useState<number | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAiAnalysis(null);
    setAiLoading(false);
  }, [region?.id, activeLayer]);

  useEffect(() => {
    setChatMessages([]);
    setChatInput('');
    setChatError(null);
  }, [region?.id]);

  useEffect(() => {
    if (open) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading, open]);

  const runAiAnalysis = useCallback(async () => {
    if (!region) return;
    onAIRequest?.(regionDisplayName, activeLayer);
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regionData: region,
          category: activeLayer,
          categoryLabel: CATEGORY_LABELS[activeLayer],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analyze failed');
      setAiAnalysis(data.analysis as AiAnalysisResult);
    } catch (e) {
      console.error(e);
      setAiAnalysis(null);
    } finally {
      setAiLoading(false);
    }
  }, [region, activeLayer, regionDisplayName, onAIRequest]);

  const sendChat = async () => {
    if (!region || chatLoading) return;
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    setChatError(null);
    const nextMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: trimmed }];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatLoading(true);
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          regionData: region,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(data.details || data.error || 'Не удалось получить ответ');
      }
      const reply = typeof data.reply === 'string' ? data.reply : '';
      if (!reply) throw new Error('Пустой ответ модели');
      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка сети';
      setChatError(msg);
    } finally {
      setChatLoading(false);
    }
  };

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

  const anomalyMetrics = useMemo(
    () => ({
      aqi: region?.ecology?.aqi ?? 0,
      congestion: region?.transport?.congestion ?? 0,
      co2: region?.ecology?.co2 ?? 0,
    }),
    [region],
  );
  const { anomalyData, loading: anomalyLoading } = useAnomalyDetection(region?.id ?? null, anomalyMetrics);

  const trend: TrendPoint[] = ((region as any)?.trends?.[activeLayer] ?? []) as TrendPoint[];
  const avg = useMemo(() => {
    if (!trend.length) return 0;
    return trend.reduce((s, p) => s + p.value, 0) / trend.length;
  }, [trend]);

  const threatFillPct = layerStatus === 'high' ? 0.9 : layerStatus === 'medium' ? 0.55 : 0.2;

  const sectionCard: React.CSSProperties = {
    background: pt.sectionBg,
    border: `1px solid ${pt.sectionBorder}`,
    borderRadius: 12,
    padding: 12,
  };

  const kpiCardBase: React.CSSProperties = {
    background: pt.kpiCardBg,
    border: `1px solid ${pt.kpiCardBorder}`,
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
        background: pt.panelBg,
        borderLeft: pt.panelBorderLeft,
        boxShadow: pt.panelShadow,
        borderTop: `2px solid ${overallAccent}`,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 300ms ease',
        zIndex: 1100,
        pointerEvents: open ? 'auto' : 'none',
        padding: 20,
        paddingTop: 56,
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
        .region-panel::-webkit-scrollbar-thumb { background: ${pt.scrollThumb}; border-radius: 999px; }

        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.25); opacity: 0.55; }
        }
        @keyframes forecastSkeleton {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.55; }
        }
      `}</style>

      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть панель"
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 30,
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme === 'dark' ? 'rgba(15, 23, 42, 0.92)' : '#ffffff',
          border: theme === 'dark' ? '2px solid rgba(248, 250, 252, 0.35)' : '2px solid rgba(0,0,0,0.12)',
          color: theme === 'dark' ? '#f8fafc' : '#1a1a2e',
          borderRadius: 12,
          cursor: 'pointer',
          boxShadow: theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.45)' : '0 4px 16px rgba(0,0,0,0.12)',
          transition: 'background 150ms ease, transform 150ms ease, border-color 150ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = pt.closeHoverBg;
          e.currentTarget.style.color = '#ffffff';
          e.currentTarget.style.borderColor = 'rgba(248,250,252,0.5)';
          e.currentTarget.style.transform = 'scale(1.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = theme === 'dark' ? 'rgba(15, 23, 42, 0.92)' : '#ffffff';
          e.currentTarget.style.color = theme === 'dark' ? '#f8fafc' : '#1a1a2e';
          e.currentTarget.style.borderColor =
            theme === 'dark' ? 'rgba(248, 250, 252, 0.35)' : 'rgba(0,0,0,0.12)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <MaterialSymbolsClose style={{ width: 24, height: 24 }} aria-hidden />
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 14, paddingRight: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: fontMono,
              fontSize: 22,
              fontWeight: 600,
              color: pt.title,
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
                (e.currentTarget as HTMLDivElement).style.borderColor = pt.kpiCardBorder;
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: fontMono,
                    fontSize: 28,
                    fontWeight: 700,
                    color: pt.kpiValue,
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
                  color: pt.muted,
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
        <div style={{ fontSize: 11, color: pt.muted, fontFamily: fontMono, marginBottom: 10 }}>Уровень угрозы</div>
        <div style={{ width: '100%', height: 6, background: pt.barTrack, borderRadius: 3, overflow: 'hidden' }}>
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
        <div style={{ fontSize: 12, color: pt.muted, fontFamily: fontMono, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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
              <CartesianGrid stroke={pt.chartGrid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: pt.chartTick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: pt.tooltipCursor }}
                contentStyle={{
                  background: pt.tooltipBg,
                  border: `1px solid ${pt.tooltipBorder}`,
                  borderRadius: 10,
                  color: pt.tooltipColor,
                  fontSize: 12,
                }}
                labelStyle={{ color: pt.tooltipLabel }}
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

      <div
        style={{
          ...sectionCard,
          padding: 12,
          background:
            anomalyData?.hasAnomalies && anomalyData.overallRisk === 'critical'
              ? 'rgba(239,68,68,0.1)'
              : anomalyData?.hasAnomalies
                ? 'rgba(245,158,11,0.1)'
                : 'rgba(34,197,94,0.1)',
          border:
            anomalyData?.hasAnomalies && anomalyData.overallRisk === 'critical'
              ? '1px solid #ef4444'
              : anomalyData?.hasAnomalies
                ? '1px solid #f59e0b'
                : '1px solid #22c55e',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontFamily: fontMono,
            color: pt.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 10,
          }}
        >
          Аномалии (изоляция от нормы)
        </div>
        {anomalyLoading && (
          <div style={{ fontSize: 12, fontFamily: fontMono, color: pt.muted }}>Анализ…</div>
        )}
        {!anomalyLoading && anomalyData?.hasAnomalies && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, fontFamily: fontMono, color: '#ef4444', fontWeight: 600 }}>
              ⚠ Обнаружена аномалия
            </div>
            {anomalyData.anomalies.map((a) => {
              const label = metricLabelRu[a.metric] ?? a.metric;
              const barPct = Math.min(100, (a.deviation / 4) * 100);
              const sev = a.severity === 'critical';
              return (
                <div key={a.metric} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12, fontFamily: fontMono, color: pt.title }}>{label}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: fontMono,
                        padding: '2px 8px',
                        borderRadius: 6,
                        border: `1px solid ${sev ? '#ef4444' : '#f59e0b'}`,
                        color: sev ? '#ef4444' : '#f59e0b',
                        background: sev ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                      }}
                    >
                      {sev ? 'КРИТИЧНО' : 'ВНИМАНИЕ'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontFamily: fontMono, color: pt.muted }}>
                    Текущее значение: {a.currentValue} (норма: {a.historicalMean})
                  </div>
                  <div style={{ width: '100%', height: 6, background: pt.barTrack, borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${barPct}%`,
                        height: '100%',
                        background: sev ? '#ef4444' : '#f59e0b',
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!anomalyLoading && anomalyData && !anomalyData.hasAnomalies && (
          <div style={{ fontSize: 12, fontFamily: fontMono, color: '#22c55e' }}>✓ Показатели в норме</div>
        )}
      </div>

      {(aiLoading || aiAnalysis) && (
        <div
          style={{
            background: '#111827',
            border: '1px solid #1e293b',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              fontFamily: fontMono,
              fontSize: 13,
              color: '#e2e8f0',
            }}
          >
            <span aria-hidden>🕐</span>
            Прогноз на 24-48 часов
          </div>

          {aiLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  height: 14,
                  borderRadius: 6,
                  background: '#1e293b',
                  width: '55%',
                  animation: 'forecastSkeleton 1.1s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  height: 12,
                  borderRadius: 6,
                  background: '#1e293b',
                  width: '100%',
                  animation: 'forecastSkeleton 1.1s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  height: 12,
                  borderRadius: 6,
                  background: '#1e293b',
                  width: '88%',
                  animation: 'forecastSkeleton 1.1s ease-in-out infinite',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <div
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 10,
                    background: '#1e293b',
                    animation: 'forecastSkeleton 1.1s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 10,
                    background: '#1e293b',
                    animation: 'forecastSkeleton 1.1s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          )}

          {!aiLoading && aiAnalysis?.forecast && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(() => {
                const tr = aiAnalysis.forecast!.trend;
                const trendUi =
                  tr === 'worsening'
                    ? { arrow: '↑', label: 'Ухудшение', color: '#ef4444' }
                    : tr === 'improving'
                      ? { arrow: '↓', label: 'Улучшение', color: '#22c55e' }
                      : { arrow: '→', label: 'Стабильно', color: '#94a3b8' };
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: fontMono, fontSize: 13 }}>
                    <span style={{ color: trendUi.color, fontSize: 18 }}>{trendUi.arrow}</span>
                    <span style={{ color: trendUi.color }}>{trendUi.label}</span>
                  </div>
                );
              })()}

              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: '#94a3b8',
                  lineHeight: 1.6,
                }}
              >
                {aiAnalysis.forecast.summary}
              </p>

              {(aiAnalysis.forecast.predictedValues?.aqi != null ||
                aiAnalysis.forecast.predictedValues?.congestion != null) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {aiAnalysis.forecast.predictedValues?.aqi != null && (
                    <div
                      style={{
                        background: pt.kpiCardBg,
                        border: `1px solid ${pt.kpiCardBorder}`,
                        borderRadius: 10,
                        padding: '10px 12px',
                        minHeight: 56,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      <div style={{ fontSize: 10, color: pt.muted, fontFamily: fontMono, textTransform: 'uppercase' }}>
                        Прогноз AQI
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: pt.kpiValue, fontFamily: fontMono }}>
                        {aiAnalysis.forecast.predictedValues!.aqi}
                      </div>
                    </div>
                  )}
                  {aiAnalysis.forecast.predictedValues?.congestion != null && (
                    <div
                      style={{
                        background: pt.kpiCardBg,
                        border: `1px solid ${pt.kpiCardBorder}`,
                        borderRadius: 10,
                        padding: '10px 12px',
                        minHeight: 56,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      <div style={{ fontSize: 10, color: pt.muted, fontFamily: fontMono, textTransform: 'uppercase' }}>
                        Прогноз пробок
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: pt.kpiValue, fontFamily: fontMono }}>
                        {aiAnalysis.forecast.predictedValues!.congestion}%
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(() => {
                const risk = aiAnalysis.forecast!.riskLevel || 'Низкий';
                const rc =
                  risk.includes('Высок') || risk.toLowerCase().includes('high')
                    ? { bg: 'rgba(239,68,68,0.2)', border: '#ef4444', color: '#ef4444' }
                    : risk.includes('Средн') || risk.toLowerCase().includes('medium')
                      ? { bg: 'rgba(245,158,11,0.2)', border: '#f59e0b', color: '#f59e0b' }
                      : { bg: 'rgba(34,197,94,0.2)', border: '#22c55e', color: '#22c55e' };
                return (
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: fontMono,
                        padding: '4px 12px',
                        borderRadius: 999,
                        border: `1px solid ${rc.border}`,
                        background: rc.bg,
                        color: rc.color,
                      }}
                    >
                      {risk}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b', fontFamily: fontMono }}>
                      Горизонт: {aiAnalysis.forecast!.timeframe}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {!aiLoading && aiAnalysis && !aiAnalysis.forecast && (
            <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: fontMono }}>
              Прогноз не вернулся в ответе модели.
            </div>
          )}
        </div>
      )}

      <div
        style={{
          background: `linear-gradient(135deg, ${pt.aiBoxFrom}, ${pt.aiBoxTo})`,
          border: `1px solid ${pt.aiBoxBorder}`,
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontFamily: fontMono, fontSize: 13, color: theme === 'light' ? '#4f46e5' : '#818cf8' }}>
            AI Анализ
          </div>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: pt.aiDot,
              animation: 'pulseDot 1.2s ease-in-out infinite',
            }}
          />
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: pt.aiSub, lineHeight: 1.5 }}>
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
                background: pt.aiChipBg,
                border: `1px solid ${pt.aiChipBorder}`,
                color: pt.aiChipColor,
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
          onClick={() => void runAiAnalysis()}
          disabled={!region || aiLoading}
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
            cursor: !region || aiLoading ? 'not-allowed' : 'pointer',
            opacity: !region || aiLoading ? 0.65 : 1,
            transition: 'background 140ms ease, transform 140ms ease',
          }}
          onMouseEnter={(e) => {
            if (!region || aiLoading) return;
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

      <div
        style={{
          ...sectionCard,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: 12,
        }}
      >
        <div style={{ fontFamily: fontMono, fontSize: 11, color: pt.muted, letterSpacing: '0.06em' }}>ИИ чат</div>

        <div
          style={{
            minHeight: 160,
            maxHeight: 200,
            overflowY: 'auto',
            borderRadius: 8,
            background: pt.sectionBg,
            border: `1px solid ${pt.sectionBorder}`,
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {chatMessages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '94%',
                borderRadius: 8,
                padding: '6px 8px',
                fontSize: 11,
                lineHeight: 1.45,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: m.role === 'user' ? fontMono : 'inherit',
                background:
                  m.role === 'user'
                    ? theme === 'dark'
                      ? 'rgba(79,70,229,0.35)'
                      : 'rgba(79,70,229,0.15)'
                    : theme === 'dark'
                      ? 'rgba(30,41,59,0.9)'
                      : '#ffffff',
                border: `1px solid ${m.role === 'user' ? pt.aiChipBorder : pt.sectionBorder}`,
                color: pt.title,
              }}
            >
              {m.content}
            </div>
          ))}
          {chatLoading && (
            <div style={{ fontSize: 10, color: pt.muted, fontFamily: fontMono }}>…</div>
          )}
          <div ref={chatEndRef} />
        </div>

        {chatError && (
          <div style={{ fontSize: 10, color: '#f87171', fontFamily: fontMono, lineHeight: 1.35 }}>{chatError}</div>
        )}

        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendChat();
              }
            }}
            placeholder=""
            aria-label="Сообщение"
            rows={2}
            disabled={!region || chatLoading}
            style={{
              flex: 1,
              resize: 'none',
              borderRadius: 8,
              border: `1px solid ${pt.sectionBorder}`,
              background: pt.sectionBg,
              color: pt.title,
              padding: '6px 8px',
              fontSize: 11,
              fontFamily: fontMono,
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => void sendChat()}
            disabled={!region || chatLoading || !chatInput.trim()}
            style={{
              flexShrink: 0,
              height: 40,
              padding: '0 12px',
              background: !region || chatLoading || !chatInput.trim() ? pt.barTrack : '#4f46e5',
              border: `1px solid ${!region || chatLoading || !chatInput.trim() ? pt.sectionBorder : '#4f46e5'}`,
              color: '#ffffff',
              fontFamily: fontMono,
              fontSize: 11,
              borderRadius: 8,
              cursor: !region || chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            →
          </button>
        </div>
      </div>
    </aside>
  );
};

