import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { detectAnomalies } from './anomalyDetector.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Force IPv4 first to avoid ETIMEDOUT on IPv6-only DNS results
dns.setDefaultResultOrder('ipv4first');
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `You are an expert analyst for a Smart City dashboard. I will provide you with data about a region in Kazakhstan for a specific category (transport, ecology, safety, or housing).
You must return a JSON response with exactly the following schema:
{
  "situation": "Detailed description of the current situation (2-3 sentences)",
  "criticality": "Высокий" | "Средний" | "Низкий",
  "criticalityColor": "critical" | "warning" | "normal",
  "explanation": "Brief explanation of the assessment",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "forecast": {
    "summary": "2-3 sentence prediction of what will happen in the next 24-48 hours",
    "trend": "worsening" | "stable" | "improving",
    "predictedValues": {
      "aqi": number or null,
      "congestion": number or null
    },
    "riskLevel": "Высокий" | "Средний" | "Низкий",
    "timeframe": "24 часа" | "48 часов" | "72 часа"
  }
}

Important:
- Your response MUST be valid JSON and contain NO MARKDOWN formatting.
- The 'criticalityColor' should correspond loosely to the score and status of metrics.
- Language of the response MUST be Russian for all human-readable string fields (situation, explanation, recommendations, forecast.summary, forecast.riskLevel, forecast.timeframe).
- Provide actionable, realistic recommendations suitable for city administration.
- Use concrete examples based on the provided metrics.
- If the user context includes detected anomalies (АНОМАЛИИ ОБНАРУЖЕНЫ), you MUST explicitly mention them in the "situation" field in plain language for city administrators (what is unusual and why it matters).

Forecast (field "forecast"):
- Base the forecast on current metrics, anomaly summary, weather conditions from context, and implied trend direction.
- If anomalies were detected → set forecast.trend to "worsening" unless weather data strongly justify stability or improvement.
- If metrics are near baseline and there are no anomalies → forecast.trend "stable".
- If metrics clearly indicate improvement → forecast.trend "improving".
- predictedValues: estimate AQI and congestion after ~24 hours as numbers when relevant to the category and data; use null when the metric is not meaningful for the selected category (e.g. congestion null for pure ecology-only focus if appropriate).
- Be specific and realistic for Kazakhstan's climate seasons and urban context.
- Choose timeframe as one of: "24 часа", "48 часов", "72 часа" to match the horizon you emphasize in summary.`;

// Coordinates and WAQI slugs of Kazakhstan regions
const regionMeta = {
  'KZ-10': { lat: 50.4111, lon: 80.2275, waqi_slug: 'semey' },
  'KZ-11': { lat: 51.1694, lon: 71.4491, waqi_slug: 'astana' },
  'KZ-15': { lat: 50.2839, lon: 57.1670, waqi_slug: 'aktobe' },
  'KZ-19': { lat: 43.2389, lon: 76.8897, waqi_slug: 'almaty' },
  'KZ-23': { lat: 47.0945, lon: 51.9238, waqi_slug: 'atyrau' },
  'KZ-27': { lat: 51.2333, lon: 51.3667, waqi_slug: 'oral' },
  'KZ-31': { lat: 42.9026, lon: 71.3656, waqi_slug: 'taraz' },
  'KZ-33': { lat: 45.0156, lon: 78.3739, waqi_slug: 'taldykorgan' },
  'KZ-35': { lat: 49.8019, lon: 73.1021, waqi_slug: 'karaganda' },
  'KZ-39': { lat: 53.2198, lon: 63.6283, waqi_slug: 'kostanay' },
  'KZ-43': { lat: 44.8397, lon: 65.5025, waqi_slug: 'kyzylorda' },
  'KZ-47': { lat: 43.6481, lon: 51.1706, waqi_slug: 'aktau' },
  'KZ-55': { lat: 52.3014, lon: 76.9566, waqi_slug: 'pavlodar' },
  'KZ-59': { lat: 54.8754, lon: 69.1628, waqi_slug: 'petropavlovsk' },
  'KZ-61': { lat: 43.2973, lon: 68.2702, waqi_slug: 'turkestan' },
  'KZ-62': { lat: 47.7934, lon: 67.7109, waqi_slug: 'zhezkazgan' },
  'KZ-63': { lat: 49.9455, lon: 82.6115, waqi_slug: 'oskemen' }
};

// Map AQI to our status colors
function getAqiStatus(aqi) {
  if (aqi <= 50) return 'normal';
  if (aqi <= 100) return 'warning';
  return 'critical';
}

function aqiStatusToLayerStatus(aqi) {
  const s = getAqiStatus(aqi);
  if (s === 'critical') return 'high';
  if (s === 'warning') return 'medium';
  return 'low';
}

const CHAT_SYSTEM_PROMPT_BASE = `Ты — ИИ-ассистент дашборда регионов Казахстана. В контексте только два направления данных: экология и транспорт. ЖКХ, жильё, коммунальные услуги, безопасность и любые другие темы вне экологии/транспорта не обсуждаются: на такие вопросы ответь одной короткой фразой, что в этом чате доступны только экология и транспорт.

Источник фактов — только переданный JSON (регион, тренды экологии/транспорта, погода при наличии). Не придумывай цифры и события.

Формат ответа — только простой текст для экрана чата:
- Запрещены любые символы и приёмы разметки: звёздочки, решётки, подчёркивания для выделения, обратные кавычки, Markdown, HTML.
- Не используй жирный или курсив (никаких ** * __ _ вокруг текста).
- Не делай нумерованные списки вида «1.» «2.» «3.»; не начинай строки с «*» для пунктов.
- Структурируй смысл обычными фразами: короткие абзацы через пустую строку; при необходимости строка-подпись и двоеточие (Сводка: … Экология: …) без спецсимволов оформления.
- Без вступлений вроде «Конечно», без фраз «если нужно — спросите».`;

function plainChatReply(raw) {
  if (typeof raw !== 'string') return '';
  let t = raw.replace(/\r\n/g, '\n');
  for (let n = 0; n < 8; n++) {
    const next = t
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1');
    if (next === t) break;
    t = next;
  }
  t = t.replace(/`([^`]+)`/g, '$1');
  t = t.replace(/^#{1,6}\s+/gm, '');
  t = t.replace(/^\s*\*\s+/gm, '');
  t = t.replace(/\*([^*\n]+)\*/g, '$1');
  t = t.replace(/_([^_\n]+)_/g, '$1');
  t = t.replace(/^\s*\d+\.\s+/gm, '');
  return t.replace(/\n{3,}/g, '\n\n').trim();
}


function parseWaqiAqi(raw) {
  if (raw == null || raw === '-') return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Enrich RegionData-like object with live WAQI / TomTom / weather; без live — нули, без моков */
async function enrichRegionForChat(regionData) {
  const r = JSON.parse(JSON.stringify(regionData));
  let weatherNote = '';
  let transportLive = false;
  let ecologyLive = false;

  if (regionMeta[r.id]) {
    const coords = regionMeta[r.id];
    try {
      const { ok, data } = await safeGet(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,wind_speed_10m,precipitation,weather_code`,
      );
      if (ok && data?.current) {
        const temp = data.current.temperature_2m;
        const wind = data.current.wind_speed_10m;
        const precip = data.current.precipitation;
        const code = data.current.weather_code;
        if (
          Number.isFinite(temp) &&
          Number.isFinite(wind) &&
          Number.isFinite(precip) &&
          Number.isFinite(code)
        ) {
          let weatherDesc = 'Ясно/облачно';
          if (code >= 51 && code <= 67) weatherDesc = 'Дождь';
          else if (code >= 71 && code <= 86) weatherDesc = 'Снег';
          else if (code >= 95) weatherDesc = 'Гроза';
          weatherNote = `Погода (Open-Meteo): ${temp}°C, ветер ${wind} км/ч, осадки ${precip} мм, условие: ${weatherDesc} (код WMO ${code}).`;
        }
      }
    } catch {
      /* ignore */
    }

    if (process.env.TOMTOM_API_KEY) {
      const ttKey = process.env.TOMTOM_API_KEY;
      try {
        const tomtomUrl = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${coords.lat},${coords.lon}&key=${ttKey}`;
        const { ok, data } = await safeGet(tomtomUrl);
        const fs = data?.flowSegmentData;
        const currentSpeed = fs?.currentSpeed;
        const freeFlowSpeed = fs?.freeFlowSpeed;
        if (
          ok &&
          fs &&
          typeof currentSpeed === 'number' &&
          Number.isFinite(currentSpeed) &&
          typeof freeFlowSpeed === 'number' &&
          Number.isFinite(freeFlowSpeed) &&
          freeFlowSpeed > 0
        ) {
          const congestionIndex = Math.max(0, Math.min(100, Math.round((1 - currentSpeed / freeFlowSpeed) * 100)));
          r.transport = r.transport || {};
          r.transport.congestion = congestionIndex;
          r.transport.status =
            congestionIndex > 40 ? 'high' : congestionIndex > 20 ? 'medium' : 'low';
          transportLive = true;
        }
      } catch {
        /* ignore */
      }
      try {
        const { ok, count } = await fetchTomTomAccidentCount(coords.lat, coords.lon, ttKey);
        if (ok && count !== null) {
          r.transport = r.transport || {};
          r.transport.accidents = count;
          transportLive = true;
        }
      } catch {
        /* ignore */
      }
    }

    if (process.env.WAQI_API_KEY) {
      const waqiSlug = regionMeta[r.id].waqi_slug;
      try {
        const { ok, data } = await safeGet(`https://api.waqi.info/feed/${waqiSlug}/?token=${process.env.WAQI_API_KEY}`);
        if (ok && data?.status === 'ok' && data.data) {
          const realAqi = parseWaqiAqi(data.data.aqi);
          if (realAqi != null) {
            const iaqi = data.data.iaqi || {};
            r.ecology = r.ecology || {};
            r.ecology.aqi = realAqi;
            r.ecology.status = aqiStatusToLayerStatus(realAqi);
            const coVal = iaqi.co?.v;
            if (typeof coVal === 'number' && Number.isFinite(coVal)) {
              r.ecology.co2 = coVal;
            }
            ecologyLive = true;
          }
        }
      } catch {
        /* ignore */
      }
    }
  }

  if (!transportLive) {
    r.transport = { ...(r.transport || {}), congestion: 0, accidents: 0, status: 'low' };
  }
  if (!ecologyLive) {
    r.ecology = { ...(r.ecology || {}), aqi: 0, co2: 0, status: 'low' };
  }

  return { region: r, weatherNote };
}

// Helper: safe axios GET with timeout
async function safeGet(url, timeoutMs = 6000) {
  const { data, status } = await axios.get(url, { timeout: timeoutMs });
  return { ok: status >= 200 && status < 300, data };
}

/** EPSG:4326 bbox around a point; delta ~0.35° ≈ 25–40 km (TomTom max 10 000 km²). */
function tomTomBboxAround(lat, lon, deltaDeg = 0.35) {
  const minLat = lat - deltaDeg;
  const maxLat = lat + deltaDeg;
  const minLon = lon - deltaDeg;
  const maxLon = lon + deltaDeg;
  return `${minLon},${minLat},${maxLon},${maxLat}`;
}

function tomTomIncidentFeatures(data) {
  const inc = data?.incidents;
  if (!inc) return [];
  if (Array.isArray(inc)) return inc;
  if (Array.isArray(inc.features)) return inc.features;
  return [];
}

/**
 * TomTom Traffic Incidents v5 — только категория Accident (ДТП).
 * Параметр t опущен: сервер подставляет актуальный Traffic Model ID.
 */
async function fetchTomTomAccidentCount(lat, lon, apiKey) {
  const bbox = tomTomBboxAround(lat, lon);
  const fields = encodeURIComponent(
    '{incidents{type,geometry{type,coordinates},properties{iconCategory}}}',
  );
  const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${encodeURIComponent(
    apiKey,
  )}&bbox=${bbox}&fields=${fields}&language=ru-RU&timeValidityFilter=present&categoryFilter=Accident`;
  const { ok, data } = await safeGet(url);
  if (!ok || !data) return { ok: false, count: null };
  return { ok: true, count: tomTomIncidentFeatures(data).length };
}

function getAnomalyMetrics(regionData, category, categoryData) {
  const ecology = category === 'ecology' ? categoryData : regionData.ecology;
  const transport = category === 'transport' ? categoryData : regionData.transport;

  const fromMetrics = (slice, matches) => {
    if (!slice?.metrics) return undefined;
    const m = slice.metrics.find((x) => matches(x.name.toLowerCase()));
    return m != null && typeof m.value === 'number' ? m.value : undefined;
  };

  const aqi =
    fromMetrics(ecology, (n) => n.includes('aqi')) ?? (typeof ecology?.aqi === 'number' ? ecology.aqi : 0);
  const co2 =
    fromMetrics(ecology, (n) => n.includes('co2') || (n.includes('co') && !n.includes('aqi'))) ??
    (typeof ecology?.co2 === 'number' ? ecology.co2 : 0);
  const congestion =
    fromMetrics(transport, (n) => n.includes('пробок') || n.includes('индекс')) ??
    (typeof transport?.congestion === 'number' ? transport.congestion : 0);

  return { aqi, congestion, co2 };
}

function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateFallback(regionId) {
  const idx = parseInt(regionId.replace('KZ-', ''), 10);
  const rand = seededRand(idx * 7919);
  return {
    ecology: {
      aqi: Math.round(20 + rand() * 130),
      co2: Math.round(rand() * 12 * 10) / 10,
    },
    transport: {
      congestion: Math.round(5 + rand() * 60),
    },
    weather: {
      temp: Math.round(-5 + rand() * 30),
    },
  };
}

app.get('/api/real-data', async (req, res) => {
  try {
    const results = {};

    const fetchPromises = Object.entries(regionMeta).map(async ([regionId, coords]) => {
      let aqi = null;
      let co2 = null;
      let congestion = null;
      let accidents = null;
      let temp = null;

      // 1. Fetch Ecology Data (WAQI)
      if (process.env.WAQI_API_KEY) {
        try {
          const { ok, data } = await safeGet(
            `https://api.waqi.info/feed/${coords.waqi_slug}/?token=${process.env.WAQI_API_KEY}`
          );
          if (ok && data.status === "ok" && data.data) {
            aqi = parseWaqiAqi(data.data.aqi);
            const coRaw = data.data.iaqi?.co?.v;
            co2 =
              typeof coRaw === "number" && Number.isFinite(coRaw)
                ? coRaw
                : 0;
          }
        } catch (err) {
          // Will use fallback
        }
      }

      // 2. Fetch Transport Data (TomTom): flow + ДТП (incidents)
      if (process.env.TOMTOM_API_KEY) {
        const ttKey = process.env.TOMTOM_API_KEY;
        try {
          const [flowRes, incRes] = await Promise.all([
            safeGet(
              `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${coords.lat},${coords.lon}&key=${ttKey}`,
            ),
            fetchTomTomAccidentCount(coords.lat, coords.lon, ttKey),
          ]);
          const { ok, data } = flowRes;
          if (ok && data?.flowSegmentData) {
            const currentSpeed = data.flowSegmentData.currentSpeed;
            const freeFlowSpeed = data.flowSegmentData.freeFlowSpeed;
            if (freeFlowSpeed > 0) {
              congestion = Math.max(0, Math.round((1 - (currentSpeed / freeFlowSpeed)) * 100));
            }
          }
          if (incRes.ok && incRes.count !== null) {
            accidents = incRes.count;
          }
        } catch (err) {
          // Will use fallback
        }
      }

      // 3. Fetch Weather Data (Open-Meteo)
      try {
        const { ok, data } = await safeGet(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m`
        );
        if (ok) {
          temp = data.current.temperature_2m;
        }
      } catch (err) {
        // Will use fallback
      }

      // Только живые/честные значения: при ошибке API — 0 (или null для температуры)
      results[regionId] = {
        ecology: {
          aqi: aqi ?? 0,
          co2: co2 ?? 0,
        },
        transport: {
          congestion: congestion ?? 0,
          accidents: accidents ?? 0,
        },
        weather: {
          temp: temp ?? null,
        },
      };
    });

    await Promise.all(fetchPromises);
    return res.json(results);

  } catch (error) {
    console.error("Error fetching real data:", error);
    return res.status(500).json({ error: 'Failed to fetch real data' });
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { regionData, category, categoryLabel } = req.body;

    if (!regionData || !category) {
      return res.status(400).json({ error: 'Missing regionData or category in request body.' });
    }

    let categoryData = JSON.parse(JSON.stringify(regionData[category]));

    if (!categoryData) {
      return res.status(400).json({ error: `Category '${category}' not found in region data.` });
    }

    // --- OPEN-METEO WEATHER DATA (COMMON CONTEXT) ---
    let additionalWeatherContext = "";
    if (regionMeta[regionData.id]) {
      const coords = regionMeta[regionData.id];
      try {
        const { ok, data } = await safeGet(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,wind_speed_10m,precipitation,weather_code`
        );
        if (ok) {
          const temp = data.current.temperature_2m;
          const wind = data.current.wind_speed_10m;
          const precip = data.current.precipitation;
          const code = data.current.weather_code;

          let weatherDesc = "Clear/Cloudy";
          if (code >= 51 && code <= 67) weatherDesc = "Rain";
          else if (code >= 71 && code <= 86) weatherDesc = "Snow";
          else if (code >= 95) weatherDesc = "Thunderstorm";

          additionalWeatherContext = `
Current Weather Conditions:
- Temperature: ${temp}°C
- Wind Speed: ${wind} km/h
- Precipitation: ${precip} mm
- Condition: ${weatherDesc} (WMO Code: ${code})
`;
        }
      } catch (err) {
        // Weather context unavailable
      }
    }

    // --- INTEGRATION OF REAL DATA PER CATEGORY ---
    if (category === 'transport' && regionMeta[regionData.id] && process.env.TOMTOM_API_KEY) {
      const coords = regionMeta[regionData.id];
      const ttKey = process.env.TOMTOM_API_KEY;
      try {
        const [{ ok, data }, incRes] = await Promise.all([
          safeGet(
            `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${coords.lat},${coords.lon}&key=${ttKey}`,
          ),
          fetchTomTomAccidentCount(coords.lat, coords.lon, ttKey),
        ]);
        if (ok && data?.flowSegmentData) {
          const currentSpeed = data.flowSegmentData.currentSpeed;
          const freeFlowSpeed = data.flowSegmentData.freeFlowSpeed;

          if (freeFlowSpeed > 0) {
            const congestionIndex = Math.round((1 - (currentSpeed / freeFlowSpeed)) * 100);

            if (categoryData.metrics) {
              categoryData.metrics = categoryData.metrics.map(m => {
                if (m.name.includes('Индекс пробок') || m.name.toLowerCase().includes('пробок')) {
                  return { ...m, value: Math.max(0, congestionIndex), status: congestionIndex > 40 ? 'critical' : (congestionIndex > 20 ? 'warning' : 'normal') };
                }
                if (m.name.includes('Скорость') || m.name.toLowerCase().includes('скорость')) {
                  return { ...m, value: currentSpeed, status: currentSpeed < (freeFlowSpeed * 0.5) ? 'critical' : 'normal' };
                }
                return m;
              });
            }
            categoryData.score = Math.max(0, 100 - congestionIndex);
            categoryData.status = congestionIndex > 40 ? 'critical' : (congestionIndex > 20 ? 'warning' : 'normal');
          }
        }
        if (incRes.ok && incRes.count !== null) {
          categoryData.accidents = incRes.count;
          if (categoryData.metrics) {
            const ac = incRes.count;
            const acStatus = ac >= 5 ? 'critical' : ac >= 2 ? 'warning' : 'normal';
            categoryData.metrics = categoryData.metrics.map((m) => {
              const low = m.name.toLowerCase();
              if (
                low.includes('дтп') ||
                low.includes('accident') ||
                low.includes('авар') ||
                m.name.includes('ДТП')
              ) {
                return { ...m, value: ac, status: acStatus };
              }
              return m;
            });
          }
        }
      } catch (err) {
        // Falling back to existing data
      }
    }

    if (category === 'ecology' && regionMeta[regionData.id] && process.env.WAQI_API_KEY) {
      const waqiSlug = regionMeta[regionData.id].waqi_slug;
      try {
        const { ok, data } = await safeGet(
          `https://api.waqi.info/feed/${waqiSlug}/?token=${process.env.WAQI_API_KEY}`
        );
        if (ok && data.status === "ok" && data.data) {
          const realAqi = parseWaqiAqi(data.data.aqi);
          const iaqi = data.data.iaqi || {};
          const realPm25 = iaqi.pm25 ? iaqi.pm25.v : null;
          const realCo = iaqi.co ? iaqi.co.v : null;

          if (realAqi != null) {
            if (categoryData.metrics) {
              categoryData.metrics = categoryData.metrics.map(m => {
                const mName = m.name.toLowerCase();
                if (mName.includes('aqi')) return { ...m, value: realAqi, status: getAqiStatus(realAqi) };
                if (mName.includes('pm2.5') && realPm25 !== null) return { ...m, value: realPm25, status: realPm25 > 25 ? 'warning' : 'normal' };
                if ((mName.includes('co2') || mName.includes('co')) && realCo !== null) return { ...m, name: 'Угарный газ (CO)', value: realCo, unit: 'μg/m³', status: realCo > 10 ? 'warning' : 'normal' };
                return m;
              });
            }
            categoryData.score = Math.max(0, 100 - Math.round(realAqi / 2));
            categoryData.status = getAqiStatus(realAqi);
          }
        }
      } catch (err) {
        // Falling back to existing data
      }
    }

    const { aqi: anomalyAqi, congestion: anomalyCongestion, co2: anomalyCo2 } = getAnomalyMetrics(
      regionData,
      category,
      categoryData
    );
    const anomalyResult = detectAnomalies(regionData.id, {
      aqi: anomalyAqi,
      congestion: anomalyCongestion,
      co2: anomalyCo2,
    });

    const anomalyContext = anomalyResult.hasAnomalies
      ? `\nАНОМАЛИИ ОБНАРУЖЕНЫ:\n${anomalyResult.anomalies
          .map(
            (a) =>
              `- ${a.metric}: текущее ${a.currentValue}, норма ${a.historicalMean} (отклонение ${a.deviation}σ)`
          )
          .join('\n')}`
      : '\nАномалий не обнаружено — показатели в пределах нормы.';

    // Build the user prompt context
    const metricsText = categoryData.metrics
      ? categoryData.metrics.map(m => `- ${m.name}: ${m.value} ${m.unit || ''} (Status: ${m.status})`).join('\n')
      : category === 'transport'
        ? `- Загруженность (индекс пробок): ${categoryData.congestion ?? 'N/A'}%\n- ДТП в зоне TomTom (≈окрестности центра региона): ${categoryData.accidents ?? 'N/A'}`
        : `- AQI: ${categoryData.aqi || 'N/A'}\n- CO2/CO: ${categoryData.co2 || 'N/A'}\n- Congestion: ${categoryData.congestion || 'N/A'}%`;

    const userPrompt = `
Region Name: ${regionData.name || regionData.nameKz || 'Unknown'}
Category: ${categoryLabel || category}

Metrics:
${metricsText}

Overall Score: ${categoryData.score ?? 'N/A'} out of 100
Overall Status: ${categoryData.status || 'unknown'}
${additionalWeatherContext}
${anomalyContext}
`;

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return res.status(500).json({
        error:
          'GEMINI_API_KEY is not set. Add it to backend/.env (see backend/.env.example) and restart the server.',
      });
    }

    // Call Gemini API via axios POST
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.2, response_mime_type: "application/json" }
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );

    const geminiData = geminiResponse.data;
    let textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error("Invalid response format from Gemini API");
    }

    const aiResponse = JSON.parse(textResponse);

    return res.json({
      analysis: aiResponse,
      updatedMetrics: categoryData.metrics,
      updatedScore: categoryData.score,
      updatedStatus: categoryData.status
    });

  } catch (error) {
    console.error("Error generating AI response:", error.message);
    return res.status(500).json({
      error: 'Failed to generate analysis',
      details: error.message
    });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, regionData } = req.body;

    if (!regionData || typeof regionData !== 'object') {
      return res.status(400).json({ error: 'Missing regionData in request body.' });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages must be a non-empty array.' });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const { region: enrichedRegion, weatherNote } = await enrichRegionForChat(regionData);

    const tr = enrichedRegion.trends || null;
    const trendsEcologyTransport =
      tr && (tr.ecology || tr.transport)
        ? {
            ...(tr.ecology ? { ecology: tr.ecology } : {}),
            ...(tr.transport ? { transport: tr.transport } : {}),
          }
        : null;

    const regionForPrompt = {
      id: enrichedRegion.id,
      name: enrichedRegion.name,
      nameKz: enrichedRegion.nameKz,
      ecology: enrichedRegion.ecology ?? null,
      transport: enrichedRegion.transport ?? null,
    };

    const contextPayload = {
      project: {
        name: 'Smart City Kazakhstan',
        scope: 'Только направления: экология (AQI, CO₂ и статус) и транспорт (пробки, ДТП, статус). Прочие слои карты в этом чате не используются.',
      },
      region: regionForPrompt,
      trends: trendsEcologyTransport,
      liveContext: weatherNote ? { weather: weatherNote } : {},
    };

    const systemText = `${CHAT_SYSTEM_PROMPT_BASE}

КОНТЕКСТ (JSON):
${JSON.stringify(contextPayload, null, 2)}`;

    const geminiContents = messages.map((m) => {
      const role = m.role === 'assistant' ? 'model' : 'user';
      const text = typeof m.content === 'string' ? m.content : '';
      return { role, parts: [{ text }] };
    });

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        system_instruction: { parts: [{ text: systemText }] },
        contents: geminiContents,
        generationConfig: { temperature: 0.25, maxOutputTokens: 768 },
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 60000 },
    );

    const textResponse = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      throw new Error('Invalid response format from Gemini API');
    }

    return res.json({ reply: plainChatReply(textResponse) });
  } catch (error) {
    console.error('Error in /api/chat:', error.message);
    return res.status(500).json({
      error: 'Failed to get chat reply',
      details: error.response?.data?.error?.message || error.message,
    });
  }
});

app.post('/api/anomalies', (req, res) => {
  const { regionId, metrics } = req.body;
  if (!regionId || !metrics) {
    return res.status(400).json({ error: 'Missing regionId or metrics' });
  }
  const result = detectAnomalies(regionId, metrics);
  return res.json(result);
});

app.listen(port, () => {
  console.log(`Smartcity Backend API is running on port ${port}`);
});
