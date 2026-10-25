/**
 * 5-Agent System Architecture diagram.
 *
 * Visually maps how a document flows through the 5 agents:
 *   Document → Agent 1 (Legal Intel) → Agent 2 (Precedent Retrieval)
 *           → Agent 3 (Citation Verify) → Agent 4 (Procedural Risk)
 *           → Agent 5 (Synthesis) → Report
 *
 * Each agent has the NLP tasks it owns + the technique used.
 * Designed to be screenshot-able for the thesis report.
 */
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Brain, Search, BadgeCheck, AlertTriangle, FileSignature, ArrowRight,
} from "lucide-react";

type Agent = {
  num: number;
  name: string;
  icon: typeof Brain;
  tasks: string[];
  techniques: string;
};

const AGENTS: Agent[] = [
  {
    num: 1,
    name: "Legal Intelligence",
    icon: Brain,
    tasks: ["NER", "Citations", "Statutes", "Issue Classification", "Semantic Segmentation"],
    techniques: "Regex · Gazetteer · Pattern Matching",
  },
  {
    num: 2,
    name: "Precedent Retrieval",
    icon: Search,
    tasks: ["Hybrid Ranking"],
    techniques: "BM25 + TF-IDF + InLegalBERT + RRF",
  },
  {
    num: 3,
    name: "Citation Verification",
    icon: BadgeCheck,
    tasks: ["Fuzzy Lookup"],
    techniques: "Levenshtein + Corpus Lookup",
  },
  {
    num: 4,
    name: "Procedural Risk",
    icon: AlertTriangle,
    tasks: ["Risk Scoring"],
    techniques: "Rule-Based Multi-Dimensional",
  },
  {
    num: 5,
    name: "Argument Synthesis",
    icon: FileSignature,
    tasks: ["Report Generation"],
    techniques: "Weighted Aggregation",
  },
];

export function AgentArchitecture() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-24 px-6 border-t border-border/60">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary/80 mb-3">
            Section III · System Architecture
          </div>
          <h2 className="font-serif text-4xl md:text-5xl tracking-tight text-foreground mb-4">
            Five agents in a deterministic pipeline.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Each agent has an explicit input/output contract. Outputs are JSON, so
            the system is fully traceable — no opaque LLM reasoning, no
            hallucinated citations.
          </p>
        </motion.div>

        {/* Agent cards in a row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {AGENTS.map((agent, i) => {
            const Icon = agent.icon;
            return (
              <div key={agent.num} className="contents">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="relative rounded-lg border border-border bg-surface/80 backdrop-blur-sm p-4 hover:border-primary/40 transition-all"
                >
                  {/* Top: number + icon */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="legal-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                      Agent 0{agent.num}
                    </span>
                    <div className="w-7 h-7 rounded-md bg-primary/8 border border-primary/30 flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="font-serif text-[15.5px] leading-snug mb-2.5">
                    {agent.name}
                  </h3>

                  {/* Tasks list */}
                  <ul className="space-y-0.5 mb-3">
                    {agent.tasks.map((t) => (
                      <li key={t} className="text-[11.5px] text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary/60 mt-0.5">·</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Techniques footer */}
                  <div className="legal-mono text-[9.5px] text-primary/70 leading-snug pt-2 border-t border-border/50">
                    {agent.techniques}
                  </div>
                </motion.div>

                {/* Connecting arrow (between cards on md+) */}
                {i < AGENTS.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 0.5 } : {}}
                    transition={{ duration: 0.4, delay: i * 0.15 + 0.3 }}
                    className="hidden md:flex items-center justify-center absolute pointer-events-none"
                    style={{
                      left: `calc(${((i + 1) / AGENTS.length) * 100}% - 9px)`,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    <ArrowRight className="h-3.5 w-3.5 text-primary/50" />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Flow caption */}
        <div className="mt-8 text-center text-[11px] legal-mono text-muted-foreground/80">
          INPUT (document) → 5 agents → OUTPUT (generated report + risk score)
        </div>
      </div>
    </section>
  );
}
