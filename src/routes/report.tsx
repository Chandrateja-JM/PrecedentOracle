import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Download, Mail, FileText, FileCode, Check, Printer } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { exportTextReport, exportBibTeX } from "@/lib/pdf-export";
import { toast } from "sonner";

export const Route = createFileRoute("/report")({
  head: () => ({ meta: [{ title: "Report Studio — PrecedentOracle" },
    { name: "description", content: "Generate court-ready legal research reports. Every claim cited, every citation verified." }] }),
  component: ReportStudio,
});


const SECTIONS = [
  { id: "exec", title: "1. Executive Summary" },
  { id: "case", title: "2. Case Profile" },
  { id: "issues", title: "3. Legal Issues" },
  { id: "law", title: "4. Applicable Law" },
  { id: "support", title: "5. Supporting Precedents" },
  { id: "oppose", title: "6. Opposing Precedents" },
  { id: "verify", title: "7. Citation Verification" },
  { id: "risk", title: "8. Procedural Risk Analysis" },
  { id: "score", title: "9. Court Readiness Score" },
  { id: "recommend", title: "10. Recommended Actions" },
  { id: "notes", title: "10.5 Advocate Notes" },
  { id: "biblio", title: "11. Bibliography" },
];

const BIBTEX_ENTRIES = [
  { key: "puttaswamy2017", case: "K.S. Puttaswamy v. Union of India", year: 2017, reporter: "(2017) 10 SCC 1", court: "Supreme Court of India" },
  { key: "olgaTellis1985", case: "Olga Tellis v. Bombay Municipal Corp.", year: 1985, reporter: "(1985) 3 SCC 545", court: "Supreme Court of India" },
  { key: "manekaGandhi1978", case: "Maneka Gandhi v. Union of India", year: 1978, reporter: "(1978) 1 SCC 248", court: "Supreme Court of India" },
  { key: "francisCoralie1981", case: "Francis Coralie Mullin v. UT of Delhi", year: 1981, reporter: "(1981) 1 SCC 608", court: "Supreme Court of India" },
];

function ReportStudio() {
  const [active, setActive] = useState("exec");
  const [notes, setNotes] = useState("");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("advocate-notes") : null;
    if (saved) setNotes(saved);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("advocate-notes", notes);
  }, [notes]);

  function downloadPdf() {
    exportTextReport({
      title: "Legal Research Report",
      subtitle: "Ramesh Kumar v. Suresh Singh · Karnataka High Court · " + new Date().toLocaleDateString(),
      sections: [
        { title: "1. Executive Summary", body: "The appellant-tenant challenges concurrent findings decreeing eviction under § 27(2)(r) of the Karnataka Rent Act, 1999. Eleven of fourteen citations have been verified against Indian Kanoon. Court Readiness Score: 73/100; three procedural risks require attention before final hearing." },
        { title: "2. Case Profile", body: "Court: Karnataka High Court · Bench: Single Judge · Case Type: Property — Eviction · Year: 2022 · Petitioner: Ramesh Kumar · Respondent: Suresh Singh" },
        { title: "3. Legal Issues", body: "1) Whether the respondent has established bona fide requirement under § 27(2)(r). 2) Whether comparative hardship under § 27(7) tips in favour of the tenant. 3) Whether a substantial question of law arises under § 100 CPC." },
        { title: "4. Applicable Law", body: "Karnataka Rent Act, 1999 §§ 27(2)(r), 27(7); Code of Civil Procedure, 1908 § 100." },
        { title: "5. Supporting Precedents", body: "Olga Tellis v. Bombay Municipal Corp. (1985) 3 SCC 545 — right to livelihood; Maneka Gandhi v. Union of India (1978) 1 SCC 248 — golden triangle; Francis Coralie Mullin v. UT of Delhi (1981) 1 SCC 608 — right to dignity." },
        { title: "6. Opposing Precedents", body: "B.V. Nagaraju v. M. Veeranna (2019) — relied upon by respondent; WEAK verification, citation lacks reporter and two candidates exist for the year." },
        { title: "7. Citation Verification", body: "14 citations · 11 verified (78.5%) · 2 weak · 1 overruled (ADM Jabalpur — replace with Puttaswamy)." },
        { title: "8. Procedural Risk Analysis", body: "Strong: citation grounding, 11 verified precedents, clear holding extraction. Moderate: evidence completeness, 1 missing affidavit reference. Weak: 2 contradictions in timeline, 1 overruled citation must be replaced." },
        { title: "9. Court Readiness Score", body: "73 / 100 — Ready with mitigations." },
        { title: "10. Recommended Actions", body: "1) Replace ADM Jabalpur citation with Puttaswamy (2017) 10 SCC 1. 2) Annex the registered lease deed as Exhibit P-3. 3) Reconcile dates of possession in ¶ 2 and ¶ 7 of grounds of appeal." },
        { title: "11. Bibliography", body: "K.S. Puttaswamy v. Union of India (2017) 10 SCC 1; Olga Tellis (1985) 3 SCC 545; Maneka Gandhi (1978) 1 SCC 248; Francis Coralie Mullin (1981) 1 SCC 608." },
      ],
    });
    toast.success("PDF report downloaded");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Report Studio"
        title="Legal Research Report"
        subtitle="Ramesh Kumar v. Suresh Singh · Karnataka High Court · Generated 20 Jun 2026"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="border-border" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" />Print Preview</Button>
            <Button variant="outline" className="border-border" onClick={() => { exportBibTeX(BIBTEX_ENTRIES); toast.success("BibTeX downloaded", { description: `${BIBTEX_ENTRIES.length} citations · .bib file` }); }}><FileCode className="h-4 w-4 mr-1.5" />BibTeX</Button>
            <Button variant="outline" className="border-border" onClick={() => { window.location.href = "mailto:?subject=Legal Research Report&body=Please find attached the PrecedentOracle research memo."; }}><Mail className="h-4 w-4 mr-1.5" />Email</Button>
            <Button className="gold-gradient border-0" onClick={downloadPdf}><Download className="h-4 w-4 mr-1.5" />Download PDF</Button>
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-5 px-8 py-6">
        {/* TOC */}
        <aside className="col-span-12 lg:col-span-2 sticky top-20 self-start">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-3">Sections</div>
          <ul className="space-y-1">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} onClick={() => setActive(s.id)}
                  className={`block rounded-md px-2.5 py-1.5 text-[12px] transition ${
                    active === s.id ? "bg-primary/15 text-primary border-l-2 border-primary" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  <Check className="h-3 w-3 inline mr-1.5 text-verified" />
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Live preview — cream paper */}
        <article className="col-span-12 lg:col-span-7 paper rounded-xl p-12 shadow-elev-3 space-y-8">
          <header className="text-center border-b border-paper-ink/15 pb-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper-ink/60">PrecedentOracle · Confidential research memo</div>
            <h1 className="font-display text-3xl font-bold text-paper-ink mt-3">Legal Research Report</h1>
            <div className="font-display text-lg italic text-paper-ink/85 mt-1">Ramesh Kumar v. Suresh Singh</div>
            <div className="text-[12px] text-paper-ink/60 mt-2 legal-mono">RSA 1184/2021 · High Court of Karnataka · 20 June 2026</div>
          </header>

          <Section id="exec" title="1. Executive Summary">
            <p>The appellant-tenant challenges concurrent findings decreeing eviction under § 27(2)(r) of the Karnataka Rent Act, 1999.
            The matter raises a substantial question of law on the evidentiary threshold for "bona fide requirement" and the balance
            test under § 27(7).<sup>1</sup> Eleven of fourteen citations have been verified against Indian Kanoon. The Court Readiness
            Score is <strong>73 / 100</strong>; three procedural risks require attention before final hearing.</p>
          </Section>

          <Section id="case" title="2. Case Profile">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13.5px]">
              <Field k="Court" v="Karnataka High Court" />
              <Field k="Bench" v="Single Judge" />
              <Field k="Case Type" v="Property — Eviction" />
              <Field k="Year" v="2022" />
              <Field k="Petitioner" v="Ramesh Kumar" />
              <Field k="Respondent" v="Suresh Singh" />
            </dl>
          </Section>

          <Section id="issues" title="3. Legal Issues">
            <ol className="list-decimal list-inside space-y-1">
              <li>Whether the respondent has established bona fide requirement under § 27(2)(r).</li>
              <li>Whether comparative hardship under § 27(7) tips in favour of the tenant.</li>
              <li>Whether a substantial question of law arises under § 100 CPC.</li>
            </ol>
          </Section>

          <Section id="law" title="4. Applicable Law">
            <ul className="space-y-1.5">
              <li><strong>Karnataka Rent Act, 1999</strong> §§ 27(2)(r), 27(7)</li>
              <li><strong>Code of Civil Procedure, 1908</strong> § 100</li>
            </ul>
          </Section>

          <Section id="support" title="5. Supporting Precedents">
            <ul className="space-y-1.5">
              <li><em>Olga Tellis v. Bombay Municipal Corp.</em> (1985) 3 SCC 545 — right to livelihood<sup>2</sup></li>
              <li><em>Maneka Gandhi v. Union of India</em> (1978) 1 SCC 248 — golden triangle<sup>3</sup></li>
              <li><em>Francis Coralie Mullin v. UT of Delhi</em> (1981) 1 SCC 608 — right to dignity<sup>4</sup></li>
            </ul>
          </Section>

          <Section id="oppose" title="6. Opposing Precedents">
            <p><em>B.V. Nagaraju v. M. Veeranna</em> (2019) — relied upon by respondent; <strong>weak verification</strong>,
            citation lacks reporter and two candidates exist for the year.</p>
          </Section>

          <Section id="verify" title="7. Citation Verification">
            <table className="w-full text-[12.5px] font-mono mt-2">
              <thead className="border-b border-paper-ink/30 text-paper-ink/70 text-[10.5px] uppercase tracking-wider">
                <tr><th className="py-1.5 text-left">Citation</th><th>Status</th><th>Confidence</th></tr>
              </thead>
              <tbody>
                <tr className="border-b border-paper-ink/10"><td className="py-1.5">Puttaswamy (2017) 10 SCC 1</td><td><StatusBadge status="verified" /></td><td className="text-center">98%</td></tr>
                <tr className="border-b border-paper-ink/10"><td className="py-1.5">Maneka Gandhi (1978) 1 SCC 248</td><td><StatusBadge status="verified" /></td><td className="text-center">97%</td></tr>
                <tr className="border-b border-paper-ink/10"><td className="py-1.5">B.V. Nagaraju (2019)</td><td><StatusBadge status="weak" /></td><td className="text-center">52%</td></tr>
                <tr><td className="py-1.5">ADM Jabalpur (1976)</td><td><StatusBadge status="overruled" /></td><td className="text-center">—</td></tr>
              </tbody>
            </table>
          </Section>

          <Section id="risk" title="8. Procedural Risk Analysis">
            <ul className="space-y-1.5">
              <li><strong>Strong:</strong> citation grounding · 11 verified precedents · clear holding extraction</li>
              <li><strong>Moderate:</strong> evidence completeness · 1 missing affidavit reference</li>
              <li><strong>Weak:</strong> 2 contradictions in timeline · 1 overruled citation must be replaced</li>
            </ul>
          </Section>

          <Section id="score" title="9. Court Readiness Score">
            <div className="text-center py-4">
              <div className="font-display text-6xl font-bold text-paper-ink">73 <span className="text-3xl text-paper-ink/50">/ 100</span></div>
              <div className="text-[12px] text-paper-ink/70 mt-1">Ready with mitigations</div>
            </div>
          </Section>

          <Section id="recommend" title="10. Recommended Actions">
            <ol className="list-decimal list-inside space-y-1">
              <li>Replace ADM Jabalpur citation with Puttaswamy (2017) 10 SCC 1.</li>
              <li>Annex the registered lease deed as Exhibit P-3.</li>
              <li>Reconcile dates of possession in ¶ 2 and ¶ 7 of grounds of appeal.</li>
            </ol>
          </Section>

          <Section id="notes" title="10.5 Advocate Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your own observations, strategy notes, or reminders. Saved locally."
              rows={5}
              className="w-full rounded-md border border-paper-ink/20 bg-paper-cream/40 px-3 py-2 text-[13.5px] font-serif text-paper-ink focus:outline-none focus:border-primary/60 resize-y print:border-paper-ink/40"
            />
            <div className="text-[10.5px] text-paper-ink/55 mt-1 font-mono">Autosaved · {notes.length} characters</div>
          </Section>

          <Section id="biblio" title="11. Bibliography">
            <ol className="list-decimal list-inside space-y-0.5 text-[12px]">
              <li>K.S. Puttaswamy v. Union of India, (2017) 10 SCC 1 (SC).</li>
              <li>Olga Tellis v. Bombay Municipal Corp., (1985) 3 SCC 545 (SC).</li>
              <li>Maneka Gandhi v. Union of India, (1978) 1 SCC 248 (SC).</li>
              <li>Francis Coralie Mullin v. UT of Delhi, (1981) 1 SCC 608 (SC).</li>
            </ol>
          </Section>


          <footer className="border-t border-paper-ink/15 pt-4 text-[10.5px] text-paper-ink/60 text-center font-mono">
            Generated by PrecedentOracle · Every citation verified against Indian Kanoon · Not legal advice.
          </footer>
        </article>

        {/* Edit panel */}
        <aside className="col-span-12 lg:col-span-3 space-y-3 sticky top-20 self-start">
          <div className="glass rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Section quality</div>
            <ul className="space-y-1.5 text-[12px]">
              {SECTIONS.slice(0, 6).map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-verified" />
                  <span className="flex-1">{s.title}</span>
                  <span className="text-verified font-mono text-[10px]">OK</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Export</div>
            <div className="space-y-1.5">
              <Button variant="outline" size="sm" className="w-full justify-start border-border" onClick={downloadPdf}><FileText className="h-3.5 w-3.5 mr-2" />PDF (court-ready)</Button>
              <Button variant="outline" size="sm" className="w-full justify-start border-border" onClick={() => toast.info("DOCX export coming soon — use PDF for now")}><FileText className="h-3.5 w-3.5 mr-2" />DOCX (editable)</Button>
              <Button variant="outline" size="sm" className="w-full justify-start border-border" onClick={() => { exportBibTeX(BIBTEX_ENTRIES); toast.success("BibTeX downloaded"); }}><FileCode className="h-3.5 w-3.5 mr-2" />BibTeX / RIS</Button>
              <Button variant="outline" size="sm" className="w-full justify-start border-border" onClick={() => toast.info("Resend email integration: connect Resend in Cloud to enable.")}><Mail className="h-3.5 w-3.5 mr-2" />Email via Resend</Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-xl font-bold text-paper-ink border-b border-paper-ink/15 pb-1.5 mb-3">{title}</h2>
      <div className="font-serif text-[14px] leading-relaxed text-paper-ink/90 space-y-2">{children}</div>
    </section>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-paper-ink/60 font-mono text-[11px] uppercase tracking-wider">{k}</dt>
      <dd className="text-paper-ink">{v}</dd>
    </>
  );
}
