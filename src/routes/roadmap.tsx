import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Bell, FileCheck2, MessageSquare, Gavel, ChevronDown, AlertTriangle, Sparkles, Loader2, Download, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/page-shell";
import { generateRoadmap } from "@/lib/ai.functions";
import { exportChecklistPdf } from "@/lib/pdf-export";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


export const Route = createFileRoute("/roadmap")({
  head: () => ({ meta: [{ title: "Procedural Roadmap — PrecedentOracle" },
    { name: "description", content: "Expected procedural path for any case. Procedural information only — no roleplay." }] }),
  component: RoadmapPage,
});

const STAGES = [
  { id: "filing", icon: FileText, title: "Filing", duration: "7–14 days", risk: "low" as const,
    checklist: [
      "Plaint / Petition with verification",
      "Court fee assessment and payment",
      "Required annexures (P-1 to P-N)",
      "Vakalatnama executed by litigant",
      "Index, synopsis, list of dates",
    ],
    risks: ["Insufficient court fee — defect notice", "Missing notarization of affidavit"],
    statute: "CPC Order IV, Rules 1–3 · BNSS § 175",
  },
  { id: "notice", icon: Bell, title: "Notice & Service", duration: "14–30 days", risk: "low" as const,
    checklist: [
      "Issue of summons by court",
      "Service through process server / RPAD / e-service",
      "Filing of affidavit of service",
      "Substituted service if needed (Order V Rule 20)",
    ],
    risks: ["Refusal of service — may require substituted service", "Wrong address on record"],
    statute: "CPC Order V · BNSS § 64–71",
  },
  { id: "evidence", icon: FileCheck2, title: "Evidence", duration: "60–180 days", risk: "moderate" as const,
    checklist: [
      "Plaintiff's evidence by affidavit (Order XVIII Rule 4)",
      "Production and marking of documents",
      "Cross-examination of witnesses",
      "Defence evidence and rebuttal",
      "Electronic record certification under BSA § 63",
    ],
    risks: ["1 missing affidavit identified by Procedural Risk Analyzer", "Lease deed not yet exhibited"],
    statute: "BSA, 2023 (replaces IEA, 1872) · CPC Order XIII, XVIII",
  },
  { id: "arguments", icon: MessageSquare, title: "Arguments", duration: "30–60 days", risk: "moderate" as const,
    checklist: [
      "Written arguments filed under Order XVIII Rule 17",
      "Oral arguments by counsel",
      "Authorities (compilation of judgments)",
      "Synopsis of arguments",
    ],
    risks: ["2 contradictions in timeline flagged — reconcile before final hearing", "1 overruled citation must be replaced"],
    statute: "CPC Order XVIII · Court Manuals",
  },
  { id: "order", icon: Gavel, title: "Judgment & Appeal", duration: "30–90 days post-arguments", risk: "low" as const,
    checklist: [
      "Reserved judgment delivery",
      "Decree drawn under Order XX",
      "Execution petition if needed",
      "Appeal under § 96 CPC / § 100 CPC (substantial question of law)",
    ],
    risks: ["Limitation for appeal: 30 days for FA / 90 days for SA"],
    statute: "CPC Order XX–XXI · § 96, § 100",
  },
];

type Stage = {
  id: string;
  icon: typeof FileText;
  title: string;
  duration: string;
  risk: "low" | "moderate" | "high";
  checklist: string[];
  risks: string[];
  statute: string;
};

const STAGE_ICONS = [FileText, Bell, FileCheck2, MessageSquare, Gavel];

function RoadmapPage() {
  const [open, setOpen] = useState<string>("evidence");
  const [stages, setStages] = useState<Stage[]>(STAGES);
  const [aiOpen, setAiOpen] = useState(false);
  const [facts, setFacts] = useState("Eviction suit under Section 21 of Karnataka Rent Act. Tenant in arrears for 8 months. Notice served under Section 27.");
  const [caseType, setCaseType] = useState("Property — Eviction");
  const [court, setCourt] = useState("Karnataka High Court");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const runRoadmap = useServerFn(generateRoadmap);

  const handleGenerate = async () => {
    setLoading(true); setErr("");
    try {
      const result = await runRoadmap({ data: { caseType, court, facts } });
      const newStages: Stage[] = result.slice(0, 5).map((s, i) => ({
        id: `ai-${i}`,
        icon: STAGE_ICONS[i] ?? FileText,
        title: s.title,
        duration: s.duration,
        risk: s.risk,
        statute: s.statute,
        checklist: s.checklist,
        risks: s.risks,
      }));
      setStages(newStages);
      setOpen(newStages[0]?.id ?? "");
      setAiOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to generate roadmap");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Case Roadmap"
        title="Procedural Roadmap"
        subtitle={`${caseType} · ${court}`}
      />

      <TimelineEstimator caseType={caseType} court={court} />

      <div className="px-8 pt-4 flex justify-end gap-2 flex-wrap">
        <HearingReminder />
        <Button variant="outline" className="border-border gap-2" onClick={() => {
          exportChecklistPdf({
            caseTitle: "Procedural Checklist",
            court, caseType,
            stages: stages.map(s => ({ title: s.title, duration: s.duration, statute: s.statute, checklist: s.checklist })),
          });
          toast.success("Checklist downloaded", { description: "Print and use physically at the bench." });
        }}>
          <Download className="h-4 w-4" /> Download Checklist
        </Button>
        <Button onClick={() => setAiOpen(!aiOpen)} className="gold-gradient text-paper-ink gap-2">
          <Sparkles className="h-4 w-4" /> AI Generate Roadmap
        </Button>
      </div>

      {aiOpen && (
        <div className="mx-8 mt-3 glass rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground">Case type</label>
              <input value={caseType} onChange={(e) => setCaseType(e.target.value)}
                className="w-full mt-1 glass rounded-md px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground">Court</label>
              <input value={court} onChange={(e) => setCourt(e.target.value)}
                className="w-full mt-1 glass rounded-md px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </div>
          </div>
          <div>
            <label className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground">Facts</label>
            <textarea value={facts} onChange={(e) => setFacts(e.target.value)} rows={3}
              className="w-full mt-1 glass rounded-md px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40 font-serif" />
          </div>
          {err && <div className="text-[12px] text-risk">{err}</div>}
          <Button onClick={handleGenerate} disabled={loading} className="gold-gradient text-paper-ink gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate 5 stages</>}
          </Button>
        </div>
      )}


      <div className="px-8 py-6">
        {/* Horizontal timeline */}
        <div className="relative">
          <div className="absolute top-7 left-0 right-0 h-px bg-border" />
          <div className="grid grid-cols-5 gap-3 relative">
            {stages.map((s, i) => (
              <button
                key={s.id} onClick={() => setOpen(s.id === open ? "" : s.id)}
                className="flex flex-col items-center group"
              >
                <div className={`relative z-10 h-14 w-14 rounded-full flex items-center justify-center border-2 transition ${
                  open === s.id ? "gold-gradient border-primary shadow-gold-glow" : "bg-surface border-border group-hover:border-primary/50"
                }`}>
                  <s.icon className={`h-5 w-5 ${open === s.id ? "" : "text-primary"}`} />
                </div>
                <div className="mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Stage {i + 1}</div>
                <div className="font-display text-sm font-semibold mt-0.5">{s.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.duration}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="mt-8 space-y-3">
          {stages.map((s) => (
            <div key={s.id} className="glass rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(s.id === open ? "" : s.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-surface/40 transition"
              >
                <s.icon className="h-5 w-5 text-primary" />
                <div className="text-left flex-1">
                  <div className="font-display text-base font-semibold">{s.title}</div>
                  <div className="text-[11.5px] text-muted-foreground">{s.statute}</div>
                </div>
                <span className={`text-[10.5px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  s.risk === "low" ? "bg-verified/15 text-verified" : s.risk === "moderate" ? "bg-weak/15 text-weak" : "bg-risk/15 text-risk"
                }`}>{s.risk} risk</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${open === s.id ? "rotate-180" : ""}`} />
              </button>
              {open === s.id && (
                <div className="px-4 pb-5 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-border/60 pt-4">
                  <div>
                    <div className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Checklist</div>
                    <ul className="space-y-1.5 text-[13px]">
                      {s.checklist.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1 w-1 rounded-full bg-primary/70" /> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-mono uppercase tracking-wider text-risk mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Risk Analyzer findings
                    </div>
                    <ul className="space-y-1.5 text-[13px]">
                      {s.risks.map((r, i) => (
                        <li key={i} className="rounded-md border-l-2 border-risk bg-risk/5 px-2.5 py-1.5">{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineEstimator({ caseType, court }: { caseType: string; court: string }) {
  // Heuristic estimate by court tier × case type.
  const months = useMemo(() => {
    const lower = court.toLowerCase();
    let base = lower.includes("supreme") ? [24, 48]
      : lower.includes("high") ? [18, 30]
      : lower.includes("district") ? [12, 24]
      : lower.includes("tribunal") ? [9, 18]
      : [12, 24];
    if (caseType.toLowerCase().includes("writ")) base = [base[0] / 2, base[1] / 2];
    if (caseType.toLowerCase().includes("appeal")) base = [base[0] + 6, base[1] + 6];
    return [Math.round(base[0]), Math.round(base[1])];
  }, [caseType, court]);
  const pct = Math.min(100, (months[0] / 48) * 100);
  return (
    <div className="mx-8 mt-4 glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <div>
          <div className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground">Timeline Estimator</div>
          <div className="font-display text-lg font-semibold mt-0.5">
            Estimated timeline: <span className="text-primary">{months[0]}–{months[1]} months</span>
          </div>
          <div className="text-[12px] text-muted-foreground">{court} · {caseType} · Original Suit baseline</div>
        </div>
        <div className="text-right text-[11px] text-muted-foreground font-mono">
          Min: {months[0]} mo<br />Max: {months[1]} mo
        </div>
      </div>
      <div className="relative h-2 rounded-full bg-surface overflow-hidden">
        <div className="absolute inset-y-0 left-0 gold-gradient" style={{ width: `${pct}%` }} />
        <div className="absolute inset-y-0 left-0 bg-primary/20" style={{ width: `${Math.min(100, (months[1] / 48) * 100)}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
        <span>0</span><span>12 mo</span><span>24 mo</span><span>36 mo</span><span>48 mo</span>
      </div>
    </div>
  );
}

function HearingReminder() {
  const [date, setDate] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const countdown = useMemo(() => {
    if (!date) return null;
    const target = new Date(date).getTime();
    if (Number.isNaN(target)) return null;
    const diffMs = target - now;
    if (diffMs < 0) return { label: "Past", days: 0, hours: 0, overdue: true };
    const days = Math.floor(diffMs / 86_400_000);
    const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);
    return { label: "", days, hours, overdue: false };
  }, [date, now]);
  return (
    <div className="glass rounded-md flex items-center gap-2 px-3 py-1.5 text-[12px]">
      <CalendarClock className="h-4 w-4 text-primary" />
      <span className="text-muted-foreground">Next hearing</span>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
        className="bg-transparent border-b border-border focus:border-primary outline-none text-[12px] py-0.5" />
      {countdown && (
        <span className={`font-mono text-[11.5px] ${countdown.overdue ? "text-risk" : "text-primary"}`}>
          {countdown.overdue ? "Past due" : `in ${countdown.days}d ${countdown.hours}h`}
        </span>
      )}
    </div>
  );
}
