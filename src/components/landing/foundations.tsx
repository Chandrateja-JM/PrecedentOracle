/**
 * Foundation section — explicitly cites the models, datasets, and prior work
 * the project builds on. This is what an examiner reads to verify the
 * student didn't just slap GPT on a UI.
 *
 * Lists: InLegalBERT (IIT KGP), Indian Kanoon, Sentence Transformers,
 * and the academic papers the techniques come from.
 */
import { motion } from "framer-motion";
import { BookOpen, Database, Cpu, GraduationCap } from "lucide-react";

export function Foundations() {
  const items = [
    {
      icon: Cpu,
      label: "Pretrained Model",
      title: "InLegalBERT",
      sub: "IIT Kharagpur · 5.4M Indian legal docs",
      url: "https://huggingface.co/law-ai/InLegalBERT",
    },
    {
      icon: Database,
      label: "Corpus",
      title: "Indian Kanoon",
      sub: "Supreme Court + 25 High Courts",
      url: "https://indiankanoon.org",
    },
    {
      icon: BookOpen,
      label: "Retrieval",
      title: "BM25 + RRF",
      sub: "Robertson (1995) · Cormack (2009)",
      url: "https://dl.acm.org/doi/10.1145/1571941.1572114",
    },
    {
      icon: GraduationCap,
      label: "Benchmark",
      title: "ILDC / IL-TUR",
      sub: "Paul et al. (2023) · Kalamkar (2022)",
      url: "https://arxiv.org/abs/2209.06049",
    },
  ];

  return (
    <section className="relative py-24 px-6 border-t border-border/60 bg-surface/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary/80 mb-3">
            Section IV · Foundations
          </div>
          <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-4">
            Built on published work.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every retrieval algorithm and pretrained model is sourced from peer-reviewed
            research or established Indian legal infrastructure.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <motion.a
                key={it.title}
                href={it.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group block rounded-lg border border-border bg-paper/60 backdrop-blur-sm p-5 hover:border-primary/40 hover:bg-paper transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="legal-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {it.label}
                  </div>
                  <Icon className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
                </div>
                <div className="font-serif text-[17px] tracking-tight text-foreground mb-1">
                  {it.title}
                </div>
                <div className="text-[12px] text-muted-foreground leading-relaxed">
                  {it.sub}
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
