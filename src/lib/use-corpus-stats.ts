import { useEffect, useState } from "react";

interface CorpusStats {
  cases: number;
  judges: number;
  statutes: number;
  case_statutes: number;
  case_citations: number;
}

const FALLBACK: CorpusStats = {
  cases: 56, judges: 18, statutes: 8, case_statutes: 144, case_citations: 60,
};

/**
 * Live corpus stats from backend /api/status.
 * Returns fallback values while loading or if backend unreachable.
 * Used by Precedent Explorer and Graph to show real counts instead of hardcoded "50".
 */
export function useCorpusStats(): CorpusStats {
  const [stats, setStats] = useState<CorpusStats>(FALLBACK);

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
    let cancelled = false;
    fetch(`${API}/api/status`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled || !data?.corpus) return;
        setStats({
          cases: data.corpus.cases ?? FALLBACK.cases,
          judges: data.corpus.judges ?? FALLBACK.judges,
          statutes: data.corpus.statutes ?? FALLBACK.statutes,
          case_statutes: data.corpus.case_statutes ?? FALLBACK.case_statutes,
          case_citations: data.corpus.case_citations ?? FALLBACK.case_citations,
        });
      })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, []);

  return stats;
}
