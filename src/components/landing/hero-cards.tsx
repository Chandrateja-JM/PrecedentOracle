/**
 * Two-mode hero cards on the landing page.
 * - PRACTITIONER MODE: upload a brief, run the pipeline
 * - RESEARCH MODE: explore the precedent graph + corpus
 *
 * Cards have a subtle hover lift + gold border accent.
 */
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Upload, Search, ArrowUpRight, BookOpen, FileText, Network } from "lucide-react";

export function HeroCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto w-full">
      {/* Card 1 — Practitioner Mode */}
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          to="/research"
          className="group relative block rounded-xl border border-border bg-surface/80 backdrop-blur-md p-6 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all overflow-hidden h-full"
        >
          {/* Top tag */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] legal-mono uppercase tracking-[0.18em] text-primary/80 px-2 py-1 rounded border border-primary/30 bg-primary/5">
              Mode 01
            </span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>

          {/* Icon */}
          <div className="w-12 h-12 rounded-lg bg-primary/8 border border-primary/30 flex items-center justify-center mb-4">
            <Upload className="h-5 w-5 text-primary" />
          </div>

          {/* Title + body */}
          <h3 className="font-serif text-[22px] tracking-tight mb-2 text-foreground">
            Practitioner
          </h3>
          <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-4">
            Upload a judgment or paste a brief. The 5-agent pipeline returns
            ranked precedents, verified citations, and a court-readiness score.
          </p>

          {/* Feature dots */}
          <div className="flex flex-wrap gap-2 text-[10.5px] legal-mono text-muted-foreground/90">
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3 w-3" /> PDF · DOCX · TXT
            </span>
            <span className="text-border">·</span>
            <span>9 NLP tasks</span>
            <span className="text-border">·</span>
            <span>Generates report</span>
          </div>
        </Link>
      </motion.div>

      {/* Card 2 — Research Mode */}
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          to="/graph"
          className="group relative block rounded-xl border border-border bg-surface/80 backdrop-blur-md p-6 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all overflow-hidden h-full"
        >
          {/* Top tag */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] legal-mono uppercase tracking-[0.18em] text-primary/80 px-2 py-1 rounded border border-primary/30 bg-primary/5">
              Mode 02
            </span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>

          {/* Icon */}
          <div className="w-12 h-12 rounded-lg bg-primary/8 border border-primary/30 flex items-center justify-center mb-4">
            <Network className="h-5 w-5 text-primary" />
          </div>

          {/* Title + body */}
          <h3 className="font-serif text-[22px] tracking-tight mb-2 text-foreground">
            Researcher
          </h3>
          <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-4">
            Explore 156 landmark Indian cases as a citation network. Pivot
            between Article 21 jurisprudence, basic structure, LGBTQ+ rights,
            and more.
          </p>

          {/* Feature dots */}
          <div className="flex flex-wrap gap-2 text-[10.5px] legal-mono text-muted-foreground/90">
            <span className="inline-flex items-center gap-1">
              <Search className="h-3 w-3" /> 60 citation edges
            </span>
            <span className="text-border">·</span>
            <span>D3 force graph</span>
            <span className="text-border">·</span>
            <span>AI lookup</span>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
