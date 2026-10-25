import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search, Loader2, Sparkles, Scale, BookOpen, User, ArrowRight, FileText } from "lucide-react";
import { aiSearch, type AISearchResult } from "@/lib/ai.functions";

export type AIContext = "global" | "cases" | "statutes" | "judges" | "graph" | "research";

export interface AISearchSelection {
  kind: "case" | "statute" | "judge" | "answer" | "page";
  case?: AISearchResult["cases"][number];
  statute?: AISearchResult["statutes"][number];
  judge?: AISearchResult["judges"][number];
  answer?: string;
  page?: { id: string; label: string };
  query: string;
}

interface LocalItem { id: string; label: string; sub?: string; group?: string; onPick: () => void }

interface Props {
  context?: AIContext;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  onSelect?: (sel: AISearchSelection) => void;
  /** Extra non-AI results (e.g. seeded matches or pages). `group` controls section heading. */
  localResults?: LocalItem[];
  floating?: boolean;
  value?: string;
  onValueChange?: (v: string) => void;
}

interface FlatItem {
  key: string;
  group: string;
  render: () => React.ReactNode;
  pick: () => void;
}

export function AISearchBar({
  context = "global",
  placeholder = "Search anything — cases, statutes, judges, sections…",
  className = "",
  inputClassName = "",
  autoFocus,
  onSelect,
  localResults = [],
  floating = true,
  value: controlledValue,
  onValueChange,
}: Props) {
  const navigate = useNavigate();
  const runSearch = useServerFn(aiSearch);
  const [internal, setInternal] = useState("");
  const q = controlledValue ?? internal;
  const setQ = (v: string) => { onValueChange ? onValueChange(v) : setInternal(v); };

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AISearchResult | null>(null);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const lastQuery = useRef("");

  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed.length < 2) { setData(null); setLoading(false); return; }
    if (trimmed === lastQuery.current) return;
    const t = setTimeout(async () => {
      lastQuery.current = trimmed;
      setLoading(true);
      try {
        const res = await runSearch({ data: { query: trimmed, context } });
        setData(res);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [q, context, runSearch]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function doSelect(sel: AISearchSelection) {
    setOpen(false);
    if (onSelect) { onSelect(sel); return; }
    if (sel.kind === "case") navigate({ to: "/precedents" });
    else if (sel.kind === "statute") navigate({ to: "/library" });
    else if (sel.kind === "judge") navigate({ to: "/judges" });
  }

  const flat = useCallback((): FlatItem[] => {
    const items: FlatItem[] = [];
    localResults.forEach((r) => items.push({
      key: `l-${r.id}`,
      group: r.group ?? "Pages",
      render: () => (
        <div className="flex items-center gap-2">
          {r.group === "Cases" ? <Scale className="h-3.5 w-3.5 text-primary/70" /> :
           r.group === "Statutes" ? <BookOpen className="h-3.5 w-3.5 text-muted-foreground" /> :
           r.group === "Judges" ? <User className="h-3.5 w-3.5 text-muted-foreground" /> :
           <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] truncate">{r.label}</div>
            {r.sub && <div className="text-[10.5px] text-muted-foreground truncate">{r.sub}</div>}
          </div>
        </div>
      ),
      pick: r.onPick,
    }));
    if (data?.answer) items.push({
      key: "answer",
      group: "AI Answer",
      render: () => (
        <div className="flex items-start gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-serif text-foreground/90">{data.answer}</div>
          </div>
        </div>
      ),
      pick: () => doSelect({ kind: "answer", answer: data.answer, query: q }),
    });
    data?.cases?.forEach((c, i) => items.push({
      key: `c-${i}`,
      group: "Cases",
      render: () => (
        <div className="flex items-start gap-2">
          <Scale className="h-3.5 w-3.5 text-primary/80 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[12.5px] truncate">{c.name}</span>
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-sm bg-primary/15 text-primary border border-primary/30 flex-shrink-0">AI</span>
            </div>
            <div className="text-[10.5px] font-mono text-muted-foreground truncate">{c.citation} · {c.court} · {c.year}</div>
          </div>
        </div>
      ),
      pick: () => doSelect({ kind: "case", case: c, query: q }),
    }));
    data?.statutes?.forEach((s, i) => items.push({
      key: `s-${i}`,
      group: "Statutes",
      render: () => (
        <div className="flex items-start gap-2">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[12.5px] truncate">{s.act} {s.section} — {s.title}</span>
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-sm bg-primary/15 text-primary border border-primary/30 flex-shrink-0">AI</span>
            </div>
            {s.snippet && <div className="text-[10.5px] text-muted-foreground truncate">{s.snippet}</div>}
          </div>
        </div>
      ),
      pick: () => doSelect({ kind: "statute", statute: s, query: q }),
    }));
    data?.judges?.forEach((j, i) => items.push({
      key: `j-${i}`,
      group: "Judges",
      render: () => (
        <div className="flex items-start gap-2">
          <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[12.5px] truncate">{j.name}</span>
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-sm bg-primary/15 text-primary border border-primary/30 flex-shrink-0">AI</span>
            </div>
            <div className="text-[10.5px] text-muted-foreground truncate">{j.court} · {j.tenure}</div>
          </div>
        </div>
      ),
      pick: () => doSelect({ kind: "judge", judge: j, query: q }),
    }));
    return items;
  }, [data, localResults, q]);

  const items = flat();
  const GROUP_ORDER = ["AI Answer", "Pages", "Cases", "Statutes", "Judges"];
  const grouped: Record<string, FlatItem[]> = {};
  items.forEach((it) => { (grouped[it.group] ??= []).push(it); });

  function onKey(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter" && items[active]) { e.preventDefault(); items[active].pick(); }
    else if (e.key === "Escape") setOpen(false);
  }

  const showDropdown = open && q.trim().length >= 2 && (loading || items.length > 0);

  // build sequential index map for keyboard nav across groups
  let runningIdx = 0;

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-primary" />}
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={placeholder}
          className={`w-full glass rounded-md pl-9 pr-9 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40 ${inputClassName}`}
        />
      </div>

      {showDropdown && (
        <div
          className={`${floating ? "absolute top-full mt-1 left-0 right-0 z-50" : "mt-2"} glass rounded-lg max-h-[60vh] overflow-y-auto shadow-xl border-primary/20`}
        >
          {loading && items.length === 0 && (
            <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-1.5" />
              Searching with AI…
            </div>
          )}
          {GROUP_ORDER.filter((g) => grouped[g]?.length).map((g) => (
            <div key={g}>
              <div className="px-3 pt-2 pb-1 text-[9.5px] font-mono uppercase tracking-[0.18em] text-primary/70 bg-surface/30 sticky top-0">
                {g}
              </div>
              {grouped[g].map((it) => {
                const i = runningIdx++;
                return (
                  <button
                    key={it.key}
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={it.pick}
                    className={`w-full text-left px-3 py-2 border-b border-border/40 last:border-0 transition ${
                      i === active ? "bg-primary/10" : "hover:bg-surface/60"
                    }`}
                  >
                    {it.render()}
                  </button>
                );
              })}
            </div>
          ))}
          {!loading && items.length === 0 && (
            <div className="px-3 py-4 text-[12px] text-muted-foreground">No results.</div>
          )}
          <div className="px-3 py-1.5 text-[10px] font-mono text-muted-foreground/70 border-t border-border/40 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" /> PrecedentOracle AI · ↑↓ Enter
            <ArrowRight className="h-2.5 w-2.5 ml-auto" />
          </div>
        </div>
      )}
    </div>
  );
}
