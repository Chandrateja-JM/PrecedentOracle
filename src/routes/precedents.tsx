import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronRight, ExternalLink, Bookmark, Filter } from "lucide-react";
import { PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { LANDMARK_CASES, type LandmarkCase } from "@/lib/seed-data";
import { AISearchBar } from "@/components/ai-search-bar";
import { useCorpusStats } from "@/lib/use-corpus-stats";
import { toast } from "sonner";


export const Route = createFileRoute("/precedents")({
  head: () => ({
    meta: [{ title: "Precedent Explorer — PrecedentOracle" },
      { name: "description", content: "Search the indexed corpus of Indian judgments." }],
  }),
  component: PrecedentExplorer,
});


function PrecedentExplorer() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<LandmarkCase>(LANDMARK_CASES[0]);
  const [category, setCategory] = useState<string>("All");
  const [aiResults, setAiResults] = useState<LandmarkCase[]>([]);
  const stats = useCorpusStats();

  const allCases = useMemo(() => [...LANDMARK_CASES, ...aiResults], [aiResults]);
  const categories = useMemo(() => ["All", ...Array.from(new Set(allCases.map((c) => c.category)))], [allCases]);
  const results = useMemo(() => allCases.filter((c) => {
    const matchQ = !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.principle.toLowerCase().includes(q.toLowerCase());
    const matchC = category === "All" || c.category === category;
    return matchQ && matchC;
  }), [q, category, allCases]);

  const localMatches = useMemo(() => results.slice(0, 5).map((c) => ({
    id: c.id,
    label: c.name,
    sub: `${c.citation} · ${c.court}`,
    onPick: () => { setSelected(c); setQ(""); },
  })), [results]);

  return (
    <div>
      <PageHeader eyebrow="Corpus" title="Precedent Explorer" subtitle={`${stats.cases} landmark Indian judgments indexed · ${stats.judges} judges · ${stats.statutes} statutes. Search, filter, and open into the Knowledge Graph.`} />

      <div className="px-8 py-5 border-b border-border/60">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[260px] max-w-xl">
            <AISearchBar
              context="cases"
              placeholder="Search corpus, or ask AI to identify any Indian case…"
              value={q}
              onValueChange={setQ}
              localResults={localMatches}
              onSelect={(sel) => {
                if (sel.kind === "case" && sel.case) {
                  const ai = sel.case;
                  const match = LANDMARK_CASES.find((c) =>
                    c.name.toLowerCase().includes(ai.name.toLowerCase().split(" v.")[0]) ||
                    ai.name.toLowerCase().includes(c.name.toLowerCase().split(" v.")[0])
                  );
                  if (match) { setSelected(match); toast.success(`Found: ${match.name}`); return; }
                  const id = "ai-" + ai.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
                  const exists = aiResults.find((c) => c.id === id);
                  if (exists) { setSelected(exists); return; }
                  const newCase: LandmarkCase = {
                    id, name: ai.name, year: parseInt(ai.year) || 0,
                    citation: ai.citation, court: ai.court,
                    courtTier: ai.court.includes("Supreme") ? "SC" : "HC",
                    bench: "—", category: "AI Result",
                    principle: ai.snippet || "—", holding: ai.snippet || "AI-identified case.",
                    status: "active", citedBy: 0,
                  };
                  setAiResults((arr) => [...arr, newCase]);
                  setSelected(newCase);
                  setQ("");
                  toast.success(`AI added: ${ai.name}`);
                }
              }}

            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {categories.slice(0, 8).map((c) => (
              <button
                key={c} onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1 text-[11.5px] border transition ${
                  category === c ? "bg-primary/15 text-primary border-primary/40" : "border-border bg-surface/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="ml-auto text-[11px] font-mono text-muted-foreground">{results.length} results</div>
        </div>
      </div>



      <div className="grid grid-cols-12 gap-5 p-8">
        <div className="col-span-12 lg:col-span-7 space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {results.map((c) => (
            <button
              key={c.id} onClick={() => setSelected(c)}
              className={`w-full text-left glass rounded-lg p-4 hover:border-primary/40 transition ${
                selected.id === c.id ? "border-primary/50 shadow-gold-glow" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-primary/80">{c.category}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="legal-mono text-muted-foreground">{c.court}</span>
                  </div>
                  <div className="font-display text-[16px] font-semibold leading-snug">{c.name}</div>
                  <div className="legal-mono text-primary/80 mt-1">{c.citation}</div>
                  <div className="text-[12.5px] text-muted-foreground mt-2 line-clamp-2 font-serif">{c.holding}</div>
                  <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[10.5px]">
                    {c.status === "landmark" && <Badge tone="primary">★ Landmark</Badge>}
                    {c.status === "overruled" && <Badge tone="overruled">Overruled</Badge>}
                    {c.status === "active" && <Badge tone="verified">Active</Badge>}
                    <Badge tone="muted">{c.year}</Badge>
                    <Badge tone="muted">Cited {c.citedBy ?? "—"}×</Badge>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>

        <aside className="col-span-12 lg:col-span-5">
          <div className="glass rounded-xl p-5 sticky top-20">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary/80">{selected.category}</div>
            <h2 className="font-display text-2xl font-bold mt-1 leading-tight">{selected.name}</h2>
            <div className="legal-mono text-primary/85 mt-2">{selected.citation}</div>
            <div className="text-[12px] text-muted-foreground mt-1">{selected.court} · {selected.bench} · {selected.year}</div>

            <div className="mt-4 flex items-center gap-1.5">
              {selected.status === "overruled" && <Badge tone="overruled">Overruled</Badge>}
              {selected.status === "landmark" && <Badge tone="primary">★ Landmark</Badge>}
              {selected.status === "active" && <Badge tone="verified">Active</Badge>}
            </div>

            <div className="mt-5 paper rounded-md p-4 text-[13.5px] leading-relaxed">
              <div className="text-[10px] font-mono uppercase tracking-wider text-paper-ink/60 mb-1">Holding</div>
              <div className="font-serif">{selected.holding}</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-paper-ink/60 mt-3 mb-1">Principle</div>
              <div className="font-serif italic">{selected.principle}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="border-border"><Bookmark className="h-3 w-3 mr-1" />Save</Button>
              <Button asChild variant="outline" size="sm" className="border-border">
                <a href="/graph">Open in Graph</a>
              </Button>
              <Button asChild size="sm" className="col-span-2 gold-gradient border-0">
                <a href="https://indiankanoon.org" target="_blank" rel="noreferrer">Read on Indian Kanoon <ExternalLink className="h-3 w-3 ml-1.5" /></a>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "primary" | "verified" | "overruled" | "muted" }) {
  const cls = {
    primary: "bg-primary/15 text-primary border-primary/30",
    verified: "bg-verified/15 text-verified border-verified/30",
    overruled: "bg-overruled/15 text-overruled border-overruled/40",
    muted: "bg-muted text-muted-foreground border-border",
  }[tone];
  return <span className={`rounded-full border px-2 py-0.5 ${cls}`}>{children}</span>;
}
