# PrecedentOracle — Enhanced NLP Backend v2.0

**India's AI Legal Operating System — 5-Agent NLP Pipeline**

Enhanced with LegalSphere-style visualizations + IIT KGP-inspired NLP

---

## What's New in v2.0

### Data (Real, Not Fabricated)
- **67 real landmark Indian SC cases** (up from 24) — verified citations, real holdings
- **15 real Supreme Court judge profiles** with specializations and notable judgments
- **12 real Indian statutes** (Constitution, IPC, BNS, CrPC, CPC, Evidence Act, IT Act, IBC, Arbitration Act, RPA, POSH, POCSO) with actual section text
- **16 court locations** with GPS coordinates (SC + 14 High Courts + NCLT + NGT)
- Each case includes: timeline events, geospatial location, judges, cites/overrules relationships

### New NLP Features (IIT KGP Law-AI Inspired)
- **Semantic Segmentation** — Labels sentences with rhetorical roles: FACTS, ARGUMENTS, RATIO, RULING, STATUTE, PRECEDENT, ISSUE, PREAMBLE
- **Statute Identification Engine** — Identifies applicable Indian statutes from case text using TF-IDF + concept mapping (inspired by LeSICiN, AAAI 2022)

### New Visualization Data (LegalSphere Inspired)
- **Timeline Generator** — Chronological case events for timeline visualization
- **Evidence Board** — Entity-relationship graph (nodes/edges) for ReactFlow/D3
- **Tree View** — Hierarchical case breakdown
- **Court Map** — Geospatial court matching with coordinates

### Indian Kanoon Scraper
- CLI tool for scraping real case data from indiankanoon.org
- Search + full case fetch with BeautifulSoup parsing
- Rate limiting and demo mode fallback

---

## Quick Start

```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt --break-system-packages

# 2. Start the API
python3 api.py

# Server starts at http://localhost:8000
# Docs at http://localhost:8000/docs (Swagger UI)
```

---

## API Endpoints

### Original 5-Agent Pipeline
| Endpoint | Method | Description |
|---|---|---|
| `/api/agents/legal-intelligence` | POST | NER extraction (parties, judges, courts, statutes, citations) |
| `/api/agents/precedent-retrieval` | POST | Hybrid BM25 + TF-IDF + RRF retrieval |
| `/api/agents/citation-verification` | POST | Verify citations (Verified/Weak/Missing/Overruled) |
| `/api/agents/procedural-risk` | POST | Rule-based risk analysis, court readiness score 0-100 |
| `/api/agents/generate-report` | POST | Compile all agents into structured report |
| `/api/pipeline/full` | POST | Run all 5 agents + visualizations in one call |

### New NLP Endpoints
| Endpoint | Method | Description |
|---|---|---|
| `/api/nlp/semantic-segments` | POST | Segment document into Facts/Arguments/Ratio/Ruling |
| `/api/nlp/identify-statutes` | POST | Identify applicable Indian statutes |

### New Visualization Endpoints
| Endpoint | Method | Description |
|---|---|---|
| `/api/visualize/timeline` | POST | Timeline events data |
| `/api/visualize/evidence-board` | POST | Entity-relationship graph |
| `/api/visualize/tree` | POST | Hierarchical case breakdown |
| `/api/visualize/court-map` | POST | Geospatial court markers |

### Data Endpoints
| Endpoint | Method | Description |
|---|---|---|
| `/api/cases` | GET | List all 67 cases (filter by category) |
| `/api/cases/{id}` | GET | Single case detail |
| `/api/judges` | GET | List all 15 judges |
| `/api/bare-acts` | GET | List all 12 statutes |
| `/api/bare-acts/{id}` | GET | Full statute with sections |
| `/api/court-locations` | GET | All 16 court locations with GPS |
| `/api/knowledge-graph` | GET | Citation network nodes + edges |
| `/api/stats` | GET | Dashboard statistics |
| `/api/search/cases` | POST | Search cases by keyword |
| `/api/scraper/indian-kanoon` | POST | Scrape real cases from Indian Kanoon |

### Request Format (POST endpoints)
```json
{
  "document_text": "The petitioner filed a writ under Article 32...",
  "court": "Supreme Court of India",
  "case_type": "Constitutional",
  "depth": "deep"
}
```

**Depth levels:** `quick` (Agents 1-2), `deep` (Agents 1-4 + visualizations), `comprehensive` (all 5 + visualizations)

---

## Architecture

```
Core Principle: NLP pipelines first, LLMs only for explanation
```

### 5-Agent Pipeline
1. **Legal Intelligence** — Regex + pattern NER (no LLM)
2. **Precedent Retrieval** — BM25 + TF-IDF cosine + Reciprocal Rank Fusion
3. **Citation Verification** — Fuzzy matching + corpus lookup
4. **Procedural Risk** — Rule-based checklist (no LLM)
5. **Report Generator** — Structured compilation (no LLM)

### New Utilities
- **SemanticSegmenter** — Rhetorical role labeling (regex pattern matching)
- **StatuteIdentifier** — TF-IDF + keyword concept mapping
- **TimelineGenerator** — Date extraction + chronological ordering
- **EvidenceBoardGenerator** — Entity-relationship graph construction
- **TreeViewGenerator** — Hierarchical structure generation
- **CourtMapGenerator** — Geospatial coordinate matching

---

## File Structure
```
backend/
├── api.py                          # FastAPI server (all endpoints)
├── requirements.txt                # Python dependencies
├── README.md                       # This file
├── agents/
│   ├── legal_intelligence.py       # Agent 1: NER extraction
│   ├── precedent_retrieval.py      # Agent 2: BM25 + TF-IDF + RRF
│   ├── citation_verification.py    # Agent 3: Citation checking
│   ├── procedural_risk.py          # Agent 4: Risk analysis
│   └── report_generator.py         # Agent 5: Report compilation
├── utils/
│   ├── semantic_segmenter.py       # IIT KGP-inspired segmentation
│   ├── statute_identifier.py       # LeSICiN-inspired statute ID
│   └── visualization_generators.py # Timeline, Evidence Board, Tree, Map
├── scrapers/
│   └── indian_kanoon.py            # Indian Kanoon scraper CLI
└── data/
    ├── landmark_cases.json         # 67 real SC cases
    ├── judges.json                 # 15 real SC judges
    ├── bare_acts.json              # 12 real Indian statutes
    └── court_locations.json        # 16 courts with GPS coordinates
```

---

## Using the Indian Kanoon Scraper

```bash
# Search and save results
python3 scrapers/indian_kanoon.py --query "Article 21 privacy" --max 50 --output data/scraped.json

# With full case text
python3 scrapers/indian_kanoon.py --query "insolvency IBC" --max 20 --fetch-full --output data/ibc_cases.json
```

Requires: `pip install requests beautifulsoup4 --break-system-packages`

---

## Future Enhancements (Not Yet Implemented)
- **InLegalBERT** integration (law-ai/InLegalBERT on HuggingFace) for production-grade NER
- **280K case database** via LegalSphere's scraper approach
- **Vector embeddings** with FAISS for semantic retrieval
- **ILDC dataset** (35K annotated SC cases) integration

---

## Credits & References
- IIT Kharagpur Law-AI: github.com/Law-AI (semantic segmentation, InLegalBERT, statute identification)
- LegalSphere: github.com/sarfarajansari/legalSphere.Web (visualization concepts, scraper approach)
- Indian Kanoon: indiankanoon.org (case data source)
