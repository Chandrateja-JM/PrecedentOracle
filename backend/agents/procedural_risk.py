"""
Agent 4: Procedural Risk Analyzer
──────────────────────────────────
Rule-based procedural risk analysis.
Checks: missing evidence, weak citations, contradictions, research gaps.
Returns court readiness score (0-100).

Engine: Rule-based checklist + NLP pattern matching (NO LLM)
"""

import re
from typing import Dict, List, Any


class ProceduralRiskAnalyzer:

    REQUIRED_DOCUMENTS = {
        "Civil": [
            "Plaint / Written Statement",
            "Vakalatnama",
            "Court fee stamps",
            "Affidavit of verification",
            "List of documents",
            "Certified copies of relevant documents",
        ],
        "Criminal": [
            "FIR copy",
            "Charge sheet",
            "Bail application (if applicable)",
            "Witness statements",
            "Medical reports (if applicable)",
            "Forensic evidence (if applicable)",
        ],
        "Constitutional": [
            "Writ Petition",
            "Affidavit in support",
            "Memo of parties",
            "List of dates and events",
            "Certified copies of impugned order",
            "Compilation of relevant judgments",
        ],
        "Property": [
            "Sale deed / Lease deed",
            "Title documents",
            "Survey records",
            "Encumbrance certificate",
            "Tax receipts",
            "Possession proof",
        ],
        "Family": [
            "Marriage certificate",
            "Maintenance records",
            "Income proof",
            "Child custody application",
            "Domestic violence complaint (if applicable)",
        ],
        "Commercial": [
            "Contract / Agreement",
            "Board resolution",
            "Financial statements",
            "Arbitration clause reference",
            "Notice under Section 8 (if IBC)",
        ],
    }

    CONTRADICTION_PATTERNS = [
        (r'on one hand.*on the other', "Contradictory argument structure detected"),
        (r'however.*contrary', "Contradictory statements found"),
        (r'plaintiff.*admits.*defendant.*denies', "Conflicting admissions"),
        (r'(\d{1,2}[/\-]\d{1,2}[/\-]\d{4}).*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})', "Multiple dates — verify timeline consistency"),
    ]

    def analyze(self, document_text: str, entities: Dict, citation_results: List[Dict],
                precedent_results: Dict, court: str = None, case_type: str = None) -> Dict[str, Any]:
        """
        Main risk analysis function.
        Returns court readiness score and detailed risk breakdown.
        """
        strengths = []
        moderate_risks = []
        critical_risks = []
        missing_documents = []
        contradictions = []
        recommendations = []

        score = 100  # Start at 100, deduct for issues

        # ─── Check 1: Citation Quality ─────────────────────
        verified_count = sum(1 for c in citation_results if c.get("status") == "Verified")
        weak_count = sum(1 for c in citation_results if c.get("status") == "Weak")
        missing_count = sum(1 for c in citation_results if c.get("status") == "Missing")
        overruled_count = sum(1 for c in citation_results if c.get("status") == "Overruled")

        if verified_count > 0:
            strengths.append({
                "area": "Citation grounding",
                "detail": f"{verified_count} citations verified against Indian Kanoon",
                "impact": "positive"
            })

        if weak_count > 0:
            moderate_risks.append({
                "area": "Weak citations",
                "detail": f"{weak_count} citations could not be fully verified",
                "impact": "moderate",
                "severity": "medium"
            })
            score -= weak_count * 5
            recommendations.append(f"Verify {weak_count} weak citation(s) on Indian Kanoon before filing")

        if missing_count > 0:
            critical_risks.append({
                "area": "Missing citations",
                "detail": f"{missing_count} citation(s) not found in any indexed source",
                "impact": "high",
                "severity": "critical"
            })
            score -= missing_count * 10
            recommendations.append(f"Remove or replace {missing_count} unverifiable citation(s)")

        if overruled_count > 0:
            critical_risks.append({
                "area": "Overruled authority",
                "detail": f"{overruled_count} cited case(s) have been overruled",
                "impact": "high",
                "severity": "critical"
            })
            score -= overruled_count * 15
            for c in citation_results:
                if c.get("status") == "Overruled":
                    recommendations.append(
                        f"Replace {c.get('citation', 'overruled case')} with {c.get('overruled_by', 'newer authority')}"
                    )

        # ─── Check 2: Precedent Coverage ───────────────────
        supporting = precedent_results.get("supporting", [])
        opposing = precedent_results.get("opposing", [])

        if len(supporting) >= 3:
            strengths.append({
                "area": "Precedent support",
                "detail": f"{len(supporting)} supporting precedents identified",
                "impact": "positive"
            })
        elif len(supporting) == 0:
            critical_risks.append({
                "area": "No supporting precedents",
                "detail": "No supporting case law found for the legal position",
                "impact": "high",
                "severity": "critical"
            })
            score -= 20
            recommendations.append("Research additional supporting precedents before proceeding")

        if len(opposing) > 0:
            moderate_risks.append({
                "area": "Opposing precedents exist",
                "detail": f"{len(opposing)} opposing precedent(s) found — prepare distinguishing arguments",
                "impact": "moderate",
                "severity": "medium"
            })
            score -= len(opposing) * 3
            recommendations.append("Prepare distinguishing arguments for opposing precedents")

        # ─── Check 3: Entity Completeness ──────────────────
        if entities.get("parties", {}).get("petitioner"):
            strengths.append({
                "area": "Party identification",
                "detail": "Petitioner and respondent clearly identified",
                "impact": "positive"
            })
        else:
            moderate_risks.append({
                "area": "Party identification",
                "detail": "Unable to clearly identify parties from the document",
                "impact": "moderate",
                "severity": "medium"
            })
            score -= 5

        if not entities.get("statutes"):
            critical_risks.append({
                "area": "No statutes identified",
                "detail": "No statutory provisions referenced in the document",
                "impact": "high",
                "severity": "critical"
            })
            score -= 15
            recommendations.append("Add specific statutory provisions to strengthen legal basis")
        else:
            strengths.append({
                "area": "Statutory basis",
                "detail": f"{len(entities['statutes'])} statutory provisions identified",
                "impact": "positive"
            })

        # ─── Check 4: Missing Documents ────────────────────
        doc_type = case_type or "Civil"
        required = self.REQUIRED_DOCUMENTS.get(doc_type, self.REQUIRED_DOCUMENTS["Civil"])
        text_lower = document_text.lower()

        for doc in required:
            doc_keywords = doc.lower().split()
            found = any(kw in text_lower for kw in doc_keywords if len(kw) > 3)
            if not found:
                missing_documents.append(doc)

        if missing_documents:
            moderate_risks.append({
                "area": "Document completeness",
                "detail": f"{len(missing_documents)} required document(s) not referenced",
                "impact": "moderate",
                "severity": "medium"
            })
            score -= min(len(missing_documents) * 3, 15)
            recommendations.append(f"Ensure the following documents are prepared: {', '.join(missing_documents[:3])}")

        # ─── Check 5: Contradictions ───────────────────────
        for pattern, desc in self.CONTRADICTION_PATTERNS:
            if re.search(pattern, document_text, re.IGNORECASE | re.DOTALL):
                contradictions.append(desc)

        if contradictions:
            critical_risks.append({
                "area": "Internal contradictions",
                "detail": f"{len(contradictions)} potential contradiction(s) detected",
                "impact": "high",
                "severity": "critical"
            })
            score -= len(contradictions) * 8
            recommendations.append("Review and resolve internal contradictions before filing")

        # ─── Check 6: Document Length ──────────────────────
        word_count = len(document_text.split())
        if word_count < 100:
            moderate_risks.append({
                "area": "Insufficient detail",
                "detail": f"Document contains only {word_count} words — may lack sufficient detail",
                "impact": "moderate",
                "severity": "medium"
            })
            score -= 10
            recommendations.append("Expand the document with more factual details and legal arguments")

        # ─── Check 7: Research Gaps ────────────────────────
        legal_issues = entities.get("legal_issues", [])
        if not legal_issues:
            moderate_risks.append({
                "area": "Research gap",
                "detail": "Unable to classify legal issues — document may be too generic",
                "impact": "moderate",
                "severity": "medium"
            })
            score -= 5
            recommendations.append("Clearly state the legal issues and questions of law")

        # ─── Final Score ───────────────────────────────────
        score = max(score, 0)
        score = min(score, 100)

        if score >= 80:
            risk_level = "Low"
        elif score >= 60:
            risk_level = "Moderate"
        elif score >= 40:
            risk_level = "High"
        else:
            risk_level = "Critical"

        if not recommendations:
            recommendations.append("Document appears well-prepared for court filing")

        return {
            "score": score,
            "risk_level": risk_level,
            "strengths": strengths,
            "moderate_risks": moderate_risks,
            "critical_risks": critical_risks,
            "missing_documents": missing_documents,
            "contradictions": contradictions,
            "recommendations": recommendations
        }
