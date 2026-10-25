"""
Agent 1: Legal Intelligence Agent
─────────────────────────────────
NLP-based extraction from legal documents.
- Named Entity Recognition (parties, judges, courts, statutes, sections, dates)
- Citation extraction (regex patterns for Indian legal citations)
- Legal issue classification
- Holding extraction

Engine: spaCy + regex (NO LLM)
"""

import re
from typing import Dict, List, Any
from collections import defaultdict


class LegalIntelligenceAgent:

    def __init__(self):
        # Indian legal citation patterns
        self.citation_patterns = [
            # (2017) 10 SCC 1 — SCC format
            r'\((\d{4})\)\s*(\d{1,2})\s*SCC\s*(\d+)',
            # AIR 1978 SC 597 — AIR format
            r'AIR\s*(\d{4})\s*(SC|Del|Bom|Mad|Cal|Kar|All|Ker|Pat|Guj|AP|Raj|MP|P&H|Ori|J&K|HP|Gau)\s*(\d+)',
            # (2019) SCC OnLine SC 1234
            r'\((\d{4})\)\s*SCC\s*OnLine\s*(SC|[A-Z][a-z]+)\s*(\d+)',
            # 2018 KarLJ 45
            r'(\d{4})\s*(KarLJ|BomLR|MadLJ|CalLJ|AllLJ|MPLJ|RajLJ|CriLJ|LabIC)\s*(\d+)',
            # WP(C) No. 494/2012 — Writ Petition format
            r'(WP|SLP|CA|CrlA|RA|MA)\s*\(?([A-Za-z]*)\)?\s*No\.?\s*(\d+)[/\s]*(?:of\s*)?(\d{4})',
            # Case name pattern: X v. Y OR X vs Y OR X versus Y
            r'([A-Z][a-zA-Z\s\.]+)\s+(?:v\.|vs\.?|versus)\s+([A-Z][a-zA-Z\s\.]+?)(?:\s*\((\d{4})\))?',
        ]

        # Indian statutes and their sections
        self.statute_patterns = [
            # Section 302 of IPC / Section 302 IPC / S. 302 IPC
            r'(?:Section|Sec\.|S\.)\s*(\d+[A-Za-z]?)\s*(?:of\s+)?(?:the\s+)?(Indian Penal Code|IPC|BNS|Bharatiya Nyaya Sanhita|CrPC|BNSS|Code of Criminal Procedure|CPC|Code of Civil Procedure|Indian Evidence Act|IEA|BSA|Bharatiya Sakshya Adhiniyam|Constitution|Companies Act|Arbitration Act|IT Act|Information Technology Act|Contract Act|Transfer of Property Act|TPA|Specific Relief Act|Limitation Act|Hindu Marriage Act|HMA|Hindu Succession Act|Special Marriage Act|DPPA|Digital Personal Data Protection Act)',
            # Article 14/15/19/21 of the Constitution
            r'(?:Article|Art\.)\s*(\d+[A-Za-z]?)\s*(?:of\s+)?(?:the\s+)?(?:Constitution|Constitution of India)',
            # Order V Rule 1 CPC
            r'Order\s+([IVXLCDM]+|[0-9]+)\s*(?:Rule\s*(\d+))?\s*(?:of\s+)?(?:the\s+)?(CPC|CrPC|BNSS)',
        ]

        # Court patterns
        self.court_patterns = [
            r'Supreme Court of India',
            r'High Court of ([A-Za-z\s]+)',
            r'(Karnataka|Delhi|Bombay|Madras|Calcutta|Allahabad|Kerala|Gujarat|Andhra Pradesh|Rajasthan|Madhya Pradesh|Patna|Punjab & Haryana|Orissa|Jammu & Kashmir|Himachal Pradesh|Gauhati|Jharkhand|Uttarakhand|Chhattisgarh|Tripura|Meghalaya|Manipur|Sikkim|Telangana)\s*High\s*Court',
            r'(District Court|Sessions Court|Metropolitan Magistrate|NCLT|NCLAT|NCDRC|NGT|CAT|ITAT|SAT|TDSAT)',
        ]

        # Judge name patterns
        self.judge_patterns = [
            r'(?:Hon\'?ble\s+)?(?:Mr\.?|Mrs\.?|Ms\.?)?\s*(?:Justice|J\.)\s+([A-Z][a-zA-Z\.\s]+?)(?:\s*,|\s+and\s+|\s*$)',
            r'(?:Chief Justice|CJ|CJI)\s+([A-Z][a-zA-Z\.\s]+?)(?:\s*,|\s+and\s+|\s*$)',
        ]

        # Legal issue keywords for classification
        self.issue_keywords = {
            "Constitutional": ["fundamental rights", "article 14", "article 19", "article 21",
                             "article 32", "writ", "constitutional validity", "basic structure",
                             "directive principles", "amendment", "article 226"],
            "Criminal": ["murder", "theft", "robbery", "cheating", "forgery", "assault",
                        "kidnapping", "section 302", "section 304", "section 376", "FIR",
                        "bail", "anticipatory bail", "charge sheet", "cognizable"],
            "Civil": ["suit", "decree", "injunction", "specific performance", "damages",
                     "breach of contract", "partition", "declaration", "possession"],
            "Property": ["eviction", "tenancy", "rent", "landlord", "tenant", "lease",
                        "transfer of property", "mortgage", "easement", "title"],
            "Family": ["divorce", "maintenance", "custody", "adoption", "marriage",
                      "alimony", "domestic violence", "restitution of conjugal rights"],
            "Commercial": ["arbitration", "insolvency", "bankruptcy", "company law",
                          "winding up", "NCLT", "IBC", "corporate debtor"],
            "Labour": ["industrial dispute", "workman", "retrenchment", "unfair labour",
                      "trade union", "wages", "gratuity", "provident fund"],
            "Environmental": ["pollution", "environment", "NGT", "forest", "wildlife",
                            "sustainable development", "precautionary principle"],
            "Intellectual Property": ["patent", "trademark", "copyright", "infringement",
                                    "passing off", "design", "trade secret"],
            "Taxation": ["income tax", "GST", "customs", "excise", "tax evasion",
                        "assessment", "ITAT", "tax tribunal"],
        }

    def extract(self, text: str) -> Dict[str, Any]:
        """
        Main extraction pipeline. Runs all NLP extractors on the input text.
        Returns structured entities, citations, statutes, issues, and parties.
        """
        results = {
            "entities": [],
            "citations": [],
            "statutes": [],
            "legal_issues": [],
            "parties": {"petitioner": None, "respondent": None},
            "court": None,
            "judges": [],
            "dates": [],
            "confidence": 0.0
        }

        # 1. Extract citations
        results["citations"] = self._extract_citations(text)

        # 2. Extract statutes and sections
        results["statutes"] = self._extract_statutes(text)

        # 3. Extract parties
        results["parties"] = self._extract_parties(text)

        # 4. Extract court
        results["court"] = self._extract_court(text)

        # 5. Extract judges
        results["judges"] = self._extract_judges(text)

        # 6. Extract dates
        results["dates"] = self._extract_dates(text)

        # 7. Classify legal issues
        results["legal_issues"] = self._classify_issues(text)

        # 8. Build entity list
        results["entities"] = self._build_entity_list(results)

        # 9. Calculate confidence
        results["confidence"] = self._calculate_confidence(results)

        return results

    def _extract_citations(self, text: str) -> List[str]:
        """Extract Indian legal citations using regex patterns."""
        citations = []
        seen = set()

        # Boilerplate indicators that suggest a false-positive party-name match
        boilerplate_markers = [
            "...", "petitioner", "respondent", "appellant", "applicant",
            "\n", "judgment", "versus only", "the relies"
        ]

        for pattern in self.citation_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                cite_text = match.group(0).strip()
                # Normalize whitespace
                cite_text = " ".join(cite_text.split())

                # Skip duplicates and trivially short matches
                if cite_text in seen or len(cite_text) < 6:
                    continue

                # Skip multi-line matches and boilerplate
                lower = cite_text.lower()
                if any(b in lower for b in boilerplate_markers):
                    continue

                # Skip if too long (probably swallowed multiple sentences)
                if len(cite_text) > 120:
                    continue

                citations.append(cite_text)
                seen.add(cite_text)

        return citations

    def _extract_statutes(self, text: str) -> List[Dict[str, str]]:
        """Extract statutes and section references."""
        statutes = []
        seen = set()

        for pattern in self.statute_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                groups = match.groups()
                if len(groups) >= 2:
                    section = groups[0]
                    act = groups[1] if groups[1] else "Unknown"
                    key = f"{act}_{section}"
                    if key not in seen:
                        statutes.append({
                            "section": section,
                            "act": self._normalize_act_name(act),
                            "raw": match.group(0).strip()
                        })
                        seen.add(key)

        return statutes

    def _normalize_act_name(self, act: str) -> str:
        """Normalize statute abbreviations to full names."""
        mapping = {
            "IPC": "Indian Penal Code, 1860",
            "BNS": "Bharatiya Nyaya Sanhita, 2023",
            "CrPC": "Code of Criminal Procedure, 1973",
            "BNSS": "Bharatiya Nagarik Suraksha Sanhita, 2023",
            "CPC": "Code of Civil Procedure, 1908",
            "IEA": "Indian Evidence Act, 1872",
            "BSA": "Bharatiya Sakshya Adhiniyam, 2023",
            "IT Act": "Information Technology Act, 2000",
            "TPA": "Transfer of Property Act, 1882",
            "HMA": "Hindu Marriage Act, 1955",
            "DPPA": "Digital Personal Data Protection Act, 2023",
        }
        return mapping.get(act.strip(), act.strip())

    def _extract_parties(self, text: str) -> Dict[str, str]:
        """Extract petitioner and respondent from case text."""
        parties = {"petitioner": None, "respondent": None}

        # Pattern: X ... Appellant/Petitioner versus Y ... Respondent
        pet_match = re.search(
            r'([A-Z][A-Za-z\s\.]+?)\s*(?:\.{3,}|…)?\s*(?:Appellant|Petitioner|Complainant)',
            text
        )
        res_match = re.search(
            r'(?:versus|vs?\.?\s).*?([A-Z][A-Za-z\s\.]+?)\s*(?:\.{3,}|…)?\s*(?:Respondent|Defendant|Accused)',
            text
        )

        if pet_match:
            parties["petitioner"] = pet_match.group(1).strip()
        if res_match:
            parties["respondent"] = res_match.group(1).strip()

        # Fallback: X v. Y pattern
        if not parties["petitioner"]:
            vs_match = re.search(
                r'([A-Z][a-zA-Z\s\.]+?)\s+(?:v\.|vs\.?|versus)\s+([A-Z][a-zA-Z\s\.]+)',
                text
            )
            if vs_match:
                parties["petitioner"] = vs_match.group(1).strip()
                parties["respondent"] = vs_match.group(2).strip()

        return parties

    def _extract_court(self, text: str) -> str:
        """Identify which court the document is from."""
        for pattern in self.court_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0).strip()
        return "Unknown Court"

    def _extract_judges(self, text: str) -> List[str]:
        """Extract judge names from the document."""
        judges = []
        seen = set()

        for pattern in self.judge_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                name = match.group(1).strip().rstrip(',')
                if name not in seen and len(name) > 3:
                    judges.append(name)
                    seen.add(name)

        return judges

    def _extract_dates(self, text: str) -> List[str]:
        """Extract dates from legal documents."""
        date_patterns = [
            r'\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}',
            r'\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s*,?\s*\d{4}',
            r'(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\s*,?\s*\d{4}',
        ]
        dates = []
        seen = set()
        for pattern in date_patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                d = match.group(0).strip()
                if d not in seen:
                    dates.append(d)
                    seen.add(d)
        return dates

    def _classify_issues(self, text: str) -> List[str]:
        """Classify legal issues based on keyword matching."""
        text_lower = text.lower()
        issue_scores = defaultdict(int)

        for category, keywords in self.issue_keywords.items():
            for keyword in keywords:
                count = text_lower.count(keyword.lower())
                if count > 0:
                    issue_scores[category] += count

        # Return categories sorted by relevance
        sorted_issues = sorted(issue_scores.items(), key=lambda x: x[1], reverse=True)
        return [issue for issue, score in sorted_issues if score > 0]

    def _build_entity_list(self, results: Dict) -> List[Dict[str, str]]:
        """Build a consolidated entity list from all extractions."""
        entities = []

        if results["parties"]["petitioner"]:
            entities.append({"type": "PETITIONER", "value": results["parties"]["petitioner"]})
        if results["parties"]["respondent"]:
            entities.append({"type": "RESPONDENT", "value": results["parties"]["respondent"]})
        if results["court"]:
            entities.append({"type": "COURT", "value": results["court"]})
        for judge in results["judges"]:
            entities.append({"type": "JUDGE", "value": judge})
        for statute in results["statutes"]:
            entities.append({"type": "STATUTE", "value": f"{statute['act']} § {statute['section']}"})
        for date in results["dates"]:
            entities.append({"type": "DATE", "value": date})
        for citation in results["citations"]:
            entities.append({"type": "CITATION", "value": citation})

        return entities

    def _calculate_confidence(self, results: Dict) -> float:
        """Calculate extraction confidence based on entity coverage."""
        score = 0.0
        if results["parties"]["petitioner"]:
            score += 15
        if results["parties"]["respondent"]:
            score += 15
        if results["court"] and results["court"] != "Unknown Court":
            score += 15
        if results["judges"]:
            score += 10
        if results["citations"]:
            score += min(len(results["citations"]) * 5, 15)
        if results["statutes"]:
            score += min(len(results["statutes"]) * 5, 15)
        if results["legal_issues"]:
            score += 10
        if results["dates"]:
            score += 5

        return min(round(score, 1), 100.0)
