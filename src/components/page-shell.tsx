export function PageHeader({
  title, subtitle, tricolor = true, eyebrow, actions,
}: {
  title: string;
  subtitle?: string;
  tricolor?: boolean;
  eyebrow?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {tricolor && <div className="tricolor-strip" />}
      <div className="px-8 pt-8 pb-6 border-b border-border/60 bg-gradient-to-b from-surface/30 to-transparent">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            {eyebrow && (
              <div className="text-[11px] uppercase tracking-[0.22em] text-primary/80 font-mono mb-2">
                {eyebrow}
              </div>
            )}
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && <p className="mt-2 text-[15px] text-muted-foreground max-w-2xl">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: "verified" | "weak" | "missing" | "overruled" | "unverified" }) {
  const map = {
    verified: { label: "Verified", cls: "bg-verified/15 text-verified border-verified/30" },
    weak: { label: "Weak", cls: "bg-weak/15 text-weak border-weak/30" },
    missing: { label: "Missing", cls: "bg-risk/15 text-risk border-risk/30" },
    overruled: { label: "Overruled", cls: "bg-overruled/20 text-overruled border-overruled/40" },
    unverified: { label: "Unverified", cls: "bg-muted text-muted-foreground border-border" },
  } as const;
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium tracking-wide ${s.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}
