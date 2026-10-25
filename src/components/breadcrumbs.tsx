import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

const LABELS: Record<string, string> = {
  research: "Research",
  precedents: "Precedent Explorer",
  citations: "Citation Verification",
  graph: "Knowledge Graph",
  library: "Bare Acts Library",
  judges: "Judge Analytics",
  roadmap: "Procedural Roadmap",
  report: "Report Studio",
};

export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/") return null;
  const parts = pathname.split("/").filter(Boolean);
  return (
    <nav aria-label="Breadcrumb" className="px-8 py-2 border-b border-border/40 bg-surface/30">
      <ol className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground font-mono">
        <li>
          <Link to="/" className="inline-flex items-center gap-1 hover:text-primary transition">
            <Home className="h-3 w-3" /> Command Center
          </Link>
        </li>
        {parts.map((p, i) => {
          const last = i === parts.length - 1;
          const href = "/" + parts.slice(0, i + 1).join("/");
          const label = LABELS[p] ?? p.replace(/-/g, " ");
          return (
            <li key={href} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 opacity-50" />
              {last ? (
                <span className="text-primary capitalize">{label}</span>
              ) : (
                <a href={href} className="hover:text-primary transition capitalize">{label}</a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
