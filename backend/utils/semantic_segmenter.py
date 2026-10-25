"""
Semantic Segmentation of Legal Documents
─────────────────────────────────────────
Inspired by IIT Kharagpur Law-AI's rhetorical role labeling.
Labels sentences with: FACTS, ARGUMENTS, RATIO, RULING, STATUTE, PRECEDENT, ISSUE

Engine: Rule-based + keyword patterns (NO LLM)
"""

import re
from typing import List, Dict, Any


class SemanticSegmenter:
    """Segments legal text into rhetorical roles (Facts, Arguments, Ratio, Ruling, etc.)"""

    ROLE_PATTERNS = {
        "PREAMBLE": [
            r"^in the .*(court|tribunal)",
            r"^(writ petition|civil appeal|criminal appeal|SLP|special leave)",
            r"^(before|coram)\s*:?\s*(hon|justice|j\.)",
            r"^(petition|appeal|case)\s*no\.",
            r"^(date of|pronounced on|reserved on|delivered on)",
        ],
        "FACTS": [
            r"(the (facts|brief facts|factual matrix|factual background) (of|are|is))",
            r"(it (is|was) (alleged|stated|submitted|contended) that)",
            r"(the (petitioner|appellant|plaintiff|complainant) (filed|lodged|submitted|approached))",
            r"(the (respondent|defendant|accused) (is|was|had|has))",
            r"(the case (arises|arose) (out of|from))",
            r"(the (incident|event|transaction|occurrence) (took place|occurred|happened))",
            r"(on or about \d)",
            r"(FIR (was|has been) (lodged|registered|filed))",
            r"(the factual (matrix|background|narrative))",
        ],
        "ISSUE": [
            r"(the (question|issue|point) (for|of|to be) (consideration|determination|decided))",
            r"(whether .*(is|are|was|were|can|could|should|shall))",
            r"(the (moot|central|main|primary|core) (question|issue|point))",
            r"(falls for (consideration|determination))",
            r"(the (controversy|dispute) (is|centres|revolves))",
        ],
        "ARGUMENTS": [
            r"(learned (counsel|advocate|senior counsel|amicus) (for|appearing for|representing) the (petitioner|appellant|respondent|defendant))",
            r"(it (is|was) (argued|contended|submitted|urged) (that|by))",
            r"(the (submission|argument|contention) (is|was) that)",
            r"(counsel (submitted|argued|contended|urged))",
            r"(per contra|on the other hand|in reply|in rebuttal)",
            r"(the learned (AG|SG|ASG|attorney general|solicitor general) (submitted|argued))",
        ],
        "STATUTE": [
            r"(section \d+[a-z]? of the)",
            r"(article \d+[a-z]? of the constitution)",
            r"(under (section|article|rule|order|regulation) \d)",
            r"(the (relevant|applicable|material) (provision|section|statute))",
            r"(the (act|code|regulation|statute) (provides|states|stipulates|reads))",
        ],
        "PRECEDENT": [
            r"(in .* v\.\s)",
            r"(this court (in|has in))",
            r"(was (considered|decided|held|observed|noted) in)",
            r"(reliance (was|is) (placed|made) (on|upon))",
            r"(the (ratio|principle) (laid down|enunciated|propounded) in)",
            r"(as held (in|by))",
            r"(\(\d{4}\)\s*\d+\s*SCC\s*\d+)",
            r"(AIR\s*\d{4}\s*(SC|Del|Bom|Mad|Cal))",
        ],
        "RATIO": [
            r"(we (are of the|hold|observe|find|conclude) (opinion|view|that))",
            r"(in (our|my) (considered )?(opinion|view|judgment))",
            r"(it (is|would be) (clear|evident|manifest|obvious) that)",
            r"(the (correct|true|proper) (position|interpretation|view) (of|in) law)",
            r"(the (ratio|principle) (is|of this case is))",
            r"(we (accordingly|therefore) (hold|observe|direct|order))",
            r"(having considered .* we (hold|find|are of the view))",
        ],
        "RULING": [
            r"(the (appeal|petition|writ|application) (is|stands) (allowed|dismissed|disposed|rejected))",
            r"(we (hereby|accordingly) (allow|dismiss|dispose|direct|order))",
            r"(in (the result|conclusion|view of the above|light of the above))",
            r"(the (order|judgment|decree|conviction|sentence) (is|of the .* court is) (set aside|upheld|confirmed|modified))",
            r"(ordered accordingly|disposed of accordingly|judgment pronounced)",
            r"(the (impugned|challenged) (order|notification|judgment) (is|shall be))",
        ],
    }

    def segment(self, text: str) -> List[Dict[str, Any]]:
        """
        Segment a legal document into labelled sections.
        Returns list of {role, text, confidence, start_pos, end_pos}.
        """
        sentences = self._split_sentences(text)
        segments = []

        for sent in sentences:
            role, confidence = self._classify_sentence(sent["text"])
            segments.append({
                "role": role,
                "text": sent["text"],
                "confidence": confidence,
                "start_pos": sent["start"],
                "end_pos": sent["end"],
            })

        # Post-processing: smooth isolated labels
        segments = self._smooth_labels(segments)
        return segments

    def get_section_summary(self, segments: List[Dict]) -> Dict[str, Any]:
        """Return counts and text for each rhetorical role."""
        summary = {}
        for seg in segments:
            role = seg["role"]
            if role not in summary:
                summary[role] = {"count": 0, "text": [], "avg_confidence": 0}
            summary[role]["count"] += 1
            summary[role]["text"].append(seg["text"])
            summary[role]["avg_confidence"] += seg["confidence"]

        for role in summary:
            n = summary[role]["count"]
            summary[role]["avg_confidence"] = round(summary[role]["avg_confidence"] / max(n, 1), 2)
            summary[role]["combined_text"] = " ".join(summary[role]["text"][:5])  # First 5 sentences
            del summary[role]["text"]

        return summary

    def _split_sentences(self, text: str) -> List[Dict]:
        """Split text into sentences preserving positions."""
        # Legal text sentence splitter (handles abbreviations like v., S., Art.)
        pattern = r'(?<!\bv)(?<!\bS)(?<!\bArt)(?<!\bNo)(?<!\bMr)(?<!\bMrs)(?<!\bDr)(?<!\bHon)(?<!\bJ)(?<!\bvs)\.\s+(?=[A-Z])'
        parts = re.split(pattern, text)

        sentences = []
        pos = 0
        for part in parts:
            part = part.strip()
            if len(part) > 10:
                start = text.find(part, pos)
                if start == -1:
                    start = pos
                sentences.append({
                    "text": part + ".",
                    "start": start,
                    "end": start + len(part),
                })
                pos = start + len(part)

        return sentences if sentences else [{"text": text, "start": 0, "end": len(text)}]

    def _classify_sentence(self, sentence: str) -> tuple:
        """Classify a single sentence into a rhetorical role."""
        sent_lower = sentence.lower().strip()
        best_role = "FACTS"
        best_score = 0

        for role, patterns in self.ROLE_PATTERNS.items():
            score = 0
            for pattern in patterns:
                if re.search(pattern, sent_lower):
                    score += 1

            if score > best_score:
                best_score = score
                best_role = role

        confidence = min(0.5 + best_score * 0.15, 0.95) if best_score > 0 else 0.3
        return best_role, round(confidence, 2)

    def _smooth_labels(self, segments: List[Dict]) -> List[Dict]:
        """Smooth isolated labels using context."""
        if len(segments) < 3:
            return segments

        for i in range(1, len(segments) - 1):
            if segments[i]["confidence"] < 0.4:
                prev_role = segments[i - 1]["role"]
                next_role = segments[i + 1]["role"]
                if prev_role == next_role:
                    segments[i]["role"] = prev_role
                    segments[i]["confidence"] = 0.35

        return segments
