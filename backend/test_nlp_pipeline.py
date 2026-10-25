"""PrecedentOracle - End-to-End NLP Pipeline Test (matches api.py exact flow)"""
import sys, time, json
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SAMPLE_TEXT = """
IN THE SUPREME COURT OF INDIA
Civil Appellate Jurisdiction
Writ Petition (Civil) No. 231 of 1977

Maneka Gandhi ... Petitioner
versus
Union of India ... Respondent

JUDGMENT
P.N. Bhagwati, J.

1. The petitioner is an Indian citizen whose passport has been impounded
by the Government of India under Section 10(3)(c) of the Passport Act, 1967.
The principal question for consideration in this writ petition under
Article 32 of the Constitution is the constitutional validity of the order.

2. The petitioner contends that the order violates her fundamental rights
under Articles 14, 19 and 21 of the Constitution. She relies on
A.K. Gopalan v. State of Madras (1950) SCR 88 and Satwant Singh Sawhney
v. D. Ramarathnam AIR 1967 SC 1836.

3. It is held that the procedure established by law under Article 21 must be
just, fair and reasonable. The principles laid down in Kharak Singh v. State
of UP AIR 1963 SC 1295 are also applicable. The case of Kesavananda Bharati
v. State of Kerala (1973) 4 SCC 225 establishes the basic structure doctrine.

4. We therefore quash the order impounding the passport. Section 302 IPC
and Section 41 CrPC are not relevant here.
"""

def task(num, name, engine, fn):
    t0 = time.perf_counter()
    try:
        out = fn()
        ms = (time.perf_counter() - t0) * 1000
        status = "PASS"
    except Exception as e:
        import traceback
        out = {"error": str(e), "trace": traceback.format_exc()[-400:]}
        ms = (time.perf_counter() - t0) * 1000
        status = "FAIL"
    icon = "OK" if status == "PASS" else "XX"
    print(f"  [{icon}] Task {num}: {name:<32} {ms:7.1f}ms")
    print(f"        Engine: {engine}")
    if status == "FAIL":
        print(f"        Error:  {out['error'][:150]}")
    return {"task": num, "name": name, "engine": engine, "status": status, "ms": round(ms,2), "output": out}

print("=" * 78)
print("PrecedentOracle - End-to-End NLP Pipeline Test")
print("=" * 78)
print(f"Input: {len(SAMPLE_TEXT)} chars - Maneka Gandhi v. Union of India (1978)")
print()

from agents.legal_intelligence import LegalIntelligenceAgent
from agents.precedent_retrieval import PrecedentRetrievalAgent
from agents.citation_verification import CitationVerificationAgent
from agents.procedural_risk import ProceduralRiskAnalyzer
from agents.report_generator import ReportGeneratorAgent
from utils.semantic_segmenter import SemanticSegmenter
from utils.statute_identifier import StatuteIdentifier
from utils.database import list_cases

corpus = list_cases(limit=200)
print(f"Corpus: {len(corpus)} cases loaded from SQLite\n")

intel = LegalIntelligenceAgent()
retr = PrecedentRetrievalAgent(corpus)
verif = CitationVerificationAgent(corpus)
risk = ProceduralRiskAnalyzer()
report_gen = ReportGeneratorAgent()
seg = SemanticSegmenter()
stat_id = StatuteIdentifier()

results = []

# AGENT 1 — runs once, feeds all sub-tasks
print("AGENT 1: Legal Intelligence (Tasks 1-5)")
print("-" * 78)
intel_result = intel.extract(SAMPLE_TEXT)

r = task(1, "Named Entity Recognition", "regex + gazetteer",
         lambda: {"petitioner": intel_result.get("petitioner"),
                  "respondent": intel_result.get("respondent"),
                  "court": intel_result.get("court"),
                  "judges": intel_result.get("judges", [])})
results.append(r)

r = task(2, "Citation Extraction", "6 regex patterns",
         lambda: intel_result.get("citations", []))
results.append(r)

r = task(3, "Statute Identification", "pattern matching",
         lambda: stat_id.identify(SAMPLE_TEXT))
results.append(r)

r = task(4, "Legal Issue Classification", "keyword multi-label",
         lambda: intel_result.get("legal_issues") or intel_result.get("issues") or [])
results.append(r)

r = task(5, "Semantic Segmentation", "rhetorical role labeling",
         lambda: seg.segment(SAMPLE_TEXT))
results.append(r)
print()

print("AGENT 2: Precedent Retrieval (Task 6)")
print("-" * 78)
r = task(6, "Precedent Retrieval", "BM25 + TF-IDF + RRF",
         lambda: retr.retrieve(SAMPLE_TEXT, limit=10))
results.append(r)
retr_out = r["output"] if r["status"] == "PASS" else {"supporting": [], "opposing": []}
print()

print("AGENT 3: Citation Verification (Task 7)")
print("-" * 78)
citations = intel_result.get("citations", [])
def verify_all():
    return [verif.verify(
        c if isinstance(c, str)
        else (c.get("raw") if isinstance(c, dict) else str(c))
    ) for c in citations]
r = task(7, "Citation Verification", "fuzzy match",
         lambda: verify_all())
results.append(r)
verif_out = r["output"] if r["status"] == "PASS" else []
print()

# CRITICAL: pass keyword arguments to match api.py
print("AGENT 4: Procedural Risk (Task 8)")
print("-" * 78)
r = task(8, "Procedural Risk Assessment", "rule-based",
         lambda: risk.analyze(
             document_text=SAMPLE_TEXT,
             entities=intel_result,
             citation_results=verif_out if isinstance(verif_out, list) else [],
             precedent_results=retr_out,
             court="Supreme Court of India",
             case_type="Constitutional"))
results.append(r)
risk_out = r["output"] if r["status"] == "PASS" else {}
print()

print("AGENT 5: Argument Synthesis (Task 9)")
print("-" * 78)
r = task(9, "Argument Synthesis", "weighted aggregation",
         lambda: report_gen.compile(
             entities=intel_result,
             precedents=retr_out,
             citations=verif_out if isinstance(verif_out, list) else [],
             risk_analysis=risk_out,
             court="Supreme Court of India",
             case_type="Constitutional"))
results.append(r)
print()

print("=" * 78)
ok = sum(1 for r in results if r["status"] == "PASS")
total_ms = sum(r["ms"] for r in results)
print(f"RESULT: {ok}/9 tasks PASSED  |  Total time: {total_ms:.1f}ms")
print("=" * 78)

# Save outputs
print("\nDETAILED OUTPUTS:\n")

print("Task 1 - NER extracted:")
ner_out = results[0]["output"] if results[0]["status"] == "PASS" else {}
for k, v in (ner_out.items() if isinstance(ner_out, dict) else []):
    if v: print(f"  {k}: {v}")

cites = results[1]['output'] if isinstance(results[1]['output'], list) else []
print(f"\nTask 2 - Citations ({len(cites)} found):")
for c in cites[:5]: print(f"  - {c}")

statutes = results[2]['output'] if isinstance(results[2]['output'], list) else []
print(f"\nTask 3 - Statutes ({len(statutes)} found):")
for s in statutes[:5]:
    if isinstance(s, dict):
        print(f"  - {s.get('reference', s.get('act', s.get('statute_ref', '?')))} ({s.get('category', '?')})")
    else:
        print(f"  - {s}")

print(f"\nTask 4 - Legal issues: {results[3]['output']}")

print(f"\nTask 5 - Semantic segmentation:")
seg_out = results[4]['output']
if isinstance(seg_out, list):
    from collections import Counter
    labels = Counter(s.get('role', s.get('label', '?')) for s in seg_out)
    print(f"  Total segments: {len(seg_out)}")
    for lbl, n in labels.most_common():
        print(f"    {lbl}: {n}")

supp = retr_out.get("supporting", []) if isinstance(retr_out, dict) else []
print(f"\nTask 6 - Top 5 supporting precedents:")
for i, p in enumerate(supp[:5], 1):
    name = (p.get("name") or "?")[:50]
    score = p.get("weight") or p.get("score") or 0
    bm25 = p.get("bm25_score", 0)
    tfidf = p.get("tfidf_score", 0)
    print(f"  {i}. {name:<50} weight={score:.3f} (BM25={bm25:.2f}, TF-IDF={tfidf:.3f})")

print(f"\nTask 7 - Citation verification:")
for v in (verif_out[:5] if isinstance(verif_out, list) else []):
    text = (v.get("citation") or v.get("citation_text") or v.get("text") or "?")[:42]
    status = v.get("status", "?")
    print(f"  {text:<42} -> {status}")

print(f"\nTask 8 - Procedural risk:")
if isinstance(risk_out, dict):
    print(f"  Readiness score: {risk_out.get('score', '?')}/100")
    print(f"  Risk level:      {risk_out.get('risk_level', '?')}")
    print(f"  Strengths:       {len(risk_out.get('strengths', []))}")
    print(f"  Moderate risks:  {len(risk_out.get('moderate_risks', []))}")
    print(f"  Critical risks:  {len(risk_out.get('critical_risks', []))}")
    print(f"  Recommendations: {len(risk_out.get('recommendations', []))}")

print(f"\nTask 9 - Report:")
rep = results[8]['output']
if isinstance(rep, dict):
    print(f"  Sections: {list(rep.keys())[:6]}")

with open('nlp_test_full.json', 'w') as f:
    json.dump(results, f, indent=2, default=str)
print(f"\nFull JSON: nlp_test_full.json")
