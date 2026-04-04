import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../config';

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
  const metricsKey = useMemo(() => JSON.stringify(metrics), [metrics]);

  useEffect(() => {
    if (!regionId) {
      // Reset when panel has no region: sync clear is intentional here
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale anomaly data when regionId cleared */
      setAnomalyData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/api/anomalies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regionId, metrics }),
    })
      .then((r) => r.json())
      .then((data) => setAnomalyData(data))
      .finally(() => setLoading(false));
  }, [regionId, metricsKey, metrics]);

  return { anomalyData, loading };
}

