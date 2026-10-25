# PrecedentOracle — Quick Start (Final Verified Build)

> **Tested 28 June 2026 — all 9 NLP tasks PASS on both text and PDF input.**

---

## What's in this build

| Component | Status |
|---|---|
| 5-agent NLP pipeline | ✅ 9/9 tasks verified |
| SQLite database (156 cases) | ✅ |
| InLegalBERT integration | ✅ Lazy-loaded |
| Cesium 3D globe + OSM fallback | ✅ |
| Knowledge graph (D3.js) | ✅ |
| PDF upload + text extraction | ✅ |
| Procedural risk scoring | ✅ Fixed in this build |
| Citation verification | ✅ Fixed (handles strings & dicts) |
| Supabase optional (soft-fail) | ✅ Removed throwing |
| Vite restart-loop protection | ✅ Patched |
| Frontend live trace panel | ✅ |
| Indian Kanoon scraper | ✅ 100 cases pulled |

---

## Important: Move out of iCloud-synced folder first

If your project is in `~/Documents/`, iCloud syncs files in the background, which causes Vite to restart in an infinite loop. **Move it out:**

```bash
# Move to home directory (NOT inside Documents)
mv ~/Documents/PrecedentOracle-Final-v2 ~/PrecedentOracle
cd ~/PrecedentOracle
```

---

## Run Steps

### Step 1 — Environment

```bash
cp .env.example .env
```

Edit `.env` to include at least:

```env
# ANTHROPIC_API_KEY=sk-ant-api03-...  (optional)
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_API_KEY=AIzaSyxxxxx
VITE_GOOGLE_CSE_ID=xxxxxx
INDIAN_KANOON_API_TOKEN=xxxxx
```

### Step 2 — Install dependencies

Frontend (terminal 1):
```bash
bun install
```

Backend (terminal 2):
```bash
cd backend
python3 -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 3 — Initialize the SQLite database

```bash
cd backend
source venv/bin/activate
python scripts/init_db.py
```

You should see:
```
Created cases, judges, statutes tables
Loaded 56 landmark cases
Stats: 56 cases, 18 judges, 8 statutes
```

### Step 4 (Optional) — Expand to 156 cases

```bash
# Requires INDIAN_KANOON_API_TOKEN in .env
python scripts/fetch_landmark_cases.py
```

Pulls 100 real Indian SC/HC landmark cases → 156 total in DB.

### Step 5 — Start services

**Terminal 1 (backend):**
```bash
cd backend
source venv/bin/activate
uvicorn api:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
[corpus] SQLite loaded: 156 cases, 18 judges, 8 statutes
```

**Terminal 2 (frontend):**
```bash
bun run dev
```

Expected output (single line, no restart messages):
```
VITE v8.0.16  ready in XXXX ms
➜  Local: http://localhost:8080/
```

### Step 6 — Open browser

http://localhost:8080

---

## Verify the NLP Pipeline (proof for thesis)

### Quick test (from terminal, no UI needed)

```bash
cd backend
source venv/bin/activate
python test_nlp_pipeline.py
```

Expected output:
```
RESULT: 9/9 tasks PASSED  |  Total time: 10.4ms
```

### PDF test

```bash
# 1. Generate a sample SC judgment PDF
python make_test_pdf.py

# 2. Run NLP pipeline on the PDF
python test_pdf_pipeline.py
```

Expected output:
```
9/9 TASKS PASSED — Total wall-clock: 19.0ms
```

### Live test (via UI)

1. Go to http://localhost:8080 → AI Mode → Research
2. Click **Samples** → pick "Maneka Gandhi" or any sample
3. Scroll to **NLP Pipeline Trace** panel (top of middle column)
4. Click **"Run 9 NLP Tasks"** — watch all 9 tasks fire green ✓
5. Click **"Load InLegalBERT"** (downloads 440 MB, one time)
6. Re-run pipeline — Task 6 now uses BERT embeddings

For PDF demo:
- Same Research page → **Upload** tab → drop any court PDF
- Toast: "Extracted X chars · Y citations · Z statutes"
- Click **Run 9 NLP Tasks** — pipeline runs on the PDF text

---

## Demo Flow (Viva)

| Step | Tab/Action | What to highlight |
|---|---|---|
| 1 | Dashboard | "Live corpus stats: 156 cases, 18 judges, 8 statutes" |
| 2 | AI Mode → Research → Samples | Pick any landmark case |
| 3 | NLP Pipeline Trace | Click "Run 9 NLP Tasks" — all 9 turn green |
| 4 | Same panel | Load InLegalBERT — BERT badge turns ON |
| 5 | Precedents tab | Top 10 cases ranked by hybrid BM25 + TF-IDF + RRF |
| 6 | Citations tab | Fuzzy match each citation against 156-case corpus |
| 7 | Graph tab | 104-node, 84-edge knowledge graph with AI explain |
| 8 | Roadmap tab | Procedural risk score 0–100 with 4-dimension breakdown |
| 9 | Report tab | Full PDF report compiled from all agents |

---

## Troubleshooting

### Vite restart loop?
You're still in iCloud-synced folder. Move to `~/PrecedentOracle` (not `~/Documents`).

### Port 8000 in use?
```bash
lsof -ti:8000 | xargs kill -9
```

### Port 8080 in use?
```bash
lsof -ti:8080 | xargs kill -9
```

### Database not found?
You skipped Step 3. Run `python scripts/init_db.py`.

### NLP pipeline fails on PDF?
Check `pip list | grep pypdf` — should show pypdf installed.

### Cesium globe blank?
Token missing or network blocks CDN. App falls back to OpenStreetMap 2D map. Pipeline still works.

### Frontend can't reach backend?
Check `.env` has `VITE_API_URL=http://localhost:8000`. Restart `bun run dev` after editing `.env`.

---

## File Map

```
PrecedentOracle/
├── README.md                       ← Original project README
├── RUN.md                          ← Detailed run guide
├── QUICKSTART.md                   ← This file
├── NLP_PIPELINE_REPORT.md          ← Thesis-ready test report
├── .env.example                    ← Copy to .env
├── package.json                    ← Frontend deps
├── vite.config.ts                  ← Patched: no restart loop
├── tsconfig.json
│
├── src/                            ← React 19 frontend
│   ├── routes/
│   │   ├── index.tsx               ← Dashboard with live corpus stats
│   │   ├── research.tsx            ← 5-tab workspace + NLP trace panel
│   │   ├── precedents.tsx
│   │   ├── citations.tsx
│   │   ├── graph.tsx               ← Knowledge graph (D3)
│   │   ├── library.tsx             ← Bare Acts
│   │   ├── judges.tsx
│   │   ├── roadmap.tsx
│   │   └── report.tsx
│   ├── components/
│   │   ├── nlp-trace-panel.tsx     ← Live 9-task trace UI
│   │   ├── cesium-court-globe.tsx  ← 3D globe + OSM fallback
│   │   └── legal-visualizations.tsx
│   ├── integrations/supabase/      ← Soft-fail clients
│   └── lib/
│       ├── use-corpus-stats.ts     ← Live DB stats hook
│       └── pipeline.functions.ts
│
└── backend/                        ← FastAPI + 5 NLP agents
    ├── api.py                      ← All endpoints + safe-wrapped citations
    ├── requirements.txt
    │
    ├── agents/
    │   ├── legal_intelligence.py   ← Tasks 1-5 (NER, citations, statutes, etc.)
    │   ├── precedent_retrieval.py  ← Task 6 (BM25 + TF-IDF + RRF + weight norm)
    │   ├── citation_verification.py ← Task 7 (fuzzy match)
    │   ├── procedural_risk.py      ← Task 8 (rule-based scoring)
    │   └── report_generator.py     ← Task 9 (synthesis)
    │
    ├── utils/
    │   ├── ner_engine.py
    │   ├── semantic_segmenter.py
    │   ├── statute_identifier.py
    │   ├── database.py             ← SQLite schema + queries
    │   └── inlegalbert.py          ← InLegalBERT wrapper
    │
    ├── scripts/
    │   ├── init_db.py              ← One-time DB seeding
    │   └── fetch_landmark_cases.py ← Indian Kanoon scraper
    │
    ├── test_nlp_pipeline.py        ← Verify 9/9 tasks pass
    ├── test_pdf_pipeline.py        ← Verify PDF extraction + pipeline
    ├── make_test_pdf.py            ← Generate sample SC judgment PDF
    │
    └── data/
        ├── landmark_cases.json     ← 56 SC/HC landmark cases (JSON seed)
        ├── judges.json             ← 18 judges
        ├── bare_acts.json          ← 8 acts, 53 sections
        ├── court_locations.json    ← 26 courts
        └── precedent_oracle.db     ← (Created by init_db.py)
```

---

## What's been fixed in this build

| Issue | Fix |
|---|---|
| Citation verifier crash (Task 7) when citations are strings | Safe-wrapped `verify()` calls — handles strings AND dicts |
| Procedural risk crash (Task 8) | Fixed `api.py` to call with correct keyword args |
| Citation extraction false positives (party names) | Boilerplate filter + length cap + multi-line skip |
| Precedent retrieval returned weight=0.000 | Added BM25 sigmoid normalization + weighted average |
| Supabase ENV missing → app crash | Soft-fail with noop proxy + dev-user bypass |
| Vite restart loop on iCloud-synced folder | Tighter watch ignore list in vite.config.ts |

---

*Built with care for M.Tech AI/ML viva at MSRUAS.*
*सत्यमेव जयते*
