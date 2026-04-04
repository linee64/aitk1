# Smartcity Backend

This is the backend for the Smartcity dashboard MVP. It exposes an API endpoint to generate insights using the Gemini Generative AI based on various metrics of cities/regions in Kazakhstan.

## Architecture

- **Framework**: Express.js (Node.js)
- **AI Integration**: Direct `fetch` call to Gemini `v1beta` HTTP endpoint using model `gemini-2.5-flash` with JSON structured mode (`response_mime_type: "application/json"`).
- **Environment**: Managed using `dotenv`.

## Setup Instructions

1. **Install Dependencies**
   Run the following command in this directory:
   ```bash
   npm install
   ```

2. **Configure Environment**
   Copy the `.`env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your `GEMINI_API_KEY`.

3. **Run the Server**
   To start the development server:
   ```bash
   npm run dev
   ```
   Or for production start:
   ```bash
   npm start
   ```
   The API will be available at `http://localhost:3001` (or whatever `PORT` is specified in `.env`).

## API Endpoints

### POST `/api/analyze`

**Description**: Accepts data about a specific region and category, constructs a tailored prompt, and generates AI-driven insights concerning the situation, criticality, and recommendations.

**Request Body**:
```json
{
  "regionData": {
    "name": "Алматинская",
    "id": "almaty",
    "transport": {
      "metrics": [
        { "name": "Индекс загруженности", "value": 87, "unit": "/ 100", "status": "critical" }
        // ... more metrics
      ],
      "score": 28,
      "status": "critical",
      "trend": "↑"
    }
  },
  "category": "transport",
  "categoryLabel": "🚦 Транспорт"
}
```

**Response** (JSON):
```json
{
  "analysis": {
    "situation": "Detailed description of the current transport/ecology situation...",
    "criticality": "Высокий",
    "criticalityColor": "critical",
    "explanation": "Brief explanation...",
    "recommendations": [
      "Recommendation 1...",
      "Recommendation 2..."
    ]
  },
  "updatedMetrics": [
    { "name": "Индекс загруженности", "value": 87, "unit": "/ 100", "status": "critical" }
  ],
  "updatedScore": 28,
  "updatedStatus": "critical"
}
```

The frontend currently uses mocked AI responses inside `frontend/src/data/mockData.ts`. The integrating developer should:
1. Ensure this backend is running concurrently with the frontend (e.g. during development, run the node server on port 3001).
2. Rewrite `getAIResponse` (or add a new asynchronous hook replacing it) to make a `fetch` `POST` call to `http://localhost:3001/api/analyze` with the `region` object and `category`.
3. **IMPORTANT**: If the category is `ecology`, this backend fetches real data from Open-Meteo. The frontend state must be updated using the returned `updatedMetrics`, `updatedScore`, and `updatedStatus` inside the React component to display real data instead of mock data.
4. Handle loading and error states in the frontend components (e.g. the Region Details panel) while waiting for the API response.
