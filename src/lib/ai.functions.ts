import { createServerFn } from "@tanstack/react-start";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

// Model identifiers per provider
const LOVABLE_MODEL = "google/gemini-3-flash-preview";
// Use latest Claude model. Override via ANTHROPIC_MODEL env var.
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
const GEMINI_MODEL = "gemini-2.0-flash";

function getModel() {
  // Priority 1: Anthropic Claude (best quality for legal reasoning)
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    const provider = createAnthropic({ apiKey: anthropicKey });
    return provider(ANTHROPIC_MODEL);
  }

  // Priority 2: Lovable AI Gateway (works on Lovable cloud)
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (lovableKey) {
    const provider = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": lovableKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    return provider(LOVABLE_MODEL);
  }

  // Priority 3: Direct Google Gemini (free fallback)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const provider = createOpenAICompatible({
      name: "gemini",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
      headers: { Authorization: `Bearer ${geminiKey}` },
    });
    return provider(GEMINI_MODEL);
  }

  throw new Error(
    "No AI key configured. Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env"
  );
}

// ----- 1. Identify a case from a name / person / number / event -----

const IdentifyInput = z.object({ query: z.string().min(2).max(500) });

export const identifyCase = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => IdentifyInput.parse(input))
  .handler(async ({ data }) => {
    
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          identified: z.boolean(),
          caseName: z.string(),
          citation: z.string(),
          court: z.string(),
          year: z.string(),
          parties: z.object({ petitioner: z.string(), respondent: z.string() }),
          statutes: z.array(z.string()),
          holding: z.string(),
          principle: z.string(),
          summary: z.string(),
          confidence: z.number(),
        }),
      }),
      prompt: `You are an expert in Indian law. Identify the most likely Indian court case matching this query and return STRUCTURED case details. If you can't identify a specific case, set identified=false and produce a best-effort hypothetical fact pattern.

Query: ${data.query}

Return realistic Indian case data. Citations use SCC/AIR format. Courts use full names (e.g. "Supreme Court of India", "Karnataka High Court"). Confidence 0-1.`,
    });
    return output;
  });

// ----- 2. Run the 5-agent research pipeline -----

const PipelineInput = z.object({
  text: z.string().min(10).max(20000),
  court: z.string(),
  caseType: z.string(),
});

const CaseRefSchema = z.object({
  name: z.string(),
  citation: z.string(),
  relevance: z.string(),
  weight: z.number(),
});

export const runResearchPipeline = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PipelineInput.parse(input))
  .handler(async ({ data }) => {
    
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          intelligence: z.object({
            petitioner: z.string(),
            respondent: z.string(),
            bench: z.string(),
            date: z.string(),
            outcomeSought: z.string(),
            tags: z.array(z.string()),
            statutes: z.array(z.string()),
          }),
          precedents: z.object({
            supporting: z.array(CaseRefSchema),
            opposing: z.array(CaseRefSchema),
          }),
          citations: z.object({
            total: z.number(),
            verified: z.number(),
            weak: z.number(),
            overruled: z.number(),
          }),
          graph: z.object({
            connectedCases: z.number(),
            connectedStatutes: z.number(),
            connectedJudges: z.number(),
          }),
          risk: z.object({
            score: z.number(),
            strong: z.string(),
            moderate: z.string(),
            weak: z.string(),
            recommendations: z.array(z.string()),
          }),
          applicableStatutes: z.array(z.object({ ref: z.string(), purpose: z.string() })),
          argument: z.object({
            primary: z.string(),
            strength: z.number(),
            label: z.string(),
          }),
        }),
      }),
      prompt: `You are PrecedentOracle, India's AI legal research engine. Analyze this matter and produce structured findings for 7 agent cards.

CASE TYPE: ${data.caseType}
COURT: ${data.court}
DOCUMENT:
${data.text.slice(0, 8000)}

For supporting/opposing precedents, return 3-5 each: real Indian landmark cases (SC/HC). Each weight is 0-1 relevance score.
For citations: total 8-20, verified is majority, 1-3 weak, 0-2 overruled.
For risk score: 0-100. strong/moderate/weak are one-line summaries.
For recommendations: 3-5 concrete actions.
For argument: primary is a 2-sentence advocate's argument, strength 1-4, label "Strong"/"Moderate"/"Weak".`,
    });
    return output;
  });

export type ResearchPipelineResult = Awaited<ReturnType<typeof runResearchPipeline>>;

// ----- 3. Find similar cases -----

const SimilarInput = z.object({ caseName: z.string(), context: z.string().optional() });

export const findSimilarCases = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SimilarInput.parse(input))
  .handler(async ({ data }) => {
    // Lenient schema: coerce numbers→strings, allow missing fields, give defaults.
    // This was the source of the "schema error" you were seeing — the LLM
    // sometimes returns `year: 1973` (number) when schema expects a string,
    // or omits `similarity`. We now accept both.
    try {
      const { output } = await generateText({
        model: getModel(),
        output: Output.object({
          schema: z.object({
            cases: z.array(
              z.object({
                name: z.string(),
                citation: z.string().default(""),
                year: z.union([z.string(), z.number()]).transform((v) => String(v)).default(""),
                court: z.string().default("Supreme Court of India"),
                similarity: z.union([z.number(), z.string()]).transform((v) => {
                  const n = typeof v === "string" ? parseFloat(v) : v;
                  return isNaN(n) ? 0.7 : Math.min(1, Math.max(0, n));
                }).default(0.7),
                reason: z.string().default("Related legal principle"),
              }),
            ),
          }),
        }),
        prompt: `Find 5 real Indian cases similar in legal principle to "${data.caseName}".${data.context ? `\nContext: ${data.context}` : ""}\nReturn ONLY real Supreme Court / High Court cases with real SCC or AIR citations. similarity = 0..1.`,
      });
      return output.cases;
    } catch (err) {
      // Don't crash the UI — return an empty list with a console hint
      console.error("findSimilarCases failed:", err);
      throw new Error(
        err instanceof Error
          ? `AI returned invalid response (${err.message}). Try again or check ANTHROPIC_API_KEY in .env`
          : "Unknown error finding similar cases"
      );
    }
  });

// ----- 4. Lightweight AI suggestions -----

const SuggestInput = z.object({ text: z.string().min(10).max(5000), caseType: z.string() });

export const aiSuggestions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SuggestInput.parse(input))
  .handler(async ({ data }) => {
    
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          suggestions: z.array(z.object({ title: z.string(), body: z.string() })),
        }),
      }),
      prompt: `Suggest 3 concrete additions or improvements an Indian advocate should consider for this ${data.caseType} matter. Each suggestion has a short title (e.g. "Add Maneka Gandhi citation") and a one-sentence body. Source document:\n${data.text.slice(0, 3000)}`,
    });
    return output.suggestions;
  });

// ----- 5. Plain-language explanation for a bare act section -----

const PlainInput = z.object({
  actName: z.string(),
  sectionNumber: z.string(),
  sectionTitle: z.string(),
  sectionText: z.string(),
  language: z.enum(["en", "hi"]).default("en"),
});

export const explainSection = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlainInput.parse(input))
  .handler(async ({ data }) => {
    
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          plainLanguage: z.string(),
          example: z.string(),
          relatedCases: z.array(z.string()),
        }),
      }),
      prompt: `Explain ${data.actName} ${data.sectionNumber} (${data.sectionTitle}) in ${data.language === "hi" ? "simple Hindi (Devanagari)" : "plain English"}, in 2-3 sentences. Then give one short real-world example (1-2 sentences), and list 2-3 famous Indian cases that have interpreted this section.\n\nText: ${data.sectionText}`,
    });
    return output;
  });

// ----- 6. Generate procedural roadmap -----

const RoadmapInput = z.object({
  caseType: z.string(),
  court: z.string(),
  facts: z.string().min(10).max(5000),
});

export const generateRoadmap = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RoadmapInput.parse(input))
  .handler(async ({ data }) => {
    // Lenient schema — the LLM often returns "Medium" / "Moderate" / "High"
    // or capitalized variants. Normalize to lowercase enum.
    try {
      const { output } = await generateText({
        model: getModel(),
        output: Output.object({
          schema: z.object({
            stages: z.array(z.object({
              title: z.string(),
              duration: z.string().default("2-4 weeks"),
              risk: z.string().transform((v) => {
                const norm = v.toLowerCase().trim();
                if (norm.startsWith("h")) return "high" as const;
                if (norm.startsWith("l")) return "low" as const;
                return "moderate" as const;
              }).pipe(z.enum(["low", "moderate", "high"])),
              statute: z.string().default(""),
              checklist: z.array(z.string()).default([]),
              risks: z.array(z.string()).default([]),
            })),
          }),
        }),
        prompt: `You are an Indian procedural law expert. Generate a 5-stage procedural roadmap.

CASE TYPE: ${data.caseType}
COURT: ${data.court}
FACTS: ${data.facts.slice(0, 3000)}

Return EXACTLY 5 stages from filing through judgment/appeal.
Each stage MUST have:
  - title (short string)
  - duration (e.g. "2-4 weeks")
  - risk (one word: low, moderate, or high)
  - statute (e.g. "CPC Order VII Rule 1", "BNSS s.173")
  - checklist (array of 4-5 short strings)
  - risks (array of 1-3 short strings)
Use BNSS 2023 (not CrPC) and BSA 2023 (not IEA).`,
      });
      return output.stages;
    } catch (err) {
      console.error("generateRoadmap failed:", err);
      throw new Error(
        err instanceof Error
          ? `Roadmap generation failed: ${err.message}. Check ANTHROPIC_API_KEY in .env`
          : "Unknown roadmap generation error"
      );
    }
  });

// ----- 7. Judge insights -----

const JudgeInsightInput = z.object({ judgeName: z.string(), court: z.string() });

export const judgeInsights = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => JudgeInsightInput.parse(input))
  .handler(async ({ data }) => {
    
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          observations: z.array(z.string()),
          preparationTips: z.array(z.string()),
        }),
      }),
      prompt: `Based ONLY on public judgment patterns of ${data.judgeName} (${data.court}), give 3 statistical observations (case mix, doctrinal leanings, citation style) and 3 preparation tips. Neutral — no bias or future-decision prediction.`,
    });
    return output;
  });

// ----- 8. Verify a single citation -----

const VerifyInput = z.object({ citation: z.string().min(3).max(500) });

export const verifyCitation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => VerifyInput.parse(input))
  .handler(async ({ data }) => {
    
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          status: z.enum(["verified", "weak", "missing", "overruled"]),
          confidence: z.number(),
          canonicalCitation: z.string(),
          court: z.string(),
          year: z.string(),
          notes: z.string(),
          overruledBy: z.string().optional(),
        }),
      }),
      prompt: `Verify this Indian legal citation against your knowledge of the SCC/AIR/SCR reporters and Indian Kanoon. Citation: "${data.citation}". Return canonical form, status (verified/weak/missing/overruled), confidence 0-100, court, year, brief notes, and overruledBy if applicable.`,
    });
    return output;
  });

// ----- 9. Extract citations from document text -----

const ExtractInput = z.object({ text: z.string().min(20).max(20000) });

export const extractCitations = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ExtractInput.parse(input))
  .handler(async ({ data }) => {
    
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          citations: z.array(z.object({
            text: z.string(),
            status: z.enum(["verified", "weak", "missing", "overruled"]),
            confidence: z.number(),
            notes: z.string(),
          })),
        }),
      }),
      prompt: `Extract every Indian legal citation from this text. For each: canonical form, verification status (verified/weak/missing/overruled based on whether the citation looks well-formed and matches a known case), confidence 0-100, brief notes.\n\nText:\n${data.text.slice(0, 15000)}`,
    });
    return output.citations;
  });

// ----- 10. Explain a case (for Knowledge Graph) -----

const ExplainCaseInput = z.object({ caseName: z.string(), citation: z.string(), principle: z.string() });

export const explainCase = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ExplainCaseInput.parse(input))
  .handler(async ({ data }) => {
    
    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          plainSummary: z.string(),
          whyItMatters: z.string(),
          modernRelevance: z.string(),
        }),
      }),
      prompt: `Explain the Indian case "${data.caseName}" (${data.citation}) on principle "${data.principle}" in plain English. Return: plainSummary (2-3 sentences for a non-lawyer), whyItMatters (1-2 sentences on doctrinal significance), modernRelevance (1-2 sentences on continued application today).`,
    });
    return output;
  });

// ----- 11. Universal AI search (instant results, categorized) -----

const AISearchInput = z.object({
  query: z.string().min(1).max(300),
  context: z.enum(["global", "cases", "statutes", "judges", "graph", "research"]).default("global"),
});

export const aiSearch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AISearchInput.parse(input))
  .handler(async ({ data }) => {
    
    const focusHint = {
      global: "Return a balanced mix across all categories.",
      cases: "Focus heavily on Indian case law. Statutes/judges only if directly relevant.",
      statutes: "Focus on Indian acts and sections (BNS, BNSS, BSA, Constitution, IPC, CrPC, IEA, CPC, Contract Act, etc.). Include both the new code and the superseded equivalent when relevant.",
      judges: "Focus on Indian judges (Supreme Court and High Courts), past and present.",
      graph: "Focus on landmark Indian cases that would appear in a citation network.",
      research: "Focus on identifying a specific Indian case the user is researching.",
    }[data.context];

    const { output } = await generateText({
      model: getModel(),
      output: Output.object({
        schema: z.object({
          cases: z.array(z.object({
            name: z.string(), citation: z.string(), court: z.string(), year: z.string(), snippet: z.string(),
          })),
          statutes: z.array(z.object({
            act: z.string(), section: z.string(), title: z.string(), snippet: z.string(),
          })),
          judges: z.array(z.object({
            name: z.string(), court: z.string(), tenure: z.string(),
          })),
          answer: z.string(),
        }),
      }),
      prompt: `You are an Indian-law search engine. The user typed: "${data.query}"
Context: ${data.context}. ${focusHint}

Return up to 5 cases, 5 statutes, 3 judges that best match. Use real Indian SCC/AIR citations, real act names (use BNS 2023, BNSS 2023, BSA 2023 alongside the superseded IPC/CrPC/IEA when relevant), and real judges. Each snippet is one short line (<120 chars).
If the query is a plain-English question (e.g. "what is the punishment for theft"), put a 1-2 sentence plain-English answer in 'answer' and include the relevant statute. Otherwise leave 'answer' empty.
Empty arrays are fine for irrelevant categories.`,
    });
    return output;
  });

export type AISearchResult = Awaited<ReturnType<typeof aiSearch>>;





