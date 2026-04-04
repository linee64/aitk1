import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import axios from 'axios';

// Force IPv4 first to avoid ETIMEDOUT on IPv6-only DNS results
dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `You are an expert analyst for a Smart City dashboard. I will provide you with data about a region in Kazakhstan for a specific category (transport, ecology, or housing).
You must return a JSON response with exactly the following schema:
{
  "situation": "Detailed description of the current situation (2-3 sentences)",
  "criticality": "Высокий" | "Средний" | "Низкий",
  "criticalityColor": "critical" | "warning" | "normal",
  "explanation": "Brief explanation of the assessment",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}

Important:
- Your response MUST be valid JSON and contain NO MARKDOWN formatting.
- The 'criticalityColor' should correspond loosely to the score and status of metrics.
- Language of the response MUST be Russian.
- Provide actionable, realistic recommendations suitable for city administration.
- Use concrete examples based on the provided metrics.`;

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

// Helper: safe axios GET with timeout
async function safeGet(url, timeoutMs = 6000) {
  const { data, status } = await axios.get(url, { timeout: timeoutMs });
  return { ok: status >= 200 && status < 300, data };
}

// Deterministic pseudo-random fallback per region
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
      co2: Math.round(rand() * 12 * 10) / 10
    },
    transport: {
      congestion: Math.round(5 + rand() * 60)
    },
    weather: {
      temp: Math.round(-5 + rand() * 30)
    }
  };
}

app.get('/api/real-data', async (req, res) => {
  try {
    const results = {};

    const fetchPromises = Object.entries(regionMeta).map(async ([regionId, coords]) => {
      let aqi = null;
      let co2 = null;
      let congestion = null;
      let temp = null;

      // 1. Fetch Ecology Data (WAQI)
      if (process.env.WAQI_API_KEY) {
        try {
          const { ok, data } = await safeGet(
            `https://api.waqi.info/feed/${coords.waqi_slug}/?token=${process.env.WAQI_API_KEY}`
          );
          if (ok && data.status === "ok" && data.data) {
            aqi = data.data.aqi;
            co2 = data.data.iaqi?.co?.v || 0;
          }
        } catch (err) {
          // Will use fallback
        }
      }

      // 2. Fetch Transport Data (TomTom)
      if (process.env.TOMTOM_API_KEY) {
        try {
          const tomtomUrl = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${coords.lat},${coords.lon}&key=${process.env.TOMTOM_API_KEY}`;
          const { ok, data } = await safeGet(tomtomUrl);
          if (ok && data?.flowSegmentData) {
            const currentSpeed = data.flowSegmentData.currentSpeed;
            const freeFlowSpeed = data.flowSegmentData.freeFlowSpeed;
            if (freeFlowSpeed > 0) {
              congestion = Math.max(0, Math.round((1 - (currentSpeed / freeFlowSpeed)) * 100));
            }
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

      // If all APIs failed, use deterministic fallback so dashboard always has data
      const fallback = generateFallback(regionId);

      results[regionId] = {
        ecology: {
          aqi: aqi ?? fallback.ecology.aqi,
          co2: co2 ?? fallback.ecology.co2
        },
        transport: {
          congestion: congestion ?? fallback.transport.congestion
        },
        weather: {
          temp: temp ?? fallback.weather.temp
        }
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
      try {
        const tomtomUrl = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${coords.lat},${coords.lon}&key=${process.env.TOMTOM_API_KEY}`;
        const { ok, data } = await safeGet(tomtomUrl);
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
          const realAqi = data.data.aqi;
          const iaqi = data.data.iaqi || {};
          const realPm25 = iaqi.pm25 ? iaqi.pm25.v : null;
          const realCo = iaqi.co ? iaqi.co.v : null;

          if (categoryData.metrics) {
            categoryData.metrics = categoryData.metrics.map(m => {
              const mName = m.name.toLowerCase();
              if (mName.includes('aqi')) return { ...m, value: realAqi, status: getAqiStatus(realAqi) };
              if (mName.includes('pm2.5') && realPm25 !== null) return { ...m, value: realPm25, status: realPm25 > 25 ? 'warning' : 'normal' };
              if ((mName.includes('co2') || mName.includes('co')) && realCo !== null) return { ...m, name: 'Угарный газ (CO)', value: realCo, unit: 'μg/m³', status: realCo > 10 ? 'warning' : 'normal' };
              return m;
            });
          }
          const newScore = Math.max(0, 100 - Math.round(realAqi / 2));
          categoryData.score = newScore;
          categoryData.status = getAqiStatus(realAqi);
        }
      } catch (err) {
        // Falling back to existing data
      }
    }

    // Build the user prompt context
    const metricsText = categoryData.metrics
      ? categoryData.metrics.map(m => `- ${m.name}: ${m.value} ${m.unit || ''} (Status: ${m.status})`).join('\n')
      : `- AQI: ${categoryData.aqi || 'N/A'}\n- CO2/CO: ${categoryData.co2 || 'N/A'}\n- Congestion: ${categoryData.congestion || 'N/A'}%`;

    const userPrompt = `
Region Name: ${regionData.name || regionData.nameKz || 'Unknown'}
Category: ${categoryLabel || category}

Metrics:
${metricsText}

Overall Score: ${categoryData.score ?? 'N/A'} out of 100
Overall Status: ${categoryData.status || 'unknown'}
${additionalWeatherContext}
`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    // Call Gemini API via axios POST
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

app.listen(port, () => {
  console.log(`Smartcity Backend API is running on port ${port}`);
});
