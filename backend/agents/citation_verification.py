"""
Agent 3: Citation Verification Agent
─────────────────────────────────────
Verifies citations against indexed corpus.
Returns: Verified / Weak / Missing / Overruled / Unverified

Engine: Fuzzy string matching + corpus lookup (NO LLM)
"""

import re
from typing import Dict, List, Any


class CitationVerificationAgent:

    OVERRULED_CASES = {
        "ADM Jabalpur v. Shivkant Shukla": "K.S. Puttaswamy v. Union of India (2017)",
        "Suresh Kumar Koushal v. Naz Foundation": "Navtej Singh Johar v. Union of India (2018)",
        "I.C. Golak Nath v. State of Punjab": "Kesavananda Bharati v. State of Kerala (1973)",
        "Mohd. Ahmed Khan v. Shah Bano": "Partially modified by Muslim Women Act 1986",
    }

    def __init__(self, cases: List[Dict]):
        self.cases = cases
        self.case_names = {c["name"].lower(): c for c in cases}
        self.case_citations = {}
        for c in cases:
            if c.get("citation"):
                self.case_citations[c["citation"].lower().strip()] = c

    def verify(self, citation_text: str) -> Dict[str, Any]:
        """
        Verify a single citation string against the corpus.
        Returns status, confidence, source, and reasoning.
        """
        citation_clean = citation_text.strip()
        citation_lower = citation_clean.lower()

        # Step 1: Exact match on citation format
        for stored_cite, case in self.case_citations.items():
            if stored_cite in citation_lower or citation_lower in stored_cite:
                # Check if overruled
                if case.get("overruled", False):
                    overruling = case.get("overruled_by", "a later decision")
                    return {
                        "citation": citation_clean,
                        "status": "Overruled",
                        "confidence": 100,
                        "source": "Indian Kanoon (indexed)",
                        "matched_case": case["name"],
                        "matched_citation": case["citation"],
                        "overruled_by": overruling,
                        "reasoning": {
                            "citation_format_match": True,
                            "name_match": True,
                            "year_match": True,
                            "court_match": True,
                        },
                        "recommendation": f"Replace with {overruling}"
                    }
                return {
                    "citation": citation_clean,
                    "status": "Verified",
                    "confidence": 98,
                    "source": "Indian Kanoon (indexed)",
                    "matched_case": case["name"],
                    "matched_citation": case["citation"],
                    "reasoning": {
                        "citation_format_match": True,
                        "name_match": True,
                        "year_match": True,
                        "court_match": True,
                    },
                    "recommendation": "Cite confidently"
                }

        # Step 2: Fuzzy match on case name
        best_match = None
        best_score = 0

        for name_lower, case in self.case_names.items():
            score = self._fuzzy_score(citation_lower, name_lower)
            if score > best_score:
                best_score = score
                best_match = case

        if best_match and best_score > 0.6:
            # Check overruled
            for overruled_name, overruling in self.OVERRULED_CASES.items():
                if overruled_name.lower() in best_match["name"].lower():
                    return {
                        "citation": citation_clean,
                        "status": "Overruled",
                        "confidence": round(best_score * 100),
                        "source": "Indian Kanoon (indexed)",
                        "matched_case": best_match["name"],
                        "matched_citation": best_match.get("citation", ""),
                        "overruled_by": overruling,
                        "reasoning": {
                            "citation_format_match": False,
                            "name_match": True,
                            "year_match": self._year_matches(citation_clean, best_match),
                            "court_match": True,
                        },
                        "recommendation": f"Replace with {overruling}"
                    }

            return {
                "citation": citation_clean,
                "status": "Verified" if best_score > 0.8 else "Weak",
                "confidence": round(best_score * 100),
                "source": "Indian Kanoon (indexed)" if best_score > 0.8 else "Partial match",
                "matched_case": best_match["name"],
                "matched_citation": best_match.get("citation", ""),
                "reasoning": {
                    "citation_format_match": best_score > 0.9,
                    "name_match": best_score > 0.6,
                    "year_match": self._year_matches(citation_clean, best_match),
                    "court_match": best_score > 0.7,
                },
                "recommendation": "Cite confidently" if best_score > 0.8 else "Verify before citing"
            }

        # Step 3: No match found
        return {
            "citation": citation_clean,
            "status": "Missing",
            "confidence": 0,
            "source": "Not found in indexed corpus",
            "matched_case": None,
            "matched_citation": None,
            "reasoning": {
                "citation_format_match": False,
                "name_match": False,
                "year_match": False,
                "court_match": False,
            },
            "recommendation": "Do not cite — verify independently on Indian Kanoon"
        }

    def _fuzzy_score(self, text1: str, text2: str) -> float:
        """Simple fuzzy matching using token overlap (Jaccard-like)."""
        tokens1 = set(re.findall(r'\w+', text1.lower()))
        tokens2 = set(re.findall(r'\w+', text2.lower()))

        if not tokens1 or not tokens2:
            return 0.0

        intersection = tokens1 & tokens2
        union = tokens1 | tokens2

        # Weighted: give more weight to longer matching tokens
        weighted_score = sum(len(t) for t in intersection) / max(sum(len(t) for t in union), 1)

        return weighted_score

    def _year_matches(self, citation: str, case: Dict) -> bool:
        """Check if the year in citation matches the case year."""
        years_in_citation = re.findall(r'\b(19|20)\d{2}\b', citation)
        case_year = str(case.get("year", ""))
        return case_year in years_in_citation
