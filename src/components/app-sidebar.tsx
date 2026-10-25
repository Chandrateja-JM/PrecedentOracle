import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  Brain, LayoutDashboard, BookText, ChevronDown, ChevronRight, Clock, Scale,
  FileSearch, Library, BadgeCheck, Network, Map as MapIcon, FileText,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { RECENT_SESSIONS } from "@/lib/seed-data";

// Three top-level modes. AI Mode expands into its 6 sub-features inline below it.
// All sub-routes remain at their original URLs so existing code stays intact.
const TOP_LEVEL = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, description: "Command Center", expandable: false },
  { title: "AI Mode",   url: "/research", icon: Brain, description: "Workspace + 6 tools", expandable: true },
  { title: "Bare Acts", url: "/library", icon: BookText, description: "Statutes · Sections", expandable: false },
] as const;

const AI_SUB_TABS = [
  { title: "Research",   url: "/research",   icon: FileSearch,  description: "Upload PDF · 9 NLP tasks" },
  { title: "Precedents", url: "/precedents", icon: Library,     description: "Supporting · Opposing" },
  { title: "Citations",  url: "/citations",  icon: BadgeCheck,  description: "Verify · Overruled" },
  { title: "Graph",      url: "/graph",      icon: Network,     description: "Cases · Statutes · Judges" },
  { title: "Roadmap",    url: "/roadmap",    icon: MapIcon,     description: "Procedural timeline" },
  { title: "Report",     url: "/report",     icon: FileText,    description: "PDF · DOCX export" },
] as const;

const AI_ROUTES = AI_SUB_TABS.map((t) => t.url);

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inAIMode = AI_ROUTES.some((r) => pathname.startsWith(r));

  const isActive = (p: string) => (p === "/" ? pathname === "/" : pathname.startsWith(p));
  const [recentOpen, setRecentOpen] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(inAIMode);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-md gold-gradient shadow-elev-1">
            <Scale className="h-5 w-5" strokeWidth={2.25} />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display text-[17px] font-bold tracking-tight text-sidebar-primary">
                PrecedentOracle
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
                Legal Intelligence
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/55">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {TOP_LEVEL.map((item) => {
                const active = item.expandable ? inAIMode : isActive(item.url);
                return (
                  <div key={item.title}>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        onClick={item.expandable ? () => setAiExpanded((v) => !v) : undefined}
                        asChild={!item.expandable}
                        className={
                          active
                            ? "bg-sidebar-primary/15 text-sidebar-primary border-l-[3px] border-sidebar-primary rounded-l-none h-auto py-2.5 font-semibold shadow-sm"
                            : "text-sidebar-foreground/85 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 hover:border-l-[3px] hover:border-sidebar-primary/30 h-auto py-2.5 transition-all"
                        }
                      >
                        {item.expandable ? (
                          <button className="flex items-start gap-2.5 w-full">
                            <item.icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${active ? "text-sidebar-primary" : ""}`} />
                            {!collapsed && (
                              <div className="flex flex-col leading-tight flex-1 text-left">
                                <span className="text-[13.5px] font-medium flex items-center gap-1">
                                  {item.title}
                                  {aiExpanded
                                    ? <ChevronDown className="h-3 w-3 ml-auto opacity-60" />
                                    : <ChevronRight className="h-3 w-3 ml-auto opacity-60" />}
                                </span>
                                <span className="text-[10px] text-sidebar-foreground/55 mt-0.5">{item.description}</span>
                              </div>
                            )}
                          </button>
                        ) : (
                          <Link to={item.url} className="flex items-start gap-2.5">
                            <item.icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${active ? "text-sidebar-primary" : ""}`} />
                            {!collapsed && (
                              <div className="flex flex-col leading-tight">
                                <span className="text-[13.5px] font-medium">{item.title}</span>
                                <span className="text-[10px] text-sidebar-foreground/55 mt-0.5">{item.description}</span>
                              </div>
                            )}
                          </Link>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    {item.expandable && aiExpanded && !collapsed && (
                      <div className="ml-7 mt-1 mb-2 border-l border-sidebar-border/60 pl-2 space-y-0.5">
                        {AI_SUB_TABS.map((sub) => {
                          const subActive = isActive(sub.url);
                          return (
                            <Link
                              key={sub.url}
                              to={sub.url}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] transition-all ${
                                subActive
                                  ? "bg-sidebar-primary/20 text-sidebar-primary font-semibold border-l-2 border-sidebar-primary pl-[6px] shadow-sm"
                                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 hover:translate-x-[1px]"
                              }`}
                            >
                              <sub.icon className="h-3 w-3" />
                              <span className="flex-1">{sub.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <SidebarGroup>
            <button
              onClick={() => setRecentOpen((v) => !v)}
              className="flex items-center w-full gap-1.5 px-2 py-1.5 text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/55 hover:text-sidebar-foreground transition-colors"
            >
              {recentOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <Clock className="h-3 w-3" />
              Recent Sessions
            </button>
            {recentOpen && (
              <SidebarGroupContent>
                <ul className="space-y-1 px-2 mt-1">
                  {RECENT_SESSIONS.slice(0, 3).map((s) => (
                    <li key={s.id}>
                      <Link
                        to="/research"
                        search={{ session: s.id } as never}
                        className="block text-[11.5px] leading-snug text-sidebar-foreground/70 hover:text-sidebar-accent-foreground transition-colors"
                      >
                        <div className="truncate">{s.title}</div>
                        <div className="text-[10px] text-sidebar-foreground/45">
                          {s.court} · {s.status}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] text-sidebar-foreground/55">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              All systems operational
            </div>
            <div className="text-[10.5px] text-sidebar-foreground/70 leading-tight">
              <div>M.Tech AI/ML · MSRUAS</div>
              <div className="font-deva text-[13px] text-sidebar-primary/90 mt-1">सत्यमेव जयते</div>
            </div>
          </div>
        ) : (
          <div className="font-deva text-[14px] text-sidebar-primary/90 text-center">सत्य</div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
