"""
Statute Identification Engine
──────────────────────────────
Inspired by IIT Kharagpur's LeSICiN (Legal Statute Identification).
Given case facts, identifies the most relevant Indian statutes.

Engine: TF-IDF + keyword mapping (NO LLM)
"""

import re
from typing import List, Dict, Any
from collections import defaultdict


class StatuteIdentifier:
    """Identifies applicable Indian statutes from case text."""

    # Statute-keyword mappings: maps legal concepts to statutes
    STATUTE_CONCEPT_MAP = {
        "Constitution Art. 14": ["equality","discrimination","equal protection","classification","reasonable classification","arbitrariness","manifestly arbitrary"],
        "Constitution Art. 15": ["discrimination","caste","religion","sex","gender","race","place of birth","untouchability"],
        "Constitution Art. 19(1)(a)": ["free speech","expression","press","media","censorship","internet","online speech"],
        "Constitution Art. 19(1)(g)": ["trade","business","profession","occupation","livelihood","commercial activity"],
        "Constitution Art. 21": ["life","personal liberty","dignity","due process","procedure established by law","privacy","right to live","speedy trial","legal aid","health","education","environment","clean water","shelter"],
        "Constitution Art. 21A": ["education","free education","compulsory education","children","primary education","RTE"],
        "Constitution Art. 25": ["religion","religious practice","freedom of conscience","propagation","conversion","worship"],
        "Constitution Art. 32": ["writ","fundamental rights","habeas corpus","mandamus","certiorari","quo warranto","prohibition"],
        "Constitution Art. 226": ["writ petition","high court","judicial review","mandamus"],
        "Constitution Art. 356": ["president's rule","state emergency","constitutional machinery","governor's report"],
        "Constitution Art. 368": ["amendment","constitutional amendment","basic structure","amending power"],
        "IPC S. 302": ["murder","homicide","killing","death","culpable homicide amounting to murder"],
        "IPC S. 304A": ["death by negligence","rash","negligent act","accident"],
        "IPC S. 354": ["modesty","outrage","molestation","sexual assault","criminal force"],
        "IPC S. 375/376": ["rape","sexual assault","sexual intercourse without consent","penetrative assault"],
        "IPC S. 377": ["unnatural offences","homosexuality","sodomy","carnal intercourse"],
        "IPC S. 420": ["cheating","fraud","dishonest inducement","forgery","criminal breach of trust"],
        "IPC S. 498A": ["cruelty","dowry","harassment","matrimonial cruelty","husband cruelty"],
        "IPC S. 124A": ["sedition","disaffection","anti-national","incitement"],
        "CrPC S. 125": ["maintenance","wife","children","parents","monthly allowance"],
        "CrPC S. 154": ["FIR","first information report","cognizable offence","police station"],
        "CrPC S. 437/439": ["bail","non-bailable offence","anticipatory bail","default bail"],
        "CrPC S. 41": ["arrest","without warrant","cognizable","police power"],
        "CPC S. 9": ["civil suit","jurisdiction","civil nature"],
        "CPC S. 11": ["res judicata","former suit","same issue","already decided"],
        "IT Act S. 66A": ["offensive message","online","electronic communication","annoying message"],
        "IT Act S. 79": ["intermediary","safe harbour","third party content","platform liability"],
        "IBC S. 7": ["insolvency","CIRP","financial creditor","corporate debtor","default"],
        "IBC S. 9": ["operational creditor","insolvency","unpaid dues","demand notice"],
        "IBC S. 29A": ["resolution applicant","eligibility","NPA","wilful defaulter"],
        "Arbitration Act S. 34": ["arbitral award","setting aside","public policy","patent illegality"],
        "POSH Act S. 3": ["sexual harassment","workplace","internal complaints committee","aggrieved woman"],
        "POCSO S. 3/7": ["child sexual abuse","penetrative assault","minor","child protection"],
        "Environment Protection Act": ["pollution","environment","hazardous","emission","effluent","waste"],
        "RPA S. 8": ["disqualification","conviction","elected representative","criminalization of politics"],
    }

    def identify(self, text: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Identify applicable statutes from case text.
        Returns ranked list of {statute, score, matched_concepts, explanation}.
        """
        text_lower = text.lower()
        scores = defaultdict(lambda: {"score": 0, "matched": []})

        for statute, concepts in self.STATUTE_CONCEPT_MAP.items():
            for concept in concepts:
                # Check multi-word concepts
                if concept in text_lower:
                    count = text_lower.count(concept)
                    weight = len(concept.split()) * 1.5  # Multi-word = higher weight
                    scores[statute]["score"] += count * weight
                    if concept not in scores[statute]["matched"]:
                        scores[statute]["matched"].append(concept)

        # Also check for directly referenced statutes
        direct_refs = self._extract_direct_references(text)
        for ref in direct_refs:
            norm = self._normalize_statute_ref(ref)
            if norm:
                scores[norm]["score"] += 10  # Direct reference = high confidence
                scores[norm]["matched"].append(f"directly referenced: {ref}")

        # Sort and return top_k
        ranked = sorted(scores.items(), key=lambda x: x[1]["score"], reverse=True)
        results = []

        for statute, data in ranked[:top_k]:
            if data["score"] > 0:
                results.append({
                    "statute": statute,
                    "score": round(data["score"], 2),
                    "confidence": min(round(data["score"] / 20.0, 2), 1.0),
                    "matched_concepts": data["matched"][:5],
                    "category": self._get_statute_category(statute),
                })

        return results

    def _extract_direct_references(self, text: str) -> List[str]:
        """Extract directly cited statute references."""
        patterns = [
            r'(?:Section|Sec\.|S\.)\s*(\d+[A-Za-z]?)\s*(?:of\s+)?(?:the\s+)?(IPC|BNS|CrPC|BNSS|CPC|IT Act|IBC|Evidence Act|Arbitration Act|POSH Act|POCSO)',
            r'(?:Article|Art\.)\s*(\d+[A-Za-z]?)\s*(?:of\s+)?(?:the\s+)?Constitution',
        ]
        refs = []
        for p in patterns:
            for m in re.finditer(p, text, re.IGNORECASE):
                refs.append(m.group(0).strip())
        return refs

    def _normalize_statute_ref(self, ref: str) -> str:
        """Normalize a statute reference to canonical form."""
        ref_lower = ref.lower()
        if "article" in ref_lower or "art." in ref_lower:
            num = re.search(r'\d+[a-z]?', ref)
            if num:
                return f"Constitution Art. {num.group(0)}"
        if "section" in ref_lower or "sec." in ref_lower or "s." in ref_lower:
            num = re.search(r'\d+[a-z]?', ref)
            act = ""
            if "ipc" in ref_lower: act = "IPC"
            elif "crpc" in ref_lower: act = "CrPC"
            elif "cpc" in ref_lower: act = "CPC"
            elif "it act" in ref_lower: act = "IT Act"
            elif "ibc" in ref_lower: act = "IBC"
            elif "pocso" in ref_lower: act = "POCSO"
            if num and act:
                return f"{act} S. {num.group(0)}"
        return ""

    def _get_statute_category(self, statute: str) -> str:
        """Map statute to category."""
        if "Constitution" in statute: return "Constitutional"
        if "IPC" in statute or "BNS" in statute: return "Criminal"
        if "CrPC" in statute or "BNSS" in statute: return "Criminal Procedure"
        if "CPC" in statute: return "Civil Procedure"
        if "IT Act" in statute: return "Technology"
        if "IBC" in statute: return "Commercial/Insolvency"
        if "Arbitration" in statute: return "Commercial"
        if "POSH" in statute: return "Gender Justice"
        if "POCSO" in statute: return "Child Protection"
        if "Environment" in statute: return "Environmental"
        if "RPA" in statute: return "Electoral"
        return "General"
