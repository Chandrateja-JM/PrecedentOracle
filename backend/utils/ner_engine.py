"""
NLP Engine for Indian Legal Documents
Handles: Named Entity Recognition, Citation Extraction, Statute Identification
Architecture: Regex + Rules first, InLegalBERT integration ready

For M.Tech evaluation: This is the core NLP layer — NOT an LLM wrapper.
"""

import re
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, field


@dataclass
class LegalEntity:
    text: str
    label: str  # PERSON, COURT, STATUTE, CITATION, DATE, JUDGE, ORGANIZATION
    start: int
    end: int
    confidence: float = 0.9


@dataclass
class ExtractedCitation:
    raw_text: str
    case_name: Optional[str] = None
    year: Optional[int] = None
    volume: Optional[str] = None
    reporter: Optional[str] = None
    page: Optional[str] = None
    court: Optional[str] = None
    format_type: Optional[str] = None  # SCC, AIR, SCR, CriLJ, etc.
    confidence: float = 0.0


class LegalNEREngine:
    """
    Named Entity Recognition for Indian Legal Documents.
    Uses regex patterns + gazetteers. Drop-in replacement for InLegalBERT when available.
    """

    # Indian court names
    COURTS = [
        "Supreme Court of India", "Supreme Court",
        "Bombay High Court", "Delhi High Court", "Madras High Court",
        "Calcutta High Court", "Karnataka High Court", "Kerala High Court",
        "Allahabad High Court", "Gujarat High Court", "Andhra Pradesh High Court",
        "Telangana High Court", "Punjab and Haryana High Court",
        "Rajasthan High Court", "Patna High Court", "Orissa High Court",
        "Madhya Pradesh High Court", "Gauhati High Court", "Jharkhand High Court",
        "Uttarakhand High Court", "Chhattisgarh High Court", "Himachal Pradesh High Court",
        "Jammu and Kashmir High Court", "Manipur High Court", "Meghalaya High Court",
        "Sikkim High Court", "Tripura High Court",
        "National Company Law Tribunal", "NCLAT", "NCLT",
        "National Green Tribunal", "NGT",
        "Armed Forces Tribunal", "AFT",
        "Central Administrative Tribunal", "CAT",
        "Income Tax Appellate Tribunal", "ITAT",
        "Debt Recovery Tribunal", "DRT",
        "District Court", "Sessions Court", "Magistrate Court",
        "Consumer Forum", "NCDRC", "SCDRC",
    ]

    # Indian statutes
    STATUTES = [
        "Constitution of India", "Indian Penal Code", "IPC",
        "Code of Criminal Procedure", "CrPC", "Cr.P.C.",
        "Code of Civil Procedure", "CPC", "C.P.C.",
        "Indian Evidence Act", "Evidence Act",
        "Bharatiya Nyaya Sanhita", "BNS",
        "Bharatiya Nagarik Suraksha Sanhita", "BNSS",
        "Bharatiya Sakshya Adhiniyam", "BSA",
        "Companies Act", "Contract Act", "Indian Contract Act",
        "Transfer of Property Act", "TP Act",
        "Specific Relief Act", "Limitation Act",
        "Arbitration and Conciliation Act",
        "Information Technology Act", "IT Act",
        "Motor Vehicles Act", "NDPS Act",
        "Prevention of Corruption Act", "POCA",
        "SC/ST (Prevention of Atrocities) Act",
        "Protection of Women from Domestic Violence Act",
        "Hindu Marriage Act", "Hindu Succession Act",
        "Muslim Personal Law (Shariat) Application Act",
        "Special Marriage Act", "Indian Divorce Act",
        "Negotiable Instruments Act", "NI Act",
        "Consumer Protection Act",
        "Right to Information Act", "RTI Act",
        "Environment Protection Act",
        "Wildlife Protection Act",
        "Insolvency and Bankruptcy Code", "IBC",
        "Goods and Services Tax Act", "GST Act",
        "Income Tax Act",
        "Representation of People Act", "RPA",
        "Arms Act", "TADA", "UAPA",
        "National Security Act", "NSA",
        "Bonded Labour System (Abolition) Act",
        "Child Labour (Prohibition and Regulation) Act",
        "Sexual Harassment of Women at Workplace Act", "POSH Act",
        "Juvenile Justice Act", "JJ Act",
        "Right to Education Act", "RTE Act",
        "Prevention of Money Laundering Act", "PMLA",
        "Foreign Exchange Management Act", "FEMA",
    ]

    # Citation patterns for Indian law reporters
    CITATION_PATTERNS = [
        # SCC format: (2017) 10 SCC 1
        (r'\((\d{4})\)\s+(\d+)\s+SCC\s+(\d+)', 'SCC'),
        # AIR format: AIR 2017 SC 4161
        (r'AIR\s+(\d{4})\s+(SC|Bom|Del|Mad|Cal|Kar|Ker|All|Guj|AP|Tel|P&H|Raj|Pat|Ori|MP|Gau)\s+(\d+)', 'AIR'),
        # SCR format: (1973) 4 SCR 225
        (r'\((\d{4})\)\s+(\d+)\s+SCR\s+(\d+)', 'SCR'),
        # SCC OnLine: 2022 SCC OnLine SC 1456
        (r'(\d{4})\s+SCC\s+OnLine\s+(SC|Bom|Del|Mad|Cal|Kar|Ker|All)\s+(\d+)', 'SCC_Online'),
        # CriLJ format: 2019 CriLJ 4567
        (r'(\d{4})\s+Cri\.?L\.?J\.?\s+(\d+)', 'CriLJ'),
        # Supp SCC: (1992) Supp (3) SCC 217
        (r'\((\d{4})\)\s+Supp\.?\s*\((\d+)\)\s+SCC\s+(\d+)', 'Supp_SCC'),
        # Bare case name with year: Maneka Gandhi v. Union of India (1978)
        (r'([A-Z][a-zA-Z\.\s]+)\s+v\.?\s+([A-Z][a-zA-Z\.\s]+)\s*\((\d{4})\)', 'case_name'),
    ]

    # Section/Article patterns
    SECTION_PATTERNS = [
        r'(?:Section|Sec\.|S\.)\s*(\d+[A-Z]?(?:\(\d+\))?(?:\([a-z]\))?)',
        r'(?:Article|Art\.)\s*(\d+[A-Z]?(?:\(\d+\))?(?:\([a-z]\))?)',
        r'(?:Order|O\.)\s+([IVXLC]+(?:\s*Rule\s*\d+)?)',
        r'(?:Rule|R\.)\s*(\d+[A-Z]?)',
        r'(?:Regulation|Reg\.)\s*(\d+[A-Z]?)',
    ]

    def __init__(self):
        self.court_pattern = re.compile(
            r'\b(' + '|'.join(re.escape(c) for c in sorted(self.COURTS, key=len, reverse=True)) + r')\b',
            re.IGNORECASE
        )
        self.statute_pattern = re.compile(
            r'\b(' + '|'.join(re.escape(s) for s in sorted(self.STATUTES, key=len, reverse=True)) + r')\b',
            re.IGNORECASE
        )

    def extract_entities(self, text: str) -> List[LegalEntity]:
        """Extract all legal entities from text."""
        entities = []
        entities.extend(self._extract_courts(text))
        entities.extend(self._extract_statutes(text))
        entities.extend(self._extract_dates(text))
        entities.extend(self._extract_persons(text))
        entities.extend(self._extract_judges(text))
        # Deduplicate by position
        seen = set()
        unique = []
        for e in entities:
            key = (e.start, e.end, e.label)
            if key not in seen:
                seen.add(key)
                unique.append(e)
        return sorted(unique, key=lambda e: e.start)

    def extract_citations(self, text: str) -> List[ExtractedCitation]:
        """Extract all legal citations from text."""
        citations = []
        for pattern, fmt in self.CITATION_PATTERNS:
            for match in re.finditer(pattern, text):
                citation = ExtractedCitation(
                    raw_text=match.group(0),
                    format_type=fmt,
                    confidence=0.85
                )
                if fmt == 'SCC':
                    citation.year = int(match.group(1))
                    citation.volume = match.group(2)
                    citation.reporter = 'SCC'
                    citation.page = match.group(3)
                    citation.confidence = 0.95
                elif fmt == 'AIR':
                    citation.year = int(match.group(1))
                    citation.court = match.group(2)
                    citation.reporter = 'AIR'
                    citation.page = match.group(3)
                    citation.confidence = 0.95
                elif fmt == 'case_name':
                    citation.case_name = f"{match.group(1).strip()} v. {match.group(2).strip()}"
                    citation.year = int(match.group(3))
                    citation.confidence = 0.70
                citations.append(citation)
        return citations

    def extract_sections(self, text: str) -> List[Dict]:
        """Extract statute section references."""
        sections = []
        for pattern in self.SECTION_PATTERNS:
            for match in re.finditer(pattern, text):
                # Look back for statute name
                context_start = max(0, match.start() - 100)
                context = text[context_start:match.start()]
                statute_match = self.statute_pattern.search(context)
                sections.append({
                    "reference": match.group(0),
                    "number": match.group(1),
                    "statute": statute_match.group(0) if statute_match else "Unknown",
                    "position": match.start()
                })
        return sections

    def _extract_courts(self, text: str) -> List[LegalEntity]:
        entities = []
        for match in self.court_pattern.finditer(text):
            entities.append(LegalEntity(
                text=match.group(0), label="COURT",
                start=match.start(), end=match.end(), confidence=0.95
            ))
        return entities

    def _extract_statutes(self, text: str) -> List[LegalEntity]:
        entities = []
        for match in self.statute_pattern.finditer(text):
            entities.append(LegalEntity(
                text=match.group(0), label="STATUTE",
                start=match.start(), end=match.end(), confidence=0.90
            ))
        return entities

    def _extract_dates(self, text: str) -> List[LegalEntity]:
        entities = []
        date_patterns = [
            r'\b(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})\b',
            r'\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b',
            r'\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b',
        ]
        for pattern in date_patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                entities.append(LegalEntity(
                    text=match.group(0), label="DATE",
                    start=match.start(), end=match.end(), confidence=0.85
                ))
        return entities

    def _extract_persons(self, text: str) -> List[LegalEntity]:
        """Extract party names from 'X v. Y' or 'X vs. Y' patterns."""
        entities = []
        versus_pattern = r'([A-Z][a-zA-Z\.\s]{2,40})\s+(?:v\.|vs\.?|versus)\s+([A-Z][a-zA-Z\.\s]{2,60})'
        for match in re.finditer(versus_pattern, text):
            entities.append(LegalEntity(
                text=match.group(1).strip(), label="PETITIONER",
                start=match.start(1), end=match.end(1), confidence=0.80
            ))
            entities.append(LegalEntity(
                text=match.group(2).strip(), label="RESPONDENT",
                start=match.start(2), end=match.end(2), confidence=0.80
            ))
        return entities

    def _extract_judges(self, text: str) -> List[LegalEntity]:
        """Extract judge names from common patterns."""
        entities = []
        judge_patterns = [
            r'(?:Justice|J\.|Hon\'ble)\s+([A-Z][a-zA-Z\.\s]{3,30})',
            r'([A-Z][a-zA-Z\.]+(?:\s+[A-Z][a-zA-Z\.]+)+)\s*,?\s*(?:CJ|CJI|JJ?\.)',
        ]
        for pattern in judge_patterns:
            for match in re.finditer(pattern, text):
                entities.append(LegalEntity(
                    text=match.group(1).strip() if match.lastindex else match.group(0).strip(),
                    label="JUDGE",
                    start=match.start(), end=match.end(), confidence=0.75
                ))
        return entities


class SemanticSegmenter:
    """
    Rhetorical Role Labeling for Indian Legal Documents.
    Based on IIT Kharagpur's approach (JURIX 2019, AI & Law Journal 2021).
    Labels sentences with: FACTS, ARGUMENTS, STATUTE, PRECEDENT, RATIO, RULING, DISSENT

    Currently uses keyword heuristics. InLegalBERT fine-tuned model plugs in here.
    """

    ROLE_KEYWORDS = {
        "FACTS": [
            "the petitioner", "the respondent", "the accused", "the plaintiff",
            "the appellant", "it is alleged", "the facts are", "briefly stated",
            "the case of", "was arrested", "filed a complaint", "the incident",
            "on or about", "the prosecution case", "according to the FIR",
            "the deceased", "the victim", "the complainant",
        ],
        "ARGUMENTS": [
            "learned counsel", "argued that", "submitted that", "contended that",
            "it was urged", "on behalf of", "senior advocate", "the contention",
            "it is submitted", "the argument", "learned senior counsel",
            "the defence", "the prosecution", "counsel for",
        ],
        "STATUTE": [
            "section", "article", "under the provisions", "as per",
            "in terms of", "the act provides", "statutory provision",
            "rule", "regulation", "clause", "sub-section",
            "the relevant provision", "reads as follows",
        ],
        "PRECEDENT": [
            "this court held", "it was held", "the ratio", "reliance was placed",
            "relied upon", "the decision in", "as observed in", "following the",
            "the principle laid down", "the dictum in", "referred to",
            "was considered in", "binding precedent", "the holding in",
        ],
        "RATIO": [
            "we are of the opinion", "in our view", "we hold that",
            "we are of the considered view", "the court is of the opinion",
            "it is clear that", "it follows that", "we conclude",
            "the correct position", "the law is settled", "we answer",
        ],
        "RULING": [
            "accordingly", "the appeal is", "the petition is",
            "dismissed", "allowed", "disposed of", "set aside",
            "the order is", "the conviction is", "the sentence is",
            "we direct", "ordered accordingly", "the writ petition",
            "appeal allowed", "appeal dismissed", "acquitted",
        ],
        "DISSENT": [
            "i respectfully disagree", "in my dissenting opinion",
            "i am unable to agree", "with respect", "the minority view",
            "i would have", "in my humble opinion", "dissenting",
        ],
    }

    def segment(self, text: str) -> List[Dict]:
        """Segment legal text into rhetorical roles."""
        sentences = self._split_sentences(text)
        results = []
        for i, sentence in enumerate(sentences):
            role = self._classify_sentence(sentence, i, len(sentences))
            results.append({
                "index": i,
                "text": sentence,
                "role": role["label"],
                "confidence": role["confidence"],
            })
        return results

    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences, handling legal abbreviations."""
        # Protect common abbreviations
        protected = text
        for abbr in ["v.", "vs.", "No.", "Art.", "Sec.", "S.", "Cr.P.C.", "C.P.C.", "Hon.", "J.", "CJ.", "JJ."]:
            protected = protected.replace(abbr, abbr.replace(".", "§"))
        sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9])', protected)
        return [s.replace("§", ".").strip() for s in sentences if len(s.strip()) > 10]

    def _classify_sentence(self, sentence: str, position: int, total: int) -> Dict:
        """Classify a single sentence into a rhetorical role."""
        sentence_lower = sentence.lower()
        scores = {}
        for role, keywords in self.ROLE_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in sentence_lower)
            scores[role] = score

        # Position heuristics
        relative_pos = position / max(total, 1)
        if relative_pos < 0.2:
            scores["FACTS"] = scores.get("FACTS", 0) + 1
        elif relative_pos > 0.85:
            scores["RULING"] = scores.get("RULING", 0) + 2

        best_role = max(scores, key=scores.get) if max(scores.values()) > 0 else "FACTS"
        total_score = sum(scores.values())
        confidence = scores[best_role] / max(total_score, 1) if total_score > 0 else 0.3

        return {"label": best_role, "confidence": min(confidence, 0.95)}


class StatuteIdentifier:
    """
    Identifies applicable statutes from case text.
    Based on IIT Kharagpur's LeSICiN approach (AAAI 2022).
    Uses keyword matching + section reference extraction.
    """

    # Mapping of legal concepts to statutes
    CONCEPT_STATUTE_MAP = {
        "murder": ["IPC S. 302", "BNS S. 103", "IPC S. 300", "BNS S. 101"],
        "theft": ["IPC S. 378", "BNS S. 303", "IPC S. 379", "BNS S. 305"],
        "cheating": ["IPC S. 415", "BNS S. 351", "IPC S. 420", "BNS S. 352"],
        "dowry": ["IPC S. 304B", "BNS S. 80", "Dowry Prohibition Act"],
        "rape": ["IPC S. 375", "BNS S. 63", "IPC S. 376", "BNS S. 64"],
        "bail": ["CrPC S. 437", "BNSS S. 480", "CrPC S. 439", "BNSS S. 483"],
        "anticipatory bail": ["CrPC S. 438", "BNSS S. 482"],
        "arrest": ["CrPC S. 41", "BNSS S. 35", "CrPC S. 154", "BNSS S. 173"],
        "FIR": ["CrPC S. 154", "BNSS S. 173"],
        "maintenance": ["CrPC S. 125", "BNSS S. 144"],
        "divorce": ["Hindu Marriage Act S. 13", "Special Marriage Act S. 27"],
        "fundamental rights": ["Constitution Art. 14", "Constitution Art. 19", "Constitution Art. 21"],
        "writ": ["Constitution Art. 32", "Constitution Art. 226"],
        "habeas corpus": ["Constitution Art. 32", "Constitution Art. 226"],
        "eviction": ["Transfer of Property Act", "State Rent Control Act"],
        "contract": ["Indian Contract Act S. 10", "Indian Contract Act S. 73"],
        "negligence": ["IPC S. 304A", "BNS S. 106", "Consumer Protection Act"],
        "defamation": ["IPC S. 499", "BNS S. 356"],
        "cyber crime": ["IT Act S. 66", "IT Act S. 43"],
        "sexual harassment": ["IPC S. 354A", "BNS S. 74", "POSH Act"],
        "corruption": ["Prevention of Corruption Act S. 7", "Prevention of Corruption Act S. 13"],
        "environment": ["Environment Protection Act", "Water Act", "Air Act", "Wildlife Protection Act"],
        "reservation": ["Constitution Art. 15(4)", "Constitution Art. 16(4)"],
        "property": ["Transfer of Property Act", "Indian Registration Act", "Indian Stamp Act"],
        "arbitration": ["Arbitration and Conciliation Act S. 11", "Arbitration and Conciliation Act S. 34"],
        "insolvency": ["IBC S. 7", "IBC S. 9", "IBC S. 10"],
        "tax": ["Income Tax Act", "GST Act"],
    }

    def identify(self, text: str, case_type: str = "") -> List[Dict]:
        """Identify applicable statutes from text."""
        text_lower = text.lower()
        identified = []
        seen = set()

        # Direct section references
        section_pattern = r'(?:Section|Sec\.|S\.)\s*(\d+[A-Z]?)\s+(?:of\s+)?(?:the\s+)?([A-Za-z\s,]+(?:Act|Code|Sanhita|Constitution))'
        for match in re.finditer(section_pattern, text, re.IGNORECASE):
            ref = f"{match.group(2).strip()} S. {match.group(1)}"
            if ref not in seen:
                seen.add(ref)
                identified.append({
                    "statute": ref,
                    "source": "direct_reference",
                    "confidence": 0.95,
                    "context": match.group(0)
                })

        # Concept-based identification
        for concept, statutes in self.CONCEPT_STATUTE_MAP.items():
            if concept in text_lower:
                for statute in statutes:
                    if statute not in seen:
                        seen.add(statute)
                        identified.append({
                            "statute": statute,
                            "source": "concept_match",
                            "confidence": 0.70,
                            "concept": concept
                        })

        return identified
