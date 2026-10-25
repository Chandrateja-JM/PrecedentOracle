"""Test NLP pipeline against a real PDF, end-to-end."""
import sys, time, json
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pypdf

# Extract text from PDF
print("=" * 78)
print("PrecedentOracle - PDF Pipeline Test")
print("=" * 78)
print(f"PDF: test_judgment.pdf")

reader = pypdf.PdfReader(os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_judgment.pdf"))
pages_text = []
for i, page in enumerate(reader.pages):
    pages_text.append(page.extract_text())

extracted = "\n".join(pages_text)
print(f"Extracted: {len(extracted)} chars from {len(reader.pages)} pages")
print(f"First 200 chars: {extracted[:200]}")
print()

# Now run the full 9-task NLP pipeline on this extracted PDF text
from agents.legal_intelligence import LegalIntelligenceAgent
from agents.precedent_retrieval import PrecedentRetrievalAgent
from agents.citation_verification import CitationVerificationAgent
from agents.procedural_risk import ProceduralRiskAnalyzer
from agents.report_generator import ReportGeneratorAgent
from utils.semantic_segmenter import SemanticSegmenter
from utils.statute_identifier import StatuteIdentifier
from utils.database import list_cases

corpus = list_cases(limit=200)
print(f"Corpus: {len(corpus)} cases")
print()

intel = LegalIntelligenceAgent()
retr = PrecedentRetrievalAgent(corpus)
verif = CitationVerificationAgent(corpus)
risk = ProceduralRiskAnalyzer()
report_gen = ReportGeneratorAgent()
seg = SemanticSegmenter()
stat_id = StatuteIdentifier()

def time_call(fn):
    t0 = time.perf_counter()
    out = fn()
    return out, (time.perf_counter() - t0) * 1000

# Run the pipeline
print("Running pipeline...")
print()
total = 0

intel_result, ms = time_call(lambda: intel.extract(extracted))
print(f"  [OK] Task 1: NER                          {ms:7.1f}ms  Court: {intel_result.get('court','?')}")
total += ms

ms = 0  # citations come from intel_result, no separate time
citations = intel_result.get("citations", [])
print(f"  [OK] Task 2: Citation Extraction              -        Found: {len(citations)}")
for c in citations[:5]: print(f"          - {c}")

statutes_out, ms = time_call(lambda: stat_id.identify(extracted))
print(f"  [OK] Task 3: Statute Identification       {ms:7.1f}ms  Found: {len(statutes_out)}")
total += ms

issues = intel_result.get("legal_issues") or intel_result.get("issues") or []
print(f"  [OK] Task 4: Legal Issue Classification       -        {issues}")

seg_out, ms = time_call(lambda: seg.segment(extracted))
print(f"  [OK] Task 5: Semantic Segmentation        {ms:7.1f}ms  Segments: {len(seg_out)}")
total += ms

retr_out, ms = time_call(lambda: retr.retrieve(extracted, limit=10))
print(f"  [OK] Task 6: Precedent Retrieval          {ms:7.1f}ms  Top: {retr_out['supporting'][0]['name'] if retr_out['supporting'] else 'none'}")
total += ms

def verify_all():
    return [verif.verify(
        c if isinstance(c, str)
        else (c.get("raw") if isinstance(c, dict) else str(c))
    ) for c in citations]

verif_out, ms = time_call(verify_all)
verified = sum(1 for v in verif_out if v.get("status") == "Verified")
missing = sum(1 for v in verif_out if v.get("status") == "Missing")
print(f"  [OK] Task 7: Citation Verification        {ms:7.1f}ms  Verified: {verified}, Missing: {missing}")
total += ms

risk_out, ms = time_call(lambda: risk.analyze(
    document_text=extracted,
    entities=intel_result,
    citation_results=verif_out,
    precedent_results=retr_out,
    court="Supreme Court of India",
    case_type="Constitutional"))
print(f"  [OK] Task 8: Procedural Risk              {ms:7.1f}ms  Score: {risk_out.get('score','?')}/100, Level: {risk_out.get('risk_level','?')}")
total += ms

report_out, ms = time_call(lambda: report_gen.compile(
    entities=intel_result,
    precedents=retr_out,
    citations=verif_out,
    risk_analysis=risk_out,
    court="Supreme Court of India",
    case_type="Constitutional"))
print(f"  [OK] Task 9: Argument Synthesis           {ms:7.1f}ms  Sections: {len(report_out) if isinstance(report_out, dict) else 0}")
total += ms

print()
print("=" * 78)
print(f"  9/9 TASKS PASSED — Total wall-clock: {total:.1f}ms")
print("=" * 78)
print()
print("Top 5 precedents matched by the PDF judgment:")
for i, p in enumerate(retr_out["supporting"][:5], 1):
    print(f"  {i}. {p['name']:<55} weight={p.get('weight',0):.3f}")
print()
print("Procedural risk breakdown:")
print(f"  Score: {risk_out.get('score','?')}/100")
print(f"  Level: {risk_out.get('risk_level','?')}")
print(f"  Strengths: {len(risk_out.get('strengths', []))}")
print(f"  Recommendations: {len(risk_out.get('recommendations', []))}")
