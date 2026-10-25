import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import * as d3 from "d3";
import { ZoomIn, ZoomOut, RotateCcw, X, Sparkles, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { LANDMARK_CASES, GRAPH_EDGES, type LandmarkCase } from "@/lib/seed-data";
import { explainCase, findSimilarCases } from "@/lib/ai.functions";
import { AISearchBar } from "@/components/ai-search-bar";
import { useCorpusStats } from "@/lib/use-corpus-stats";
import { toast } from "sonner";

const CATEGORY_COLOR: Record<string, string> = {
  Constitutional: "var(--primary)",            // gold
  Criminal: "#b87333",                          // copper
  "Fundamental Rights": "#f59e0b",             // amber
  Family: "#cd7f32",                            // bronze
  Environment: "#0d9488",                       // teal
  "Gender Justice": "#ec4899",                  // pink
  Religion: "#a855f7",
  Tort: "#ef4444",
  Education: "#3b82f6",
  Electoral: "#06b6d4",
  Commercial: "#84cc16",
  Property: "#78716c",
};
function categoryColor(cat: string) { return CATEGORY_COLOR[cat] ?? "var(--info)"; }

// Court-tier palette
const COURT_COLOR: Record<string, string> = {
  SC: "#d4af37",        // gold — Supreme Court
  HC: "#2563eb",        // blue — High Court
  Tribunal: "#94a3b8",  // silver — Tribunals (NCLT/NCLAT/NGT/ITAT)
  District: "#b87333",  // bronze — District / subordinate
};
function courtColor(tier: string) { return COURT_COLOR[tier] ?? "#64748b"; }
function courtLabel(tier: string) {
  return tier === "SC" ? "Supreme Court" : tier === "HC" ? "High Court" : tier === "Tribunal" ? "Tribunal" : tier === "District" ? "District Court" : tier;
}



export const Route = createFileRoute("/graph")({
  validateSearch: (s: Record<string, unknown>) => ({
    case: typeof s.case === "string" ? s.case : undefined,
  }),
  head: () => ({ meta: [{ title: "Knowledge Graph — PrecedentOracle" },
    { name: "description", content: "Interactive D3 force-directed graph of 50 landmark Indian cases." }] }),
  component: GraphPage,
});

interface Node extends d3.SimulationNodeDatum {
  id: string; name: string; year: number; court: string; courtTier: string;
  status: string; principle: string; citation: string; r: number; group: string;
}

interface Link extends d3.SimulationLinkDatum<Node> { type: string; context?: string; }

const PRESETS = [
  { id: "all", label: "All landmarks", filter: () => true },
  { id: "privacy", label: "Privacy law evolution", filter: (c: LandmarkCase) => ["puttaswamy-2017", "adm-jabalpur-1976", "maneka-gandhi-1978", "francis-coralie-1981", "shreya-singhal-2015", "common-cause-2018"].includes(c.id) },
  { id: "basic", label: "Basic Structure cases", filter: (c: LandmarkCase) => ["kesavananda-1973", "golak-nath-1967", "minerva-mills-1980", "ir-coelho-2007", "shankari-prasad-1951", "sajjan-singh-1965"].includes(c.id) },
  { id: "art21", label: "Article 21 expansion", filter: (c: LandmarkCase) => ["maneka-gandhi-1978", "francis-coralie-1981", "olga-tellis-1985", "hussainara-1979", "sunil-batra-1978", "dk-basu-1997", "puttaswamy-2017", "aruna-shanbaug-2011"].includes(c.id) },
  { id: "lgbtq", label: "LGBTQ+ rights timeline", filter: (c: LandmarkCase) => ["navtej-2018", "koushal-2013", "nalsa-2014", "puttaswamy-2017"].includes(c.id) },
  { id: "reserve", label: "Reservation cases", filter: (c: LandmarkCase) => ["indra-sawhney-1992", "janhit-abhiyan-2022", "kesavananda-1973"].includes(c.id) },
  { id: "env", label: "Environmental law", filter: (c: LandmarkCase) => ["mc-mehta-1986", "vellore-1996", "godavarman-1996", "bhopal-1989"].includes(c.id) },
  { id: "death", label: "Death penalty jurisprudence", filter: (c: LandmarkCase) => ["bachan-singh-1980", "mithu-1983", "sunil-batra-1978", "maneka-gandhi-1978"].includes(c.id) },
];

function GraphPage() {
  const searchParams = Route.useSearch();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [preset, setPreset] = useState("all");
  const [colorMode, setColorMode] = useState<"category" | "court">("category");
  const [selected, setSelected] = useState<LandmarkCase | null>(null);
  const [query, setQuery] = useState("");
  const stats = useCorpusStats();
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [aiExplain, setAiExplain] = useState<{ plainSummary: string; whyItMatters: string; modernRelevance: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [related, setRelated] = useState<Awaited<ReturnType<typeof findSimilar>> | null>(null);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [aiCases, setAiCases] = useState<LandmarkCase[]>([]);
  const runExplain = useServerFn(explainCase);
  const findSimilar = useServerFn(findSimilarCases);

  useEffect(() => { setRelated(null); }, [selected?.id]);


  useEffect(() => { setAiExplain(null); }, [selected?.id]);

  useEffect(() => {

    if (searchParams.case) {
      const c = LANDMARK_CASES.find((x) => x.id === searchParams.case);
      if (c) setSelected(c);
    }
  }, [searchParams.case]);

  const { nodes, links } = useMemo(() => {
    const preserve = PRESETS.find((p) => p.id === preset)!.filter;
    // Always include AI-fetched cases regardless of preset.
    const visibleCases = [...LANDMARK_CASES.filter(preserve), ...aiCases];
    const visibleIds = new Set(visibleCases.map((c) => c.id));
    const nodes: Node[] = visibleCases.map((c) => ({
      id: c.id, name: c.name, year: c.year, court: c.court, courtTier: c.courtTier,
      status: c.status, principle: c.principle, citation: c.citation,
      r: c.courtTier === "SC" ? 10 + Math.log((c.citedBy ?? 100)) : 8,
      group: c.category,
    }));
    const links: Link[] = GRAPH_EDGES
      .filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to))
      .map((e) => ({ source: e.from, target: e.to, type: e.type, context: e.context }));
    return { nodes, links };
  }, [preset, aiCases]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => g.attr("transform", event.transform.toString()));
    zoomRef.current = zoom;
    svg.call(zoom);

    const linksData = links.map((l) => ({ ...l }));
    const nodesData = nodes.map((n) => ({ ...n }));

    const sim = d3.forceSimulation<Node>(nodesData)
      .force("link", d3.forceLink<Node, Link>(linksData).id((d) => d.id).distance(110).strength(0.6))
      .force("charge", d3.forceManyBody().strength(-380))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d) => (d as Node).r + 8));

    const link = g.append("g").selectAll("line").data(linksData).join("line")
      .attr("stroke", (d) => d.type === "OVERRULED_BY" ? "var(--overruled)" :
        d.type === "AFFIRMED" ? "var(--verified)" :
        d.type === "DISTINGUISHED" ? "var(--weak)" : "var(--border-emphasis)")
      .attr("stroke-width", (d) => d.type === "OVERRULED_BY" ? 2.5 : 1.2)
      .attr("stroke-opacity", 0.85)
      .attr("stroke-dasharray", (d) => d.type === "DISTINGUISHED" ? "4,3" : null);

    const node = g.append("g").selectAll<SVGGElement, Node>("g").data(nodesData).join("g").style("cursor", "pointer")
      .on("click", (_, d) => setSelected(LANDMARK_CASES.find((c) => c.id === d.id) ?? null));

    const drag = d3.drag<SVGGElement, Node>()
      .on("start", (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on("end", (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });
    node.call(drag);

    node.append("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (d) =>
        d.status === "overruled"
          ? "var(--overruled)"
          : colorMode === "court"
            ? courtColor(d.courtTier)
            : categoryColor(d.group))
      .attr("stroke", "var(--background)")
      .attr("stroke-width", 2)
      .attr("opacity", 0.92);

    node.append("text")
      .text((d) => d.name.split(" v. ")[0])
      .attr("text-anchor", "middle")
      .attr("dy", (d) => d.r + 12)
      .attr("font-size", 10)
      .attr("font-family", "Inter")
      .attr("fill", "var(--foreground)")
      .attr("opacity", 0.85);

    node.append("text")
      .text((d) => d.year)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => d.r + 22)
      .attr("font-size", 9)
      .attr("font-family", "JetBrains Mono")
      .attr("fill", "var(--muted-foreground)");

    node.append("title").text((d) => `${d.name} (${d.year})\n${d.citation}\n${d.court} · ${courtLabel(d.courtTier)}\n${d.principle}`);

    sim.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as Node).x!)
        .attr("y1", (d) => (d.source as Node).y!)
        .attr("x2", (d) => (d.target as Node).x!)
        .attr("y2", (d) => (d.target as Node).y!);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => { sim.stop(); };
  }, [nodes, links, colorMode]);

  const zoomBy = (k: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy as never, k);
  };
  const resetZoom = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(400).call(zoomRef.current.transform as never, d3.zoomIdentity);
  };

  const filteredCases = [...LANDMARK_CASES, ...aiCases].filter((c) =>
    !query || c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="dark bg-background text-foreground min-h-screen">
      <PageHeader
        eyebrow="Visual Intelligence"
        title="Knowledge Graph Explorer"
        subtitle={`${stats.cases} landmark Indian cases · ${stats.case_citations || "60+"} verified citation relationships · drag, zoom, click any node.`}
      />

      <div className="grid grid-cols-12 gap-0">
        {/* Presets rail */}
        <aside className="col-span-12 lg:col-span-2 border-r border-border/60 p-4 space-y-1.5 max-h-[calc(100vh-220px)] overflow-y-auto">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-2">Presets</div>
          {PRESETS.map((p) => (
            <button
              key={p.id} onClick={() => setPreset(p.id)}
              className={`w-full text-left rounded-md px-2.5 py-2 text-[12px] transition ${
                preset === p.id ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
              }`}
            >
              {p.label}
            </button>
          ))}
          <div className="mt-6 pt-4 border-t border-border/60">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Color nodes by</div>
            <div className="grid grid-cols-2 gap-1 rounded-md bg-background/60 p-1 border border-border mb-3">
              {(["category", "court"] as const).map((m) => (
                <button
                  key={m} onClick={() => setColorMode(m)}
                  className={`text-[11px] py-1.5 rounded transition ${colorMode === m ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {m === "category" ? "Category" : "Court"}
                </button>
              ))}
            </div>
            {colorMode === "category" ? (
              <ul className="space-y-1.5 text-[11px]">
                <Legend dot={categoryColor("Constitutional")} label="Constitutional" />
                <Legend dot={categoryColor("Criminal")} label="Criminal" />
                <Legend dot={categoryColor("Fundamental Rights")} label="Fundamental Rights" />
                <Legend dot={categoryColor("Family")} label="Family" />
                <Legend dot={categoryColor("Environment")} label="Environmental" />
                <Legend dot="var(--overruled)" label="Overruled" />
              </ul>
            ) : (
              <ul className="space-y-1.5 text-[11px]">
                <Legend dot={courtColor("SC")} label="Supreme Court" />
                <Legend dot={courtColor("HC")} label="High Court" />
                <Legend dot={courtColor("Tribunal")} label="Tribunal (NCLT/NCLAT/NGT)" />
                <Legend dot={courtColor("District")} label="District / Subordinate" />
                <Legend dot="var(--overruled)" label="Overruled" />
              </ul>
            )}
            <ul className="space-y-1.5 text-[11px] mt-3 pt-3 border-t border-border/60">
              <li className="text-muted-foreground">Edges</li>
              <Legend line="var(--border-emphasis)" label="Cites" />
              <Legend line="var(--overruled)" label="Overruled by" thick />
              <Legend line="var(--verified)" label="Affirms" />
              <Legend line="var(--weak)" label="Distinguishes" dashed />
            </ul>
          </div>
        </aside>


        {/* Graph */}
        <div ref={containerRef} className="col-span-12 lg:col-span-7 relative bg-black h-[calc(100vh-220px)] min-h-[560px] rounded-xl overflow-hidden">
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2">
            <div className="flex-1 max-w-sm">
              <AISearchBar
                context="graph"
                placeholder="Find case in graph, or ask AI for any landmark…"
                value={query}
                onValueChange={setQuery}
                localResults={filteredCases.slice(0, 6).map((c) => ({
                  id: c.id,
                  label: `${c.name} (${c.year})`,
                  sub: c.citation,
                  onPick: () => { setSelected(c); setQuery(""); },
                }))}
                onSelect={(sel) => {
                  if (sel.kind === "case" && sel.case) {
                    const ai = sel.case;
                    const m = LANDMARK_CASES.find((c) => c.name.toLowerCase().includes(ai.name.toLowerCase().split(" v.")[0].slice(0, 12)));
                    if (m) { setSelected(m); return; }
                    // not in seed — add as a dynamic AI node
                    const id = "ai-" + ai.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
                    if (aiCases.some((c) => c.id === id)) { setSelected(aiCases.find(c => c.id === id) ?? null); return; }
                    const newCase: LandmarkCase = {
                      id, name: ai.name, year: parseInt(ai.year) || new Date().getFullYear(),
                      citation: ai.citation, court: ai.court,
                      courtTier: ai.court.includes("Supreme") ? "SC" : "HC",
                      bench: "—", category: "Constitutional",
                      principle: ai.snippet || "AI-identified landmark",
                      holding: ai.snippet || "Added dynamically by AI search.",
                      status: "landmark", citedBy: 0,
                    };
                    setAiCases((arr) => [...arr, newCase]);
                    setSelected(newCase);
                    toast.success(`AI added node: ${ai.name}`);
                  }
                }}
              />
            </div>

            <div className="ml-auto flex gap-1">
              <Button size="icon" variant="outline" onClick={() => zoomBy(1.3)} className="h-8 w-8 border-border bg-background/80"><ZoomIn className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="outline" onClick={() => zoomBy(1 / 1.3)} className="h-8 w-8 border-border bg-background/80"><ZoomOut className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="outline" onClick={resetZoom} className="h-8 w-8 border-border bg-background/80"><RotateCcw className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          <svg ref={svgRef} className="w-full h-full" />
          <div className="absolute bottom-3 left-3 text-[10px] font-mono text-muted-foreground bg-background/70 backdrop-blur rounded px-2 py-1">
            {nodes.length} nodes · {links.length} edges · drag to reposition · scroll to zoom
          </div>
        </div>

        {/* Detail panel */}
        <aside className="col-span-12 lg:col-span-3 border-l border-border/60 p-5 max-h-[calc(100vh-220px)] overflow-y-auto">
          {selected ? (
            <div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground mb-3">
                <X className="h-4 w-4" />
              </button>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary/80">{selected.category}</div>
              <h3 className="font-display text-xl font-bold mt-1 leading-tight">{selected.name}</h3>
              <div className="legal-mono text-primary/85 mt-2">{selected.citation}</div>
              <div className="text-[11.5px] text-muted-foreground mt-1">{selected.court} · {selected.bench}</div>

              <div className="mt-4 paper rounded-md p-4 text-[13px] leading-relaxed font-serif">
                <div className="text-[10px] font-mono uppercase tracking-wider text-paper-ink/60 mb-1">Holding</div>
                <div>{selected.holding}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-paper-ink/60 mt-3 mb-1">Principle</div>
                <div className="italic">{selected.principle}</div>
              </div>

              <div className="mt-4">
                {!aiExplain ? (
                  <Button onClick={async () => {
                    setAiLoading(true); setAiExplain(null);
                    try {
                      const r = await runExplain({ data: { caseName: selected.name, citation: selected.citation, principle: selected.principle } });
                      setAiExplain(r);
                    } catch (e) {
                      const msg = e instanceof Error ? e.message : (typeof e === "string" ? e : "Unknown error");
                      toast.error("AI Explain failed", { description: msg.slice(0, 180) });
                      console.error("AI Explain error:", e);
                    } finally { setAiLoading(false); }
                  }} disabled={aiLoading} size="sm" className="gold-gradient text-paper-ink gap-1.5 w-full">
                    {aiLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…</> : <><Sparkles className="h-3.5 w-3.5" /> AI Explain</>}
                  </Button>
                ) : (
                  <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-2 text-[12.5px]">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-0.5">Plain summary</div>
                      <p className="text-foreground/85">{aiExplain.plainSummary}</p>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-0.5">Why it matters</div>
                      <p className="text-foreground/85">{aiExplain.whyItMatters}</p>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-0.5">Modern relevance</div>
                      <p className="text-foreground/85">{aiExplain.modernRelevance}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Citation network</div>

              <ul className="mt-2 space-y-1.5 text-[12px]">
                {GRAPH_EDGES
                  .filter((e) => e.from === selected.id || e.to === selected.id)
                  .slice(0, 8)
                  .map((e, i) => {
                    const other = LANDMARK_CASES.find((c) => c.id === (e.from === selected.id ? e.to : e.from));
                    if (!other) return null;
                    return (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className={`mt-0.5 text-[10px] font-mono uppercase tracking-wider ${
                          e.type === "OVERRULED_BY" ? "text-overruled" :
                          e.type === "AFFIRMED" ? "text-verified" :
                          e.type === "DISTINGUISHED" ? "text-weak" : "text-muted-foreground"
                        }`}>{e.from === selected.id ? "→" : "←"} {e.type}</span>
                        <button onClick={() => setSelected(other)} className="text-left text-foreground/85 hover:text-primary">
                          {other.name} ({other.year})
                        </button>
                      </li>
                    );
                  })}
              </ul>

              {/* Related cases (AI) */}
              <div className="mt-5 pt-4 border-t border-border/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-primary/90 inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Related Cases · AI
                  </div>
                  {!related && !relatedLoading && (
                    <button
                      onClick={async () => {
                        setRelatedLoading(true);
                        try {
                          const r = await findSimilar({ data: { caseName: selected.name, context: selected.principle } });
                          setRelated(r);
                        } catch (e) {
                          const msg = e instanceof Error ? e.message : (typeof e === "string" ? e : "Unknown error");
                          toast.error("AI lookup failed", { description: msg.slice(0, 180) });
                          console.error("findSimilar error:", e);
                        }
                        finally { setRelatedLoading(false); }
                      }}
                      className="text-[11px] text-primary hover:underline"
                    >Find related</button>
                  )}
                </div>
                {relatedLoading && <div className="text-[11px] text-muted-foreground"><Loader2 className="h-3 w-3 inline animate-spin mr-1" />Searching corpus…</div>}
                {related && (
                  <ul className="space-y-1.5 text-[11.5px]">
                    {related.slice(0, 5).map((r, i) => (
                      <li key={i} className="rounded-md border border-border bg-background/40 p-2">
                        <div className="font-medium text-foreground/90 leading-snug">{r.name}</div>
                        <div className="legal-mono text-primary/80 text-[10.5px]">{r.citation} · {r.year}</div>
                        <div className="text-[10.5px] text-muted-foreground italic mt-0.5">{r.reason}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

          ) : (
            <div className="text-center text-muted-foreground mt-12">
              <div className="text-[11px] font-mono uppercase tracking-[0.18em]">No selection</div>
              <p className="mt-3 text-[13px]">Click any node in the graph to inspect its citation network, holding, and principle.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Legend({ dot, line, label, thick, dashed }: { dot?: string; line?: string; label: string; thick?: boolean; dashed?: boolean }) {
  return (
    <li className="flex items-center gap-2 text-foreground/80">
      {dot && <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} />}
      {line && (
        <svg width="20" height="6" className="flex-shrink-0">
          <line x1="0" y1="3" x2="20" y2="3" stroke={line} strokeWidth={thick ? 2 : 1} strokeDasharray={dashed ? "3,2" : undefined} />
        </svg>
      )}
      {label}
    </li>
  );
}
