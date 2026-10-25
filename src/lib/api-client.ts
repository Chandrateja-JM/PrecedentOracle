const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface BackendPipelineResult {
  pipeline: string;
  depth: string;
  total_processing_time_sec: number;
  agents_run: number;
  results: {
    legal_intelligence: { data: any };
    precedent_retrieval: { data: { supporting: any[]; opposing: any[]; metadata: any } };
    citation_verification: { total: number; verified: number; score: number; data: any[] };
    procedural_risk?: { data: any };
    report?: { data: any };
    semantic_segments?: { total_segments: number; summary: any; data: any[] };
    statute_identification?: { identified: number; data: any[] };
    timeline?: { events: number; data: any[] };
    evidence_board?: { nodes: number; edges: number; data: any };
    tree_view?: { data: any };
    court_map?: { markers: number; data: any[] };
  };
}

export async function runFullPipeline(
  documentText: string, court: string, caseType: string, depth: string = "comprehensive"
): Promise<BackendPipelineResult | null> {
  return apiFetch<BackendPipelineResult>("/api/pipeline/full", {
    method: "POST",
    body: JSON.stringify({ document_text: documentText, court, case_type: caseType, depth }),
  });
}

export async function checkBackendHealth() {
  return apiFetch<{ status: string; indexed_cases: number }>("/");
}

export async function fetchCases(category?: string) {
  const params = category ? `?category=${encodeURIComponent(category)}` : "";
  return apiFetch<{ cases: any[]; total: number }>(`/api/cases${params}`);
}

export async function fetchJudges(court?: string) {
  const params = court ? `?court=${encodeURIComponent(court)}` : "";
  return apiFetch<{ judges: any[]; total: number }>(`/api/judges${params}`);
}

export async function fetchBareActs() {
  return apiFetch<{ acts: any[]; total: number }>("/api/bare-acts");
}

export async function fetchKnowledgeGraph() {
  return apiFetch<{ nodes: any[]; edges: any[] }>("/api/knowledge-graph");
}

export async function fetchStats() {
  return apiFetch<any>("/api/stats");
}
