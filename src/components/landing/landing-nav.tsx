/**
 * Landing-page top navigation.
 *
 * Lovable/Linear-style: floating glass bar at top, logo on left,
 * minimal nav links in the center, GitHub icon + primary CTA on the right.
 *
 * The GitHub button URL is sourced from VITE_GITHUB_URL in .env — falls back
 * to a placeholder so the link still renders during development.
 */
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AshokaChakra } from "./ashoka-chakra";
import { ArrowUpRight, Github } from "lucide-react";

const GITHUB_URL =
  import.meta.env.VITE_GITHUB_URL ||
  "https://github.com/chandratejajm/precedentoracle";

export function LandingNav() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-40 px-6 pt-5"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between rounded-full border border-border/70 bg-paper/85 backdrop-blur-xl px-4 py-2.5 shadow-sm">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="text-primary group-hover:rotate-180 transition-transform duration-700">
              <AshokaChakra size={28} animate={false} />
            </div>
            <span className="font-serif text-[16px] tracking-tight">PrecedentOracle</span>
          </Link>

          {/* Center links (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-1 text-[12.5px]">
            <a href="#pipeline" className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface/70 transition-colors">
              Pipeline
            </a>
            <a href="#architecture" className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface/70 transition-colors">
              Architecture
            </a>
            <a href="#foundations" className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface/70 transition-colors">
              Foundations
            </a>
            <Link to="/graph" className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface/70 transition-colors">
              Knowledge Graph
            </Link>
          </div>

          {/* Right cluster: GitHub + CTA */}
          <div className="flex items-center gap-2">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 hover:bg-surface px-3 py-2 text-[12px] text-foreground hover:border-primary/40 transition-all"
              title="View source on GitHub"
            >
              <Github className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>

            <Link
              to="/research"
              className="group inline-flex items-center gap-1.5 rounded-full gold-gradient text-paper-ink px-4 py-2 text-[12.5px] font-medium tracking-wide hover:shadow-md hover:shadow-primary/15 transition-all"
            >
              <span className="hidden sm:inline">Open Workspace</span>
              <span className="sm:hidden">Start</span>
              <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
