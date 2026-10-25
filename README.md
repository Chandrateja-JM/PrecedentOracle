# PrecedentOracle — India's AI Legal Operating System

**"Precedents You Can Actually Cite."**

M.Tech AI/ML Thesis Project — MSRUAS (Ramaiah University of Applied Sciences)  
Developer: Chandrateja | Evaluators: Dr. Narendra Babu, Dr. Prabadevi

---

## What This Is

A full-stack AI-powered Indian legal research platform with:

- **Frontend**: React 19 + TanStack Router + Tailwind CSS 4 + D3.js — 10 pages
- **Backend**: FastAPI + 5 NLP Agents — NO LLM dependency for core NLP
- **Data**: 56 real SC/HC landmark cases, 18 judges, 8 bare acts (53 sections), 16 court locations
- **NLP**: BM25 + TF-IDF hybrid retrieval, fuzzy citation matching, semantic segmentation, statute identification
- **Visualizations**: Knowledge graph, evidence board, timeline, tree view, court map

---

## Quick Start (5 minutes)

### Prerequisites
- **Node.js 18+** or **Bun** (recommended)
- **Python 3.10+**
- **One AI API key** (Anthropic Claude recommended, or Google Gemini free)

### Step 1: Clone / Extract

```bash
# If from ZIP:
unzip PrecedentOracle-Complete.zip
cd PrecedentOracle

# If from GitHub:
git clone https://github.com/jmchandrateja-ai/precedent-karma.git
cd precedent-karma
```

### Step 2: Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your API key:
```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

Or use free Gemini:
```
GEMINI_API_KEY=your-gemini-key-here
```

### Step 3: Install frontend dependencies

```bash
# Using Bun (recommended — avoids Tailwind v4 npm conflicts):
bun install

# OR using npm (may need --legacy-peer-deps):
npm install --legacy-peer-deps
```

### Step 4: Start the frontend

```bash
# Using Bun:
bun run dev

# OR npm:
npm run dev
```

Frontend runs at: **http://localhost:8080**

### Step 5: Start the backend (separate terminal)

```bash
cd backend

# Install Python dependencies:
pip install fastapi uvicorn pydantic python-multipart requests beautifulsoup4

# Start the API server:
python api.py
```

Backend runs at: **http://localhost:8000**

### Step 6: Verify everything works

1. Open **http://localhost:8080** — you should see the Command Center
2. Open **http://localhost:8000** — you should see the health check JSON
3. Type "Kesavananda" in the search bar — cases should appear
4. Go to Research Workspace → paste legal text → click Analyze

---

## Project Structure

```
PrecedentOracle/
├── .env.example              ← Copy to .env, add your API keys
├── package.json              ← Frontend dependencies
├── bunfig.toml               ← Bun configuration
├── vite.config.ts            ← Vite build config
├── tsconfig.json             ← TypeScript config
│
├── src/                      ← FRONTEND (React + TanStack)
│   ├── routes/               ← 10 pages
│   │   ├── index.tsx         ← Command Center (home + search)
│   │   ├── research.tsx      ← Research Workspace (5-agent pipeline)
│   │   ├── precedents.tsx    ← Precedent Explorer
│   │   ├── citations.tsx     ← Citation Verification
│   │   ├── graph.tsx         ← Knowledge Graph (D3.js)
│   │   ├── library.tsx       ← Bare Acts Library
│   │   ├── judges.tsx        ← Judge Analytics
│   │   ├── roadmap.tsx       ← Procedural Roadmap
│   │   ├── report.tsx        ← Report Studio
│   │   └── __root.tsx        ← Layout + navigation
│   │
│   ├── lib/                  ← Core logic
│   │   ├── seed-data.ts      ← 56 real landmark cases (synced with backend)
│   │   ├── seed-cases-extra.ts ← 50+ additional cases (Labour, IP, Tax, etc.)
│   │   ├── pipeline-client.ts ← Client-side NLP (keyword matching, citation fuzzy matching)
│   │   ├── pipeline.functions.ts ← 5-agent pipeline orchestrator
│   │   ├── ai.functions.ts   ← AI provider layer (Claude > Lovable > Gemini)
│   │   └── pdf-export.ts     ← Report PDF generation
│   │
│   └── components/           ← UI components (shadcn/ui)
│
├── backend/                  ← BACKEND (FastAPI)
│   ├── api.py                ← Main API server (30+ endpoints)
│   ├── requirements.txt      ← Python dependencies
│   │
│   ├── agents/               ← 5 NLP Agents (NO LLM)
│   │   ├── legal_intelligence.py   ← Agent 1: NER + entity extraction
│   │   ├── precedent_retrieval.py  ← Agent 2: BM25 + TF-IDF + RRF
│   │   ├── citation_verification.py ← Agent 3: Fuzzy string matching
│   │   ├── procedural_risk.py      ← Agent 4: Rule-based risk scoring
│   │   └── report_generator.py     ← Agent 5: Template compilation
│   │
│   ├── utils/                ← NLP utilities
│   │   ├── ner_engine.py     ← Legal NER engine (40+ courts, 50+ statutes, 7 citation patterns)
│   │   ├── semantic_segmenter.py   ← Rhetorical role labeling (IIT KGP approach)
│   │   ├── statute_identifier.py   ← Statute identification (LeSICiN approach)
│   │   ├── visualization_generators.py ← Timeline, evidence board, tree, map
│   │   └── evidence_board_v2.py    ← Enhanced entity-relationship graph
│   │
│   ├── scrapers/             ← Data collection
│   │   └── indian_kanoon.py  ← Indian Kanoon scraper (search + case detail)
│   │
│   └── data/                 ← Real Indian legal data
│       ├── landmark_cases.json    ← 56 real SC/HC landmark cases
│       ├── judges.json            ← 18 real SC/HC judges
│       ├── bare_acts.json         ← 8 acts, 53 real sections
│       └── court_locations.json   ← 16 courts with lat/lng
│
└── supabase/                 ← Supabase config (optional)
```

---

## Architecture: 5-Agent NLP Pipeline

```
User Input (legal text)
    │
    ▼
┌─────────────────────────────────────────┐
│  Agent 1: Legal Intelligence            │  ← NER + regex entity extraction
│  Engine: spaCy + regex (NO LLM)         │     Extracts: parties, court, judges,
│                                         │     statutes, citations, dates, issues
└────────────────┬────────────────────────┘
                 │
    ▼            ▼
┌─────────────────────────────────────────┐
│  Agent 2: Precedent Retrieval           │  ← BM25 + TF-IDF + Reciprocal Rank
│  Engine: Hybrid retrieval (NO LLM)      │     Fusion across 100+ cases
└────────────────┬────────────────────────┘
                 │
    ▼            ▼
┌─────────────────────────────────────────┐
│  Agent 3: Citation Verification         │  ← Fuzzy string matching (Jaccard)
│  Engine: Fuzzy matching (NO LLM)        │     Status: verified/weak/missing/overruled
└────────────────┬────────────────────────┘
                 │
    ▼            ▼
┌─────────────────────────────────────────┐
│  Agent 4: Procedural Risk Analyzer      │  ← Rule-based checklist scoring
│  Engine: Rules + scoring (NO LLM)       │     Court Readiness Score 0-100
└────────────────┬────────────────────────┘
                 │
    ▼            ▼
┌─────────────────────────────────────────┐
│  Agent 5: Report Generator              │  ← Template compilation
│  Engine: Template + NLP (NO LLM)        │     PDF/DOCX export ready
└────────────────┬────────────────────────┘
                 │
    ▼            ▼
┌─────────────────────────────────────────┐
│  + Semantic Segmentation                │  ← Facts/Arguments/Ratio/Ruling
│  + Statute Identification               │  ← IPC→BNS mapping
│  + Evidence Board                       │  ← Entity-relationship graph
│  + Timeline                             │  ← Chronological events
│  + Court Map                            │  ← Geospatial visualization
└─────────────────────────────────────────┘
```

**Key thesis point**: The 5 agents do REAL NLP processing — not LLM wrappers. Claude/Gemini is used ONLY for natural language explanation of results, never for core analysis.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/pipeline/full` | Run complete 5-agent pipeline |
| POST | `/api/agents/legal-intelligence` | Agent 1: Entity extraction |
| POST | `/api/agents/precedent-retrieval` | Agent 2: Case retrieval |
| POST | `/api/agents/citation-verification` | Agent 3: Citation check |
| POST | `/api/agents/procedural-risk` | Agent 4: Risk scoring |
| POST | `/api/agents/generate-report` | Agent 5: Report generation |
| POST | `/api/nlp/semantic-segments` | Rhetorical role labeling |
| POST | `/api/nlp/identify-statutes` | Statute identification |
| POST | `/api/visualize/timeline` | Timeline data |
| POST | `/api/visualize/evidence-board` | Evidence board graph |
| POST | `/api/visualize/tree` | Tree view breakdown |
| POST | `/api/visualize/court-map` | Court geospatial data |
| POST | `/api/search/cases` | Search cases |
| GET | `/api/cases` | List all cases |
| GET | `/api/cases/{id}` | Get case by ID |
| GET | `/api/judges` | List all judges |
| GET | `/api/bare-acts` | List all bare acts |
| GET | `/api/knowledge-graph` | Knowledge graph nodes + edges |
| GET | `/api/stats` | Dashboard statistics |
| POST | `/api/scraper/indian-kanoon` | Scrape Indian Kanoon |

---

## Compared to Competitors

| Feature | PrecedentOracle | LegalSphere | CaseMine |
|---------|----------------|-------------|----------|
| Citation Verification | ✅ Fuzzy + corpus | ❌ | ❌ |
| Procedural Risk Score | ✅ Court readiness 0-100 | ❌ | ❌ |
| Knowledge Graph | ✅ D3.js interactive | ❌ | ❌ |
| Evidence Board | ✅ Entity-relationship | ✅ ReactFlow | ❌ |
| Timeline View | ✅ Chronological | ✅ | ❌ |
| Court Map | ✅ Geospatial | ✅ | ❌ |
| Semantic Segmentation | ✅ IIT KGP approach | ❌ | ❌ |
| Statute ID | ✅ LeSICiN approach | ❌ | ❌ |
| Bare Acts Library | ✅ 8 acts, 53 sections | ❌ | ✅ |
| Judge Analytics | ✅ 18 real judges | ❌ | ❌ |
| Real Landmark Cases | 56 + 50 extra | 280K consumer | Unknown |
| Agent Architecture | 5-agent NLP pipeline | RAG chatbot | Monolith |
| LLM Dependency | Explanation only | Core RAG | Core |
| Open Source | ✅ | ✅ Apache 2.0 | ❌ Commercial |

---

## Research Foundations

- **IIT Kharagpur Law-AI**: Semantic segmentation (JURIX 2019), Statute identification via LeSICiN (AAAI 2022), InLegalBERT (HuggingFace), Charge identification (COLING 2020)
- **LegalSphere**: Evidence board visualization, timeline, map, tree view
- **BM25 + TF-IDF**: Hybrid retrieval with Reciprocal Rank Fusion
- **Fuzzy String Matching**: Jaccard similarity for citation verification

---

## Troubleshooting

**"Cannot find module @tanstack/react-start"**
```bash
bun install  # Use bun, not npm
```

**"Tailwind CSS not working"**
This project uses Tailwind v4. Use `bun install`, not `npm install`.

**"API key invalid"**
- Check `.env` has no trailing spaces or quotes
- Anthropic key should start with `sk-ant-api03-`
- Test: `curl -H "x-api-key: YOUR_KEY" https://api.anthropic.com/v1/messages`

**"Backend won't start"**
```bash
cd backend
pip install fastapi uvicorn pydantic python-multipart
python api.py
```

**"Frontend can't reach backend"**
- Backend must be running on port 8000
- Check CORS in api.py allows your frontend port
- Set `VITE_API_URL=http://localhost:8000` in .env

---

## License

MIT License — Academic project, freely usable and extensible.

Built with care by Chandrateja for M.Tech AI/ML thesis at MSRUAS.
