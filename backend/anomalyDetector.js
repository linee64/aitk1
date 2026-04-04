/** Fixed normal baselines (not derived from current readings) */
const FIXED_BASELINES = {
  aqi: 70,
  /** ppm scale */
  co2: 420,
  congestion: 35,
};

/** CO₂ (ppm): elevated concentration bands */
const CO2_WARNING_PPM = 460;
const CO2_CRITICAL_PPM = 510;

function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Deterministic numeric seed from region id (for seededRand(regionId)-style RNG) */
function seedFromRegionId(regionId) {
  const s = String(regionId);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h === 0 ? 1 : h;
}

function baselineForMetric(metric) {
  const k = String(metric).toLowerCase();
  return FIXED_BASELINES[k];
}

/**
 * 30-day simulated history around the fixed normal baseline for this metric.
 * Center is always the baseline, never the current value.
 */
function generateHistory(regionId, metric) {
  const baseline = baselineForMetric(metric);
  if (baseline === undefined) return null;

  const rand = seededRand(seedFromRegionId(regionId));
  return Array.from({ length: 30 }, () => baseline + (rand() - 0.5) * baseline * 0.3);
}

/** Isolation score: how far is current value from historical norm */
function isolationScore(currentValue, history) {
  const mean = history.reduce((a, b) => a + b, 0) / history.length;
  const std = Math.sqrt(history.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / history.length);
  const zScore = Math.abs((currentValue - mean) / (std || 1));
  return {
    score: Math.min(1, zScore / 3),
    mean: Math.round(mean),
    std: Math.round(std),
    zScore: Math.round(zScore * 10) / 10,
    isAnomaly: zScore > 2.8,
  };
}

/** Main detector */
export function detectAnomalies(regionId, metrics) {
  const anomalies = [];

  for (const [key, value] of Object.entries(metrics)) {
    if (typeof value !== 'number') continue;
    const history = generateHistory(regionId, key);
    if (!history) continue;
    const result = isolationScore(value, history);
    const k = String(key).toLowerCase();

    let isAnomaly = result.isAnomaly;
    let severity = result.score > 0.8 ? 'critical' : 'warning';
    let score = result.score;

    if (k === 'co2') {
      if (value > CO2_CRITICAL_PPM) {
        isAnomaly = true;
        severity = 'critical';
        score = Math.max(score, 1);
      } else if (value > CO2_WARNING_PPM) {
        isAnomaly = true;
        severity = 'warning';
        score = Math.max(score, 0.75);
      }
    }

    if (isAnomaly) {
      anomalies.push({
        metric: key,
        currentValue: value,
        historicalMean: result.mean,
        deviation: result.zScore,
        severity,
        score,
      });
    }
  }

  return {
    hasAnomalies: anomalies.length > 0,
    anomalies,
    overallRisk:
      anomalies.length === 0 ? 'normal' : anomalies.some((a) => a.severity === 'critical') ? 'critical' : 'warning',
  };
}
