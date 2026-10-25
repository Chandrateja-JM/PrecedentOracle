"""
Visualization Data Generators
──────────────────────────────
Generates structured data for LegalSphere-style visualizations:
- Timeline: Chronological case events
- Evidence Board: Entity relationship graph
- Tree View: Hierarchical case breakdown
- Court Map: Geospatial court data

Engine: NLP extraction + structured generation (NO LLM)
"""

import re
from typing import Dict, List, Any
from collections import defaultdict


class TimelineGenerator:
    """Generates chronological event timeline from case analysis."""

    def generate(self, entities: Dict, precedents: Dict, case_info: Dict = None) -> List[Dict]:
        """
        Generate timeline events from extracted entities and precedents.
        Returns sorted list of {date, title, description, type, importance}.
        """
        events = []

        # Extract dates from entities
        for date_str in entities.get("dates", []):
            events.append({
                "date": date_str,
                "title": "Date Referenced in Document",
                "description": f"Date mentioned in the case document: {date_str}",
                "type": "document_date",
                "importance": "medium",
            })

        # Add precedent dates
        for prec in precedents.get("supporting", [])[:5]:
            events.append({
                "date": str(prec.get("year", "")),
                "title": f"Supporting Precedent: {prec['name'][:50]}",
                "description": prec.get("holding", "")[:150],
                "type": "precedent",
                "importance": "high" if prec.get("relevance") == "high" else "medium",
            })

        for prec in precedents.get("opposing", []):
            events.append({
                "date": str(prec.get("year", "")),
                "title": f"Opposing: {prec['name'][:50]}",
                "description": prec.get("holding", "")[:150] + " [OVERRULED]" if prec.get("side") == "opposing" else "",
                "type": "opposing_precedent",
                "importance": "high",
            })

        # Add statute enactment dates
        statute_years = {
            "IPC": "1860", "CrPC": "1973", "CPC": "1908",
            "Constitution": "1950", "IT Act": "2000", "IBC": "2016",
            "BNS": "2023", "BNSS": "2023", "BSA": "2023",
            "POSH Act": "2013", "POCSO": "2012",
        }
        seen_acts = set()
        for statute in entities.get("statutes", []):
            act = statute.get("act", "")
            act_short = act.split(",")[0].strip()
            for key, year in statute_years.items():
                if key.lower() in act.lower() and key not in seen_acts:
                    events.append({
                        "date": year,
                        "title": f"{act_short} enacted",
                        "description": f"Statutory framework: {act}",
                        "type": "legislation",
                        "importance": "low",
                    })
                    seen_acts.add(key)

        # Sort by date
        events.sort(key=lambda x: self._parse_date_key(x["date"]))
        return events

    def _parse_date_key(self, date_str: str) -> str:
        """Extract sortable date key."""
        years = re.findall(r'\b(19|20)\d{2}\b', str(date_str))
        return years[0] if years else "9999"


class EvidenceBoardGenerator:
    """Generates entity-relationship graph data for evidence board visualization."""

    NODE_TYPES = {
        "PETITIONER": "person", "RESPONDENT": "person", "JUDGE": "person",
        "COURT": "organization", "STATUTE": "law", "CITATION": "precedent",
        "DATE": "event", "ISSUE": "claim",
    }

    EDGE_COLORS = {
        "person": "#1c4ecb", "organization": "#D84C4CCC",
        "law": "#16ae0ecc", "precedent": "#6319b8",
        "event": "#ca7e0ccc", "claim": "#dc2222cc",
    }

    def generate(self, entities: Dict, precedents: Dict) -> Dict[str, Any]:
        """
        Generate evidence board graph from entities and precedents.
        Returns {nodes: [...], edges: [...]} for ReactFlow/D3 rendering.
        """
        nodes = []
        edges = []
        node_ids = set()
        node_counter = 1

        def add_node(name: str, node_type: str, description: str = "") -> str:
            nonlocal node_counter
            nid = str(node_counter)
            if name not in node_ids:
                nodes.append({
                    "id": nid, "name": name, "type": node_type,
                    "description": description,
                })
                node_ids.add(name)
                node_counter += 1
                return nid
            # Find existing node id
            for n in nodes:
                if n["name"] == name:
                    return n["id"]
            return nid

        # Central case node
        pet = entities.get("parties", {}).get("petitioner", "Petitioner")
        resp = entities.get("parties", {}).get("respondent", "Respondent")
        case_name = f"{pet} v. {resp}" if pet and resp else "Case Under Analysis"
        case_id = add_node(case_name, "claim", "Primary case under analysis")

        # Party nodes
        if pet:
            pid = add_node(pet, "person", "Petitioner/Appellant")
            edges.append({"fromId": pid, "toId": case_id, "description": "filed by"})
        if resp:
            rid = add_node(resp, "person", "Respondent/Defendant")
            edges.append({"fromId": rid, "toId": case_id, "description": "filed against"})

        # Court node
        court = entities.get("court", "")
        if court and court != "Unknown Court":
            cid = add_node(court, "organization", "Adjudicating court")
            edges.append({"fromId": case_id, "toId": cid, "description": "heard before"})

        # Judge nodes
        for judge in entities.get("judges", [])[:3]:
            jid = add_node(judge, "person", "Presiding Judge")
            if court and court != "Unknown Court":
                for n in nodes:
                    if n["name"] == court:
                        edges.append({"fromId": jid, "toId": n["id"], "description": "bench member"})
                        break

        # Statute nodes
        for statute in entities.get("statutes", [])[:6]:
            s_name = f"{statute['act']} § {statute['section']}"
            sid = add_node(s_name, "law", statute.get("raw", ""))
            edges.append({"fromId": case_id, "toId": sid, "description": "invokes"})

        # Legal issue nodes
        for issue in entities.get("legal_issues", [])[:4]:
            iid = add_node(issue, "claim", f"Legal issue: {issue}")
            edges.append({"fromId": case_id, "toId": iid, "description": "raises issue"})

        # Precedent nodes
        for prec in precedents.get("supporting", [])[:5]:
            prid = add_node(prec["name"][:50], "precedent", prec.get("holding", "")[:100])
            edges.append({"fromId": case_id, "toId": prid, "description": "supported by"})

        for prec in precedents.get("opposing", []):
            prid = add_node(prec["name"][:50], "precedent", prec.get("holding", "")[:100])
            edges.append({"fromId": prid, "toId": case_id, "description": "opposes"})

        return {"nodes": nodes, "edges": edges}


class TreeViewGenerator:
    """Generates hierarchical tree structure for case visualization."""

    def generate(self, entities: Dict, precedents: Dict, citations: List[Dict],
                 risk: Dict, case_name: str = "Case Analysis") -> Dict[str, Any]:
        """
        Generate hierarchical tree structure.
        Returns nested dict for ReactFlow tree rendering.
        """
        tree = {}

        # Branch 1: Parties & Court
        tree["parties_and_court"] = {
            "petitioner": entities.get("parties", {}).get("petitioner", "Unknown"),
            "respondent": entities.get("parties", {}).get("respondent", "Unknown"),
            "court": entities.get("court", "Unknown"),
            "judges": entities.get("judges", []),
        }

        # Branch 2: Legal Issues
        tree["legal_issues"] = entities.get("legal_issues", [])

        # Branch 3: Applicable Law
        tree["applicable_law"] = [
            {"section": s["section"], "act": s["act"]}
            for s in entities.get("statutes", [])
        ]

        # Branch 4: Supporting Precedents
        tree["supporting_precedents"] = [
            {"name": p["name"], "year": p["year"], "holding": p.get("holding", "")[:80]}
            for p in precedents.get("supporting", [])[:5]
        ]

        # Branch 5: Opposing Precedents
        tree["opposing_precedents"] = [
            {"name": p["name"], "year": p["year"], "note": p.get("distinguish_note", "")}
            for p in precedents.get("opposing", [])
        ]

        # Branch 6: Citation Verification
        verified = sum(1 for c in citations if c.get("status") == "Verified")
        tree["citations"] = {
            "total": len(citations),
            "verified": verified,
            "weak": sum(1 for c in citations if c.get("status") == "Weak"),
            "missing": sum(1 for c in citations if c.get("status") == "Missing"),
            "overruled": sum(1 for c in citations if c.get("status") == "Overruled"),
        }

        # Branch 7: Risk Assessment
        tree["risk_assessment"] = {
            "score": risk.get("score", 0),
            "risk_level": risk.get("risk_level", "Unknown"),
            "strengths_count": len(risk.get("strengths", [])),
            "risks_count": len(risk.get("moderate_risks", [])) + len(risk.get("critical_risks", [])),
        }

        return {"title": case_name, "tree": tree}


class CourtMapGenerator:
    """Generates geospatial data for court map visualization."""

    def generate(self, entities: Dict, court_locations: List[Dict]) -> List[Dict]:
        """
        Match extracted court info to geospatial coordinates.
        Returns list of map markers.
        """
        markers = []
        court_text = (entities.get("court", "") or "").lower()

        for loc in court_locations:
            relevance = 0
            loc_name_lower = loc["name"].lower()

            if court_text in loc_name_lower or loc_name_lower in court_text:
                relevance = 10
            elif loc["city"].lower() in court_text:
                relevance = 5
            elif loc["type"].lower() in court_text:
                relevance = 3

            if relevance > 0:
                markers.append({
                    "id": loc["id"],
                    "name": loc["name"],
                    "type": loc["type"],
                    "city": loc["city"],
                    "state": loc["state"],
                    "coordinates": [loc["lat"], loc["lng"]],
                    "relevance": relevance,
                    "description": f"{loc['name']}, {loc['city']} (Est. {loc.get('established', 'N/A')})",
                })

        # If nothing matched, add Supreme Court as default
        if not markers:
            sc = next((l for l in court_locations if l["id"] == "sc_india"), None)
            if sc:
                markers.append({
                    "id": sc["id"], "name": sc["name"], "type": sc["type"],
                    "city": sc["city"], "state": sc["state"],
                    "coordinates": [sc["lat"], sc["lng"]],
                    "relevance": 1,
                    "description": "Default: Supreme Court of India, New Delhi",
                })

        markers.sort(key=lambda x: x["relevance"], reverse=True)
        return markers
