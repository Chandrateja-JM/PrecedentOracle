# PrecedentOracle — Final Run Guide (VS Code)

## What's in this build

| # | Feature | Status |
|---|---|---|
| 1 | Sidebar consolidated → 3 modes (Dashboard / AI Mode / Bare Acts) | ✅ |
| 2 | AI Mode expands into 6 sub-tabs in sidebar | ✅ |
| 3 | Cesium 3D rotating Earth (sun lighting + atmosphere) | ✅ |
| 4 | 26 Indian courts pinned (gold = SC, blue = HC) | ✅ |
| 5 | Google Search tab in Research + Command Center | ✅ |
| 6 | 9 NLP Tasks live trace panel | ✅ |
| 7 | InLegalBERT integration (lazy-load) | ✅ |
| 8 | SQLite database (replaces JSON) | ✅ |
| 9 | Indian Kanoon scraper (150+ landmark cases) | ✅ |
| 10 | Backend PDF upload + NLP preview | ✅ |
| 11 | Gemini/Claude/IIT KGP badges removed | ✅ |
| 12 | Knowledge graph → black background | ✅ |
| 13 | Find Similar AI fixed (lenient schema) | ✅ |
| 14 | Roadmap generation fixed (lenient enum) | ✅ |

---

## Part A — Setup

```bash
cd ~/Desktop
unzip PrecedentOracle-Final-v2.zip -d PO-Final
cd PO-Final
code .
cp .env.example .env
```

Open `.env` in VS Code, paste your keys.

### Frontend (Terminal 1)
```bash
bun install      # or: npm install
```

### Backend (Terminal 2)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

First `torch` install takes 3-5 min (~750MB).

---

## Part B — Initialize SQLite (One-Time)

```bash
# In backend/ with venv active:
python scripts/init_db.py
```

Creates `backend/data/precedent_oracle.db` with 56 cases, 15 judges, 12 statutes.

---

## Part C — Expand Corpus to 200+ Cases (Optional)

If you have `INDIAN_KANOON_API_TOKEN` in `.env`:

```bash
# Make sure .env is loaded — or export the token manually:
export INDIAN_KANOON_API_TOKEN=your-token

python scripts/fetch_landmark_cases.py
```

Pulls 150 real Indian landmark cases into SQLite → ~200 total.

**Without a token**: still inserts the 150 case metadata records (real names, real years, real categories). Full judgment text won't be there, but corpus size demo works.

---

## Part D — Run

```bash
# Terminal 1
bun run dev

# Terminal 2
cd backend && source venv/bin/activate
uvicorn api:app --reload --port 8000
```

Open http://localhost:5173.

---

## Part E — `.env`

```env
# ANTHROPIC_API_KEY=sk-ant-api03-...  (optional)
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_API_KEY=
VITE_GOOGLE_CSE_ID=
INDIAN_KANOON_API_TOKEN=
```

---

## Part F — Viva Demo Flow

1. Open http://localhost:8000/api/status — show 200+ cases
2. Click **AI Mode → Research → Upload** — drop any court PDF
3. Toast shows extracted chars + citations
4. Click **Start Research** to run the pipeline
5. Scroll to **NLP Pipeline Trace** → click **Run 9 NLP Tasks**
6. Show each of the 9 tasks firing with timing
7. Click **Load InLegalBERT** (1-time, 440MB)
8. Re-run trace → `BERT: ON`
9. Show the 3D Globe — drag to rotate
10. Open Graph tab → click case → **Find similar (AI)** — works now
11. Open Roadmap → enter facts → **Generate** — works now

---

## Part G — Troubleshooting

**`bun: command not found`** → `curl -fsSL https://bun.sh/install | bash`

**`ModuleNotFoundError`** → Make sure venv is active: `source venv/bin/activate`

**Find Similar still fails** → Check browser console (F12). Most common cause: `ANTHROPIC_API_KEY` missing. Restart `bun run dev` after editing `.env`.

**Cesium blank** → Network blocks CDN. The globe falls back to a 2D court list — pipeline still works.

**Port 8000 in use** → `lsof -i :8000` → `kill -9 <PID>`

**`precedent_oracle.db` not found** → You skipped Part B. Run `python scripts/init_db.py`.

---

## Part H — File Map

**New backend files:**
- `backend/utils/database.py` — SQLite schema + queries
- `backend/utils/inlegalbert.py` — BERT wrapper
- `backend/scripts/init_db.py` — DB init
- `backend/scripts/fetch_landmark_cases.py` — Indian Kanoon scraper

**New frontend files:**
- `src/components/cesium-court-globe.tsx` — 3D Earth
- `src/components/nlp-trace-panel.tsx` — 9-task live trace UI

**Modified:**
- `backend/api.py` — SQLite loader, PDF upload, trace endpoint
- `backend/requirements.txt` — added transformers, torch, pypdf, sqlalchemy
- `src/lib/ai.functions.ts` — fixed Find Similar + Roadmap schemas
- `src/components/app-sidebar.tsx` — 3-mode nav
- `src/components/legal-visualizations.tsx` — Cesium instead of SVG
- `src/components/command-palette.tsx` — Google tab
- `src/routes/research.tsx` — Google tab + NLP trace + PDF backend
- `src/routes/graph.tsx` — black bg

---

**सत्यमेव जयते** · M.Tech AI/ML · MSRUAS
