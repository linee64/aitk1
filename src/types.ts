export type StatusType = 'high' | 'medium' | 'low';

export interface LayerData {
  status: StatusType;
  [key: string]: number | string | StatusType;
}

export interface EcologyData extends LayerData {
  aqi: number;
  co2: number;
}

export interface TransportData extends LayerData {
  congestion: number;
  accidents: number;
}

export interface SafetyData extends LayerData {
  incidents: number;
  crimeIndex: number;
}

export interface HousingData extends LayerData {
  complaints: number;
  failures: number;
}

export type ActiveLayer = 'ecology' | 'transport' | 'safety' | 'housing';

export type RegionTrendPoint = { month: string; value: number };

export interface RegionData {
  id: string;
  name: string;
  nameKz: string;
  ecology: EcologyData;
  transport: TransportData;
  safety: SafetyData;
  housing: HousingData;
  overallStatus: StatusType;
  /** 6-month sparkline data per layer (mock / dashboard) */
  trends?: Partial<Record<ActiveLayer, RegionTrendPoint[]>>;
}
