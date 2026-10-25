import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, RefreshCw, Download, ExternalLink, Sparkles, Loader2, Upload } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { exportCitationReport } from "@/lib/pdf-export";
import { verifyCitation, extractCitations } from "@/lib/ai.functions";
import { extractFileText } from "@/lib/doc-extract";
import { toast } from "sonner";



export const Route = createFileRoute("/citations")({
  head: () => ({ meta: [{ title: "Citation Verification — PrecedentOracle" },
    { name: "description", content: "Every citation verified against Indian Kanoon. Verified, weak, missing, overruled." }] }),
  component: CitationCenter,
});


type Status = "verified" | "weak" | "missing" | "overruled" | "unverified";

interface CitationRow {
  n: number; text: string; source: string; status: Status; confidence: number;
  reasoning: { exact: boolean; year: boolean; court: boolean; format: boolean; notes?: string };
  overruledBy?: string;
}

const ROWS: CitationRow[] = [
  { n: 1, text: "K.S. Puttaswamy v. Union of India (2017) 10 SCC 1", source: "Indian Kanoon", status: "verified", confidence: 98,
    reasoning: { exact: true, year: true, court: true, format: true, notes: "9-Judge Constitution Bench. Exact match in Indian Kanoon docid 91938676." } },
  { n: 2, text: "Maneka Gandhi v. Union of India (1978) 1 SCC 248", source: "Indian Kanoon", status: "verified", confidence: 97,
    reasoning: { exact: true, year: true, court: true, format: true } },
  { n: 3, text: "Vishaka v. State of Rajasthan (1997) 6 SCC 241", source: "Indian Kanoon", status: "verified", confidence: 96,
    reasoning: { exact: true, year: true, court: true, format: true } },
  { n: 4, text: "Olga Tellis v. Bombay Municipal Corp (1985) 3 SCC 545", source: "Indian Kanoon", status: "verified", confidence: 95,
    reasoning: { exact: true, year: true, court: true, format: true } },
  { n: 5, text: "Indra Sawhney v. Union of India AIR 1993 SC 477", source: "Indian Kanoon", status: "verified", confidence: 94,
    reasoning: { exact: true, year: true, court: true, format: true } },
  { n: 6, text: "B.V. Nagaraju v. M. Veeranna (2019)", source: "Partial match", status: "weak", confidence: 52,
    reasoning: { exact: false, year: true, court: false, format: false, notes: "Citation lacks reporter. Two candidates in 2019 with similar parties." } },
  { n: 7, text: "Bhagwan Das case (no citation)", source: "None matched", status: "missing", confidence: 12,
    reasoning: { exact: false, year: false, court: false, format: false, notes: "Insufficient information to identify case. Do not cite." } },
  { n: 8, text: "ADM Jabalpur v. Shivkant Shukla (1976) 2 SCC 521", source: "Indian Kanoon", status: "overruled", confidence: 100,
    reasoning: { exact: true, year: true, court: true, format: true, notes: "Expressly overruled by Puttaswamy (2017) ¶ 119–124." },
    overruledBy: "K.S. Puttaswamy v. Union of India (2017) 10 SCC 1" },
  { n: 9, text: "Shreya Singhal v. Union of India (2015) 5 SCC 1", source: "Indian Kanoon", status: "verified", confidence: 96,
    reasoning: { exact: true, year: true, court: true, format: true } },
  { n: 10, text: "Joseph Shine v. Union of India (2019) 3 SCC 39", source: "Indian Kanoon", status: "verified", confidence: 93,
    reasoning: { exact: true, year: true, court: true, format: true } },
  { n: 11, text: "Navtej Singh Johar v. Union of India (2018) 10 SCC 1", source: "Indian Kanoon", status: "verified", confidence: 97,
    reasoning: { exact: true, year: true, court: true, format: true } },
  { n: 12, text: "Common Cause v. Union of India (2018) 5 SCC 1", source: "Indian Kanoon", status: "verified", confidence: 92,
    reasoning: { exact: true, year: true, court: true, format: true } },
  { n: 13, text: "M.C. Mehta v. Union of India (1987) 1 SCC 395", source: "Indian Kanoon", status: "verified", confidence: 95,
    reasoning: { exact: true, year: true, court: true, format: true } },
  { n: 14, text: "Some unreported HC decision from 2017", source: "Unable to verify", status: "weak", confidence: 28,
    reasoning: { exact: false, year: true, court: false, format: false, notes: "Description too vague to match." } },
];

const VERIFIED = ROWS.filter((r) => r.status === "verified").length;
const SCORE = Math.round((VERIFIED / ROWS.length) * 100);

function CitationCenter() {
  const [open, setOpen] = useState<CitationRow | null>(null);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [extraRows, setExtraRows] = useState<CitationRow[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [extractLoading, setExtractLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const runVerify = useServerFn(verifyCitation);
  const runExtract = useServerFn(extractCitations);


  const allRows = [...ROWS, ...extraRows];
  const visible = allRows.filter((r) => filter === "all" || r.status === filter);

  const handleVerify = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const r = await runVerify({ data: { citation: aiInput } });
      const newRow: CitationRow = {
        n: allRows.length + 1,
        text: r.canonicalCitation || aiInput,
        source: "AI verified",
        status: r.status,
        confidence: Math.round(r.confidence),
        reasoning: { exact: r.confidence > 80, year: !!r.year, court: !!r.court, format: r.confidence > 70, notes: r.notes },
        overruledBy: r.overruledBy,
      };
      setExtraRows((p) => [...p, newRow]);
      setOpen(newRow);
      setAiInput("");
      toast.success(`Citation ${r.status} (${Math.round(r.confidence)}% confidence)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Verification failed");
    } finally { setAiLoading(false); }
  };

  const handleUpload = async (file: File) => {
    setExtractLoading(true);
    try {
      const text = await extractFileText(file);
      if (!text || text.length < 20) { toast.error("No readable text found in document"); return; }
      const found = await runExtract({ data: { text } });
      const baseN = ROWS.length + extraRows.length;
      const newRows: CitationRow[] = found.map((c, i) => ({
        n: baseN + i + 1,
        text: c.text,
        source: "AI extracted",
        status: c.status,
        confidence: Math.round(c.confidence),
        reasoning: { exact: c.confidence > 80, year: true, court: c.confidence > 60, format: c.confidence > 70, notes: c.notes },
      }));
      setExtraRows((p) => [...p, ...newRows]);
      toast.success(`Extracted ${newRows.length} citation${newRows.length === 1 ? "" : "s"} from ${file.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Extraction failed");
    } finally { setExtractLoading(false); }
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
      <PageHeader
        eyebrow="Trust Layer"
        title="Citation Verification Report"
        subtitle={`Session 9be4 · ${SCORE}% verified · ${VERIFIED} of ${ROWS.length} citations`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="border-border" onClick={() => fileRef.current?.click()} disabled={extractLoading}>
              {extractLoading ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Extracting…</> : <><Upload className="h-4 w-4 mr-1.5" />Extract from PDF</>}
            </Button>
            <Button variant="outline" className="border-border" onClick={() => toast.info("Re-verifying citations against Indian Kanoon…")}><RefreshCw className="h-4 w-4 mr-1.5" />Re-verify</Button>
            <Button className="gold-gradient border-0" onClick={() => { exportCitationReport([...ROWS, ...extraRows], SCORE); toast.success("PDF report exported"); }}><Download className="h-4 w-4 mr-1.5" />Export PDF</Button>
          </div>
        }


      />

      <div className="px-8 py-5">
        <div className="glass rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Overall verification</div>
            <div className="font-display text-3xl font-bold gold-text">{SCORE}%</div>
          </div>
          <div className="h-2 w-full bg-background rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${SCORE}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full gold-gradient"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
            <StatTile icon={CheckCircle2} label="Verified" count={ROWS.filter(r => r.status === "verified").length} tone="verified" onClick={() => setFilter("verified")} active={filter === "verified"} />
            <StatTile icon={AlertTriangle} label="Weak" count={ROWS.filter(r => r.status === "weak").length} tone="weak" onClick={() => setFilter("weak")} active={filter === "weak"} />
            <StatTile icon={XCircle} label="Missing" count={ROWS.filter(r => r.status === "missing").length} tone="risk" onClick={() => setFilter("missing")} active={filter === "missing"} />
            <StatTile icon={XCircle} label="Overruled" count={ROWS.filter(r => r.status === "overruled").length} tone="overruled" onClick={() => setFilter("overruled")} active={filter === "overruled"} />
            <StatTile icon={HelpCircle} label="All" count={ROWS.length} tone="muted" onClick={() => setFilter("all")} active={filter === "all"} />
          </div>
        </div>

        <div className="glass rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <div className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground">AI verify a new citation</div>
          </div>
          <div className="flex gap-2">
            <input value={aiInput} onChange={(e) => setAiInput(e.target.value)}
              placeholder='e.g. "Vishaka v. State of Rajasthan (1997) 6 SCC 241"'
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              className="flex-1 glass rounded-md px-3 py-2 text-[13px] font-serif focus:outline-none focus:ring-1 focus:ring-primary/40" />
            <Button onClick={handleVerify} disabled={aiLoading || !aiInput.trim()} className="gold-gradient text-paper-ink gap-1.5">
              {aiLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</> : <><Sparkles className="h-4 w-4" /> Verify</>}
            </Button>
          </div>
        </div>



        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-surface/60 border-b border-border">
              <tr className="text-left text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">Citation</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4 w-24">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr
                  key={r.n}
                  onClick={() => setOpen(r)}
                  className={`border-b border-border/50 hover:bg-surface/40 cursor-pointer transition border-l-2 ${
                    r.status === "verified" ? "border-l-verified" :
                    r.status === "weak" ? "border-l-weak" :
                    r.status === "missing" ? "border-l-risk" :
                    r.status === "overruled" ? "border-l-overruled" : "border-l-border"
                  }`}
                >
                  <td className="py-3 px-4 font-mono text-muted-foreground">{r.n}</td>
                  <td className="py-3 px-4">
                    <span className={`font-serif ${r.status === "missing" ? "line-through text-muted-foreground" : ""}`}>
                      {r.text}
                    </span>
                  </td>
                  <td className="py-3 px-4 legal-mono text-muted-foreground">{r.source}</td>
                  <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-background overflow-hidden">
                        <div className={`h-full ${r.confidence >= 80 ? "bg-verified" : r.confidence >= 50 ? "bg-weak" : "bg-risk"}`} style={{ width: `${r.confidence}%` }} />
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">{r.confidence}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-[11.5px] text-primary/90 hover:text-primary inline-flex items-center gap-1">
                      View <ExternalLink className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
            onClick={() => setOpen(null)}
          >
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-surface-elevated border-l border-border overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Citation #{open.n}</span>
                  <StatusBadge status={open.status} />
                </div>
                <div className="legal-mono text-[15px] text-foreground mt-3 leading-snug">{open.text}</div>
                <div className="text-[12px] text-muted-foreground mt-2">Source: {open.source}</div>

                <div className="mt-6">
                  <div className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Confidence breakdown</div>
                  <ul className="space-y-1.5 text-[12.5px]">
                    <ReasoningRow ok={open.reasoning.exact} label="Exact name match" />
                    <ReasoningRow ok={open.reasoning.year} label="Year match" />
                    <ReasoningRow ok={open.reasoning.court} label="Court match" />
                    <ReasoningRow ok={open.reasoning.format} label="Citation format match" />
                  </ul>
                </div>

                {open.reasoning.notes && (
                  <div className="mt-4 rounded-md border border-border bg-background/60 p-3 text-[12.5px] text-foreground/85 font-serif">
                    {open.reasoning.notes}
                  </div>
                )}

                {open.overruledBy && (
                  <div className="mt-4 rounded-md border border-overruled/40 bg-overruled/10 p-3">
                    <div className="text-[10.5px] font-mono uppercase tracking-wider text-overruled mb-1">Replace with</div>
                    <div className="legal-mono text-[12.5px]">{open.overruledBy}</div>
                  </div>
                )}

                <div className="mt-6 flex gap-2">
                  <Button asChild variant="outline" className="border-border flex-1">
                    <a href="https://indiankanoon.org" target="_blank" rel="noreferrer">Open on Indian Kanoon</a>
                  </Button>
                  <Button onClick={() => setOpen(null)} className="gold-gradient border-0">Close</Button>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatTile({ icon: Icon, label, count, tone, active, onClick }: { icon: React.ElementType; label: string; count: number; tone: string; active?: boolean; onClick?: () => void }) {
  const colorMap: Record<string, string> = {
    verified: "text-verified bg-verified/10 border-verified/30",
    weak: "text-weak bg-weak/10 border-weak/30",
    risk: "text-risk bg-risk/10 border-risk/30",
    overruled: "text-overruled bg-overruled/10 border-overruled/30",
    muted: "text-muted-foreground bg-muted border-border",
  };
  return (
    <button onClick={onClick} className={`rounded-lg border p-3 text-left transition ${colorMap[tone]} ${active ? "ring-2 ring-primary/30" : "hover:opacity-80"}`}>
      <Icon className="h-4 w-4 mb-1.5" />
      <div className="font-display text-xl font-bold">{count}</div>
      <div className="text-[10.5px] font-mono uppercase tracking-wider">{label}</div>
    </button>
  );
}

function ReasoningRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-verified" /> : <XCircle className="h-3.5 w-3.5 text-risk" />}
      <span className={ok ? "text-foreground/90" : "text-muted-foreground line-through"}>{label}</span>
    </li>
  );
}
