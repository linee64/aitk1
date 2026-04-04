import { useEffect, useState } from 'react';

export type AnomalyItem = {
  metric: string;
  currentValue: number;
  historicalMean: number;
  deviation: number;
  severity: 'critical' | 'warning';
  score: number;
};

export type AnomalyDetectionResult = {
  hasAnomalies: boolean;
  anomalies: AnomalyItem[];
  overallRisk: 'normal' | 'critical' | 'warning';
};

export function useAnomalyDetection(regionId: string | null, metrics: Record<string, number>) {
  const [anomalyData, setAnomalyData] = useState<AnomalyDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!regionId) {
      setAnomalyData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch('/api/anomalies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regionId, metrics }),
    })
      .then((r) => r.json())
      .then((data) => setAnomalyData(data))
      .finally(() => setLoading(false));
  }, [regionId, JSON.stringify(metrics)]);

  return { anomalyData, loading };
}
