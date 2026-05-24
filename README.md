# 🧠 Decision Assistant

**AI-powered structured reasoning platform that helps you make better decisions.**

Describe any decision in natural language — which job to take, which phone to buy, whether to relocate — and get a structured, scored analysis with charts, confidence metrics, bias detection, and scenario simulation.

![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

### 🤖 AI-Powered Extraction
- Describe your decision in plain English — the LLM extracts options, factors, and weights automatically
- Generates adaptive follow-up questions to fill information gaps
- LLM-driven reasoning with bias detection and pros/cons analysis

### 📊 Deterministic Scoring Engine
- Weighted multi-factor decision matrix — fully deterministic, reproducible, and explainable
- The LLM **never touches** the scoring math — it only structures the input
- Rankings, weighted totals, and factor-by-factor breakdowns

### 🎯 Confidence Metrics
- Composite confidence score based on:
  - **Data completeness** — how many factors have real scores
  - **Question completion** — how many follow-up questions were answered
  - **Option similarity** — how close the top options are (closer = less confident)
- Circular gauge visualization

### 🔍 Bias Detection
- Rule-based bias detection (confirmation bias, emotional variance, recency/near-tie detection)
- LLM-powered deeper bias analysis (sunk cost, anchoring, availability heuristic)
- Severity ratings (low / medium / high)

### 🔄 Scenario Simulator
- Adjust factor weights with sliders — see results recalculate instantly
- Compare "what if I care more about price than quality?" scenarios
- Deterministic recalculation means instant feedback

### 📈 Rich Visualizations
- **Radar chart** — factor comparison across options
- **Bar chart** — weighted score comparison
- **Decision matrix table** — full scoring breakdown
- **Confidence gauge** — circular progress indicator

### 📜 Decision History
- All decisions saved in-memory during session
- Browse past analyses with full details

### 🌙 Dark Glassmorphism UI
- Modern dark theme with frosted-glass panels
- Responsive design, works on mobile and desktop
- Smooth transitions and animations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  Dark glassmorphism UI (HTML/CSS/JS + Chart.js)  │
│  Served as static files by FastAPI               │
└──────────────────────┬──────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────┐
│               FastAPI Backend                    │
│                                                  │
│  ┌────────────┐  ┌──────────────┐  ┌──────────┐│
│  │ LLM Client │  │ Scoring      │  │ API      ││
│  │ (mimo-v2.5 │  │ Engine       │  │ Routes   ││
│  │  -pro)     │  │ (deterministic)│ │          ││
│  └────────────┘  └──────────────┘  └──────────┘│
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │ Decision Service (orchestration)             ││
│  └──────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

**Key principle:** The LLM handles natural language understanding (extraction, questioning, reasoning) but **never touches the scoring math**. The scoring engine is purely deterministic — same inputs always produce the same outputs.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- An OpenAI-compatible API endpoint (default: configured for [Gitlawb OpenGateway](https://opengateway.gitlawb.com))

### 1. Clone the repo

```bash
git clone https://github.com/george3232-foo/decision-assistant.git
cd decision-assistant
```

### 2. Set your API key

```bash
export LLM_API_KEY="your-api-key-here"
```

### 3. Start the server

```bash
chmod +x start.sh
./start.sh
```

The script will:
- Create a Python virtual environment
- Install dependencies
- Start the FastAPI server on `http://localhost:8000`

### 4. Open the app

Navigate to **http://localhost:8000** in your browser.

---

## ⚙️ Configuration

The LLM client is configurable via environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LLM_API_KEY` | ✅ Yes | — | API key for your LLM provider |
| `LLM_BASE_URL` | No | `https://opengateway.gitlawb.com/v1` | OpenAI-compatible API base URL |
| `LLM_MODEL` | No | `mimo-v2.5-pro` | Model name |

### Example: Use OpenAI GPT-4o

```bash
LLM_BASE_URL="https://api.openai.com/v1" \
LLM_MODEL="gpt-4o" \
LLM_API_KEY="sk-your-key" \
./start.sh
```

### Example: Use local Ollama

```bash
LLM_BASE_URL="http://localhost:11434/v1" \
LLM_MODEL="llama3" \
LLM_API_KEY="ollama" \
./start.sh
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/decision/analyze` | Analyze a decision (extract structure + generate questions) |
| `POST` | `/decision/{id}/answers` | Submit answers to adaptive questions |
| `POST` | `/decision/{id}/score` | Score the decision (build matrix + recommendation) |
| `POST` | `/decision/{id}/simulate` | Simulate scenario with modified weights |
| `GET` | `/decision/history` | Get all past decisions |
| `GET` | `/decision/{id}` | Get a single decision by ID |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Interactive API documentation (Swagger UI) |

### Example: Analyze a decision

```bash
curl -X POST http://localhost:8000/decision/analyze \
  -H "Content-Type: application/json" \
  -d '{"input": "Should I buy an iPhone 16 Pro or Samsung Galaxy S25 Ultra? I care about camera quality, battery life, ecosystem, and price."}'
```

---

## 📁 Project Structure

```
decision-assistant/
├── start.sh                    # One-command startup script
├── README.md
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── requirements.txt        # Python dependencies
│   ├── api/
│   │   └── routes.py           # REST API endpoints
│   ├── models/
│   │   └── schemas.py          # Pydantic models (types, requests, responses)
│   ├── scoring/
│   │   └── engine.py           # Deterministic scoring engine (the sacred core)
│   ├── llm/
│   │   ├── client.py           # OpenAI-compatible async client
│   │   ├── extraction.py       # LLM: extract decision structure
│   │   ├── questions.py        # LLM: generate adaptive questions
│   │   └── reasoning.py        # LLM: reasoning, bias detection, pros/cons
│   ├── services/
│   │   └── decision_service.py # Orchestration layer
│   └── static/
│       └── index.html          # Frontend (single-file, dark glassmorphism)
└── frontend/                   # Original Next.js scaffold (optional, not used in MVP)
```

---

## 🧪 How It Works

1. **You describe a decision** → "Should I take the startup job or stay at my corporate role?"
2. **LLM extracts structure** → options, factors, weights, missing info
3. **LLM generates questions** → "How important is work-life balance to you?" "What's the salary difference?"
4. **You answer the questions** → adaptive follow-ups refine the analysis
5. **Scoring engine calculates** → deterministic weighted matrix, rankings, confidence
6. **LLM provides reasoning** → bias detection, pros/cons, final recommendation
7. **You simulate scenarios** → "What if I value salary less?" → instant recalculation

---

## 🛣️ Roadmap

- [ ] PostgreSQL + pgvector for persistent storage and semantic similarity
- [ ] User authentication (Clerk / JWT)
- [ ] Decision sharing via unique URLs
- [ ] Export to PDF / JSON
- [ ] Multi-language support
- [ ] WebSocket real-time updates
- [ ] Docker deployment
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/) and [Chart.js](https://www.chartjs.org/)
- LLM integration via [OpenAI Python SDK](https://github.com/openai/openai-python)
- Scoring methodology inspired by multi-criteria decision analysis (MCDA)
- UI design inspired by modern glassmorphism aesthetics
