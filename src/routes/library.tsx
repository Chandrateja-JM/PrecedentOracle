import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, BookOpen, ExternalLink, Languages, Sparkles, Loader2, Download, GitCompare, AlertTriangle, X } from "lucide-react";
import { PageHeader } from "@/components/page-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BARE_ACTS, IPC_BNS_MAP, type BareAct } from "@/lib/seed-data";
import { useServerFn } from "@tanstack/react-start";
import { explainSection } from "@/lib/ai.functions";
import { exportBareActPdf } from "@/lib/pdf-export";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { AISearchBar } from "@/components/ai-search-bar";


export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "Bare Acts Library — PrecedentOracle" },
    { name: "description", content: "Every Indian law, searchable and citable. Live from India Code." }] }),
  component: LibraryPage,
});

function LibraryPage() {
  const [act, setAct] = useState<BareAct | null>(null);
  const [q, setQ] = useState("");
  const [compareOpen, setCompareOpen] = useState(false);

  const grouped = useMemo(() => {
    const g: Record<string, BareAct[]> = {};
    BARE_ACTS.filter((a) => !q || a.name.toLowerCase().includes(q.toLowerCase()) || a.shortName.toLowerCase().includes(q.toLowerCase()))
      .forEach((a) => { (g[a.category] ??= []).push(a); });
    return g;
  }, [q]);

  if (act) return <ActDetail act={act} back={() => setAct(null)} onOpenCompare={() => setCompareOpen(true)} compareOpen={compareOpen} closeCompare={() => setCompareOpen(false)} />;

  return (
    <div className="relative">
      {/* Indian law-book background — fades behind content */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=1600&q=70)',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/60 via-background/85 to-background pointer-events-none" />
      <PageHeader
        eyebrow="Live from India Code"
        title="Every Indian Law. Searchable. Citable."
        subtitle="Plain language explanations · Hindi translations · Knowledge Graph linkage"
        actions={
          <Button variant="outline" className="border-border gap-2" onClick={() => setCompareOpen(true)}>
            <GitCompare className="h-4 w-4" /> Compare Acts
          </Button>
        }
      />
      <div className="px-8 py-6">

        <AISearchBar
          context="statutes"
          placeholder="Search acts, sections, or ask 'what is the punishment for theft'…"
          value={q}
          onValueChange={setQ}
          className="max-w-xl"
          onSelect={(sel) => {
            if (sel.kind === "statute" && sel.statute) {
              const found = BARE_ACTS.find((a) =>
                a.shortName.toLowerCase().includes(sel.statute!.act.toLowerCase()) ||
                sel.statute!.act.toLowerCase().includes(a.shortName.toLowerCase())
              );
              if (found) setAct(found);
              else toast.info(`${sel.statute.act} ${sel.statute.section} — ${sel.statute.title}`, { description: sel.statute.snippet });
            }
          }}
        />


        {Object.entries(grouped).map(([cat, acts]) => (
          <section key={cat} className="mt-8">
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-primary/80 mb-3">{cat}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {acts.map((a) => (
                <button
                  key={a.id} onClick={() => setAct(a)}
                  className="text-left glass rounded-lg p-4 hover:border-primary/40 hover:shadow-gold-glow transition group"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg gold-gradient flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-[15px] font-semibold leading-snug group-hover:text-primary transition">{a.shortName}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{a.name}</div>
                      <div className="text-[10.5px] font-mono text-muted-foreground/70 mt-1.5">{a.year} · {a.sectionsCount} sections</div>
                    </div>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-3 line-clamp-2">{a.description}</p>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      {compareOpen && <CompareModal onClose={() => setCompareOpen(false)} />}
    </div>
  );
}

type Explanation = { plainLanguage: string; example: string; relatedCases: string[] } | null;

function ActDetail({ act, back, onOpenCompare, compareOpen, closeCompare }: { act: BareAct; back: () => void; onOpenCompare: () => void; compareOpen: boolean; closeCompare: () => void }) {
  const explainFn = useServerFn(explainSection);
  const [explanations, setExplanations] = useState<Record<string, Explanation>>({});
  const [loading, setLoading] = useState<Record<string, "en" | "hi" | null>>({});
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return act.keySections;
    const term = search.toLowerCase();
    return act.keySections.filter(s =>
      s.number.toLowerCase().includes(term) ||
      s.title.toLowerCase().includes(term) ||
      s.text.toLowerCase().includes(term)
    );
  }, [search, act.keySections]);

  const isLegacy = act.category.includes("Legacy");

  async function explain(section: { number: string; title: string; text: string }, language: "en" | "hi") {
    const key = `${section.number}-${language}`;
    setLoading((l) => ({ ...l, [section.number]: language }));
    try {
      const result = await explainFn({
        data: { actName: act.shortName, sectionNumber: section.number, sectionTitle: section.title, sectionText: section.text, language },
      });
      setExplanations((s) => ({ ...s, [key]: result }));
    } catch (e) {
      toast.error("AI explanation failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setLoading((l) => ({ ...l, [section.number]: null }));
    }
  }

  function downloadPdf() {
    exportBareActPdf({ shortName: act.shortName, fullName: act.name, year: act.year, sections: act.keySections });
    toast.success("PDF generated", { description: `${act.shortName} downloaded as a styled bare-act PDF` });
  }

  function highlight(text: string) {
    if (!search.trim()) return text;
    const parts = text.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((p, i) =>
      p.toLowerCase() === search.toLowerCase()
        ? <mark key={i} className="bg-primary/30 text-paper-ink rounded-sm px-0.5">{p}</mark>
        : <span key={i}>{p}</span>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={act.category}
        title={act.shortName}
        subtitle={act.name + " · " + act.year}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={back} className="border-border">← Back</Button>
            <Button variant="outline" onClick={onOpenCompare} className="border-border gap-1.5"><GitCompare className="h-4 w-4" /> Compare</Button>
            <Button onClick={downloadPdf} className="gold-gradient border-0 gap-1.5"><Download className="h-4 w-4" /> Download PDF</Button>
          </div>
        }
      />

      {isLegacy && (
        <div className="mx-8 mt-4 rounded-md border border-overruled/40 bg-overruled/10 px-4 py-2.5 text-[12.5px] text-overruled flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Superseded statute.</strong> This Act has been superseded by the 2023 reforms (BNS / BNSS / BSA) with effect from 01.07.2024.
            Applicable only to offences/proceedings initiated before that date.
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-5 px-8 py-6">
        <aside className="col-span-12 lg:col-span-3 sticky top-20 self-start">
          <div className="glass rounded-xl p-4">
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search within act…"
                className="pl-8 h-9 text-[12.5px] bg-background/60 border-border" />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
              Table of contents {search && `· ${filtered.length} match`}
            </div>
            <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
              {filtered.map((s) => (
                <li key={s.number}>
                  <a href={`#${s.number.replace(/[^\w]/g, "-")}`} className="block text-[12.5px] text-foreground/80 hover:text-primary py-1">
                    <span className="font-mono text-[11px] text-primary/70 mr-1">{s.number}</span> {s.title}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-border/60 text-[11px] text-muted-foreground">
              Source: {act.source}
            </div>
          </div>
        </aside>

        <article className="col-span-12 lg:col-span-9 space-y-4">
          {filtered.map((s) => {
            const enKey = `${s.number}-en`;
            const hiKey = `${s.number}-hi`;
            const en = explanations[enKey];
            const hi = explanations[hiKey];
            const loadingLang = loading[s.number];
            return (
              <section key={s.number} id={s.number.replace(/[^\w]/g, "-")} className="paper rounded-xl p-7 shadow-elev-2">
                <div className="flex items-baseline justify-between mb-2 gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-display text-3xl font-bold text-paper-ink">{s.number}</div>
                    <div className="font-display text-base text-paper-ink/80 mt-0.5">{highlight(s.title)}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => explain(s, "en")}
                      disabled={loadingLang === "en"}
                      className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
                        en ? "border-primary/50 bg-primary/15 text-primary" : "border-paper-ink/20 text-paper-ink/70 hover:bg-paper-ink/5"
                      } disabled:opacity-60`}
                    >
                      {loadingLang === "en"
                        ? <><Loader2 className="h-3 w-3 inline mr-1 animate-spin" /> Plain</>
                        : <><Sparkles className="h-3 w-3 inline mr-1" /> Plain Language</>}
                    </button>
                    <button
                      onClick={() => explain(s, "hi")}
                      disabled={loadingLang === "hi"}
                      className={`rounded-md border px-2.5 py-1 text-[11px] transition ${
                        hi ? "border-primary/50 bg-primary/15 text-primary" : "border-paper-ink/20 text-paper-ink/70 hover:bg-paper-ink/5"
                      } disabled:opacity-60`}
                    >
                      {loadingLang === "hi"
                        ? <><Loader2 className="h-3 w-3 inline mr-1 animate-spin" /> हिंदी</>
                        : <><Languages className="h-3 w-3 inline mr-1" /> हिंदी</>}
                    </button>
                  </div>
                </div>
                <p className="font-serif text-[15px] leading-relaxed text-paper-ink mt-4">{highlight(s.text)}</p>

                {(en || hi) && (
                  <div className="mt-4 space-y-3">
                    {en && (
                      <div className="rounded-md border-l-2 border-primary/60 bg-primary/5 p-3 text-[13px] text-paper-ink/90">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">AI explanation · English</div>
                        <p>{en.plainLanguage}</p>
                        <p className="mt-2 italic text-paper-ink/75"><strong className="not-italic">Example:</strong> {en.example}</p>
                        {en.relatedCases.length > 0 && (
                          <div className="mt-2 text-[11.5px]"><strong>Related:</strong> {en.relatedCases.join(" · ")}</div>
                        )}
                      </div>
                    )}
                    {hi && (
                      <div className="rounded-md border-l-2 border-primary/60 bg-primary/5 p-3 text-[13px] text-paper-ink/90 font-serif">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">AI व्याख्या · हिंदी</div>
                        <p>{hi.plainLanguage}</p>
                        <p className="mt-2 italic text-paper-ink/75"><strong className="not-italic">उदाहरण:</strong> {hi.example}</p>
                        {hi.relatedCases.length > 0 && (
                          <div className="mt-2 text-[11.5px]"><strong>संबंधित:</strong> {hi.relatedCases.join(" · ")}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-5 pt-4 border-t border-paper-ink/15 flex items-center justify-between text-[11.5px] text-paper-ink/70 flex-wrap gap-2">
                  <Link to="/graph" className="hover:text-paper-ink inline-flex items-center gap-1">
                    Cases citing this section <ExternalLink className="h-3 w-3" />
                  </Link>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${act.shortName}, ${s.number}, "${s.title}"`);
                      toast.success("Citation copied");
                    }}
                    className="font-mono text-[10.5px] uppercase tracking-wider hover:text-paper-ink"
                  >
                    Cite this section
                  </button>
                </div>
              </section>
            );
          })}
          {filtered.length === 0 && (
            <div className="paper rounded-xl p-10 text-center text-paper-ink/60">
              No sections match "<strong>{search}</strong>" in {act.shortName}.
            </div>
          )}
        </article>
      </div>
      {compareOpen && <CompareModal onClose={closeCompare} />}
    </div>
  );
}

function CompareModal({ onClose }: { onClose: () => void }) {
  const [pair, setPair] = useState(IPC_BNS_MAP[0]);
  const ipcAct = BARE_ACTS.find(a => a.id === "ipc-1860")!;
  const bnsAct = BARE_ACTS.find(a => a.id === "bns-2023")!;
  const ipcSection = ipcAct.keySections.find(s => s.number === pair.ipc);
  const bnsSection = bnsAct.keySections.find(s => s.number === pair.bns);

  return (
    <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-strong rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">Compare Acts</div>
            <h2 className="font-display text-xl font-bold">IPC, 1860 ↔ Bharatiya Nyaya Sanhita, 2023</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1.5 hover:bg-surface"><X className="h-4 w-4" /></button>
        </header>
        <div className="px-6 py-4 border-b border-border/60">
          <div className="flex gap-2 flex-wrap">
            {IPC_BNS_MAP.map((m) => (
              <button key={m.ipc} onClick={() => setPair(m)}
                className={`rounded-full border px-3 py-1 text-[11.5px] transition ${
                  pair.ipc === m.ipc ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                }`}>
                {m.ipc} ↔ {m.bns}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          <div className="paper rounded-xl p-6 shadow-elev-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-overruled mb-2">IPC, 1860 (Legacy)</div>
            <div className="font-display text-2xl font-bold text-paper-ink">{pair.ipc}</div>
            <div className="font-display text-sm text-paper-ink/80 mt-1">{pair.ipcTitle}</div>
            <p className="font-serif text-[13.5px] leading-relaxed text-paper-ink mt-4">
              {ipcSection?.text ?? "Not in seed library."}
            </p>
          </div>
          <div className="paper rounded-xl p-6 shadow-elev-2 ring-1 ring-primary/30">
            <div className="text-[10px] font-mono uppercase tracking-wider text-verified mb-2">BNS, 2023 (In force)</div>
            <div className="font-display text-2xl font-bold text-paper-ink">{pair.bns}</div>
            <div className="font-display text-sm text-paper-ink/80 mt-1">{pair.bnsTitle}</div>
            <p className="font-serif text-[13.5px] leading-relaxed text-paper-ink mt-4">
              {bnsSection?.text ?? "Not in seed library."}
            </p>
          </div>
        </div>
        <div className="px-6 pb-6 -mt-2">
          <div className="rounded-md border-l-2 border-primary/60 bg-primary/5 px-4 py-3 text-[12.5px] text-foreground/85">
            <strong className="text-primary">Mapping note:</strong> {pair.note}
          </div>
        </div>
      </div>
    </div>
  );
}
