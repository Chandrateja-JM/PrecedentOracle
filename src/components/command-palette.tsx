import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AISearchBar } from "@/components/ai-search-bar";
import { toast } from "sonner";
import { Search, Globe, ExternalLink, Loader2 } from "lucide-react";

export function CommandPalette({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"ai" | "google">("ai");
  const [googleQuery, setGoogleQuery] = useState("");
  const [googleSearching, setGoogleSearching] = useState(false);
  const [googleResults, setGoogleResults] = useState<Array<{
    title: string; link: string; snippet: string; displayLink: string;
  }> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // Reset on close
  useEffect(() => {
    if (!open) { setGoogleResults(null); setGoogleQuery(""); setMode("ai"); }
  }, [open]);

  const PAGE_HINTS = [
    { kw: ["research", "workspace", "agent"], to: "/research", label: "Research Workspace" },
    { kw: ["precedent", "case", "judgment"], to: "/precedents", label: "Precedent Explorer" },
    { kw: ["citation", "verify"], to: "/citations", label: "Citation Verification" },
    { kw: ["graph", "network"], to: "/graph", label: "Knowledge Graph" },
    { kw: ["library", "act", "section", "statute", "bare"], to: "/library", label: "Bare Acts Library" },
    { kw: ["judge", "bench"], to: "/judges", label: "Judge Analytics" },
    { kw: ["roadmap", "procedure", "timeline"], to: "/roadmap", label: "Procedural Roadmap" },
    { kw: ["report", "studio", "export"], to: "/report", label: "Report Studio" },
    { kw: ["home", "command"], to: "/", label: "Command Center" },
  ];

  const handleGoogleSearch = useCallback(async () => {
    if (!googleQuery.trim()) return;
    setGoogleSearching(true);
    setGoogleResults(null);
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const cx = import.meta.env.VITE_GOOGLE_CSE_ID;
      if (!apiKey || !cx) {
        // Graceful fallback: open search in new tab
        const url = `https://www.google.com/search?q=${encodeURIComponent(googleQuery + " Indian law site:indiankanoon.org OR site:casemine.com")}`;
        window.open(url, "_blank");
        toast.info("Opened Google search in new tab", {
          description: "Add VITE_GOOGLE_API_KEY and VITE_GOOGLE_CSE_ID to .env for inline results",
        });
        onOpenChange(false);
        return;
      }
      const res = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(googleQuery + " Indian law court judgment")}&num=8`
      );
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setGoogleResults(data.items ?? []);
    } catch (e) {
      toast.error("Google search failed", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setGoogleSearching(false);
    }
  }, [googleQuery, onOpenChange]);

  const LEGAL_SITES = [
    { label: "Indian Kanoon", domain: "indiankanoon.org" },
    { label: "CaseMine", domain: "casemine.com" },
    { label: "Judis", domain: "judis.nic.in" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-background/95 backdrop-blur-xl border-primary/30">
        {/* Mode toggle */}
        <div className="flex border-b border-border/50">
          <button
            onClick={() => setMode("ai")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11.5px] font-mono uppercase tracking-wider transition ${
              mode === "ai" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search className="h-3 w-3" /> AI Search
          </button>
          <button
            onClick={() => setMode("google")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11.5px] font-mono uppercase tracking-wider transition ${
              mode === "google" ? "text-blue-400 border-b-2 border-blue-400" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3 w-3" /> Google Search
          </button>
        </div>

        {mode === "ai" && (
          <div className="p-3">
            <AISearchBar
              context="global"
              placeholder="Search cases, statutes, judges, or ask a question…"
              autoFocus
              floating={false}
              localResults={PAGE_HINTS.map((p) => ({
                id: p.to,
                label: p.label,
                sub: p.to,
                onPick: () => { onOpenChange(false); setTimeout(() => navigate({ to: p.to }), 30); },
              }))}
              onSelect={(sel) => {
                onOpenChange(false);
                setTimeout(() => {
                  if (sel.kind === "case") navigate({ to: "/precedents" });
                  else if (sel.kind === "statute") navigate({ to: "/library" });
                  else if (sel.kind === "judge") navigate({ to: "/judges" });
                  else if (sel.kind === "answer" && sel.answer) toast.info("AI", { description: sel.answer });
                }, 30);
              }}
            />
          </div>
        )}

        {mode === "google" && (
          <div className="p-3 space-y-2">
            <div className="flex gap-1.5">
              <input
                autoFocus
                value={googleQuery}
                onChange={(e) => setGoogleQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGoogleSearch()}
                placeholder="Search Indian legal cases, judgments, statutes…"
                className="flex-1 glass rounded-md px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-400/40"
              />
              <button
                onClick={handleGoogleSearch}
                disabled={googleSearching || !googleQuery.trim()}
                className="px-3 py-2 rounded-md bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition disabled:opacity-50 flex-shrink-0"
              >
                {googleSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Quick site shortcuts */}
            <div className="flex gap-1 flex-wrap">
              {LEGAL_SITES.map(({ label, domain }) => (
                <button
                  key={label}
                  onClick={() => {
                    window.open(`https://www.google.com/search?q=${encodeURIComponent((googleQuery || "Indian law") + ` site:${domain}`)}`, "_blank");
                    onOpenChange(false);
                  }}
                  className="text-[9.5px] font-mono px-1.5 py-0.5 rounded border border-border bg-surface/40 hover:border-blue-400/40 text-muted-foreground hover:text-blue-400 transition"
                >
                  → {label}
                </button>
              ))}
              <button
                onClick={() => {
                  navigate({ to: "/research", search: { fresh: "1" } });
                  onOpenChange(false);
                }}
                className="text-[9.5px] font-mono px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition ml-auto"
              >
                Open Research Tab →
              </button>
            </div>

            {/* Results */}
            {googleResults && (
              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                {googleResults.length === 0 ? (
                  <div className="text-center text-[12px] text-muted-foreground py-4">No results found.</div>
                ) : googleResults.map((r, i) => (
                  <div key={i} className="rounded-md border border-border bg-surface/40 p-2 space-y-0.5 hover:border-primary/30 transition">
                    <div className="flex items-start gap-2">
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] font-medium text-blue-400 hover:underline leading-snug flex-1"
                        onClick={() => onOpenChange(false)}
                      >
                        {r.title}
                      </a>
                      <a href={r.link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-muted-foreground hover:text-primary">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="text-[9.5px] text-blue-400/50 font-mono">{r.displayLink}</div>
                    <div className="text-[10.5px] text-muted-foreground leading-relaxed">{r.snippet}</div>
                  </div>
                ))}
              </div>
            )}

            {!googleResults && !googleSearching && (
              <div className="text-center text-[11px] text-muted-foreground py-6">
                Search any Indian legal case, judgment, statute, or legal concept.
                <br />
                <span className="text-[10px] opacity-60">Results sourced from Google · Indian Kanoon · CaseMine</span>
              </div>
            )}
          </div>
        )}

        <div className="px-3 py-1.5 border-t border-border/40 flex items-center gap-2 text-[10px] font-mono text-muted-foreground/60">
          <span>⌘K to toggle</span>
          <span className="ml-auto">↑↓ Enter · Esc to close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
