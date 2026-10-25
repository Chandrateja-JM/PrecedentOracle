// Client-side document parsing helpers (PDF via pdf.js, DOCX via mammoth)
// IMPORTANT: All imports are lazy (inside functions) so this module is safe
// to import during SSR — pdfjs-dist requires browser globals (DOMMatrix, etc.)

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

export async function extractPdfText(file: File): Promise<string> {
  if (!isBrowser) {
    throw new Error("PDF extraction requires a browser environment");
  }
  const pdfjsLib = await import("pdfjs-dist");
  const pdfWorker = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it: unknown) =>
      (it && typeof it === "object" && "str" in it ? String((it as { str: string }).str) : "")
    ).join(" ");
    pages.push(text);
  }
  return pages.join("\n\n");
}

export async function extractDocxText(file: File): Promise<string> {
  if (!isBrowser) {
    throw new Error("DOCX extraction requires a browser environment");
  }
  // @ts-expect-error - mammoth browser build lacks types
  const mammoth = await import("mammoth/mammoth.browser");
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value;
}

export async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return extractPdfText(file);
  if (name.endsWith(".docx") || name.endsWith(".doc")) return extractDocxText(file);
  return await file.text();
}
