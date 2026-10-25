import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, FileText, Upload, Sparkles, Brain, Search, BadgeCheck,
  Network, AlertTriangle, ChevronRight, ChevronDown, Plus,
  BookOpen, ShieldCheck, ExternalLink, Bookmark, Loader2, Wand2,
} from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SAMPLE_DOCUMENTS, LANDMARK_CASES, COURTS, CASE_TYPES, RECENT_SESSIONS,
} from "@/lib/seed-data";
import { useServerFn } from "@tanstack/react-start";
import { identifyCase, findSimilarCases, aiSuggestions } from "@/lib/ai.functions";
import {
  agent1Extract, agent2RankPrecedents, agent3ExplainUnmatched,
  agent4ExplainRisk, agent5Synthesize, type Agent1Output,
} from "@/lib/pipeline.functions";
import {
  retrievePrecedentCandidates, lookupCaseById, matchCitations,
  runRiskChecklist, type MatchedCitation, type RiskFlags,
} from "@/lib/pipeline-client";

interface PipelineState {
  intel: Agent1Output;
  supporting: { name: string; citation: string; relevance: string; weight: number }[];
  opposing: { name: string; citation: string; relevance: string; weight: number }[];
  citations: { total: number; verified: number; weak: number; overruled: number };
  matchedCitations: MatchedCitation[];
  graph: { connectedCases: number; connectedStatutes: number; connectedJudges: number };
  flags: RiskFlags;
  risk: { score: number; strong: string; moderate: string; weak: string; recommendations: string[] };
  applicableStatutes: { ref: string; purpose: string }[];
  argument: { primary: string; strength: number; label: string };
  executiveSummary: string;
}
import { extractFileText } from "@/lib/doc-extract";
import { toast } from "sonner";
import { AISearchBar } from "@/components/ai-search-bar";
import { runFullPipeline } from "@/lib/api-client";
import { CourtMapViz, CaseTreeViz, EvidenceBoardViz, TimelineViz, SemanticSegmentsViz } from "@/components/legal-visualizations";
import { NLPTracePanel } from "@/components/nlp-trace-panel";


interface ResearchSearch {
  sample?: string; session?: string; text?: string; court?: string; caseType?: string; fresh?: string;
}

export const Route = createFileRoute("/research")({
  validateSearch: (s: Record<string, unknown>): ResearchSearch => ({
    sample: typeof s.sample === "string" ? s.sample : undefined,
    session: typeof s.session === "string" ? s.session : undefined,
    text: typeof s.text === "string" ? s.text : undefined,
    court: typeof s.court === "string" ? s.court : undefined,
    caseType: typeof s.caseType === "string" ? s.caseType : undefined,
    fresh: typeof s.fresh === "string" ? s.fresh : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Research Workspace — PrecedentOracle" },
      { name: "description", content: "AI-powered discovery canvas. Seven agents working in parallel." },
    ],
  }),
  component: ResearchWorkspace,
});

const STATIC_SUPPORTING = LANDMARK_CASES.filter((c) => c.status !== "overruled").slice(0, 5);
const STATIC_OPPOSING = LANDMARK_CASES.filter((c) => c.status === "overruled").slice(0, 3);

function ResearchWorkspace() {
  const search = Route.useSearch();
  const identify = useServerFn(identifyCase);
  const callAgent1 = useServerFn(agent1Extract);
  const callAgent2 = useServerFn(agent2RankPrecedents);
  const callAgent3 = useServerFn(agent3ExplainUnmatched);
  const callAgent4 = useServerFn(agent4ExplainRisk);
  const callAgent5 = useServerFn(agent5Synthesize);
  const findSimilar = useServerFn(findSimilarCases);
  const getSuggestions = useServerFn(aiSuggestions);

  const initial = useMemo(() => {
    if (search.fresh) return { text: "", court: "Supreme Court of India", caseType: "Constitutional" };
    if (search.sample) {
      const doc = SAMPLE_DOCUMENTS.find((d) => d.id === search.sample);
      if (doc) {
        const caseType = doc.type === "FIR" ? "Criminal" : doc.type === "Contract" ? "Commercial" : doc.type === "Petition" ? "Constitutional" : "Property";
        return { text: doc.text, court: doc.court, caseType };
      }
    }
    if (search.session) {
      const s = RECENT_SESSIONS.find((r) => r.id === search.session);
      if (s) return { text: `Loaded session: ${s.title}\n\n(Pre-filled from saved research — readiness ${s.readinessScore}/100)`, court: s.court, caseType: "Constitutional" };
    }
    return { text: search.text ?? SAMPLE_DOCUMENTS[0].text, court: search.court ?? "Karnataka High Court", caseType: search.caseType ?? "Property" };
  }, [search]);

  const [text, setText] = useState(initial.text);
  const [court, setCourt] = useState(initial.court);
  const [caseType, setCaseType] = useState(initial.caseType);
  const [depth, setDepth] = useState<"Quick" | "Deep" | "Comprehensive">("Deep");
  const [running, setRunning] = useState(false);
  const [revealCount, setRevealCount] = useState(0); // 0..7
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [agentStatus, setAgentStatus] = useState<("idle" | "running" | "done")[]>(["idle","idle","idle","idle","idle","idle","idle"]);
  const [details, setDetails] = useState<Record<string, boolean>>({});
  const [identified, setIdentified] = useState<{ petitioner: string; respondent: string; petAdvocate?: string; resAdvocate?: string; petArgs: string[]; resArgs: string[] } | null>(null);

  // AI Search tab state
  const [aiQuery, setAiQuery] = useState("");
  const [aiSearching, setAiSearching] = useState(false);

  // Google Search tab state
  const [googleQuery, setGoogleQuery] = useState("");
  const [googleSearching, setGoogleSearching] = useState(false);
  const [googleResults, setGoogleResults] = useState<Array<{
    title: string; link: string; snippet: string; displayLink: string;
  }> | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Upload
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Right panel
  const [suggestions, setSuggestions] = useState<{ title: string; body: string }[] | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [similarOpen, setSimilarOpen] = useState(false);
  const [similar, setSimilar] = useState<Awaited<ReturnType<typeof findSimilar>> | null>(null);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    setText(initial.text); setCourt(initial.court); setCaseType(initial.caseType);
    setRunning(false); setRevealCount(0); setPipeline(null); setSuggestions(null);
  }, [initial]);

  const toggle = (k: string) => setDetails((s) => ({ ...s, [k]: !s[k] }));

  async function handleAiSearch() {
    if (!aiQuery.trim()) return;
    setAiSearching(true);
    try {
      const result = await identify({ data: { query: aiQuery.trim() } });
      const block = `${result.caseName}
${result.citation} · ${result.court} · ${result.year}

PARTIES
  Petitioner: ${result.parties.petitioner}
  Respondent: ${result.parties.respondent}

STATUTES INVOLVED
${result.statutes.map((s) => `  • ${s}`).join("\n")}

HOLDING
${result.holding}

PRINCIPLE
${result.principle}

SUMMARY
${result.summary}`;
      setText(block);
      setIdentified({
        petitioner: result.parties.petitioner,
        respondent: result.parties.respondent,
        petArgs: [result.principle, result.holding].filter(Boolean),
        resArgs: [`Counter to: ${result.principle}`, "Reliance on statutory bar / procedural defect"].filter(Boolean),
      });
      if (result.court.includes("Supreme")) setCourt("Supreme Court of India");
      else if (COURTS.includes(result.court)) setCourt(result.court);
      toast.success(`Identified: ${result.caseName}`, { description: `Confidence ${(result.confidence * 100).toFixed(0)}%` });
    } catch (e) {
      toast.error("AI search failed", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setAiSearching(false);
    }
  }

  async function handleGoogleSearch() {
    if (!googleQuery.trim()) return;
    setGoogleSearching(true);
    setGoogleError(null);
    setGoogleResults(null);
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const cx = import.meta.env.VITE_GOOGLE_CSE_ID;
      if (!apiKey || !cx) {
        // Fallback: open Google search in new tab
        const url = `https://www.google.com/search?q=${encodeURIComponent(googleQuery + " site:indiankanoon.org OR site:casemine.com OR site:judis.nic.in")}`;
        window.open(url, "_blank");
        setGoogleError("Google Custom Search API keys not configured (VITE_GOOGLE_API_KEY, VITE_GOOGLE_CSE_ID). Opened Google in new tab instead.");
        return;
      }
      const q = `${googleQuery} Indian law court judgment`;
      const res = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(q)}&num=10`
      );
      if (!res.ok) {
        let hint = "";
        if (res.status === 403) {
          hint = " — your API key has restrictions. Go to Google Cloud Console → Credentials → click your key → set 'Application restrictions' to 'None' (for local dev) and 'API restrictions' to 'Custom Search API' only.";
        } else if (res.status === 400) {
          hint = " — check VITE_GOOGLE_CSE_ID is correct (no spaces, just the cx value).";
        } else if (res.status === 429) {
          hint = " — quota exceeded. Google free tier is 100 queries/day.";
        }
        throw new Error(`Google API error: ${res.status}${hint}`);
      }
      const data = await res.json();
      setGoogleResults(
        (data.items ?? []).map((item: { title: string; link: string; snippet: string; displayLink: string }) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          displayLink: item.displayLink,
        }))
      );
      if (!data.items?.length) setGoogleError("No results found. Try a different query.");
    } catch (e) {
      setGoogleError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setGoogleSearching(false);
    }
  }

  async function handleFileUpload(file: File | undefined) {
    if (!file) return;
    setParsing(true);
    try {
      // For PDFs/DOCX, route through backend for better extraction + immediate NLP preview.
      // For plain text, fall back to client-side extract for speed.
      const isBinary = /\.(pdf|docx|doc)$/i.test(file.name);
      if (isBinary) {
        const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API}/api/upload/pdf`, { method: "POST", body: formData });
        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Backend ${res.status}: ${errBody.slice(0, 200)}`);
        }
        const data = await res.json();
        setText(data.full_text.slice(0, 30000));
        const preview = data.nlp_preview;
        toast.success(`Extracted ${data.chars_extracted.toLocaleString()} chars from ${file.name}`, {
          description: `Found ${preview.citations_found} citations · ${preview.statutes_found} statutes · ${preview.entities_found} entities`,
        });
      } else {
        const extracted = await extractFileText(file);
        setText(extracted.slice(0, 30000));
        toast.success(`Extracted ${extracted.length.toLocaleString()} characters from ${file.name}`);
      }
    } catch (e) {
      toast.error("Failed to parse document", { description: e instanceof Error ? e.message : "Unsupported file" });
    } finally {
      setParsing(false);
    }
  }

  async function startResearch() {
    // Depth controls how many agent cards run.
    // Quick = 2 (Legal Intelligence + Precedent Retrieval)
    // Deep = 5 core agents (adds Citation Verification + Knowledge Graph + Procedural Risk)
    // Comprehensive = 7 (adds Applicable Statutes + Argument Builder via Report Generator)
    const maxStage = depth === "Quick" ? 2 : depth === "Deep" ? 5 : 7;
    toast.message(`${depth} research started`, {
      description: depth === "Quick" ? "Running 2 agents · Legal Intelligence + Precedent Retrieval"
        : depth === "Deep" ? "Running 5 core agents"
        : "Running all 7 agents · full discovery canvas",
    });
    setRunning(true);
    setPipeline(null);
    setRevealCount(0);
    setSuggestions(null);
    setAgentStatus(["idle","idle","idle","idle","idle","idle","idle"]);


    const setStatus = (i: number, s: "running" | "done") =>
      setAgentStatus((arr) => { const n = [...arr]; n[i] = s; return n; });

    try {
      // ===== TRY BACKEND FIRST (no AI key needed) =====
      const depthMap = { Quick: "quick", Deep: "deep", Comprehensive: "comprehensive" } as const;
      const br = await runFullPipeline(text, court, caseType, depthMap[depth]);
      if (br?.results) {
        const r = br.results;
        const intl = r.legal_intelligence?.data || {};
        const prec = r.precedent_retrieval?.data || { supporting: [], opposing: [] };
        const cit = r.citation_verification || { total: 0, verified: 0, data: [] };
        const rd = r.procedural_risk?.data || { score: 50, strengths: [], moderate_risks: [], critical_risks: [], missing_documents: [], contradictions: [], recommendations: [] };
        const rpt = r.report?.data || {};
        setAgentStatus(["done","done","done","done","done","done","done"]);
        setRevealCount(maxStage);
        const mp = (a: any[]) => a.map((p: any) => ({ name: p.name, citation: p.citation, relevance: p.holding?.slice(0,100)||p.principle||"", weight: p.bm25_score?Math.min(p.bm25_score/6,1):0.5 }));
        const wk = (cit.data||[]).filter((c: any)=>c.status==="Weak"||c.status==="weak").length;
        const ov = (cit.data||[]).filter((c: any)=>c.status==="Overruled"||c.status==="overruled").length;
        const es = rpt?.sections?.["1_executive_summary"]?.content || "Pipeline completed in "+br.total_processing_time_sec+"s.";
        setPipeline({
          intel: { petitioner: intl.parties?.petitioner||"", respondent: intl.parties?.respondent||"", bench:"", date:"", outcomeSought:"", tags: intl.legal_issues||[], statutes: (intl.statutes||[]).map((s: any)=>s.raw||s.act+" S. "+s.section), citationsExtracted: intl.citations||[], issues: intl.legal_issues||[], keywords: (intl.statutes||[]).map((s: any)=>s.act), category: caseType },
          supporting: mp(prec.supporting?.slice(0,10)||[]),
          opposing: mp(prec.opposing?.slice(0,5)||[]),
          citations: { total:cit.total, verified:cit.verified||0, weak:wk, overruled:ov },
          matchedCitations: (cit.data||[]).map((c: any)=>({text:c.citation, status:(c.status||"missing").toLowerCase()})),
          graph: { connectedCases:(prec.supporting?.length||0)+(prec.opposing?.length||0), connectedStatutes:(intl.statutes||[]).length, connectedJudges:(intl.judges||[]).length||2 },
          flags: { missingDocuments:rd.missing_documents||[], weakCitations:wk, overruledCitations:ov, contradictions:rd.contradictions||[], score:rd.score||50 },
          risk: { score:rd.score||50, strong:rd.strengths?.map((s: any)=>s.detail).join(". ")||"", moderate:rd.moderate_risks?.map((x: any)=>x.detail).join(". ")||"", weak:rd.critical_risks?.map((x: any)=>x.detail).join(". ")||"", recommendations:rd.recommendations||[] },
          applicableStatutes: (intl.statutes||[]).map((s: any)=>({ref:s.raw||s.act+" S. "+s.section, purpose:"NLP engine"})),
          argument: { primary:es, strength:rd.score>=70?3:rd.score>=40?2:1, label:rd.score>=70?"Strong":rd.score>=40?"Moderate":"Weak" },
          executiveSummary: es,
        });
        toast.success("Research complete via NLP backend");
        setRunning(false);
        return;
      }
      // ===== FALLBACK: AI SDK pipeline =====
      // ===== AGENT 1: Legal Intelligence (NLP extraction) =====
      setRevealCount(1); setStatus(0, "running");
      const intel = await callAgent1({ data: { text, court, caseType } });
      setStatus(0, "done");

      // ===== AGENT 2: Precedent Retrieval (deterministic + AI rank) =====
      setRevealCount(2); setStatus(1, "running");
      const candidates = retrievePrecedentCandidates(
        [...intel.keywords, ...intel.tags], intel.category || caseType,
      );
      let supporting: PipelineState["supporting"] = [];
      let opposing: PipelineState["opposing"] = [];
      if (candidates.length > 0) {
        const ranked = await callAgent2({
          data: { keywords: intel.keywords, category: intel.category || caseType, candidates },
        });
        const map = (arr: { id: string; weight: number; relevance: string }[]) =>
          arr.map((r) => {
            const c = lookupCaseById(r.id);
            return c ? { name: c.name, citation: c.citation, relevance: r.relevance, weight: r.weight } : null;
          }).filter((x): x is NonNullable<typeof x> => x !== null);
        supporting = map(ranked.supporting);
        opposing = map(ranked.opposing);
      }
      setStatus(1, "done");

      // ===== AGENT 3: Citation Verification (fuzzy match + AI on unmatched) =====
      let citationStats = { total: 0, verified: 0, weak: 0, overruled: 0 };
      let allCitations: MatchedCitation[] = [];
      if (maxStage >= 3) {
        setRevealCount(3); setStatus(2, "running");
        const { matched, unmatched } = matchCitations(intel.citationsExtracted);
        allCitations = [...matched];
        if (unmatched.length > 0) {
          const explained = await callAgent3({ data: { unmatched: unmatched.slice(0, 20) } });
          allCitations = [
            ...matched,
            ...explained.explained.map((e) => ({ text: e.citation, status: e.status })),
          ];
        }
        citationStats = {
          total: allCitations.length,
          verified: allCitations.filter((c) => c.status === "verified").length,
          weak: allCitations.filter((c) => c.status === "weak" || c.status === "missing").length,
          overruled: allCitations.filter((c) => c.status === "overruled").length,
        };
        setStatus(2, "done");
      }

      // ===== Knowledge Graph card (computed from agents 1-3) =====
      let graphStats = { connectedCases: 0, connectedStatutes: 0, connectedJudges: 0 };
      if (maxStage >= 4) {
        setRevealCount(4); setStatus(3, "running");
        graphStats = {
          connectedCases: supporting.length + opposing.length,
          connectedStatutes: intel.statutes.length,
          connectedJudges: Math.max(2, Math.round((supporting.length + opposing.length) / 2)),
        };
        setStatus(3, "done");
      }

      // ===== AGENT 4: Procedural Risk (rule checklist + AI narrative) =====
      let flags: RiskFlags = { missingDocuments: [], weakCitations: 0, overruledCitations: 0, contradictions: [], score: 0 };
      let riskNarrative = { strong: "", moderate: "", weak: "", recommendations: [] as string[] };
      if (maxStage >= 5) {
        setRevealCount(5); setStatus(4, "running");
        flags = runRiskChecklist(intel, allCitations, intel.category || caseType);
        riskNarrative = await callAgent4({ data: { flags, caseType } });
        setStatus(4, "done");
      }

      // ===== Applicable Statutes card (from agent 1) =====
      let applicableStatutes: { ref: string; purpose: string }[] = [];
      if (maxStage >= 6) {
        setRevealCount(6); setStatus(5, "running");
        applicableStatutes = intel.statutes.map((s) => ({ ref: s, purpose: "Invoked in pleading" }));
        setStatus(5, "done");
      }

      // ===== AGENT 5: Report Generator (single AI synthesis call) =====
      let synth = { primaryArgument: "", strength: 0, label: "", executiveSummary: "" };
      if (maxStage >= 7) {
        setRevealCount(7); setStatus(6, "running");
        synth = await callAgent5({
          data: {
            intel: {
              petitioner: intel.petitioner, respondent: intel.respondent,
              outcomeSought: intel.outcomeSought, issues: intel.issues,
            },
            supportingCount: supporting.length,
            opposingCount: opposing.length,
            citationStats: { verified: citationStats.verified, weak: citationStats.weak, overruled: citationStats.overruled },
            riskScore: flags.score,
            caseType, court,
          },
        });
        setStatus(6, "done");
      }

      setPipeline({
        intel,
        supporting, opposing,
        citations: citationStats,
        matchedCitations: allCitations,
        graph: graphStats,
        flags,
        risk: { score: flags.score, ...riskNarrative },
        applicableStatutes,
        argument: { primary: synth.primaryArgument, strength: synth.strength, label: synth.label },
        executiveSummary: synth.executiveSummary,
      });
      toast.success(`${depth} research complete · ${maxStage} agents executed`);

      setLoadingSuggestions(true);
      getSuggestions({ data: { text, caseType } })
        .then((s) => setSuggestions(s))
        .catch(() => setSuggestions([]))
        .finally(() => setLoadingSuggestions(false));
    } catch (e) {
      toast.error("Pipeline failed", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setRunning(false);
    }
  }

  async function handleFindSimilar(caseName: string) {
    setSimilarOpen(true);
    setLoadingSimilar(true);
    setSimilar(null);
    try {
      const cases = await findSimilar({ data: { caseName } });
      setSimilar(cases);
    } catch (e) {
      toast.error("Find similar failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setLoadingSimilar(false);
    }
  }

  // Pipeline view-data (with static fallback before run)
  const cards = pipeline;
  const supporting = cards?.supporting ?? STATIC_SUPPORTING.map((p) => ({ name: p.name, citation: p.citation, relevance: p.principle, weight: 0.85 }));
  const opposing = cards?.opposing ?? STATIC_OPPOSING.map((p) => ({ name: p.name, citation: p.citation, relevance: p.principle, weight: 0.6 }));
  const citationStats = cards?.citations ?? { total: 14, verified: 11, weak: 2, overruled: 1 };
  const graphStats = cards?.graph ?? { connectedCases: 12, connectedStatutes: 4, connectedJudges: 6 };
  const risk = cards?.risk ?? {
    score: 73,
    strong: "Citation grounding · 11 verified precedents · clear holding extraction",
    moderate: "Evidence completeness · 1 missing affidavit reference",
    weak: "2 contradictions in timeline · 1 overruled citation must be replaced",
    recommendations: [
      "Replace ADM Jabalpur citation with Puttaswamy (2017) 10 SCC 1",
      "Annex the registered lease deed as Exhibit P-3",
      "Reconcile dates of possession in ¶ 2 and ¶ 7",
    ],
  };
  const statutes = cards?.applicableStatutes ?? [
    { ref: "Karnataka Rent Act, 1999 § 27(2)(r)", purpose: "Bona fide requirement ground for eviction." },
    { ref: "Karnataka Rent Act, 1999 § 27(7)", purpose: "Comparative hardship analysis." },
    { ref: "CPC § 100", purpose: "Second appeal lies only on substantial question of law." },
  ];
  const intel = cards?.intel ?? {
    petitioner: "Ramesh Kumar", respondent: "Suresh Singh", bench: "Single Judge", date: "2022",
    outcomeSought: "Dismissal of eviction decree",
    tags: ["Bona fide requirement", "Comparative hardship", "Rent control", "Second appeal"],
    statutes: ["Karnataka Rent Act, 1999 §§ 27(2)(r), 27(7)", "CPC § 100"],
    citationsExtracted: [], issues: [], keywords: [], category: caseType,
  };
  const argument = cards?.argument ?? {
    primary: "The respondent's bona fide need is not genuine — son's medical practice not established by registration or premises survey. Comparative hardship under § 27(7) tips for tenant given 20-year occupation.",
    strength: 3, label: "Strong",
  };

  const isCardVisible = (i: number) => running || pipeline ? i < revealCount : false;
  const isCardDone = (i: number) => pipeline !== null && i < revealCount;

  return (
    <div>
      <PageHeader
        eyebrow="Discovery Canvas"
        title="Research Workspace"
        subtitle="Paste, upload, sample, or AI search. Seven agents extract entities, retrieve precedents, verify citations, map the knowledge graph, and score procedural risk."
        actions={
          <Button asChild variant="outline" className="border-border">
            <a href="/report"><FileText className="h-4 w-4 mr-1.5" /> Generate Report</a>
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-5 px-8 py-6">
        {/* LEFT */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="glass rounded-xl p-4">
            <Tabs defaultValue="paste">
              <TabsList className="flex flex-wrap gap-1.5 bg-background/60 p-1.5 h-auto justify-start">
                <TabsTrigger value="paste" className="text-[11.5px] uppercase tracking-wider font-medium px-3 py-1.5">Paste</TabsTrigger>
                <TabsTrigger value="upload" className="text-[11.5px] uppercase tracking-wider font-medium px-3 py-1.5">Upload</TabsTrigger>
                <TabsTrigger value="sample" className="text-[11.5px] uppercase tracking-wider font-medium px-3 py-1.5">Samples</TabsTrigger>
                <TabsTrigger value="ai" className="text-[11.5px] uppercase tracking-wider font-medium px-3 py-1.5"><Wand2 className="h-3 w-3 mr-1" />AI</TabsTrigger>
                <TabsTrigger value="google" className="text-[11.5px] uppercase tracking-wider font-medium px-3 py-1.5"><Search className="h-3 w-3 mr-1" />Google</TabsTrigger>
              </TabsList>

              <TabsContent value="paste" className="mt-3">
                <textarea
                  value={text} onChange={(e) => setText(e.target.value)} rows={14}
                  className="w-full rounded-md border border-border bg-background/60 px-3 py-2.5 text-[12.5px] font-serif leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </TabsContent>

              <TabsContent value="upload" className="mt-3 space-y-3">
                <input
                  ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" hidden
                  onChange={(e) => handleFileUpload(e.target.files?.[0] ?? undefined)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={parsing}
                  className="w-full rounded-md border-2 border-dashed border-border bg-background/40 p-8 text-center hover:border-primary/40 transition disabled:opacity-60"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="h-7 w-7 mx-auto text-primary mb-2 animate-spin" />
                      <div className="text-sm">Extracting text…</div>
                    </>
                  ) : (
                    <>
                      <Upload className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
                      <div className="text-sm">Drop or click to upload</div>
                      <div className="text-[11px] text-muted-foreground mt-1">PDF · DOCX · TXT · up to 20MB</div>
                    </>
                  )}
                </button>

                {/* Sample PDF library - for demos */}
                <div className="rounded-md border border-border bg-surface/40 p-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                    Try a sample judgment
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { name: "Maneka Gandhi v. Union of India (1978)", file: "/samples/maneka_gandhi.pdf", desc: "Constitutional · Article 21" },
                      { name: "Kesavananda Bharati v. State of Kerala (1973)", file: "/samples/kesavananda.pdf", desc: "Basic Structure Doctrine" },
                      { name: "Vishaka v. State of Rajasthan (1997)", file: "/samples/vishaka.pdf", desc: "Workplace Sexual Harassment" },
                    ].map((s) => (
                      <button
                        key={s.file}
                        onClick={async () => {
                          setParsing(true);
                          try {
                            const r = await fetch(s.file);
                            if (!r.ok) throw new Error("Sample not bundled. Download from Indian Kanoon instead.");
                            const blob = await r.blob();
                            const file = new File([blob], s.name.replace(/\s+/g, "_") + ".pdf", { type: "application/pdf" });
                            await handleFileUpload(file);
                          } catch (e) {
                            toast.error("Sample not found", {
                              description: e instanceof Error ? e.message : "Get the PDF from indiankanoon.org",
                            });
                          } finally {
                            setParsing(false);
                          }
                        }}
                        className="w-full text-left rounded-md border border-border bg-background/40 px-2.5 py-2 hover:border-primary/40 transition"
                      >
                        <div className="text-[12px] font-medium truncate">{s.name}</div>
                        <div className="text-[10.5px] text-muted-foreground">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2.5 text-[10.5px] text-muted-foreground border-t border-border/60 pt-2 leading-relaxed">
                    Get more PDFs from{" "}
                    <a href="https://indiankanoon.org" target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">indiankanoon.org</a>
                    {" "}— search any case → Print → Save as PDF
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sample" className="mt-3 space-y-2">
                {SAMPLE_DOCUMENTS.map((d) => (
                  <button
                    key={d.id} onClick={() => setText(d.text)}
                    className="w-full text-left rounded-md border border-border bg-surface/60 px-3 py-2 hover:border-primary/40 transition"
                  >
                    <div className="text-[12.5px] font-medium">{d.title.replace("Sample — ", "")}</div>
                    <div className="text-[11px] text-muted-foreground">{d.court}</div>
                  </button>
                ))}
              </TabsContent>

              <TabsContent value="ai" className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11.5px] text-muted-foreground">
                    Search any case, person, event, or legal concept.
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9.5px] font-mono uppercase tracking-wider text-primary">
                    <Sparkles className="h-2.5 w-2.5" /> AI Search
                  </span>
                </div>
                <AISearchBar
                  context="research"
                  placeholder="Search any case, person, event, or legal concept..."
                  value={aiQuery}
                  onValueChange={setAiQuery}
                  onSelect={(sel) => {
                    if (sel.kind === "case" && sel.case) {
                      const c = sel.case;
                      setText(`${c.name}\n${c.citation} · ${c.court} · ${c.year}\n\n${c.snippet}`);
                      if (c.court.includes("Supreme")) setCourt("Supreme Court of India");
                      else if (COURTS.includes(c.court)) setCourt(c.court);
                      toast.success(`Loaded: ${c.name}`);
                    }
                  }}
                />
                <Button onClick={handleAiSearch} disabled={aiSearching || !aiQuery.trim()} className="w-full gold-gradient border-0">
                  {aiSearching ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Identifying…</> : <><Search className="h-4 w-4 mr-1.5" />Deep Identify</>}
                </Button>

                {identified && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-verified/30 bg-verified/5 p-2.5">
                      <div className="text-[9.5px] font-mono uppercase tracking-wider text-verified mb-1">Petitioner / Appellant</div>
                      <div className="text-[12px] font-semibold text-foreground/90 leading-snug">{identified.petitioner}</div>
                      {identified.petAdvocate && <div className="text-[10.5px] text-muted-foreground mt-0.5">{identified.petAdvocate}</div>}
                      <ul className="mt-2 space-y-1 text-[11px] text-foreground/80">
                        {identified.petArgs.slice(0, 2).map((a, i) => <li key={i} className="line-clamp-2">• {a}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md border border-overruled/30 bg-overruled/5 p-2.5">
                      <div className="text-[9.5px] font-mono uppercase tracking-wider text-overruled mb-1">Respondent / Defendant</div>
                      <div className="text-[12px] font-semibold text-foreground/90 leading-snug">{identified.respondent}</div>
                      {identified.resAdvocate && <div className="text-[10.5px] text-muted-foreground mt-0.5">{identified.resAdvocate}</div>}
                      <ul className="mt-2 space-y-1 text-[11px] text-foreground/80">
                        {identified.resArgs.slice(0, 2).map((a, i) => <li key={i} className="line-clamp-2">• {a}</li>)}
                      </ul>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ─── GOOGLE SEARCH TAB ─── */}
              <TabsContent value="google" className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11.5px] text-muted-foreground">
                    Search Indian legal cases via Google — results load directly into your workspace.
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[9.5px] font-mono uppercase tracking-wider text-blue-400">
                    <Search className="h-2.5 w-2.5" /> Google
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <input
                    value={googleQuery}
                    onChange={(e) => setGoogleQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGoogleSearch()}
                    placeholder="e.g. Maneka Gandhi fundamental rights Article 21..."
                    className="flex-1 glass rounded-md px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <Button
                    onClick={handleGoogleSearch}
                    disabled={googleSearching || !googleQuery.trim()}
                    size="sm"
                    className="gold-gradient border-0 px-3 flex-shrink-0"
                  >
                    {googleSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: "Indian Kanoon", domain: "indiankanoon.org" },
                    { label: "CaseMine", domain: "casemine.com" },
                    { label: "Judis", domain: "judis.nic.in" },
                    { label: "SCC Online", domain: "scconline.com" },
                  ].map(({ label, domain }) => (
                    <button
                      key={label}
                      onClick={() => {
                        const q = googleQuery || "Indian law judgment";
                        window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}+site:${domain}`, "_blank");
                      }}
                      className="text-[9.5px] font-mono px-1.5 py-0.5 rounded border border-border bg-surface/40 hover:border-primary/40 transition"
                    >
                      → {label}
                    </button>
                  ))}
                </div>
                {googleError && (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11.5px] text-amber-400">
                    {googleError}
                  </div>
                )}
                {googleResults && googleResults.length > 0 && (
                  <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1">
                    {googleResults.map((r, i) => (
                      <div key={i} className="rounded-md border border-border bg-surface/40 p-2.5 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <a
                            href={r.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[12.5px] font-medium text-primary hover:underline leading-snug flex-1"
                          >
                            {r.title}
                          </a>
                          <button
                            onClick={() => {
                              setText(`Source: ${r.link}\n\n${r.title}\n\n${r.snippet}`);
                              toast.success("Loaded into workspace", { description: r.title.slice(0, 60) });
                            }}
                            className="text-[9.5px] font-mono px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition flex-shrink-0"
                          >
                            Use
                          </button>
                        </div>
                        <div className="text-[10px] text-primary/60 font-mono">{r.displayLink}</div>
                        <div className="text-[11px] text-muted-foreground leading-relaxed">{r.snippet}</div>
                      </div>
                    ))}
                  </div>
                )}
                {!googleResults && !googleError && !googleSearching && (
                  <div className="text-center text-[11px] text-muted-foreground py-4">
                    Enter a query to search across Indian Kanoon, CaseMine, Judis and more.<br />
                    Results can be loaded directly into your research workspace.
                  </div>
                )}
              </TabsContent>

            </Tabs>
          </div>

          <div className="glass rounded-xl p-4 space-y-3">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Court</label>
              <Select value={court} onValueChange={setCourt}>
                <SelectTrigger className="mt-1 bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">{COURTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Case Type</label>
              <Select value={caseType} onValueChange={setCaseType}>
                <SelectTrigger className="mt-1 bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{CASE_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Research depth</label>
              <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-md bg-background/60 p-1 border border-border">
                {(["Quick", "Deep", "Comprehensive"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => { setDepth(d); toast.info(`${d} mode`, { description: d === "Quick" ? "2 agents" : d === "Deep" ? "5 agents" : "7 agents" }); }}
                    className={`text-[11.5px] py-1.5 rounded transition ${depth === d ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground font-mono">
                {depth === "Quick" ? "2 agents · Intel + Precedents" : depth === "Deep" ? "5 core agents" : "All 7 agents · full canvas"}
              </div>
            </div>

            <Button onClick={startResearch} disabled={running || !text.trim()} className="w-full gold-gradient border-0 hover:opacity-95">
              {running ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Researching…</> : <>Begin Research <ArrowRight className="ml-1.5 h-4 w-4" /></>}
            </Button>
          </div>
        </aside>

        {/* CENTER */}
        <section className="col-span-12 lg:col-span-6 space-y-4">
          {/* ─── NLP Pipeline Trace — ALWAYS visible when text exists ─── */}
          {text && text.length > 20 && (
            <NLPTracePanel documentText={text} court={court} caseType={caseType} />
          )}

          {!running && !pipeline && revealCount === 0 && (
            <div className="glass rounded-xl p-10 text-center">
              <Sparkles className="h-8 w-8 mx-auto text-primary mb-3" />
              <h3 className="font-display text-xl">Discovery canvas ready</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Click <strong>Begin Research</strong>. Seven AI agents will analyze your matter — cards appear progressively with reasoning.
              </p>
            </div>
          )}

          <AnimatePresence>
            {isCardVisible(0) && (
              <DiscoveryCard key="li" kind="nlp" index={0} done={isCardDone(0)} icon={Brain} title="Legal Intelligence" sub="Case profile extracted"
                detailsOpen={!!details.li} onToggle={() => toggle("li")}>
                <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                  <Field label="Petitioner" value={intel.petitioner} />
                  <Field label="Respondent" value={intel.respondent} />
                  <Field label="Court" value={court} />
                  <Field label="Bench" value={intel.bench} />
                  <Field label="Date" value={intel.date} />
                  <Field label="Outcome sought" value={intel.outcomeSought} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {intel.tags.map((t) => (
                    <span key={t} className="rounded-full bg-primary/10 text-primary/90 border border-primary/25 px-2 py-0.5 text-[11px]">{t}</span>
                  ))}
                </div>
                <div className="mt-3 text-[12px] text-muted-foreground">
                  <strong className="text-foreground">Statutes:</strong> {intel.statutes.join("; ")}
                </div>
              </DiscoveryCard>
            )}

            {isCardVisible(1) && (
              <DiscoveryCard key="pr" kind="hybrid" index={1} done={isCardDone(1)} icon={Search} title="Precedent Retrieval"
                sub={`${supporting.length + opposing.length} precedents · ${supporting.length} supporting · ${opposing.length} opposing`}
                detailsOpen={!!details.pr} onToggle={() => toggle("pr")}>
                <div className="mb-2 text-[10.5px] font-mono uppercase tracking-wider text-verified flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-verified" /> Supporting
                </div>
                <ul className="space-y-1.5 mb-3">
                  {supporting.slice(0, 5).map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px]">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="legal-mono text-muted-foreground text-[11px]">{p.citation}</div>
                      </div>
                      <span className="text-[10px] font-mono text-primary/80 flex-shrink-0">{p.weight.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mb-2 text-[10.5px] font-mono uppercase tracking-wider text-overruled flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-overruled" /> Opposing
                </div>
                <ul className="space-y-1.5">
                  {opposing.slice(0, 4).map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px]">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground italic">{p.relevance}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </DiscoveryCard>
            )}

            {isCardVisible(2) && (
              <DiscoveryCard key="cv" kind="hybrid" index={2} done={isCardDone(2)} icon={BadgeCheck} title="Citation Verification" sub={`${citationStats.total} citations analyzed`}
                detailsOpen={!!details.cv} onToggle={() => toggle("cv")}>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Verified", count: citationStats.verified, status: "verified" as const },
                    { label: "Weak", count: citationStats.weak, status: "weak" as const },
                    { label: "Overruled", count: citationStats.overruled, status: "overruled" as const },
                  ].map((b) => (
                    <div key={b.label} className="rounded-lg border border-border bg-background/60 p-3 text-center">
                      <div className="font-display text-2xl font-bold">{b.count}</div>
                      <div className="mt-1 flex justify-center"><StatusBadge status={b.status} /></div>
                    </div>
                  ))}
                </div>
                <a href="/citations" className="mt-3 inline-flex items-center gap-1 text-[12px] text-primary/90 hover:text-primary">
                  Open verification center <ExternalLink className="h-3 w-3" />
                </a>
              </DiscoveryCard>
            )}

            {isCardVisible(3) && (
              <DiscoveryCard key="kg" kind="rule" index={3} done={isCardDone(3)} icon={Network} title="Knowledge Graph Preview"
                sub={`${graphStats.connectedCases} cases · ${graphStats.connectedStatutes} statutes · ${graphStats.connectedJudges} judges connected`}
                detailsOpen={!!details.kg} onToggle={() => toggle("kg")}>
                <MiniGraph />
                <a href="/graph" className="mt-3 inline-flex items-center gap-1 text-[12px] text-primary/90 hover:text-primary">
                  Explore full graph <ArrowRight className="h-3 w-3" />
                </a>
              </DiscoveryCard>
            )}

            {isCardVisible(4) && (
              <DiscoveryCard key="pra" kind="hybrid" index={4} done={isCardDone(4)} icon={AlertTriangle} title="Procedural Risk Analyzer" sub={`Court Readiness Score: ${risk.score} / 100`}
                accent="primary" detailsOpen={!!details.pra} onToggle={() => toggle("pra")}>
                <div className="flex items-center gap-4">
                  <ReadinessGauge value={risk.score} />
                  <div className="flex-1 space-y-2 text-[12.5px]">
                    <RiskRow tone="verified" label="Strong" body={risk.strong} />
                    <RiskRow tone="weak" label="Moderate" body={risk.moderate} />
                    <RiskRow tone="risk" label="Weak" body={risk.weak} />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/60">
                  <div className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Recommended actions</div>
                  <ul className="space-y-1.5 text-[12.5px]">
                    {risk.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2"><Plus className="h-3.5 w-3.5 text-primary mt-0.5" />{r}</li>
                    ))}
                  </ul>
                </div>
              </DiscoveryCard>
            )}

            {isCardVisible(5) && (
              <DiscoveryCard key="st" kind="nlp" index={5} done={isCardDone(5)} icon={BookOpen} title="Applicable Statutes" sub={`${statutes.length} provisions`}
                detailsOpen={!!details.st} onToggle={() => toggle("st")}>
                <ul className="space-y-2 text-[12.5px]">
                  {statutes.map((s, i) => (
                    <li key={i}><strong>{s.ref}</strong> — {s.purpose}</li>
                  ))}
                </ul>
              </DiscoveryCard>
            )}

            {isCardVisible(6) && (
              <DiscoveryCard key="ab" kind="ai" index={6} done={isCardDone(6)} icon={ShieldCheck} title="Argument Builder" sub="Primary argument with strength meter"
                detailsOpen={!!details.ab} onToggle={() => toggle("ab")}>
                <div className="rounded-md border border-border bg-background/60 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-verified">Primary argument</div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4].map((i) => <span key={i} className={`h-1 w-6 rounded ${i <= argument.strength ? "bg-verified" : "bg-border"}`} />)}
                      <span className="text-[10px] text-muted-foreground ml-1">{argument.label}</span>
                    </div>
                  </div>
                  <p className="text-[12.5px] text-foreground/85 font-serif leading-relaxed">{argument.primary}</p>
                </div>
              </DiscoveryCard>
            )}
          </AnimatePresence>
        </section>

        {/* INTERACTIVE VISUALIZATIONS (LegalSphere + IIT KGP) */}
        {pipeline && (
          <section className="col-span-12 lg:col-span-9 space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TimelineViz events={[
                ...pipeline.supporting.map(s => ({ year: parseInt(s.citation.match(/\d{4}/)?.[0] || "2000"), name: s.name, type: "supporting" as const })),
                ...pipeline.opposing.map(s => ({ year: parseInt(s.citation.match(/\d{4}/)?.[0] || "2000"), name: s.name, type: "opposing" as const })),
              ]} />
              <EvidenceBoardViz
                petitioner={pipeline.intel.petitioner}
                respondent={pipeline.intel.respondent}
                statutes={pipeline.intel.statutes}
                issues={pipeline.intel.issues}
                supporting={pipeline.supporting}
                opposing={pipeline.opposing}
              />
              <CourtMapViz court={court} cases={pipeline.supporting} />
              <CaseTreeViz
                category={pipeline.intel.category || caseType}
                statutes={pipeline.applicableStatutes}
                supporting={pipeline.supporting}
                opposing={pipeline.opposing}
                citations={pipeline.citations}
                riskScore={pipeline.risk.score}
              />
              <div className="col-span-1 md:col-span-2">
                <SemanticSegmentsViz
                  tags={pipeline.intel.tags}
                  statutes={pipeline.intel.statutes}
                  precedents={pipeline.supporting.slice(0, 4).map(p => p.name.split(" v.")[0] || p.name)}
                />
              </div>
            </div>
          </section>
        )}

        {/* RIGHT */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="glass rounded-xl p-4 sticky top-20">
            <div className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Selected item</div>
            <div className="font-display text-base font-semibold">{pipeline?.supporting?.[0]?.name || "Maneka Gandhi v. Union of India"}</div>
            <div className="legal-mono text-muted-foreground text-[11px] mt-1">{pipeline?.supporting?.[0]?.citation || "(1978) 1 SCC 248"}</div>
            <div className="mt-2"><StatusBadge status="verified" /></div>
            <p className="text-[12px] text-foreground/85 mt-3 leading-relaxed font-serif">
              {pipeline?.supporting?.[0]?.relevance || 'Established that "procedure established by law" under Art. 21 must be just, fair and reasonable.'}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <Button size="sm" variant="outline" className="border-border" onClick={() => toast.success("Added to research")}>
                <Bookmark className="h-3 w-3 mr-1" />Add
              </Button>
              <Button size="sm" variant="outline" className="border-border" onClick={() => { navigator.clipboard.writeText((pipeline?.supporting?.[0]?.name || "Maneka Gandhi v. Union of India") + " " + (pipeline?.supporting?.[0]?.citation || "(1978) 1 SCC 248")); toast.success("Citation copied"); }}>
                Cite
              </Button>
              <Button size="sm" variant="outline" className="border-border col-span-2" onClick={() => handleFindSimilar(pipeline?.supporting?.[0]?.name || "Maneka Gandhi v. Union of India")}>
                {loadingSimilar ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Searching…</> : <>Find similar (AI)</>}
              </Button>
            </div>

            {/* AI Suggestions */}
            <div className="mt-4 pt-3 border-t border-border/60">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[10.5px] font-mono uppercase tracking-wider text-primary/90 flex items-center gap-1">
                  <Wand2 className="h-3 w-3" /> AI suggestions
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-primary">
                  <Sparkles className="h-2.5 w-2.5" /> AI Search
                </span>
              </div>
              {loadingSuggestions && <div className="text-[11px] text-muted-foreground"><Loader2 className="h-3 w-3 inline animate-spin mr-1" />Generating…</div>}
              {!loadingSuggestions && !suggestions && (
                <Button
                  size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 w-full"
                  onClick={async () => {
                    if (!text.trim()) { toast.error("Add some case text first"); return; }
                    setLoadingSuggestions(true);
                    try {
                      const s = await getSuggestions({ data: { text, caseType } });
                      setSuggestions(s);
                    } catch (e) {
                      toast.error("AI failed", { description: e instanceof Error ? e.message : "" });
                      setSuggestions([]);
                    } finally { setLoadingSuggestions(false); }
                  }}
                >
                  <Sparkles className="h-3 w-3 mr-1" /> Get AI recommendations
                </Button>
              )}
              {suggestions && suggestions.length === 0 && <div className="text-[11px] text-muted-foreground italic">No suggestions returned.</div>}
              {suggestions && suggestions.length > 0 && (
                <ul className="space-y-2">
                  {suggestions.map((s, i) => (
                    <li key={i} className="text-[11.5px]">
                      <div className="font-medium text-foreground/90">{s.title}</div>
                      <div className="text-muted-foreground">{s.body}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>


            <div className="mt-4 pt-3 border-t border-border/60">
              <div className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Research notes</div>
              <textarea rows={4} placeholder="Observations…" className="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[12px] font-serif focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none" />
            </div>
          </div>
        </aside>
      </div>

      {/* Find similar slide-over */}
      <AnimatePresence>
        {similarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm" onClick={() => setSimilarOpen(false)}>
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-surface-elevated border-l border-border overflow-y-auto p-6">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 className="h-4 w-4 text-primary" />
                <h3 className="font-display text-lg">AI · Similar cases</h3>
              </div>
              {loadingSimilar && <div className="text-sm text-muted-foreground"><Loader2 className="h-4 w-4 inline animate-spin mr-2" />Finding similar cases…</div>}
              {similar && (
                <ul className="space-y-3">
                  {similar.map((c, i) => (
                    <li key={i} className="rounded-md border border-border bg-background/60 p-3">
                      <div className="font-display text-[14px] font-semibold">{c.name}</div>
                      <div className="legal-mono text-primary/85 text-[11.5px]">{c.citation}</div>
                      <div className="text-[11px] text-muted-foreground">{c.court} · {c.year} · similarity {(c.similarity * 100).toFixed(0)}%</div>
                      <div className="text-[12px] text-foreground/85 mt-1 font-serif">{c.reason}</div>
                    </li>
                  ))}
                </ul>
              )}
              <Button className="mt-4 w-full gold-gradient border-0" onClick={() => setSimilarOpen(false)}>Close</Button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-foreground/90 mt-0.5">{value}</div>
    </div>
  );
}

function DiscoveryCard({
  index, done, icon: Icon, title, sub, children, detailsOpen, onToggle, accent, kind,
}: {
  index: number; done: boolean; icon: React.ElementType; title: string; sub: string;
  children: React.ReactNode; detailsOpen: boolean; onToggle: () => void; accent?: "primary";
  kind?: "nlp" | "ai" | "rule" | "hybrid";
}) {
  const kindLabel =
    kind === "nlp" ? "NLP Engine" :
    kind === "ai" ? "AI Explanation" :
    kind === "rule" ? "Rule-Based" :
    kind === "hybrid" ? "NLP + AI Explanation" : null;
  const kindClass =
    kind === "nlp" ? "bg-info/15 text-info border-info/30" :
    kind === "ai" ? "bg-primary/15 text-primary border-primary/30" :
    kind === "rule" ? "bg-verified/15 text-verified border-verified/30" :
    kind === "hybrid" ? "bg-gradient-to-r from-info/15 to-primary/15 text-foreground border-primary/30" :
    "";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className={`glass rounded-xl p-5 ${accent === "primary" ? "shadow-gold-glow border-primary/30" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${accent === "primary" ? "gold-gradient" : "bg-surface-elevated border border-border"}`}>
          <Icon className={`h-4 w-4 ${accent === "primary" ? "" : "text-primary"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-[17px] font-semibold leading-tight flex items-center gap-2">
              {title}
              {kindLabel && (
                <span className={`text-[9.5px] font-mono uppercase tracking-wider rounded-full border px-1.5 py-0.5 ${kindClass}`}>
                  {kindLabel}
                </span>
              )}
            </h3>
            <span className={`text-[10px] font-mono flex items-center gap-1 flex-shrink-0 ${done ? "text-verified" : "text-primary"}`}>
              {done ? <><span className="h-1.5 w-1.5 rounded-full bg-verified" /> Complete</> : <><Loader2 className="h-3 w-3 animate-spin" /> Running</>}
            </span>
          </div>
          <div className="text-[12.5px] text-muted-foreground mt-0.5">{sub}</div>
        </div>
      </div>
      <div className="mt-4">{children}</div>
      <button onClick={onToggle} className="mt-4 text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-primary inline-flex items-center gap-1">
        {detailsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {detailsOpen ? "Hide details" : "Show details"}
      </button>
    </motion.div>
  );
}

function RiskRow({ tone, label, body }: { tone: "verified" | "weak" | "risk"; label: string; body: string }) {
  const color = tone === "verified" ? "text-verified" : tone === "weak" ? "text-weak" : "text-risk";
  return (
    <div className="flex items-start gap-2">
      <span className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 bg-current ${color}`} />
      <div className="flex-1">
        <span className={`text-[10.5px] font-mono uppercase tracking-wider ${color}`}>{label}</span>
        <span className="text-foreground/85 ml-1.5">{body}</span>
      </div>
    </div>
  );
}

function ReadinessGauge({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "var(--verified)" : value >= 60 ? "var(--weak)" : "var(--risk)";
  return (
    <div className="relative h-24 w-24 flex-shrink-0">
      <svg viewBox="0 0 80 80" className="-rotate-90 h-full w-full">
        <circle cx="40" cy="40" r="36" stroke="var(--border)" strokeWidth="6" fill="none" />
        <circle cx="40" cy="40" r="36" stroke={color} strokeWidth="6" fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-2xl font-bold">{value}</div>
        <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">/ 100</div>
      </div>
    </div>
  );
}

function MiniGraph() {
  const nodes = [
    { x: 120, y: 60, r: 14, label: "Puttaswamy", color: "var(--primary)" },
    { x: 60, y: 110, r: 10, label: "Maneka", color: "var(--primary)" },
    { x: 200, y: 110, r: 10, label: "Vishaka", color: "var(--info)" },
    { x: 120, y: 160, r: 9, label: "Navtej", color: "var(--verified)" },
    { x: 40, y: 50, r: 8, label: "Kesava", color: "var(--primary)" },
    { x: 240, y: 60, r: 8, label: "ADM Jab.", color: "var(--overruled)" },
  ];
  const edges = [[0, 1], [0, 2], [0, 3], [3, 1], [1, 4], [0, 5]];
  return (
    <svg viewBox="0 0 280 200" className="w-full h-40 rounded-md border border-border bg-background/40">
      {edges.map((e, i) => {
        const a = nodes[e[0]], b = nodes[e[1]];
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--border-emphasis)" strokeWidth="1" />;
      })}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} opacity="0.85" />
          <text x={n.x} y={n.y + n.r + 10} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)" fontFamily="JetBrains Mono">{n.label}</text>
        </g>
      ))}
    </svg>
  );
}
