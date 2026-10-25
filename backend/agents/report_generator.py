"""
Agent 5: Report Generator Agent
────────────────────────────────
Compiles outputs from Agents 1-4 into a structured legal research report.
Generates professional report sections.

Engine: Structured compilation (NO LLM for core — LLM optional for summary polish)
"""

from typing import Dict, List, Any
from datetime import datetime


class ReportGeneratorAgent:

    def compile(self, entities: Dict, precedents: Dict, citations: List[Dict],
                risk_analysis: Dict, court: str = None, case_type: str = None) -> Dict[str, Any]:
        """
        Compile all agent outputs into a structured research report.
        """
        now = datetime.now().strftime("%d %B %Y")
        parties = entities.get("parties", {})
        case_name = "Unknown"
        if parties.get("petitioner") and parties.get("respondent"):
            case_name = f"{parties['petitioner']} v. {parties['respondent']}"

        report = {
            "title": f"Legal Research Report — {case_name}",
            "generated_date": now,
            "platform": "PrecedentOracle",
            "sections": {}
        }

        # Section 1: Executive Summary
        verified = sum(1 for c in citations if c.get("status") == "Verified")
        total_cites = len(citations)
        score = risk_analysis.get("score", 0) if risk_analysis else 0
        supporting_count = len(precedents.get("supporting", []))
        opposing_count = len(precedents.get("opposing", []))

        report["sections"]["1_executive_summary"] = {
            "title": "Executive Summary",
            "content": (
                f"This report analyzes the matter of {case_name} before the {court or 'Court'}. "
                f"The NLP pipeline identified {len(entities.get('statutes', []))} statutory provisions "
                f"and {len(entities.get('legal_issues', []))} legal issues. "
                f"Hybrid retrieval found {supporting_count} supporting and {opposing_count} opposing precedents. "
                f"{verified} of {total_cites} citations were verified against Indian Kanoon. "
                f"The Court Readiness Score is {score}/100 ({risk_analysis.get('risk_level', 'N/A')} risk)."
            )
        }

        # Section 2: Case Profile
        report["sections"]["2_case_profile"] = {
            "title": "Case Profile",
            "court": court or entities.get("court", "Unknown"),
            "case_type": case_type or "Unknown",
            "petitioner": parties.get("petitioner", "Unknown"),
            "respondent": parties.get("respondent", "Unknown"),
            "judges": entities.get("judges", []),
            "dates": entities.get("dates", []),
            "extraction_confidence": entities.get("confidence", 0)
        }

        # Section 3: Legal Issues
        report["sections"]["3_legal_issues"] = {
            "title": "Legal Issues Identified",
            "issues": entities.get("legal_issues", []),
            "engine": "NLP keyword classification"
        }

        # Section 4: Applicable Law
        report["sections"]["4_applicable_law"] = {
            "title": "Applicable Law",
            "statutes": entities.get("statutes", []),
            "engine": "Regex + NLP statute extraction"
        }

        # Section 5: Supporting Precedents
        supporting = precedents.get("supporting", [])
        report["sections"]["5_supporting_precedents"] = {
            "title": "Supporting Precedents",
            "count": len(supporting),
            "precedents": [
                {
                    "name": p["name"],
                    "citation": p["citation"],
                    "court": p["court"],
                    "year": p["year"],
                    "holding": p.get("holding", ""),
                    "relevance": p.get("relevance", ""),
                    "bm25_score": p.get("bm25_score", 0),
                    "rrf_rank": p.get("rrf_rank", 0),
                }
                for p in supporting[:10]
            ],
            "engine": "Hybrid BM25 + TF-IDF + RRF"
        }

        # Section 6: Opposing Precedents
        opposing = precedents.get("opposing", [])
        report["sections"]["6_opposing_precedents"] = {
            "title": "Opposing Precedents",
            "count": len(opposing),
            "precedents": [
                {
                    "name": p["name"],
                    "citation": p["citation"],
                    "court": p["court"],
                    "year": p["year"],
                    "holding": p.get("holding", ""),
                    "distinguish_note": p.get("distinguish_note", ""),
                }
                for p in opposing
            ]
        }

        # Section 7: Citation Verification
        report["sections"]["7_citation_verification"] = {
            "title": "Citation Verification Report",
            "total": total_cites,
            "verified": verified,
            "weak": sum(1 for c in citations if c.get("status") == "Weak"),
            "missing": sum(1 for c in citations if c.get("status") == "Missing"),
            "overruled": sum(1 for c in citations if c.get("status") == "Overruled"),
            "overall_score": round(verified / max(total_cites, 1) * 100, 1),
            "citations": citations,
            "engine": "Fuzzy matching + corpus lookup"
        }

        # Section 8: Procedural Risk Analysis
        report["sections"]["8_procedural_risk"] = {
            "title": "Procedural Risk Analysis",
            "court_readiness_score": score,
            "risk_level": risk_analysis.get("risk_level", "Unknown"),
            "strengths": risk_analysis.get("strengths", []),
            "moderate_risks": risk_analysis.get("moderate_risks", []),
            "critical_risks": risk_analysis.get("critical_risks", []),
            "engine": "Rule-based checklist + NLP"
        }

        # Section 9: Court Readiness Score
        report["sections"]["9_court_readiness"] = {
            "title": "Court Readiness Score",
            "score": score,
            "risk_level": risk_analysis.get("risk_level", "Unknown"),
            "missing_documents": risk_analysis.get("missing_documents", []),
            "contradictions": risk_analysis.get("contradictions", []),
        }

        # Section 10: Recommended Actions
        report["sections"]["10_recommendations"] = {
            "title": "Recommended Actions",
            "actions": risk_analysis.get("recommendations", [])
        }

        # Section 11: Bibliography
        bibliography = []
        for p in supporting + opposing:
            bibliography.append(
                f"{p['name']}, {p['citation']}, {p['court']}, {p['year']}"
            )
        for s in entities.get("statutes", []):
            bibliography.append(f"{s['act']}, Section {s['section']}")

        report["sections"]["11_bibliography"] = {
            "title": "Bibliography",
            "entries": sorted(set(bibliography))
        }

        return report
