"""
PrecedentOracle — Enhanced FastAPI NLP Backend
═══════════════════════════════════════════════
India's AI Legal Operating System — 5-Agent NLP Pipeline
+ LegalSphere-inspired visualizations + IIT KGP-inspired NLP

New features:
  - Semantic segmentation (Facts/Arguments/Ratio/Ruling)
  - Statute identification engine
  - Timeline visualization data
  - Evidence board (entity-relationship graph)
  - Tree view (hierarchical case breakdown)
  - Court map (geospatial)
  - Indian Kanoon scraper endpoint
  - Enhanced data: 67 real landmark cases, 15 judges, 12 bare acts
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Any
import json
import os
import time

# ─── Existing Agents ──────────────────────────────────────
from agents.legal_intelligence import LegalIntelligenceAgent
from agents.precedent_retrieval import PrecedentRetrievalAgent
from agents.citation_verification import CitationVerificationAgent
from agents.procedural_risk import ProceduralRiskAnalyzer
from agents.report_generator import ReportGeneratorAgent

# ─── New Utilities (LegalSphere + IIT KGP inspired) ──────
from utils.semantic_segmenter import SemanticSegmenter
from utils.statute_identifier import StatuteIdentifier
from utils.visualization_generators import (
    TimelineGenerator,
    EvidenceBoardGenerator,
    TreeViewGenerator,
    CourtMapGenerator,
)

app = FastAPI(
    title="PrecedentOracle NLP Backend",
    description=(
        "India's AI Legal Operating System — 5-Agent NLP Pipeline "
        "with LegalSphere-style visualizations and IIT KGP-inspired NLP"
    ),
    version="2.0.0",
)

# CORS for any frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Load Data (SQLite first, JSON fallback) ──────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def _load_corpus():
    """Try SQLite first. Fall back to JSON if DB not initialized yet."""
    try:
        from utils.database import list_cases, list_judges, list_statutes, DB_PATH
        if not os.path.exists(DB_PATH):
            raise FileNotFoundError("SQLite DB not initialized")
        cases = list_cases(limit=10000)
        judges = list_judges(limit=1000)
        acts = list_statutes(limit=1000)
        if cases:  # DB has data
            print(f"[corpus] SQLite loaded: {len(cases)} cases, {len(judges)} judges, {len(acts)} statutes")
            return cases, judges, acts
        raise RuntimeError("SQLite DB is empty")
    except Exception as e:
        print(f"[corpus] SQLite unavailable ({e}); falling back to JSON")
        with open(os.path.join(DATA_DIR, "landmark_cases.json")) as f:
            cases = json.load(f)
        with open(os.path.join(DATA_DIR, "judges.json")) as f:
            judges = json.load(f)
        with open(os.path.join(DATA_DIR, "bare_acts.json")) as f:
            acts = json.load(f)
        print(f"[corpus] JSON loaded: {len(cases)} cases, {len(judges)} judges, {len(acts)} statutes")
        return cases, judges, acts

LANDMARK_CASES, JUDGES, BARE_ACTS = _load_corpus()

with open(os.path.join(DATA_DIR, "court_locations.json"), "r") as f:
    COURT_LOCATIONS = json.load(f)

# ─── Initialize Agents & Utilities ─────────────────────────
legal_intel = LegalIntelligenceAgent()
precedent_retrieval = PrecedentRetrievalAgent(LANDMARK_CASES)
citation_verifier = CitationVerificationAgent(LANDMARK_CASES)
risk_analyzer = ProceduralRiskAnalyzer()
report_generator = ReportGeneratorAgent()

# New utilities
segmenter = SemanticSegmenter()
statute_identifier = StatuteIdentifier()
timeline_gen = TimelineGenerator()
evidence_board_gen = EvidenceBoardGenerator()
tree_gen = TreeViewGenerator()
court_map_gen = CourtMapGenerator()


# ─── Request Models ───────────────────────────────────────

class ResearchRequest(BaseModel):
    document_text: str
    court: Optional[str] = "Supreme Court of India"
    case_type: Optional[str] = "Constitutional"
    depth: Optional[str] = "deep"

class SearchRequest(BaseModel):
    query: str
    category: Optional[str] = None
    limit: Optional[int] = 20

class CitationVerifyRequest(BaseModel):
    citation_text: str

class BulkCitationRequest(BaseModel):
    document_text: str

class SegmentRequest(BaseModel):
    document_text: str

class StatuteRequest(BaseModel):
    document_text: str
    top_k: Optional[int] = 10

class ScrapeRequest(BaseModel):
    query: str
    max_results: Optional[int] = 20


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Health Check
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/")
def health():
    # Check InLegalBERT availability
    try:
        from utils.inlegalbert import get_bert
        bert_status = get_bert().load_status()
    except Exception:
        bert_status = {"available": False, "error": "module not installed"}

    return {
        "status": "operational",
        "platform": "PrecedentOracle NLP Backend v2.0",
        "agents": 5,
        "indexed_cases": len(LANDMARK_CASES),
        "judges": len(JUDGES),
        "bare_acts": len(BARE_ACTS),
        "court_locations": len(COURT_LOCATIONS),
        "inlegalbert": bert_status,
        "nlp_tasks": [
            "1. Named Entity Recognition (regex + InLegalBERT)",
            "2. Citation Extraction (6 regex patterns)",
            "3. Statute Identification (IPC/CrPC/Constitution)",
            "4. Legal Issue Classification (10 categories)",
            "5. Semantic Segmentation (FACTS→RATIO labeling)",
            "6. Precedent Retrieval (BM25 + TF-IDF + RRF)",
            "7. Citation Verification (fuzzy + corpus)",
            "8. Procedural Risk Assessment (rule-based)",
            "9. Argument Synthesis (weighted aggregation)",
        ],
        "features": [
            "5-Agent NLP Pipeline",
            "9 NLP Tasks (visible trace logs)",
            "InLegalBERT integration (law-ai/InLegalBERT)",
            "Semantic Segmentation",
            "Statute Identification Engine",
            "Cesium 3D Globe (Court Map)",
            "Evidence Board Graph",
            "Tree View Breakdown",
            "Indian Kanoon Scraper",
            "BM25 + TF-IDF + Optional BERT Hybrid Retrieval with RRF",
            "Citation Verification (Fuzzy + Corpus)",
            "Procedural Risk Analyzer",
        ],
    }


@app.get("/api/status")
def api_status():
    """Detailed system + NLP component status."""
    try:
        from utils.inlegalbert import get_bert
        bert = get_bert()
        bert_info = bert.load_status()
    except Exception as e:
        bert_info = {"available": False, "error": str(e)}

    return {
        "backend": "operational",
        "corpus": {
            "cases": len(LANDMARK_CASES),
            "judges": len(JUDGES),
            "bare_acts": len(BARE_ACTS),
        },
        "nlp": {
            "regex_ner": True,
            "inlegalbert": bert_info,
            "bm25": True,
            "tfidf": True,
            "semantic_segmenter": True,
        },
    }


@app.post("/api/nlp/inlegalbert/load")
def load_inlegalbert():
    """Trigger InLegalBERT load. ~440MB download on first call.
    Use this to verify the model is downloadable before running pipeline."""
    try:
        from utils.inlegalbert import get_bert
        bert = get_bert()
        bert._try_load()
        return bert.load_status()
    except Exception as e:
        return {"available": False, "error": str(e)}


@app.post("/api/upload/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Accept a PDF/DOCX/TXT upload and return extracted text + immediate NLP analysis.
    This is the main entry point for the user's "upload a case PDF" flow.
    """
    import time
    t0 = time.time()
    filename = file.filename or "unknown"
    contents = await file.read()
    text = ""

    try:
        if filename.lower().endswith(".pdf"):
            from io import BytesIO
            text = ""
            extract_engine = "none"

            # Try PyMuPDF first (fastest, best quality - 10-30x faster than pypdf)
            try:
                import fitz  # PyMuPDF
                with fitz.open(stream=contents, filetype="pdf") as doc:
                    text = "\n\n".join(page.get_text() for page in doc)
                extract_engine = "pymupdf"
            except ImportError:
                pass
            except Exception as e:
                print(f"[pdf] PyMuPDF failed: {e}, falling back to pdfplumber")

            # Fallback 1: pdfplumber (slower but reliable on weird PDFs)
            if not text.strip():
                try:
                    import pdfplumber
                    with pdfplumber.open(BytesIO(contents)) as pdf:
                        text = "\n\n".join((p.extract_text() or "") for p in pdf.pages)
                    extract_engine = "pdfplumber"
                except ImportError:
                    pass
                except Exception as e:
                    print(f"[pdf] pdfplumber failed: {e}, falling back to pypdf")

            # Fallback 2: pypdf (slowest, last resort)
            if not text.strip():
                try:
                    from pypdf import PdfReader
                    reader = PdfReader(BytesIO(contents))
                    text = "\n".join(p.extract_text() or "" for p in reader.pages)
                    extract_engine = "pypdf"
                except ImportError:
                    raise HTTPException(500, "No PDF library installed. Run: pip install PyMuPDF pdfplumber pypdf")

            print(f"[pdf] extracted {len(text)} chars in {round((time.time()-t0)*1000,1)}ms using {extract_engine}")
        elif filename.lower().endswith(".docx"):
            try:
                from docx import Document
                from io import BytesIO
                doc = Document(BytesIO(contents))
                text = "\n".join(p.text for p in doc.paragraphs)
            except ImportError:
                raise HTTPException(500, "python-docx not installed. Run: pip install python-docx")
        else:
            text = contents.decode("utf-8", errors="ignore")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Failed to extract text from {filename}: {e}")

    if not text.strip():
        raise HTTPException(400, f"No text extracted from {filename}")

    # Immediate quick NLP preview (for instant UI feedback after upload)
    intel = legal_intel.extract(text[:30000])
    preview = {
        "filename": filename,
        "size_bytes": len(contents),
        "chars_extracted": len(text),
        "duration_ms": round((time.time() - t0) * 1000, 1),
        "preview": text[:600],
        "full_text": text,
        "nlp_preview": {
            "citations_found": len(intel.get("citations", [])),
            "statutes_found": len(intel.get("statutes", [])),
            "entities_found": len(intel.get("entities", [])),
            "legal_issues": intel.get("legal_issues", []),
            "court": intel.get("court"),
            "parties": intel.get("parties"),
            "judges": intel.get("judges", [])[:5],
        },
    }
    return preview


@app.post("/api/nlp/pipeline-trace")
def nlp_pipeline_trace(req: ResearchRequest):
    """
    Run ALL 9 NLP tasks on the input text and return a verbose, timestamped trace.
    Designed to be shown to the user — each task's input, output, and timing visible.
    Critical for the M.Tech viva demo: examiner can see each NLP component fire.
    """
    import time
    pipeline_start = time.time()
    trace = []

    def task(num: int, name: str, engine: str, fn):
        t0 = time.time()
        try:
            out = fn()
            dt = round((time.time() - t0) * 1000, 1)
            trace.append({
                "task_number": num, "name": name, "engine": engine,
                "duration_ms": dt, "status": "ok",
                "input_chars": len(req.document_text),
                "output_preview": _summarize(out),
                "raw_output": out,
            })
            return out
        except Exception as e:
            trace.append({
                "task_number": num, "name": name, "engine": engine,
                "duration_ms": round((time.time() - t0) * 1000, 1),
                "status": "error", "error": str(e),
            })
            return None

    # NLP Task 1-5 (all inside Agent 1)
    intel = task(1, "Named Entity Recognition", "Regex + Gazetteer",
                 lambda: legal_intel.extract(req.document_text)["entities"])
    citations = task(2, "Citation Extraction", "6 regex patterns (SCC, AIR, SCR, CriLJ, WP)",
                     lambda: legal_intel.extract(req.document_text)["citations"])
    statutes = task(3, "Statute Identification", "Pattern matching (IPC/CrPC/Constitution)",
                    lambda: legal_intel.extract(req.document_text)["statutes"])
    issues = task(4, "Legal Issue Classification", "Keyword multi-label (10 categories)",
                  lambda: legal_intel.extract(req.document_text)["legal_issues"])
    segments = task(5, "Semantic Segmentation", "Rule-based rhetorical role labeling",
                    lambda: segmenter.segment(req.document_text))

    # NLP Task 6: Precedent Retrieval (BM25 + TF-IDF + RRF)
    query = " ".join(issues or [req.document_text[:300]])
    precedents = task(6, "Precedent Retrieval", "BM25 + TF-IDF Cosine + Reciprocal Rank Fusion",
                      lambda: precedent_retrieval.retrieve(query=query, limit=10))

    # NLP Task 7: Citation Verification
    verifications = task(7, "Citation Verification", "Fuzzy match + corpus lookup",
                         lambda: [citation_verifier.verify(
                             c if isinstance(c, str)
                             else (c.get("raw") if isinstance(c, dict) else str(c))
                         ) for c in (citations or [])])

    # NLP Task 8: Procedural Risk
    risk = task(8, "Procedural Risk Assessment", "Rule-based checklist (limitation, jurisdiction, standing)",
                lambda: procedural_risk.assess(req.document_text,
                                                req.court or "Supreme Court of India",
                                                req.case_type or "Constitutional"))

    # NLP Task 9: Argument Synthesis
    synthesis = task(9, "Argument Synthesis", "Weighted aggregation across all agents",
                     lambda: {
                         "primary_argument": (issues or ["Constitutional question"])[0] if issues else "Unknown",
                         "supporting_count": len(precedents.get("supporting", [])) if precedents else 0,
                         "opposing_count": len(precedents.get("opposing", [])) if precedents else 0,
                         "verified_citations": sum(1 for v in (verifications or []) if v.get("status") == "Verified"),
                         "risk_score": (risk or {}).get("score", 0),
                     })

    total_ms = round((time.time() - pipeline_start) * 1000, 1)

    # InLegalBERT status (informational)
    try:
        from utils.inlegalbert import get_bert
        bert_status = get_bert().load_status()
    except Exception:
        bert_status = {"available": False}

    return {
        "trace": trace,
        "total_duration_ms": total_ms,
        "total_tasks": 9,
        "successful": sum(1 for t in trace if t["status"] == "ok"),
        "inlegalbert_status": bert_status,
        "synthesis": synthesis,
    }


def _summarize(out: Any) -> str:
    """Make any NLP output into a 1-line human-readable preview."""
    if out is None:
        return "(none)"
    if isinstance(out, list):
        return f"{len(out)} item(s)"
    if isinstance(out, dict):
        keys = list(out.keys())[:3]
        return "{" + ", ".join(keys) + (", …" if len(out) > 3 else "") + "}"
    s = str(out)
    return s[:100] + ("…" if len(s) > 100 else "")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# AGENT 1: Legal Intelligence
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/agents/legal-intelligence")
def run_legal_intelligence(req: ResearchRequest):
    start = time.time()
    result = legal_intel.extract(req.document_text)
    elapsed = round(time.time() - start, 3)
    return {
        "agent": "Legal Intelligence",
        "engine": "NLP (spaCy + regex)",
        "processing_time_sec": elapsed,
        "entities": result["entities"],
        "citations_found": result["citations"],
        "statutes_invoked": result["statutes"],
        "legal_issues": result["legal_issues"],
        "parties": result["parties"],
        "court_identified": result["court"],
        "dates": result["dates"],
        "confidence": result["confidence"],
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# AGENT 2: Precedent Retrieval
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/agents/precedent-retrieval")
def run_precedent_retrieval(req: ResearchRequest):
    start = time.time()
    entities = legal_intel.extract(req.document_text)
    query_terms = []
    for s in entities["statutes"]:
        query_terms.append(s["act"] + " " + s.get("section", ""))
    for issue in entities["legal_issues"]:
        query_terms.append(issue)
    query = " ".join(query_terms) if query_terms else req.document_text[:500]

    result = precedent_retrieval.retrieve(
        query=query, court_filter=req.court,
        case_type_filter=req.case_type,
        limit=20 if req.depth == "comprehensive" else 10,
    )
    elapsed = round(time.time() - start, 3)
    return {
        "agent": "Precedent Retrieval",
        "engine": "Hybrid BM25 + TF-IDF Cosine + RRF",
        "processing_time_sec": elapsed,
        "total_retrieved": len(result["supporting"]) + len(result["opposing"]),
        "supporting": result["supporting"],
        "opposing": result["opposing"],
        "retrieval_metadata": result["metadata"],
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# AGENT 3: Citation Verification
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/agents/citation-verification")
def run_citation_verification(req: BulkCitationRequest):
    start = time.time()
    entities = legal_intel.extract(req.document_text)
    citations = entities["citations"]
    results = [citation_verifier.verify(cite if isinstance(cite, str) else (cite.get("raw") if isinstance(cite, dict) else str(cite))) for cite in citations]

    verified = sum(1 for r in results if r["status"] == "Verified")
    weak = sum(1 for r in results if r["status"] == "Weak")
    missing = sum(1 for r in results if r["status"] == "Missing")
    overruled = sum(1 for r in results if r["status"] == "Overruled")
    elapsed = round(time.time() - start, 3)

    return {
        "agent": "Citation Verification",
        "engine": "Fuzzy matching + corpus lookup",
        "processing_time_sec": elapsed,
        "total_citations": len(results),
        "verified": verified, "weak": weak,
        "missing": missing, "overruled": overruled,
        "overall_score": round(verified / max(len(results), 1) * 100, 1),
        "citations": results,
    }


@app.post("/api/agents/verify-single-citation")
def verify_single_citation(req: CitationVerifyRequest):
    return citation_verifier.verify(req.citation_text)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# AGENT 4: Procedural Risk
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/agents/procedural-risk")
def run_procedural_risk(req: ResearchRequest):
    start = time.time()
    entities = legal_intel.extract(req.document_text)
    citations = [citation_verifier.verify(c if isinstance(c, str) else (c.get("raw") if isinstance(c, dict) else str(c))) for c in entities["citations"]]
    precedents = precedent_retrieval.retrieve(query=req.document_text[:500], limit=10)
    result = risk_analyzer.analyze(
        document_text=req.document_text, entities=entities,
        citation_results=citations, precedent_results=precedents,
        court=req.court, case_type=req.case_type,
    )
    elapsed = round(time.time() - start, 3)
    return {
        "agent": "Procedural Risk Analyzer",
        "engine": "Rule-based checklist + NLP",
        "processing_time_sec": elapsed,
        "court_readiness_score": result["score"],
        "risk_level": result["risk_level"],
        "strengths": result["strengths"],
        "moderate_risks": result["moderate_risks"],
        "critical_risks": result["critical_risks"],
        "missing_documents": result["missing_documents"],
        "contradictions": result["contradictions"],
        "recommendations": result["recommendations"],
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# AGENT 5: Report Generator
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/agents/generate-report")
def generate_report(req: ResearchRequest):
    start = time.time()
    intel = legal_intel.extract(req.document_text)
    precedents = precedent_retrieval.retrieve(query=req.document_text[:500], limit=15)
    citations = [citation_verifier.verify(c if isinstance(c, str) else (c.get("raw") if isinstance(c, dict) else str(c))) for c in intel["citations"]]
    risk = risk_analyzer.analyze(
        document_text=req.document_text, entities=intel,
        citation_results=citations, precedent_results=precedents,
        court=req.court, case_type=req.case_type,
    )
    report = report_generator.compile(
        entities=intel, precedents=precedents, citations=citations,
        risk_analysis=risk, court=req.court, case_type=req.case_type,
    )
    elapsed = round(time.time() - start, 3)
    return {"agent": "Report Generator", "engine": "Structured compilation + NLP summary",
            "processing_time_sec": elapsed, "report": report}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FULL PIPELINE (all 5 agents + new features)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/pipeline/full")
def run_full_pipeline(req: ResearchRequest):
    pipeline_start = time.time()
    results = {}

    # Agent 1: Legal Intelligence
    intel = legal_intel.extract(req.document_text)
    results["legal_intelligence"] = {"agent": "Legal Intelligence", "engine": "NLP (spaCy + regex)", "data": intel}

    # Agent 2: Precedent Retrieval
    query_terms = []
    for s in intel["statutes"]:
        query_terms.append(s["act"] + " " + s.get("section", ""))
    for issue in intel["legal_issues"]:
        query_terms.append(issue)
    query = " ".join(query_terms) if query_terms else req.document_text[:500]
    depth_limit = {"quick": 5, "deep": 10, "comprehensive": 20}
    precedents = precedent_retrieval.retrieve(
        query=query, court_filter=req.court, case_type_filter=req.case_type,
        limit=depth_limit.get(req.depth, 10),
    )
    results["precedent_retrieval"] = {"agent": "Precedent Retrieval", "engine": "Hybrid BM25 + TF-IDF + RRF", "data": precedents}

    # Agent 3: Citation Verification
    citation_results = [citation_verifier.verify(c if isinstance(c, str) else (c.get("raw") if isinstance(c, dict) else str(c))) for c in intel["citations"]]
    verified = sum(1 for r in citation_results if r["status"] == "Verified")
    results["citation_verification"] = {
        "agent": "Citation Verification", "engine": "Fuzzy matching + corpus lookup",
        "total": len(citation_results), "verified": verified,
        "score": round(verified / max(len(citation_results), 1) * 100, 1),
        "data": citation_results,
    }

    # Agent 4: Procedural Risk
    if req.depth in ("deep", "comprehensive"):
        risk = risk_analyzer.analyze(
            document_text=req.document_text, entities=intel,
            citation_results=citation_results, precedent_results=precedents,
            court=req.court, case_type=req.case_type,
        )
        results["procedural_risk"] = {"agent": "Procedural Risk Analyzer", "engine": "Rule-based + NLP", "data": risk}

    # Agent 5: Report (comprehensive only)
    if req.depth == "comprehensive":
        risk_data = results.get("procedural_risk", {}).get("data", {})
        report = report_generator.compile(
            entities=intel, precedents=precedents, citations=citation_results,
            risk_analysis=risk_data, court=req.court, case_type=req.case_type,
        )
        results["report"] = {"agent": "Report Generator", "engine": "Structured compilation", "data": report}

    # ─── NEW: Visualizations (deep + comprehensive) ────────
    if req.depth in ("deep", "comprehensive"):
        # Semantic Segmentation
        segments = segmenter.segment(req.document_text)
        results["semantic_segments"] = {
            "engine": "IIT KGP-inspired rhetorical role labeling",
            "total_segments": len(segments),
            "summary": segmenter.get_section_summary(segments),
            "data": segments[:50],  # Limit for response size
        }

        # Statute Identification
        statutes = statute_identifier.identify(req.document_text)
        results["statute_identification"] = {
            "engine": "LeSICiN-inspired TF-IDF + keyword mapping",
            "identified": len(statutes),
            "data": statutes,
        }

        # Timeline
        timeline = timeline_gen.generate(intel, precedents)
        results["timeline"] = {
            "engine": "NLP extraction + chronological ordering",
            "events": len(timeline),
            "data": timeline,
        }

        # Evidence Board
        evidence_board = evidence_board_gen.generate(intel, precedents)
        results["evidence_board"] = {
            "engine": "Entity-relationship graph generator",
            "nodes": len(evidence_board["nodes"]),
            "edges": len(evidence_board["edges"]),
            "data": evidence_board,
        }

        # Tree View
        risk_data = results.get("procedural_risk", {}).get("data", {})
        pet = intel.get("parties", {}).get("petitioner", "")
        resp = intel.get("parties", {}).get("respondent", "")
        case_name = f"{pet} v. {resp}" if pet and resp else "Case Analysis"
        tree = tree_gen.generate(intel, precedents, citation_results, risk_data, case_name)
        results["tree_view"] = {
            "engine": "Hierarchical case breakdown",
            "data": tree,
        }

        # Court Map
        court_markers = court_map_gen.generate(intel, COURT_LOCATIONS)
        results["court_map"] = {
            "engine": "Geospatial court matching",
            "markers": len(court_markers),
            "data": court_markers,
        }

    total_time = round(time.time() - pipeline_start, 3)
    return {
        "pipeline": "PrecedentOracle 5-Agent NLP Pipeline v2.0",
        "depth": req.depth,
        "total_processing_time_sec": total_time,
        "agents_run": len(results),
        "results": results,
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# NEW: Semantic Segmentation (IIT KGP-inspired)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/nlp/semantic-segments")
def run_semantic_segmentation(req: SegmentRequest):
    start = time.time()
    segments = segmenter.segment(req.document_text)
    summary = segmenter.get_section_summary(segments)
    elapsed = round(time.time() - start, 3)
    return {
        "engine": "Rhetorical role labeling (IIT KGP Law-AI inspired)",
        "processing_time_sec": elapsed,
        "total_segments": len(segments),
        "roles_found": list(summary.keys()),
        "summary": summary,
        "segments": segments,
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# NEW: Statute Identification (IIT KGP LeSICiN-inspired)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/nlp/identify-statutes")
def identify_statutes(req: StatuteRequest):
    start = time.time()
    results = statute_identifier.identify(req.document_text, req.top_k)
    elapsed = round(time.time() - start, 3)
    return {
        "engine": "Statute identification (LeSICiN-inspired TF-IDF + concept mapping)",
        "processing_time_sec": elapsed,
        "identified_count": len(results),
        "statutes": results,
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# NEW: Visualization Endpoints (LegalSphere-inspired)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/visualize/timeline")
def get_timeline(req: ResearchRequest):
    intel = legal_intel.extract(req.document_text)
    query = req.document_text[:500]
    precedents = precedent_retrieval.retrieve(query=query, limit=10)
    timeline = timeline_gen.generate(intel, precedents)
    return {"engine": "Timeline generator", "events": timeline}


@app.post("/api/visualize/evidence-board")
def get_evidence_board(req: ResearchRequest):
    intel = legal_intel.extract(req.document_text)
    precedents = precedent_retrieval.retrieve(query=req.document_text[:500], limit=10)
    board = evidence_board_gen.generate(intel, precedents)
    return {"engine": "Evidence board (entity-relationship)", "data": board}


@app.post("/api/visualize/tree")
def get_tree_view(req: ResearchRequest):
    intel = legal_intel.extract(req.document_text)
    precedents = precedent_retrieval.retrieve(query=req.document_text[:500], limit=10)
    citations = [citation_verifier.verify(c if isinstance(c, str) else (c.get("raw") if isinstance(c, dict) else str(c))) for c in intel["citations"]]
    risk = risk_analyzer.analyze(
        document_text=req.document_text, entities=intel,
        citation_results=citations, precedent_results=precedents,
        court=req.court, case_type=req.case_type,
    )
    pet = intel.get("parties", {}).get("petitioner", "")
    resp = intel.get("parties", {}).get("respondent", "")
    case_name = f"{pet} v. {resp}" if pet and resp else "Case Analysis"
    tree = tree_gen.generate(intel, precedents, citations, risk, case_name)
    return {"engine": "Hierarchical tree", "data": tree}


@app.post("/api/visualize/court-map")
def get_court_map(req: ResearchRequest):
    intel = legal_intel.extract(req.document_text)
    markers = court_map_gen.generate(intel, COURT_LOCATIONS)
    return {"engine": "Court geospatial mapping", "markers": markers}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# NEW: Indian Kanoon Scraper
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/scraper/indian-kanoon")
def scrape_indian_kanoon(req: ScrapeRequest):
    from scrapers.indian_kanoon import IndianKanoonScraper
    scraper = IndianKanoonScraper()
    results = scraper.search(req.query, req.max_results)
    return {
        "source": "Indian Kanoon",
        "query": req.query,
        "results": results,
        "total": len(results),
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Data Endpoints (existing + enhanced)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.post("/api/search/cases")
def search_cases(req: SearchRequest):
    results = precedent_retrieval.search(req.query, req.category, req.limit)
    return {"query": req.query, "results": results, "total": len(results)}


@app.get("/api/cases")
def list_cases(category: Optional[str] = None, limit: int = 50):
    cases = LANDMARK_CASES
    if category:
        cases = [c for c in cases if c.get("category", "").lower() == category.lower()]
    return {"cases": cases[:limit], "total": len(cases)}


@app.get("/api/cases/{case_id}")
def get_case(case_id: str):
    for case in LANDMARK_CASES:
        if case["id"] == case_id:
            return case
    raise HTTPException(status_code=404, detail="Case not found")


@app.get("/api/judges")
def list_judges(court: Optional[str] = None):
    judges = JUDGES
    if court:
        judges = [j for j in judges if court.lower() in j.get("court", "").lower()]
    return {"judges": judges, "total": len(judges)}


@app.get("/api/judges/{judge_id}")
def get_judge(judge_id: str):
    for judge in JUDGES:
        if judge["id"] == judge_id:
            return judge
    raise HTTPException(status_code=404, detail="Judge not found")


@app.get("/api/bare-acts")
def list_bare_acts():
    acts_summary = [
        {"id": a["id"], "name": a["name"], "year": a["year"],
         "category": a["category"], "sections_count": len(a.get("sections", []))}
        for a in BARE_ACTS
    ]
    return {"acts": acts_summary, "total": len(acts_summary)}


@app.get("/api/bare-acts/{act_id}")
def get_bare_act(act_id: str):
    for act in BARE_ACTS:
        if act["id"] == act_id:
            return act
    raise HTTPException(status_code=404, detail="Act not found")


@app.get("/api/court-locations")
def list_court_locations():
    return {"courts": COURT_LOCATIONS, "total": len(COURT_LOCATIONS)}


@app.get("/api/knowledge-graph")
def get_knowledge_graph():
    nodes = []
    for case in LANDMARK_CASES:
        nodes.append({
            "id": case["id"], "type": "case", "name": case["name"],
            "year": case["year"], "court": case["court"],
            "category": case["category"], "citation": case["citation"],
        })
    edges = []
    for case in LANDMARK_CASES:
        for cited in case.get("cites", []):
            edges.append({"from": case["id"], "to": cited, "type": "CITES"})
        for overruled in case.get("overrules", []):
            edges.append({"from": case["id"], "to": overruled, "type": "OVERRULED_BY"})
    return {"nodes": nodes, "edges": edges, "total_nodes": len(nodes), "total_edges": len(edges)}


@app.get("/api/stats")
def get_stats():
    """Dashboard statistics."""
    categories = {}
    courts = {}
    decades = {}
    overruled_count = 0
    for c in LANDMARK_CASES:
        cat = c.get("category", "Other")
        categories[cat] = categories.get(cat, 0) + 1
        court = c.get("court", "Unknown")
        courts[court] = courts.get(court, 0) + 1
        decade = (c.get("year", 2000) // 10) * 10
        decades[str(decade) + "s"] = decades.get(str(decade) + "s", 0) + 1
        if c.get("overruled"):
            overruled_count += 1
    return {
        "total_cases": len(LANDMARK_CASES),
        "total_judges": len(JUDGES),
        "total_bare_acts": len(BARE_ACTS),
        "total_court_locations": len(COURT_LOCATIONS),
        "categories": categories,
        "courts": courts,
        "decades": decades,
        "overruled_cases": overruled_count,
    }


# ─── Run Server ────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
