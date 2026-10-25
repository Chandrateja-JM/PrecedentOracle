/**
 * Landing page — PrecedentOracle
 *
 * Full redesign focused on academic credibility for the M.Tech thesis defense.
 * Six sections (top to bottom):
 *   1. Hero — Ashoka Chakra + tagline + two CTA buttons
 *   2. Live corpus stats — real numbers from /api/status
 *   3. Two-mode hero cards — Practitioner / Researcher
 *   4. NLP pipeline reveal — 9 tasks with techniques (sequential)
 *   5. 5-agent architecture diagram
 *   6. Foundations — InLegalBERT, BM25, Indian Kanoon, papers
 *   7. Footer with thesis credentials
 *
 * Background: FlowGradient (subtle ambient orbs, low opacity).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

import { AshokaChakra } from "@/components/landing/ashoka-chakra";
import { FlowGradient } from "@/components/landing/flow-gradient";
import { LandingNav } from "@/components/landing/landing-nav";
import { HeroCards } from "@/components/landing/hero-cards";
import { LiveStats } from "@/components/landing/live-stats";
import { PipelineReveal } from "@/components/landing/pipeline-reveal";
import { AgentArchitecture } from "@/components/landing/agent-architecture";
import { Foundations } from "@/components/landing/foundations";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PrecedentOracle — Indian Legal Research, Engineered with NLP" },
      { name: "description", content: "M.Tech AI/ML thesis project. Five-agent NLP pipeline for Indian legal research. InLegalBERT, BM25, 156 landmark cases, verifiable citations." },
      { property: "og:title", content: "PrecedentOracle" },
      { property: "og:description", content: "Five-agent NLP pipeline · 9 NLP tasks · Real Indian case corpus" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen text-foreground">
      <FlowGradient />
      <LandingNav />

      {/* === SECTION 1: HERO === */}
      <section className="relative px-6 pt-12 md:pt-20 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Top eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 legal-mono text-[10.5px] uppercase tracking-[0.18em] text-primary/90">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              M.Tech AI/ML · MSRUAS · Thesis Project
            </span>
          </motion.div>

          {/* Ashoka Chakra centered above title */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="flex justify-center mb-8"
          >
            <div className="text-primary">
              <AshokaChakra size={120} animate />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.05] tracking-tight text-center mb-6 text-foreground"
          >
            <span className="block">PrecedentOracle</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-center text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-3"
          >
            Indian legal research, engineered with natural language processing.
          </motion.p>

          {/* Tagline with technical badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-2.5 mb-10 text-[11px] legal-mono uppercase tracking-wider text-muted-foreground/90"
          >
            <span>9 NLP tasks</span>
            <span className="text-border">·</span>
            <span>5-agent pipeline</span>
            <span className="text-border">·</span>
            <span>InLegalBERT</span>
            <span className="text-border">·</span>
            <span>BM25 + RRF retrieval</span>
            <span className="text-border">·</span>
            <span>156 landmark cases</span>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-16"
          >
            <Link
              to="/research"
              className="group inline-flex items-center gap-2 rounded-md gold-gradient text-paper-ink px-5 py-3 text-[13px] font-medium tracking-wide hover:shadow-lg hover:shadow-primary/20 transition-all"
            >
              Open Research Workspace
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/graph"
              className="group inline-flex items-center gap-2 rounded-md border border-border bg-surface/60 backdrop-blur-sm text-foreground px-5 py-3 text-[13px] font-medium tracking-wide hover:border-primary/40 hover:bg-surface transition-all"
            >
              <Play className="h-3.5 w-3.5" />
              Run Live Demo
            </Link>
          </motion.div>

          {/* Two-mode cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85 }}
          >
            <HeroCards />
          </motion.div>
        </div>
      </section>

      {/* === SECTION 2: LIVE CORPUS STATS === */}
      <LiveStats />

      {/* === SECTION 3: NLP PIPELINE REVEAL === */}
      <div id="pipeline"><PipelineReveal /></div>

      {/* === SECTION 4: AGENT ARCHITECTURE === */}
      <div id="architecture"><AgentArchitecture /></div>

      {/* === SECTION 5: FOUNDATIONS === */}
      <div id="foundations"><Foundations /></div>

      {/* === FOOTER === */}
      <footer className="relative px-6 py-10 border-t border-border/60 bg-paper/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="text-primary">
              <AshokaChakra size={36} animate={false} />
            </div>
            <div>
              <div className="font-serif text-base tracking-tight">PrecedentOracle</div>
              <div className="legal-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                M.Tech AI/ML · Ramaiah University of Applied Sciences
              </div>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground space-y-1 md:text-right">
            <div className="legal-mono uppercase tracking-wider">सत्यमेव जयते · Truth alone triumphs</div>
            <div>Built for Indian Legal Research · 2026</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
