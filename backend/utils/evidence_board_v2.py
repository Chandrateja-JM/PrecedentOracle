"""
Evidence Board Builder — Entity Relationship Visualization
Adapted from LegalSphere's evidence board approach.
Extracts entities (persons, laws, events, organizations) and their relationships
from legal text, structures them for graph visualization.
"""

from typing import List, Dict, Optional
from dataclasses import dataclass
import re


@dataclass
class EvidenceNode:
    id: str
    name: str
    node_type: str  # person, law, event, organization, place, claim
    description: str = ""


@dataclass
class EvidenceEdge:
    from_id: str
    to_id: str
    description: str = ""
    edge_type: str = "related"  # related, cited, violated, applied, argued


class EvidenceBoardBuilder:
    """
    Builds an evidence board (entity-relationship graph) from legal document analysis.
    Output format is compatible with ReactFlow / D3 visualization.
    """

    def build(self, analysis_result: Dict) -> Dict:
        """
        Build evidence board from agent analysis results.

        Args:
            analysis_result: Combined output from all 5 agents containing
                            entities, citations, statutes, issues, parties, etc.

        Returns:
            Dict with 'nodes' and 'edges' arrays for graph visualization.
        """
        nodes = []
        edges = []
        node_counter = 0

        def add_node(name: str, node_type: str, description: str = "") -> str:
            nonlocal node_counter
            node_counter += 1
            node_id = str(node_counter)
            nodes.append({
                "id": node_id,
                "name": name,
                "type": node_type,
                "description": description
            })
            return node_id

        def add_edge(from_id: str, to_id: str, description: str = "", edge_type: str = "related"):
            edges.append({
                "fromId": from_id,
                "toId": to_id,
                "description": description,
                "from": from_id,
                "to": to_id,
                "type": edge_type
            })

        # Central case node
        case_name = analysis_result.get("case_name", "This Case")
        case_id = add_node(case_name, "event", "The matter under analysis")

        # Parties
        petitioner = analysis_result.get("petitioner", "")
        respondent = analysis_result.get("respondent", "")
        if petitioner:
            pet_id = add_node(petitioner, "person", "Petitioner / Appellant")
            add_edge(pet_id, case_id, "filed", "related")
        if respondent:
            res_id = add_node(respondent, "person", "Respondent / Defendant")
            add_edge(case_id, res_id, "against", "related")

        # Court
        court = analysis_result.get("court", "")
        if court:
            court_id = add_node(court, "organization", "Adjudicating court")
            add_edge(case_id, court_id, "heard by", "related")

        # Judges
        for judge in analysis_result.get("judges", []):
            judge_id = add_node(judge, "person", "Presiding Judge")
            add_edge(court_id if court else case_id, judge_id, "bench includes", "related")

        # Statutes
        for statute in analysis_result.get("statutes", []):
            stat_name = statute if isinstance(statute, str) else statute.get("statute", "")
            stat_id = add_node(stat_name, "law", "Applicable statute")
            add_edge(case_id, stat_id, "invokes", "applied")

        # Issues
        for issue in analysis_result.get("issues", []):
            issue_id = add_node(issue, "claim", "Legal issue")
            add_edge(case_id, issue_id, "raises", "related")

        # Precedents cited
        for prec in analysis_result.get("precedents_supporting", []):
            prec_name = prec if isinstance(prec, str) else prec.get("name", "")
            prec_id = add_node(prec_name, "event", "Supporting precedent")
            add_edge(prec_id, case_id, "supports", "cited")

        for prec in analysis_result.get("precedents_opposing", []):
            prec_name = prec if isinstance(prec, str) else prec.get("name", "")
            prec_id = add_node(prec_name, "event", "Opposing precedent")
            add_edge(prec_id, case_id, "opposes", "cited")

        # Citations
        for citation in analysis_result.get("citations", []):
            cit_text = citation if isinstance(citation, str) else citation.get("raw_text", "")
            status = "unknown"
            if isinstance(citation, dict):
                status = citation.get("status", "unknown")
            cit_id = add_node(cit_text, "event", f"Citation — {status}")
            add_edge(case_id, cit_id, "cites", "cited")

        # Risk factors
        for risk in analysis_result.get("risk_factors", []):
            risk_text = risk if isinstance(risk, str) else risk.get("description", "")
            risk_id = add_node(risk_text, "claim", "Risk factor")
            add_edge(risk_id, case_id, "risks", "related")

        return {
            "nodes": nodes,
            "edges": edges,
            "metadata": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "node_types": list(set(n["type"] for n in nodes)),
            }
        }

    def build_timeline(self, analysis_result: Dict) -> List[Dict]:
        """
        Build a chronological timeline of events from the case.
        """
        events = []

        # Extract dates and events from text
        text = analysis_result.get("document_text", "")
        date_event_pattern = r'(?:on|dated?|On)\s+(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})\s*,?\s*(.{10,100}?)(?:\.|$)'
        for match in re.finditer(date_event_pattern, text):
            events.append({
                "date": match.group(1),
                "event": match.group(2).strip(),
                "type": "case_event"
            })

        # Add filing and hearing dates if available
        if analysis_result.get("filing_date"):
            events.append({
                "date": analysis_result["filing_date"],
                "event": "Case filed",
                "type": "procedural"
            })

        if analysis_result.get("hearing_date"):
            events.append({
                "date": analysis_result["hearing_date"],
                "event": "Hearing conducted",
                "type": "procedural"
            })

        return sorted(events, key=lambda e: e.get("date", ""))
