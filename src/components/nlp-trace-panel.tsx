import { useState } from "react";
import { Brain, CheckCircle2, XCircle, Loader2, Activity, Code2, Eye, EyeOff, Cpu, Clock } from "lucide-react";

interface TraceItem {
  task_number: number;
  name: string;
  engine: string;
  duration_ms: number;
  status: "ok" | "error";
  input_chars?: number;
  output_preview?: string;
  raw_output?: unknown;
  error?: string;
}

interface TraceResult {
  trace: TraceItem[];
  total_duration_ms: number;
  total_tasks: number;
  successful: number;
  inlegalbert_status?: { available: boolean; loaded: boolean; device?: string; error?: string };
  synthesis?: Record<string, unknown>;
}

interface Props {
  documentText: string;
  court?: string;
  caseType?: string;
  apiBaseUrl?: string;
}

/**
 * Visible NLP pipeline trace — shows each of the 9 NLP tasks firing on the
 * uploaded document with timing, status, and raw output preview.
 *
 * For M.Tech viva: examiner clicks "Run NLP Trace" and sees a console-style
 * dump proving the system runs real NLP, not just LLM wrapping.
 */
export function NLPTracePanel({ documentText, court, caseType, apiBaseUrl }: Props) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TraceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);

  const API = apiBaseUrl ?? import.meta.env.VITE_API_URL ?? "http://localhost:8000";

  async function runTrace() {
    if (!documentText || documentText.trim().length < 20) {
      setError("Need at least 20 characters of text to run NLP pipeline.");
      return;
    }
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API}/api/nlp/pipeline-trace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_text: documentText,
          court: court ?? "Supreme Court of India",
          case_type: caseType ?? "Constitutional",
          depth: "deep",
        }),
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pipeline trace failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="glass rounded-xl p-4 border border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
          <Brain className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="font-display text-sm font-semibold">NLP Pipeline Trace</div>
          <div className="text-[10.5px] font-mono text-muted-foreground">
            Shows all 9 NLP tasks firing on uploaded document
          </div>
        </div>
        <button
          onClick={runTrace}
          disabled={running || !documentText}
          className="px-3 py-1.5 rounded-md bg-primary/15 border border-primary/30 text-primary text-[12px] font-mono hover:bg-primary/25 disabled:opacity-50 flex items-center gap-1.5"
        >
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
          {running ? "Running…" : "Run 9 NLP Tasks"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-overruled/30 bg-overruled/5 p-2.5 text-[11.5px] text-overruled mb-3">
          <XCircle className="h-3.5 w-3.5 inline mr-1.5" />
          {error}
        </div>
      )}

      {result && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="rounded-md bg-background/60 border border-border p-2">
              <div className="text-[9.5px] font-mono uppercase tracking-wider text-muted-foreground">Tasks</div>
              <div className="text-lg font-mono font-semibold text-foreground mt-0.5">{result.total_tasks}</div>
            </div>
            <div className="rounded-md bg-background/60 border border-verified/30 p-2">
              <div className="text-[9.5px] font-mono uppercase tracking-wider text-verified">OK</div>
              <div className="text-lg font-mono font-semibold text-verified mt-0.5">{result.successful}</div>
            </div>
            <div className="rounded-md bg-background/60 border border-border p-2">
              <div className="text-[9.5px] font-mono uppercase tracking-wider text-muted-foreground">Duration</div>
              <div className="text-lg font-mono font-semibold text-foreground mt-0.5">
                {(result.total_duration_ms / 1000).toFixed(2)}s
              </div>
            </div>
            <div className="rounded-md bg-background/60 border border-border p-2">
              <div className="text-[9.5px] font-mono uppercase tracking-wider text-muted-foreground">BERT</div>
              <div className={`text-lg font-mono font-semibold mt-0.5 ${result.inlegalbert_status?.available ? "text-verified" : "text-muted-foreground"}`}>
                {result.inlegalbert_status?.available ? "ON" : "off"}
              </div>
            </div>
          </div>

          {/* Per-task trace */}
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {result.trace.map((t) => (
              <div
                key={t.task_number}
                className={`rounded-md border transition-colors ${
                  t.status === "ok"
                    ? "border-verified/20 bg-verified/[0.03]"
                    : "border-overruled/30 bg-overruled/5"
                }`}
              >
                <button
                  onClick={() => setExpandedTask(expandedTask === t.task_number ? null : t.task_number)}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-primary/5"
                >
                  <div className="flex items-center justify-center h-5 w-5 rounded bg-primary/20 text-primary text-[10px] font-mono font-bold flex-shrink-0">
                    {t.task_number}
                  </div>
                  {t.status === "ok"
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-verified flex-shrink-0" />
                    : <XCircle className="h-3.5 w-3.5 text-overruled flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium truncate">{t.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground truncate">{t.engine}</div>
                  </div>
                  <div className="text-[10.5px] font-mono text-muted-foreground flex items-center gap-1 flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    {t.duration_ms}ms
                  </div>
                  {expandedTask === t.task_number ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>

                {expandedTask === t.task_number && (
                  <div className="px-3 pb-3 border-t border-border/50 mt-1 pt-2 space-y-1.5">
                    {t.status === "ok" ? (
                      <>
                        <div className="text-[10px] font-mono">
                          <span className="text-muted-foreground">Output → </span>
                          <span className="text-foreground">{t.output_preview}</span>
                        </div>
                        <details className="text-[10px]">
                          <summary className="cursor-pointer font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                            <Code2 className="h-3 w-3" /> Raw output
                          </summary>
                          <pre className="mt-1.5 p-2 bg-background/60 rounded border border-border overflow-x-auto text-[10px] leading-relaxed max-h-48 overflow-y-auto">
                            {JSON.stringify(t.raw_output, null, 2)}
                          </pre>
                        </details>
                      </>
                    ) : (
                      <div className="text-[10.5px] font-mono text-overruled">
                        Error: {t.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* InLegalBERT status */}
          <div className="mt-3 rounded-md bg-background/40 border border-border/50 p-2.5">
            <div className="flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-mono">
                InLegalBERT:{" "}
                {result.inlegalbert_status?.available ? (
                  <span className="text-verified">Loaded on {result.inlegalbert_status.device}</span>
                ) : (
                  <span className="text-muted-foreground">
                    Not loaded — {result.inlegalbert_status?.error || "Falls back to regex NER"}
                  </span>
                )}
              </span>
            </div>
            {!result.inlegalbert_status?.available && (
              <button
                onClick={async () => {
                  try {
                    setRunning(true);
                    const res = await fetch(`${API}/api/nlp/inlegalbert/load`, { method: "POST" });
                    const data = await res.json();
                    if (data.available) {
                      setResult({ ...result, inlegalbert_status: data });
                    } else {
                      setError(`InLegalBERT load failed: ${data.error}. Run: pip install transformers torch`);
                    }
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Load failed");
                  } finally {
                    setRunning(false);
                  }
                }}
                className="mt-2 text-[10.5px] font-mono text-primary hover:underline"
              >
                → Click to load InLegalBERT (~440MB, one-time download)
              </button>
            )}
          </div>
        </>
      )}

      {!result && !running && !error && (
        <div className="text-center py-6 text-[11.5px] text-muted-foreground">
          Click <span className="font-mono text-primary">Run 9 NLP Tasks</span> to see every NLP component fire on the loaded document.
          <br />
          <span className="text-[10px] opacity-70">Demonstrates: NER · Citation Regex · Statute ID · Issue Classification · Semantic Segmentation · BM25/TF-IDF Retrieval · Citation Verification · Risk Assessment · Synthesis</span>
        </div>
      )}
    </div>
  );
}
