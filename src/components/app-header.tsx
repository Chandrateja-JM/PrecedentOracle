import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Plus, Command as CommandIcon, Settings, LogOut, Keyboard, Info, Sun, Moon, Mail, CheckCheck, ScrollText, Sparkles, BadgeCheck } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/command-palette";
import { AISearchBar } from "@/components/ai-search-bar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANDMARK_CASES, BARE_ACTS, JUDGES } from "@/lib/seed-data";
import { toast } from "sonner";

const PAGES = [
  { kw: ["research"], to: "/research", label: "Research Workspace" },
  { kw: ["precedent", "case"], to: "/precedents", label: "Precedent Explorer" },
  { kw: ["citation"], to: "/citations", label: "Citation Verification" },
  { kw: ["graph", "network"], to: "/graph", label: "Knowledge Graph" },
  { kw: ["library", "act", "statute", "section", "bare"], to: "/library", label: "Bare Acts Library" },
  { kw: ["judge"], to: "/judges", label: "Judge Analytics" },
  { kw: ["roadmap", "procedure"], to: "/roadmap", label: "Procedural Roadmap" },
  { kw: ["report", "studio", "export"], to: "/report", label: "Report Studio" },
  { kw: ["home", "command"], to: "/", label: "Command Center" },
];

const NOTIFS_INIT = [
  { id: "n1", title: "Research session completed", body: "Vyana Tech v. State of Maharashtra — readiness 82/100", time: "12m", unread: true, icon: Sparkles },
  { id: "n2", title: "New Supreme Court order indexed", body: "Stay granted in surveillance PIL (W.P. 412/2025)", time: "1h", unread: true, icon: ScrollText },
  { id: "n3", title: "Citation verification finished", body: "11 of 14 verified · 1 overruled flagged", time: "3h", unread: true, icon: BadgeCheck },
  { id: "n4", title: "Weekly digest available", body: "1,284 new judgments added to corpus", time: "Yesterday", unread: false, icon: Mail },
];

export function AppHeader() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [headerQ, setHeaderQ] = useState("");
  const [notifs, setNotifs] = useState(NOTIFS_INIT);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const navigate = useNavigate();
  const unreadCount = notifs.filter((n) => n.unread).length;

  // local hybrid matches across pages + seeded corpus
  const localMatches = (() => {
    const out: { id: string; label: string; sub?: string; group?: string; onPick: () => void }[] = [];
    const term = headerQ.trim().toLowerCase();
    if (term.length < 2) return out;
    PAGES.filter((p) => p.kw.some((k) => term.includes(k)) || p.label.toLowerCase().includes(term)).slice(0, 4).forEach((p) =>
      out.push({ id: "p-" + p.to, label: p.label, sub: p.to, group: "Pages", onPick: () => navigate({ to: p.to }) })
    );
    LANDMARK_CASES.filter((c) => c.name.toLowerCase().includes(term) || c.principle.toLowerCase().includes(term)).slice(0, 5).forEach((c) =>
      out.push({ id: "case-" + c.id, label: c.name, sub: `${c.citation} · ${c.court}`, group: "Cases",
        onPick: () => navigate({ to: "/graph", search: { case: c.id } as never }) })
    );
    BARE_ACTS.filter((a) => a.name.toLowerCase().includes(term) || a.shortName.toLowerCase().includes(term)).slice(0, 3).forEach((a) =>
      out.push({ id: "act-" + a.id, label: `${a.shortName} — ${a.name}`, sub: `${a.year} · ${a.sectionsCount} sections`, group: "Statutes",
        onPick: () => navigate({ to: "/library" }) })
    );
    JUDGES.filter((j) => j.name.toLowerCase().includes(term)).slice(0, 3).forEach((j) =>
      out.push({ id: "j-" + j.id, label: j.name, sub: `${j.court} · ${j.tenure}`, group: "Judges",
        onPick: () => navigate({ to: "/judges" }) })
    );
    return out;
  })();

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    toast.success(`${next === "dark" ? "Dark" : "Light"} mode enabled`);
  }

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-border/80 glass-strong">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="flex h-full items-center gap-3 px-4">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <div className="h-6 w-px bg-border" />

          <div className="hidden md:flex flex-1 max-w-2xl items-center gap-2">
            <div className="flex-1 max-w-xl">
              <AISearchBar
                context="global"
                placeholder="Search cases, judges, statutes, sections, or ask a question…"
                value={headerQ}
                onValueChange={setHeaderQ}
                localResults={localMatches}
                onSelect={(sel) => {
                  setHeaderQ("");
                  if (sel.kind === "case") navigate({ to: "/precedents" });
                  else if (sel.kind === "statute") navigate({ to: "/library" });
                  else if (sel.kind === "judge") navigate({ to: "/judges" });
                  else if (sel.kind === "answer" && sel.answer) toast.info("AI", { description: sel.answer });
                }}
              />
            </div>
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden lg:inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-1 text-[10px] font-mono text-muted-foreground hover:text-foreground"
              title="Command palette"
            >
              <CommandIcon className="h-3 w-3" />K
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild size="sm" className="gold-gradient hover:opacity-90 shadow-elev-1 border-0 font-medium">
              <Link to="/research" search={{ fresh: "1" } as never}>
                <Plus className="h-4 w-4 mr-1" />New Research
              </Link>
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 min-w-4 rounded-full bg-primary text-[9px] font-mono font-bold text-primary-foreground flex items-center justify-center px-1">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[360px] p-0">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60">
                  <DropdownMenuLabel className="p-0 text-[13px]">Notifications</DropdownMenuLabel>
                  <button
                    onClick={() => { setNotifs((ns) => ns.map((n) => ({ ...n, unread: false }))); toast.success("All marked as read"); }}
                    className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <CheckCheck className="h-3 w-3" /> Mark all read
                  </button>
                </div>
                <ul className="max-h-[360px] overflow-y-auto">
                  {notifs.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => setNotifs((ns) => ns.map((x) => x.id === n.id ? { ...x, unread: false } : x))}
                        className="w-full text-left px-3 py-2.5 border-b border-border/40 hover:bg-surface/60 flex items-start gap-2.5"
                      >
                        <div className={`mt-0.5 h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0 ${n.unread ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                          <n.icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12.5px] font-medium truncate">{n.title}</span>
                            {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                            <span className="ml-auto text-[10px] font-mono text-muted-foreground flex-shrink-0">{n.time}</span>
                          </div>
                          <div className="text-[11.5px] text-muted-foreground truncate">{n.body}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="px-3 py-2 border-t border-border/60 text-center">
                  <button onClick={() => toast.info("Notifications archive coming soon")} className="text-[11.5px] text-primary hover:underline">
                    View all notifications
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-[11px] font-mono font-semibold text-primary-foreground hover:ring-2 hover:ring-primary/40 transition" aria-label="Profile menu">
                  JD
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-2 py-2">
                  <div className="font-display text-sm font-semibold">Adv. Jagdish Deshmukh</div>
                  <div className="text-[11px] text-muted-foreground">jagdish@precedentoracle.in</div>
                  <div className="mt-1 text-[10px] font-mono uppercase tracking-wider text-primary/80">Bar Council · Karnataka</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.info("Settings", { description: "Profile, preferences, and integrations" })}>
                  <Settings className="h-3.5 w-3.5 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === "dark" ? <Sun className="h-3.5 w-3.5 mr-2" /> : <Moon className="h-3.5 w-3.5 mr-2" />}
                  Theme · {theme === "dark" ? "Switch to light" : "Switch to dark"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.message("Keyboard shortcuts", { description: "⌘K palette · ⌘/ search · G then R research · G then G graph" })}>
                  <Keyboard className="h-3.5 w-3.5 mr-2" /> Keyboard shortcuts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.message("About PrecedentOracle", { description: "India's AI Legal Operating System · M.Tech AI/ML · MSRUAS" })}>
                  <Info className="h-3.5 w-3.5 mr-2" /> About PrecedentOracle
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.success("Signed out")} className="text-overruled focus:text-overruled">
                  <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
