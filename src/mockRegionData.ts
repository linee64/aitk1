import type { RegionData, StatusType } from './types';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const months = (() => {
  const now = new Date();
  const res: string[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    res.push(d.toLocaleString('ru-RU', { month: 'short' }));
  }
  return res;
})();

/** Ecology from AQI */
function ecologyStatusFromAqi(aqi: number): StatusType {
  if (aqi > 100) return 'high';
  if (aqi > 50) return 'medium';
  return 'low';
}

/** Transport from congestion % */
function transportStatusFromCongestion(congestion: number): StatusType {
  if (congestion > 50) return 'high';
  if (congestion > 25) return 'medium';
  return 'low';
}

const determineStatus = (value: number, highThreshold: number, mediumThreshold: number): StatusType => {
  if (value >= highThreshold) return 'high';
  if (value >= mediumThreshold) return 'medium';
  return 'low';
};

type TrendMode = 'rising' | 'falling' | 'stable';

function trendSeries(
  base: number,
  mode: TrendMode,
  min: number,
  max: number,
  spanFrac = 0.22,
): { month: string; value: number }[] {
  if (mode === 'rising') {
    const span = Math.max(8, base * spanFrac);
    const start = clamp(base - span * 0.95, min, max);
    const end = clamp(base + span * 0.35, min, max);
    return months.map((m, i) => ({
      month: m,
      value: Math.round(clamp(start + ((end - start) * i) / 5, min, max)),
    }));
  }
  if (mode === 'falling') {
    const span = Math.max(8, base * spanFrac);
    const start = clamp(base + span * 0.55, min, max);
    const end = clamp(base - span * 0.45, min, max);
    return months.map((m, i) => ({
      month: m,
      value: Math.round(clamp(start + ((end - start) * i) / 5, min, max)),
    }));
  }
  const wiggle = [base - 4, base - 1, base + 2, base - 3, base + 1, base];
  return months.map((m, i) => ({
    month: m,
    value: Math.round(clamp(wiggle[i] ?? base, min, max)),
  }));
}

type RegionPreset = {
  aqi: number;
  co2: number;
  congestion: number;
  accidents: number;
  incidents: number;
  crimeIndex: number;
  complaints: number;
  failures: number;
  ecoTrend: TrendMode;
  transportTrend: TrendMode;
  safetyTrend: TrendMode;
  housingTrend: TrendMode;
};

const REGION_PRESETS: Record<string, RegionPreset> = {
  // LOW — clean / rural
  'KZ-39': {
    aqi: 28,
    co2: 370,
    congestion: 12,
    accidents: 8,
    incidents: 55,
    crimeIndex: 16,
    complaints: 72,
    failures: 14,
    ecoTrend: 'falling',
    transportTrend: 'stable',
    safetyTrend: 'stable',
    housingTrend: 'falling',
  },
  'KZ-59': {
    aqi: 22,
    co2: 365,
    congestion: 10,
    accidents: 6,
    incidents: 48,
    crimeIndex: 14,
    complaints: 58,
    failures: 11,
    ecoTrend: 'falling',
    transportTrend: 'falling',
    safetyTrend: 'stable',
    housingTrend: 'stable',
  },
  'KZ-43': {
    aqi: 35,
    co2: 372,
    congestion: 15,
    accidents: 11,
    incidents: 68,
    crimeIndex: 18,
    complaints: 95,
    failures: 17,
    ecoTrend: 'stable',
    transportTrend: 'stable',
    safetyTrend: 'falling',
    housingTrend: 'stable',
  },
  'KZ-27': {
    aqi: 32,
    co2: 368,
    congestion: 14,
    accidents: 9,
    incidents: 62,
    crimeIndex: 17,
    complaints: 81,
    failures: 15,
    ecoTrend: 'stable',
    transportTrend: 'falling',
    safetyTrend: 'stable',
    housingTrend: 'falling',
  },
  'KZ-11': {
    aqi: 38,
    co2: 375,
    congestion: 18,
    accidents: 12,
    incidents: 76,
    crimeIndex: 20,
    complaints: 110,
    failures: 19,
    ecoTrend: 'stable',
    transportTrend: 'stable',
    safetyTrend: 'stable',
    housingTrend: 'stable',
  },
  'KZ-31': {
    aqi: 42,
    co2: 378,
    congestion: 20,
    accidents: 14,
    incidents: 82,
    crimeIndex: 21,
    complaints: 125,
    failures: 21,
    ecoTrend: 'falling',
    transportTrend: 'stable',
    safetyTrend: 'stable',
    housingTrend: 'stable',
  },
  // MEDIUM
  'KZ-35': {
    aqi: 65,
    co2: 395,
    congestion: 35,
    accidents: 22,
    incidents: 118,
    crimeIndex: 36,
    complaints: 210,
    failures: 34,
    ecoTrend: 'stable',
    transportTrend: 'rising',
    safetyTrend: 'stable',
    housingTrend: 'stable',
  },
  'KZ-55': {
    aqi: 72,
    co2: 400,
    congestion: 30,
    accidents: 20,
    incidents: 108,
    crimeIndex: 34,
    complaints: 195,
    failures: 32,
    ecoTrend: 'rising',
    transportTrend: 'stable',
    safetyTrend: 'stable',
    housingTrend: 'stable',
  },
  'KZ-15': {
    aqi: 58,
    co2: 388,
    congestion: 28,
    accidents: 19,
    incidents: 102,
    crimeIndex: 33,
    complaints: 178,
    failures: 30,
    ecoTrend: 'stable',
    transportTrend: 'stable',
    safetyTrend: 'stable',
    housingTrend: 'stable',
  },
  'KZ-63': {
    aqi: 70,
    co2: 398,
    congestion: 32,
    accidents: 21,
    incidents: 112,
    crimeIndex: 38,
    complaints: 225,
    failures: 36,
    ecoTrend: 'rising',
    transportTrend: 'rising',
    safetyTrend: 'stable',
    housingTrend: 'stable',
  },
  'KZ-61': {
    aqi: 55,
    co2: 385,
    congestion: 25,
    accidents: 17,
    incidents: 98,
    crimeIndex: 31,
    complaints: 165,
    failures: 28,
    ecoTrend: 'stable',
    transportTrend: 'stable',
    safetyTrend: 'falling',
    housingTrend: 'stable',
  },
  'KZ-47': {
    aqi: 78,
    co2: 410,
    congestion: 22,
    accidents: 16,
    incidents: 94,
    crimeIndex: 35,
    complaints: 188,
    failures: 29,
    ecoTrend: 'rising',
    transportTrend: 'stable',
    safetyTrend: 'stable',
    housingTrend: 'stable',
  },
  // HIGH / critical stress
  'KZ-19': {
    aqi: 115,
    co2: 465,
    congestion: 78,
    accidents: 42,
    incidents: 205,
    crimeIndex: 52,
    complaints: 380,
    failures: 62,
    ecoTrend: 'rising',
    transportTrend: 'rising',
    safetyTrend: 'rising',
    housingTrend: 'rising',
  },
  'KZ-23': {
    aqi: 120,
    co2: 480,
    congestion: 25,
    accidents: 28,
    incidents: 155,
    crimeIndex: 44,
    complaints: 290,
    failures: 48,
    ecoTrend: 'rising',
    transportTrend: 'stable',
    safetyTrend: 'rising',
    housingTrend: 'stable',
  },
  'KZ-10': {
    aqi: 98,
    co2: 448,
    congestion: 30,
    accidents: 24,
    incidents: 138,
    crimeIndex: 40,
    complaints: 255,
    failures: 41,
    ecoTrend: 'rising',
    transportTrend: 'rising',
    safetyTrend: 'stable',
    housingTrend: 'stable',
  },
  // Not in explicit lists — realistic mid / rural
  'KZ-33': {
    aqi: 62,
    co2: 391,
    congestion: 33,
    accidents: 18,
    incidents: 105,
    crimeIndex: 32,
    complaints: 198,
    failures: 31,
    ecoTrend: 'stable',
    transportTrend: 'stable',
    safetyTrend: 'stable',
    housingTrend: 'stable',
  },
  'KZ-62': {
    aqi: 34,
    co2: 369,
    congestion: 13,
    accidents: 7,
    incidents: 52,
    crimeIndex: 15,
    complaints: 64,
    failures: 12,
    ecoTrend: 'falling',
    transportTrend: 'stable',
    safetyTrend: 'stable',
    housingTrend: 'falling',
  },
};

function overallFromLayers(statuses: StatusType[]): StatusType {
  if (statuses.some((s) => s === 'high')) return 'high';
  if (statuses.some((s) => s === 'medium')) return 'medium';
  return 'low';
}

const regionsInfo = [
  { id: 'KZ-10', name: 'Abay Region', nameKz: 'Абай облысы' },
  { id: 'KZ-11', name: 'Akmola Region', nameKz: 'Ақмола облысы' },
  { id: 'KZ-15', name: 'Aktobe Region', nameKz: 'Ақтөбе облысы' },
  { id: 'KZ-19', name: 'Almaty Region', nameKz: 'Алматы облысы' },
  { id: 'KZ-23', name: 'Atyrau Region', nameKz: 'Атырау облысы' },
  { id: 'KZ-27', name: 'West Kazakhstan Region', nameKz: 'Батыс Қазақстан облысы' },
  { id: 'KZ-31', name: 'Jambyl Region', nameKz: 'Жамбыл облысы' },
  { id: 'KZ-33', name: 'Jetisu Region', nameKz: 'Жетісу облысы' },
  { id: 'KZ-35', name: 'Karaganda Region', nameKz: 'Қарағанды облысы' },
  { id: 'KZ-39', name: 'Kostanay Region', nameKz: 'Қостанай облысы' },
  { id: 'KZ-43', name: 'Kyzylorda Region', nameKz: 'Қызылорда облысы' },
  { id: 'KZ-47', name: 'Mangystau Region', nameKz: 'Маңғыстау облысы' },
  { id: 'KZ-55', name: 'Pavlodar Region', nameKz: 'Павлодар облысы' },
  { id: 'KZ-59', name: 'North Kazakhstan Region', nameKz: 'Солтүстік Қазақстан облысы' },
  { id: 'KZ-61', name: 'Turkistan Region', nameKz: 'Түркістан облысы' },
  { id: 'KZ-62', name: 'Ulytau Region', nameKz: 'Ұлытау облысы' },
  { id: 'KZ-63', name: 'East Kazakhstan Region', nameKz: 'Шығыс Қазақстан облысы' },
];

export const mockRegionData: RegionData[] = regionsInfo.map((info) => {
  const p = REGION_PRESETS[info.id];
  if (!p) {
    throw new Error(`Missing mock preset for region ${info.id}`);
  }

  const ecologyStatus = ecologyStatusFromAqi(p.aqi);
  const transportStatus = transportStatusFromCongestion(p.congestion);
  const safetyStatus = determineStatus(p.crimeIndex, 60, 30);
  const housingStatus = determineStatus(p.failures, 70, 30);

  const overallStatus = overallFromLayers([ecologyStatus, transportStatus, safetyStatus, housingStatus]);

  const region: RegionData = {
    id: info.id,
    name: info.name,
    nameKz: info.nameKz,
    ecology: {
      aqi: p.aqi,
      co2: p.co2,
      status: ecologyStatus,
    },
    transport: {
      congestion: p.congestion,
      accidents: p.accidents,
      status: transportStatus,
    },
    safety: {
      incidents: p.incidents,
      crimeIndex: p.crimeIndex,
      status: safetyStatus,
    },
    housing: {
      complaints: p.complaints,
      failures: p.failures,
      status: housingStatus,
    },
    overallStatus,
  };

  (region as any).trends = {
    ecology: trendSeries(p.aqi, p.ecoTrend, 0, 200),
    transport: trendSeries(p.congestion, p.transportTrend, 0, 100),
    safety: trendSeries(p.incidents, p.safetyTrend, 0, 350),
    housing: trendSeries(p.failures, p.housingTrend, 0, 120),
  };

  return region;
});
