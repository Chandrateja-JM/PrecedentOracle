/**
 * Live corpus stats bar — shows real numbers pulled from /api/status.
 *
 * Each stat has an animated count-up on first reveal. Numbers come from the
 * backend (with fallback to constants if backend unreachable).
 *
 * Sits directly under the hero — reinforces credibility before the viewer
 * scrolls to the longer NLP sections.
 */
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { useCorpusStats } from "@/lib/use-corpus-stats";

function AnimatedNumber({ value, duration = 1.4 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => Math.floor(latest).toLocaleString());

  useEffect(() => {
    if (inView) {
      const controls = animate(motionValue, value, { duration, ease: "easeOut" });
      return controls.stop;
    }
  }, [inView, value, duration, motionValue]);

  return (
    <span ref={ref}>
      <motion.span>{rounded}</motion.span>
    </span>
  );
}

export function LiveStats() {
  const stats = useCorpusStats();

  const items = [
    { label: "Cases indexed", value: stats.cases, suffix: "" },
    { label: "Citation edges", value: stats.case_citations, suffix: "" },
    { label: "Statutes parsed", value: stats.statutes, suffix: "" },
    { label: "Judges in graph", value: stats.judges, suffix: "" },
    { label: "NLP tasks", value: 9, suffix: "" },
    { label: "AI agents", value: 5, suffix: "" },
  ];

  return (
    <section className="relative py-12 px-6 border-y border-border/60 bg-surface/40 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-7">
          <div className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-primary/80">
            Live Corpus · Indian Kanoon · SQLite
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-7 text-center">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            >
              <div className="font-serif text-3xl md:text-4xl text-primary tracking-tight tabular-nums">
                <AnimatedNumber value={item.value} />
                {item.suffix}
              </div>
              <div className="legal-mono text-[10.5px] uppercase tracking-wider text-muted-foreground mt-1.5">
                {item.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
