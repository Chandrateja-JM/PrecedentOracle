import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { CesiumCourtGlobe } from "./cesium-court-globe";

// ─── 1. COURT MAP — Cesium 3D Globe (replaces SVG India outline) ───

interface CourtMapProps {
  court: string;
  cases: { name: string; citation: string }[];
}

export function CourtMapViz({ court, cases: _cases }: CourtMapProps) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">🌐</div>
        <div>
          <div className="font-display text-sm font-semibold">Court Globe — 3D Earth</div>
          <div className="text-[10px] font-mono text-muted-foreground">Live geospatial · {court}</div>
        </div>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-mono uppercase">Cesium 3D</span>
      </div>
      <CesiumCourtGlobe height={380} />
    </div>
  );
}

// ─── 2. CASE TREE (D3 hierarchical tree) ────────────────
interface TreeNode {
  name: string;
  children?: TreeNode[];
  type?: string;
}

interface CaseTreeProps {
  category: string;
  statutes: { ref: string }[];
  supporting: { name: string }[];
  opposing: { name: string }[];
  citations: { total: number; verified: number; weak: number };
  riskScore: number;
}

export function CaseTreeViz({ category, statutes, supporting, opposing, citations, riskScore }: CaseTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const w = 500, h = 350;

    const treeData: TreeNode = {
      name: category || "Case",
      children: [
        { name: `📋 Statutes (${statutes.length})`, children: statutes.slice(0, 5).map(s => ({ name: s.ref })) },
        { name: `✅ Supporting (${supporting.length})`, children: supporting.slice(0, 5).map(s => ({ name: s.name.length > 30 ? s.name.slice(0, 30) + "…" : s.name })) },
        { name: `⚠️ Opposing (${opposing.length})`, children: opposing.slice(0, 3).map(s => ({ name: s.name.length > 30 ? s.name.slice(0, 30) + "…" : s.name })) },
        { name: `📊 Citations (${citations.total})`, children: [
          { name: `✓ ${citations.verified} verified` },
          { name: `△ ${citations.weak} weak` },
        ]},
        { name: `🎯 Risk: ${riskScore}/100` },
      ],
    };

    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree<TreeNode>().size([h - 40, w - 180]);
    treeLayout(root as any);

    const g = svg.append("g").attr("transform", "translate(80, 20)");

    // Links
    g.selectAll(".link")
      .data(root.links())
      .enter().append("path")
      .attr("class", "link")
      .attr("d", d3.linkHorizontal<any, any>().x(d => d.y).y(d => d.x) as any)
      .attr("fill", "none")
      .attr("stroke", "var(--color-primary, #b8860b)")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", 1.5);

    // Nodes
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

    node.append("circle")
      .attr("r", (d: any) => d.depth === 0 ? 6 : 4)
      .attr("fill", (d: any) => d.depth === 0 ? "var(--color-primary, #b8860b)" : d.children ? "var(--color-primary, #b8860b)" : "var(--color-muted-foreground, #999)")
      .attr("fill-opacity", (d: any) => d.depth === 0 ? 1 : 0.7)
      .attr("stroke", "white")
      .attr("stroke-width", 1.5);

    node.append("text")
      .attr("dy", "0.31em")
      .attr("x", (d: any) => d.children ? -10 : 8)
      .attr("text-anchor", (d: any) => d.children ? "end" : "start")
      .text((d: any) => d.data.name)
      .attr("font-size", (d: any) => d.depth === 0 ? "11px" : "9px")
      .attr("font-family", "var(--font-mono, monospace)")
      .attr("fill", "var(--color-foreground, #333)");

  }, [category, statutes, supporting, opposing, citations, riskScore]);

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">🌳</div>
        <div>
          <div className="font-display text-sm font-semibold">Case Tree</div>
          <div className="text-[10px] font-mono text-muted-foreground">Hierarchical breakdown</div>
        </div>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-mono uppercase">D3.js</span>
      </div>
      <svg ref={svgRef} viewBox="0 0 500 350" className="w-full h-auto" />
    </div>
  );
}

// ─── 3. EVIDENCE BOARD (D3 force-directed graph) ────────
interface EvidenceBoardProps {
  petitioner: string;
  respondent: string;
  statutes: string[];
  issues: string[];
  supporting: { name: string }[];
  opposing: { name: string }[];
}

export function EvidenceBoardViz({ petitioner, respondent, statutes, issues, supporting, opposing }: EvidenceBoardProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const w = 500, h = 380;
    const nodes: { id: string; label: string; type: string; r: number }[] = [];
    const links: { source: string; target: string; label: string }[] = [];

    // Central node
    nodes.push({ id: "case", label: "This Case", type: "case", r: 18 });

    // Petitioner
    if (petitioner) {
      nodes.push({ id: "pet", label: petitioner.slice(0, 25), type: "person", r: 12 });
      links.push({ source: "pet", target: "case", label: "filed" });
    }
    if (respondent) {
      nodes.push({ id: "res", label: respondent.slice(0, 25), type: "person", r: 12 });
      links.push({ source: "case", target: "res", label: "against" });
    }

    // Statutes
    statutes.slice(0, 4).forEach((s, i) => {
      const id = `stat_${i}`;
      nodes.push({ id, label: s.slice(0, 20), type: "law", r: 10 });
      links.push({ source: "case", target: id, label: "invokes" });
    });

    // Supporting
    supporting.slice(0, 4).forEach((s, i) => {
      const id = `sup_${i}`;
      nodes.push({ id, label: s.name.split(" v.")[0]?.slice(0, 18) || s.name.slice(0, 18), type: "supporting", r: 9 });
      links.push({ source: id, target: "case", label: "supports" });
    });

    // Opposing
    opposing.slice(0, 3).forEach((s, i) => {
      const id = `opp_${i}`;
      nodes.push({ id, label: s.name.split(" v.")[0]?.slice(0, 18) || s.name.slice(0, 18), type: "opposing", r: 9 });
      links.push({ source: id, target: "case", label: "opposes" });
    });

    const colors: Record<string, string> = {
      case: "#b8860b", person: "#3b82f6", law: "#22c55e",
      supporting: "#16a34a", opposing: "#ef4444",
    };

    const sim = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(90))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collision", d3.forceCollide().radius((d: any) => d.r + 15));

    const g = svg.append("g");

    // Links
    const link = g.selectAll(".link")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

    // Link labels
    const linkLabel = g.selectAll(".link-label")
      .data(links)
      .enter().append("text")
      .text(d => d.label)
      .attr("font-size", "7px")
      .attr("fill", "#999")
      .attr("text-anchor", "middle");

    // Nodes
    const node = g.selectAll(".node")
      .data(nodes)
      .enter().append("g")
      .call(d3.drag<any, any>()
        .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    node.append("circle")
      .attr("r", (d: any) => d.r)
      .attr("fill", (d: any) => colors[d.type] || "#999")
      .attr("fill-opacity", 0.8)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("cursor", "grab");

    node.append("text")
      .text((d: any) => d.label)
      .attr("dy", (d: any) => d.r + 12)
      .attr("text-anchor", "middle")
      .attr("font-size", "8px")
      .attr("font-family", "var(--font-mono, monospace)")
      .attr("fill", "var(--color-foreground, #333)");

    sim.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

  }, [petitioner, respondent, statutes, supporting, opposing]);

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">🔗</div>
        <div>
          <div className="font-display text-sm font-semibold">Evidence Board</div>
          <div className="text-[10px] font-mono text-muted-foreground">Drag nodes to explore</div>
        </div>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-mono uppercase">D3.js</span>
      </div>
      <svg ref={svgRef} viewBox="0 0 500 380" className="w-full h-auto" style={{ minHeight: 300 }} />
      <div className="flex gap-3 mt-2 text-[9px] font-mono text-muted-foreground">
        <span><span className="inline-block h-2 w-2 rounded-full bg-[#b8860b] mr-1" />Case</span>
        <span><span className="inline-block h-2 w-2 rounded-full bg-[#3b82f6] mr-1" />Person</span>
        <span><span className="inline-block h-2 w-2 rounded-full bg-[#22c55e] mr-1" />Law</span>
        <span><span className="inline-block h-2 w-2 rounded-full bg-[#16a34a] mr-1" />Supporting</span>
        <span><span className="inline-block h-2 w-2 rounded-full bg-[#ef4444] mr-1" />Opposing</span>
      </div>
    </div>
  );
}

// ─── 4. TIMELINE (D3 vertical timeline) ─────────────────
interface TimelineEvent {
  year: number;
  name: string;
  type: "supporting" | "opposing";
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function TimelineViz({ events }: TimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const sorted = useMemo(() => [...events].sort((a, b) => a.year - b.year), [events]);

  useEffect(() => {
    if (!svgRef.current || sorted.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const w = 480, margin = { top: 20, bottom: 20, left: 60, right: 20 };
    const itemH = 36;
    const h = Math.max(200, sorted.length * itemH + margin.top + margin.bottom);
    svg.attr("viewBox", `0 0 ${w} ${h}`);

    const y = d3.scaleLinear()
      .domain([0, sorted.length - 1])
      .range([margin.top + 10, h - margin.bottom - 10]);

    const g = svg.append("g");

    // Vertical line
    g.append("line")
      .attr("x1", margin.left).attr("x2", margin.left)
      .attr("y1", margin.top).attr("y2", h - margin.bottom)
      .attr("stroke", "var(--color-primary, #b8860b)")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", 2);

    sorted.forEach((ev, i) => {
      const cy = y(i);
      const color = ev.type === "opposing" ? "#ef4444" : "var(--color-primary, #b8860b)";

      // Dot
      g.append("circle")
        .attr("cx", margin.left).attr("cy", cy)
        .attr("r", 5)
        .attr("fill", color)
        .attr("stroke", "white")
        .attr("stroke-width", 2);

      // Year
      g.append("text")
        .attr("x", margin.left - 10).attr("y", cy + 4)
        .text(ev.year.toString())
        .attr("text-anchor", "end")
        .attr("font-size", "10px")
        .attr("font-family", "var(--font-mono, monospace)")
        .attr("fill", "var(--color-muted-foreground, #999)")
        .attr("font-weight", "600");

      // Case name
      g.append("text")
        .attr("x", margin.left + 14).attr("y", cy + 4)
        .text(ev.name.length > 45 ? ev.name.slice(0, 45) + "…" : ev.name)
        .attr("font-size", "10px")
        .attr("font-family", "var(--font-mono, monospace)")
        .attr("fill", ev.type === "opposing" ? "#ef4444" : "var(--color-foreground, #333)");

      // Strikethrough for opposing
      if (ev.type === "opposing") {
        const textW = ev.name.length * 5.5;
        g.append("line")
          .attr("x1", margin.left + 14).attr("x2", margin.left + 14 + Math.min(textW, 250))
          .attr("y1", cy + 1).attr("y2", cy + 1)
          .attr("stroke", "#ef4444")
          .attr("stroke-opacity", 0.4)
          .attr("stroke-width", 1);
      }
    });

  }, [sorted]);

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">⏳</div>
        <div>
          <div className="font-display text-sm font-semibold">Timeline</div>
          <div className="text-[10px] font-mono text-muted-foreground">Chronological precedent history</div>
        </div>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-mono uppercase">D3.js</span>
      </div>
      <svg ref={svgRef} className="w-full h-auto" />
    </div>
  );
}

// ─── 5. SEMANTIC SEGMENTS (visual role labels) ──────────
interface SegmentProps {
  tags: string[];
  statutes: string[];
  precedents: string[];
}

export function SemanticSegmentsViz({ tags, statutes, precedents }: SegmentProps) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 text-sm">🏛️</div>
        <div>
          <div className="font-display text-sm font-semibold">Semantic Segmentation</div>
          <div className="text-[10px] font-mono text-muted-foreground">Rhetorical role labeling · NLP Engine</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, i) => (
          <span key={i} className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-mono bg-primary/5 text-foreground/80">{tag}</span>
        ))}
        {statutes.map((s, i) => (
          <span key={"s" + i} className="inline-flex items-center rounded-full border border-green-300 px-2.5 py-1 text-[10px] font-mono bg-green-50 text-green-700">STATUTE: {s}</span>
        ))}
        {precedents.map((p, i) => (
          <span key={"p" + i} className="inline-flex items-center rounded-full border border-blue-300 px-2.5 py-1 text-[10px] font-mono bg-blue-50 text-blue-700">PRECEDENT: {p}</span>
        ))}
      </div>
    </div>
  );
}
