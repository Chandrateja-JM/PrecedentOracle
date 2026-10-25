import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid,
} from "recharts";
import { PageHeader } from "@/components/page-shell";
import { JUDGES, type JudgeProfile } from "@/lib/seed-data";
import { Info, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { judgeInsights } from "@/lib/ai.functions";
import { AISearchBar } from "@/components/ai-search-bar";
import { toast } from "sonner";


export const Route = createFileRoute("/judges")({
  head: () => ({ meta: [{ title: "Judge Analytics — PrecedentOracle" },
    { name: "description", content: "Statistical profiling of Indian judges. Public data only. No bias prediction." }] }),
  component: JudgesPage,
});



const COLORS = ["#C9A84C", "#4A90D9", "#16A34A", "#D97706", "#9F7AEA"];

function JudgesPage() {
  const [selected, setSelected] = useState<JudgeProfile>(JUDGES[0]);
  const [query, setQuery] = useState("");
  const [insights, setInsights] = useState<{ observations: string[]; preparationTips: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const runInsights = useServerFn(judgeInsights);

  const visibleJudges = JUDGES.filter((j) =>
    !query || j.name.toLowerCase().includes(query.toLowerCase()) || j.court.toLowerCase().includes(query.toLowerCase())
  );

  const handleInsights = async () => {
    setLoading(true); setInsights(null);
    try {
      const r = await runInsights({ data: { judgeName: selected.name, court: selected.court } });
      setInsights(r);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Statistical Profiling"
        title="Judge Analytics"
        subtitle="Public judgment data only. Statistical observations — not bias prediction, not future-decision prediction."
      />

      <div className="grid grid-cols-12 gap-5 px-8 py-6">
        <aside className="col-span-12 lg:col-span-3 space-y-2">
          <div className="mb-3">
            <AISearchBar
              context="judges"
              placeholder="Search any Indian judge…"
              value={query}
              onValueChange={setQuery}
              onSelect={(sel) => {
                if (sel.kind === "judge" && sel.judge) {
                  const m = JUDGES.find((j) => j.name.toLowerCase().includes(sel.judge!.name.toLowerCase()) || sel.judge!.name.toLowerCase().includes(j.name.toLowerCase()));
                  if (m) { setSelected(m); setInsights(null); }
                  else toast.info(sel.judge.name, { description: `${sel.judge.court} · ${sel.judge.tenure}` });
                }
              }}
            />
          </div>

          {visibleJudges.map((j) => (
            <button
              key={j.id} onClick={() => { setSelected(j); setInsights(null); }}
              className={`w-full text-left glass rounded-lg p-3 flex items-center gap-3 transition ${
                selected.id === j.id ? "border-primary/50" : "hover:border-primary/30"
              }`}
            >
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary/50 to-primary/15 flex items-center justify-center font-mono text-[13px] font-semibold flex-shrink-0">
                {j.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium truncate">{j.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{j.court}</div>
              </div>
            </button>
          ))}
        </aside>

        <section className="col-span-12 lg:col-span-9 space-y-5">
          <div className="glass rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/50 to-primary/10 flex items-center justify-center font-display text-2xl font-bold flex-shrink-0">
                {selected.initials}
              </div>
              <div>
                <h2 className="font-display text-3xl font-bold">{selected.name}</h2>
                <div className="text-[13px] text-muted-foreground mt-1">{selected.court} · {selected.tenure}</div>
                <p className="text-[13.5px] text-foreground/85 mt-3 max-w-2xl font-serif leading-relaxed">{selected.bio}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-6">
              <Stat label="Total judgments" value={selected.totalJudgments} />
              <Stat label="Landmark count" value={selected.landmarkCount} />
              <Stat label="Avg. per year" value={Math.round(selected.totalJudgments / selected.yearly.length)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="glass rounded-xl p-5">
              <div className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground mb-3">By case type</div>
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={selected.caseTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                      {selected.caseTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-2 text-[11px]">
                {selected.caseTypes.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-foreground/85">{c.name}</span>
                    <span className="ml-auto font-mono text-muted-foreground">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-xl p-5">
              <div className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground mb-3">Yearly activity</div>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={selected.yearly}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--primary)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground mb-3">Disposal pattern</div>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={selected.caseTypes}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} cursor={{ fill: "var(--accent)" }} />
                  <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Notable principles established</div>
            <div className="flex flex-wrap gap-1.5">
              {selected.topPrinciples.map((p) => (
                <span key={p} className="rounded-full bg-primary/10 text-primary border border-primary/30 px-3 py-1 text-[12px]">{p}</span>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" /> AI preparation insights
              </div>
              <Button size="sm" onClick={handleInsights} disabled={loading} className="gold-gradient text-paper-ink gap-1.5 h-7 text-[11.5px]">
                {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Analyzing…</> : <><Sparkles className="h-3 w-3" /> Generate</>}
              </Button>
            </div>
            {!insights && !loading && (
              <p className="text-[12.5px] text-muted-foreground">Click Generate for AI-summarized observations and preparation tips based on public judgment patterns.</p>
            )}
            {insights && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-[10.5px] font-mono uppercase tracking-wider text-primary/80 mb-2">Observations</div>
                  <ul className="space-y-1.5 text-[12.5px]">
                    {insights.observations.map((o, i) => <li key={i} className="flex gap-2"><span className="text-primary/70">·</span>{o}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-[10.5px] font-mono uppercase tracking-wider text-verified mb-2">Preparation tips</div>
                  <ul className="space-y-1.5 text-[12.5px]">
                    {insights.preparationTips.map((t, i) => <li key={i} className="flex gap-2"><span className="text-verified">→</span>{t}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>



          <div className="flex items-start gap-2 rounded-lg border border-border/80 bg-surface/40 p-4 text-[12.5px] text-muted-foreground">
            <Info className="h-4 w-4 text-primary/80 mt-0.5 flex-shrink-0" />
            <p>
              This profile is based on public judgment data. Statistical observations only.
              <strong className="text-foreground/90"> Not a prediction of future decisions. Not a measure of judicial bias.</strong> For research preparation only.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
