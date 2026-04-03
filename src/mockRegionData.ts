import type { RegionData, StatusType } from './types';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const generateRandomData = (): { aqi: number; co2: number; congestion: number; accidents: number; incidents: number; crimeIndex: number; complaints: number; failures: number } => ({
  aqi: Math.floor(Math.random() * 150) + 20,
  co2: Math.floor(Math.random() * 400) + 300,
  congestion: Math.floor(Math.random() * 100),
  accidents: Math.floor(Math.random() * 50),
  incidents: Math.floor(Math.random() * 200),
  crimeIndex: Math.floor(Math.random() * 80) + 10,
  complaints: Math.floor(Math.random() * 500),
  failures: Math.floor(Math.random() * 100),
});

const months = (() => {
  const now = new Date();
  const res: string[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    res.push(d.toLocaleString('ru-RU', { month: 'short' }));
  }
  return res;
})();

const generateTrend = (base: number, variance: number, min: number, max: number) => {
  let current = base;
  return months.map((m) => {
    current = clamp(current + (Math.random() - 0.5) * variance, min, max);
    return { month: m, value: Math.round(current) };
  });
};

const determineStatus = (value: number, highThreshold: number, mediumThreshold: number): StatusType => {
  if (value >= highThreshold) return 'high';
  if (value >= mediumThreshold) return 'medium';
  return 'low';
};

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
  const d = generateRandomData();

  // Make Atyrau and Mangystau have higher ecology risks
  if (info.id === 'KZ-23' || info.id === 'KZ-47') {
    d.aqi += 50;
    d.co2 += 100;
  }

  // Make Almaty Region and Karaganda have higher transport/safety risks
  if (info.id === 'KZ-19' || info.id === 'KZ-35') {
    d.congestion += 40;
    d.incidents += 50;
  }

  const ecologyStatus = determineStatus(d.aqi, 100, 50);
  const transportStatus = determineStatus(d.congestion, 80, 40);
  const safetyStatus = determineStatus(d.crimeIndex, 60, 30);
  const housingStatus = determineStatus(d.failures, 70, 30);

  const statuses = [ecologyStatus, transportStatus, safetyStatus, housingStatus];
  const highCount = statuses.filter(s => s === 'high').length;
  const mediumCount = statuses.filter(s => s === 'medium').length;
  
  let overallStatus: StatusType = 'low';
  if (highCount >= 2 || (highCount === 1 && mediumCount >= 2)) {
    overallStatus = 'high';
  } else if (highCount === 1 || mediumCount >= 2) {
    overallStatus = 'medium';
  }

  const region: RegionData = {
    id: info.id,
    name: info.name,
    nameKz: info.nameKz,
    ecology: {
      aqi: d.aqi,
      co2: d.co2,
      status: ecologyStatus,
    },
    transport: {
      congestion: d.congestion,
      accidents: d.accidents,
      status: transportStatus,
    },
    safety: {
      incidents: d.incidents,
      crimeIndex: d.crimeIndex,
      status: safetyStatus,
    },
    housing: {
      complaints: d.complaints,
      failures: d.failures,
      status: housingStatus,
    },
    overallStatus,
  };

  (region as any).trends = {
    ecology: generateTrend(region.ecology.aqi, 25, 0, 200),
    transport: generateTrend(region.transport.congestion, 18, 0, 100),
    safety: generateTrend(region.safety.incidents, 30, 0, 350),
    housing: generateTrend(region.housing.failures, 15, 0, 120),
  };

  return region;
});
