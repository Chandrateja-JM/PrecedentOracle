// 5-Agent Research Pipeline — each agent separates NLP/rule-based processing
// from AI explanation calls. The AI Gateway is used ONLY for structured
// extraction (Agent 1) and natural-language explanation (Agents 2-5).

import { createServerFn } from "@tanstack/react-start";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

const LOVABLE_MODEL = "google/gemini-3-flash-preview";
const ANTHROPIC_MODEL = "claude-sonnet-4-6";
const GEMINI_MODEL = "gemini-2.0-flash";

function getModel() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    const provider = createAnthropic({ apiKey: anthropicKey });
    return provider(ANTHROPIC_MODEL);
  }
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (lovableKey) {
    const provider = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": lovableKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    return provider(LOVABLE_MODEL);
  }
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const provider = createOpenAICompatible({
      name: "gemini",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
      headers: { Authorization: `Bearer ${geminiKey}` },
    });
    return provider(GEMINI_MODEL);
  }
  throw new Error("No AI key — set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env");
}

// ============================================================
// AGENT 1 — Legal Intelligence (NLP Engine: structured extraction)
// AI is used here strictly as an NLP engine returning JSON.
// ============================================================

const Agent1Input = z.object({
  text: z.string().min(10).max(20000),
  court: z.string(),
  caseType: z.string(),
});

export const agent1Extract = createServerFn({ method: "POST" })
  .validator((input: unknown) => Agent1Input.parse(input))
  .handler(async ({ data }) => {
    
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          petitioner: z.string(),
          respondent: z.string(),
          bench: z.string(),
          date: z.string(),
          outcomeSought: z.string(),
          tags: z.array(z.string()),
          statutes: z.array(z.string()),
          citationsExtracted: z.array(z.string()),
          issues: z.array(z.string()),
          keywords: z.array(z.string()),
          category: z.string(),
        }),
      }),
      prompt: `You are an NLP extraction engine for Indian legal documents. Return STRUCTURED ENTITIES ONLY — no prose, no opinions.

CASE TYPE: ${data.caseType}
COURT: ${data.court}
DOCUMENT:
${data.text.slice(0, 8000)}

Extract: parties, bench composition, date, outcome sought, doctrinal tags, statutes invoked, every citation string found verbatim, list of legal issues, 6-10 retrieval keywords, and one of these categories: Constitutional, Fundamental Rights, Criminal, Family, Commercial, Property, Environment, Tax, Service, Administrative.`,
    });
    return output;
  });

export type Agent1Output = Awaited<ReturnType<typeof agent1Extract>>;

// ============================================================
// AGENT 2 — Precedent Retrieval
//   Step A (deterministic): keyword + category match against seed
//   Step B (AI Explanation): rank and explain relevance only
// ============================================================

const Agent2Input = z.object({
  keywords: z.array(z.string()),
  category: z.string(),
  candidates: z.array(z.object({
    id: z.string(), name: z.string(), citation: z.string(),
    principle: z.string(), category: z.string(), status: z.string(),
  })),
});

export const agent2RankPrecedents = createServerFn({ method: "POST" })
  .validator((input: unknown) => Agent2Input.parse(input))
  .handler(async ({ data }) => {
    if (data.candidates.length === 0) {
      return { supporting: [], opposing: [] };
    }
    
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          supporting: z.array(z.object({
            id: z.string(), weight: z.number(), relevance: z.string(),
          })),
          opposing: z.array(z.object({
            id: z.string(), weight: z.number(), relevance: z.string(),
          })),
        }),
      }),
      prompt: `Pre-filtered ${data.candidates.length} seeded Indian cases matched the keywords/category by deterministic search. Your ONLY job: classify each into supporting vs opposing for the matter, assign a 0-1 relevance weight, and write a one-line reason. Do not invent cases — use only the IDs given.

Category: ${data.category}
Keywords: ${data.keywords.join(", ")}

Candidates:
${data.candidates.map((c) => `- [${c.id}] ${c.name} ${c.citation} — ${c.principle} (status: ${c.status})`).join("\n")}`,
    });
    return output;
  });

// ============================================================
// AGENT 3 — Citation Verification
//   Step A (deterministic): exact + fuzzy match against seeded citations
//   Step B (AI Explanation): explain only unmatched citations
// ============================================================

const Agent3Input = z.object({
  unmatched: z.array(z.string()).max(20),
});

export const agent3ExplainUnmatched = createServerFn({ method: "POST" })
  .validator((input: unknown) => Agent3Input.parse(input))
  .handler(async ({ data }) => {
    if (data.unmatched.length === 0) return { explained: [] };
    
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          explained: z.array(z.object({
            citation: z.string(),
            status: z.enum(["verified", "weak", "missing", "overruled"]),
            note: z.string(),
          })),
        }),
      }),
      prompt: `These Indian citations could NOT be matched against our verified seed corpus by exact/fuzzy match. For each, judge well-formedness (SCC/AIR/SCR format), and likely status. One short note per citation explaining WHY it didn't match (malformed, obscure, possibly overruled, etc.).

${data.unmatched.map((c, i) => `${i + 1}. ${c}`).join("\n")}`,
    });
    return output;
  });

// ============================================================
// AGENT 4 — Procedural Risk Analyzer
//   Step A (rule-based): run checklist, count flags
//   Step B (AI Explanation): natural-language risk narrative
// ============================================================

const Agent4Input = z.object({
  flags: z.object({
    missingDocuments: z.array(z.string()),
    weakCitations: z.number(),
    overruledCitations: z.number(),
    contradictions: z.array(z.string()),
    score: z.number(),
  }),
  caseType: z.string(),
});

export const agent4ExplainRisk = createServerFn({ method: "POST" })
  .validator((input: unknown) => Agent4Input.parse(input))
  .handler(async ({ data }) => {
    
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          strong: z.string(),
          moderate: z.string(),
          weak: z.string(),
          recommendations: z.array(z.string()),
        }),
      }),
      prompt: `Rule-based checks produced these flags for a ${data.caseType} matter (readiness score ${data.flags.score}/100). Write ONE short sentence each for strong / moderate / weak posture, plus 3-5 concrete remedial actions. Use only what the flags state; do not invent facts.

Missing documents: ${data.flags.missingDocuments.join("; ") || "none"}
Weak citations: ${data.flags.weakCitations}
Overruled citations: ${data.flags.overruledCitations}
Contradictions: ${data.flags.contradictions.join("; ") || "none"}`,
    });
    return output;
  });

// ============================================================
// AGENT 5 — Report Generator (AI Explanation: single synthesis call)
// ============================================================

const Agent5Input = z.object({
  intel: z.object({
    petitioner: z.string(), respondent: z.string(), outcomeSought: z.string(),
    issues: z.array(z.string()),
  }),
  supportingCount: z.number(),
  opposingCount: z.number(),
  citationStats: z.object({ verified: z.number(), weak: z.number(), overruled: z.number() }),
  riskScore: z.number(),
  caseType: z.string(),
  court: z.string(),
});

export const agent5Synthesize = createServerFn({ method: "POST" })
  .validator((input: unknown) => Agent5Input.parse(input))
  .handler(async ({ data }) => {
    
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          executiveSummary: z.string(),
          primaryArgument: z.string(),
          strength: z.number(),
          label: z.enum(["Weak", "Moderate", "Strong", "Very Strong"]),
        }),
      }),
      prompt: `Compose the executive summary and primary advocate argument from these aggregated agent outputs. Two-paragraph executive summary; one paragraph primary argument; strength 1-4.

Matter: ${data.intel.petitioner} v. ${data.intel.respondent} (${data.caseType}, ${data.court})
Outcome sought: ${data.intel.outcomeSought}
Issues: ${data.intel.issues.join("; ")}
Precedent posture: ${data.supportingCount} supporting / ${data.opposingCount} opposing
Citation health: ${data.citationStats.verified} verified, ${data.citationStats.weak} weak, ${data.citationStats.overruled} overruled
Court readiness score: ${data.riskScore}/100`,
    });
    return output;
  });
