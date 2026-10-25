// Client-side orchestrator for the 5-agent pipeline.
// Runs deterministic NLP/rule-based steps locally against the seed corpus,
// and calls the server functions only for AI explanation steps.

import { LANDMARK_CASES, type LandmarkCase } from "@/lib/seed-data";
import type { Agent1Output } from "@/lib/pipeline.functions";

// ---- Agent 2 step A: keyword + category retrieval (deterministic) ----

export interface Candidate {
  id: string; name: string; citation: string;
  principle: string; category: string; status: string;
}

export function retrievePrecedentCandidates(
  keywords: string[], category: string, max = 12,
): Candidate[] {
  const kw = keywords.map((k) => k.toLowerCase()).filter(Boolean);
  const scored = LANDMARK_CASES.map((c: LandmarkCase) => {
    const hay = `${c.name} ${c.principle} ${c.holding} ${c.category}`.toLowerCase();
    let score = 0;
    for (const k of kw) if (hay.includes(k)) score += 2;
    if (c.category.toLowerCase() === category.toLowerCase()) score += 3;
    if (c.status === "landmark") score += 1;
    return { c, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);

  return scored.map(({ c }) => ({
    id: c.id, name: c.name, citation: c.citation,
    principle: c.principle, category: c.category, status: c.status,
  }));
}

export function lookupCaseById(id: string) {
  return LANDMARK_CASES.find((c) => c.id === id);
}

// ---- Agent 3 step A: citation matching (exact + fuzzy) ----

export interface MatchedCitation {
  text: string;
  status: "verified" | "weak" | "missing" | "overruled";
  matchedTo?: string;
}

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s()]/g, "").trim();
}

export function matchCitations(citations: string[]): {
  matched: MatchedCitation[]; unmatched: string[];
} {
  const corpus = LANDMARK_CASES.map((c) => ({
    norm: normalize(c.citation), name: c.name, status: c.status,
  }));
  const matched: MatchedCitation[] = [];
  const unmatched: string[] = [];

  for (const raw of citations) {
    const n = normalize(raw);
    // Exact match
    let hit = corpus.find((c) => c.norm === n);
    // Fuzzy: contains the volume/page tuple (e.g. "1978 1 scc 248")
    if (!hit) hit = corpus.find((c) => c.norm.includes(n) || n.includes(c.norm));
    if (hit) {
      matched.push({
        text: raw,
        status: hit.status === "overruled" ? "overruled" : "verified",
        matchedTo: hit.name,
      });
    } else {
      unmatched.push(raw);
    }
  }
  return { matched, unmatched };
}

// ---- Agent 4 step A: rule-based risk checklist ----

export interface RiskFlags {
  missingDocuments: string[];
  weakCitations: number;
  overruledCitations: number;
  contradictions: string[];
  score: number;
}

const REQUIRED_DOCS: Record<string, string[]> = {
  Criminal: ["FIR", "charge sheet", "panchnama"],
  Property: ["sale deed", "registration", "possession"],
  Commercial: ["agreement", "invoice", "notice"],
  Constitutional: ["impugned order", "writ petition"],
  "Fundamental Rights": ["impugned order"],
  Family: ["marriage certificate", "maintenance"],
};

export function runRiskChecklist(
  intel: Agent1Output, matched: MatchedCitation[], category: string,
): RiskFlags {
  const text = `${intel.petitioner} ${intel.respondent} ${intel.outcomeSought} ${intel.tags.join(" ")} ${intel.statutes.join(" ")}`.toLowerCase();
  const required = REQUIRED_DOCS[category] ?? [];
  const missingDocuments = required.filter((d) => !text.includes(d.toLowerCase()));

  const weakCitations = matched.filter((m) => m.status === "weak" || m.status === "missing").length;
  const overruledCitations = matched.filter((m) => m.status === "overruled").length;

  const contradictions: string[] = [];
  if (intel.issues.length === 0) contradictions.push("No legal issues identified");
  if (intel.citationsExtracted.length < 2) contradictions.push("Fewer than 2 citations in pleading");

  // Score: start at 100, deduct
  let score = 100;
  score -= missingDocuments.length * 8;
  score -= weakCitations * 5;
  score -= overruledCitations * 12;
  score -= contradictions.length * 6;
  score = Math.max(20, Math.min(100, score));

  return { missingDocuments, weakCitations, overruledCitations, contradictions, score };
}
