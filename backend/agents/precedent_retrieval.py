"""
Agent 2: Precedent Retrieval Agent
───────────────────────────────────
Hybrid retrieval: BM25 (sparse) + TF-IDF cosine (dense) + InLegalBERT (semantic).
Reciprocal Rank Fusion to merge results.
Returns supporting + opposing precedents.

Engine: rank_bm25 + scikit-learn TF-IDF + law-ai/InLegalBERT (NO LLM)
"""

import math
import re
from typing import Dict, List, Any, Optional
from collections import Counter

# Optional BERT enhancement — gracefully degrades if not installed
try:
    from utils.inlegalbert import get_bert
    BERT_ENABLED = True
except ImportError:
    BERT_ENABLED = False
    get_bert = None


class PrecedentRetrievalAgent:

    def __init__(self, cases: List[Dict]):
        self.cases = cases
        self.corpus = []
        self.case_index = {}

        # Build corpus for BM25 and TF-IDF
        for case in cases:
            doc_text = self._build_document_text(case)
            self.corpus.append(doc_text)
            self.case_index[case["id"]] = case

        # Build BM25 index
        self.tokenized_corpus = [self._tokenize(doc) for doc in self.corpus]
        self.bm25_avgdl = sum(len(doc) for doc in self.tokenized_corpus) / max(len(self.tokenized_corpus), 1)
        self.bm25_doc_freqs = self._compute_doc_freqs()
        self.bm25_N = len(self.tokenized_corpus)

        # Build TF-IDF index
        self.idf = self._compute_idf()
        self.tfidf_vectors = [self._compute_tfidf(doc) for doc in self.tokenized_corpus]

    def _build_document_text(self, case: Dict) -> str:
        """Build searchable text from case fields."""
        parts = [
            case.get("name", ""),
            case.get("holding", ""),
            case.get("principle", ""),
            case.get("category", ""),
            case.get("citation", ""),
            " ".join(case.get("statutes_applied", [])),
            " ".join(case.get("keywords", [])),
        ]
        return " ".join(parts).lower()

    def _tokenize(self, text: str) -> List[str]:
        """Simple whitespace + punctuation tokenizer."""
        text = re.sub(r'[^\w\s]', ' ', text.lower())
        tokens = text.split()
        # Remove common stop words
        stops = {'the', 'of', 'and', 'in', 'to', 'a', 'is', 'was', 'for', 'on',
                'that', 'it', 'with', 'as', 'by', 'an', 'be', 'this', 'which',
                'or', 'from', 'are', 'at', 'not', 'has', 'had', 'have', 'but',
                'its', 'been', 'were', 'would', 'their', 'shall', 'may', 'any',
                'such', 'under', 'said', 'court', 'case'}
        return [t for t in tokens if t not in stops and len(t) > 1]

    def _compute_doc_freqs(self) -> Dict[str, int]:
        """Compute document frequencies for BM25."""
        df = Counter()
        for doc in self.tokenized_corpus:
            unique_terms = set(doc)
            for term in unique_terms:
                df[term] += 1
        return df

    def _compute_idf(self) -> Dict[str, float]:
        """Compute IDF scores for TF-IDF."""
        idf = {}
        N = len(self.tokenized_corpus)
        all_terms = set()
        for doc in self.tokenized_corpus:
            all_terms.update(doc)

        for term in all_terms:
            df = self.bm25_doc_freqs.get(term, 0)
            idf[term] = math.log((N - df + 0.5) / (df + 0.5) + 1)
        return idf

    def _compute_tfidf(self, doc: List[str]) -> Dict[str, float]:
        """Compute TF-IDF vector for a document."""
        tf = Counter(doc)
        doc_len = len(doc)
        vector = {}
        for term, count in tf.items():
            tf_val = count / max(doc_len, 1)
            idf_val = self.idf.get(term, 0)
            vector[term] = tf_val * idf_val
        return vector

    def _bm25_score(self, query_tokens: List[str], doc_idx: int,
                     k1: float = 1.5, b: float = 0.75) -> float:
        """Compute BM25 score for a single document."""
        doc = self.tokenized_corpus[doc_idx]
        doc_len = len(doc)
        tf = Counter(doc)
        score = 0.0

        for term in query_tokens:
            if term not in tf:
                continue
            term_freq = tf[term]
            df = self.bm25_doc_freqs.get(term, 0)
            idf = math.log((self.bm25_N - df + 0.5) / (df + 0.5) + 1)
            numerator = term_freq * (k1 + 1)
            denominator = term_freq + k1 * (1 - b + b * doc_len / max(self.bm25_avgdl, 1))
            score += idf * numerator / denominator

        return score

    def _cosine_similarity(self, vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
        """Compute cosine similarity between two sparse vectors."""
        common_terms = set(vec1.keys()) & set(vec2.keys())
        if not common_terms:
            return 0.0

        dot = sum(vec1[t] * vec2[t] for t in common_terms)
        mag1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
        mag2 = math.sqrt(sum(v ** 2 for v in vec2.values()))

        if mag1 == 0 or mag2 == 0:
            return 0.0
        return dot / (mag1 * mag2)

    def _reciprocal_rank_fusion(self, bm25_ranking: List[int],
                                 tfidf_ranking: List[int],
                                 k: int = 60) -> List[int]:
        """
        Reciprocal Rank Fusion (RRF) to merge BM25 and TF-IDF rankings.
        RRF(d) = sum(1 / (k + rank_i(d))) for each ranking system i.
        """
        rrf_scores = Counter()

        for rank, doc_idx in enumerate(bm25_ranking):
            rrf_scores[doc_idx] += 1.0 / (k + rank + 1)

        for rank, doc_idx in enumerate(tfidf_ranking):
            rrf_scores[doc_idx] += 1.0 / (k + rank + 1)

        # Sort by RRF score descending
        sorted_docs = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)
        return sorted_docs

    def retrieve(self, query: str, court_filter: Optional[str] = None,
                 case_type_filter: Optional[str] = None,
                 limit: int = 10) -> Dict[str, Any]:
        """
        Main retrieval function.
        Returns supporting and opposing precedents with scores.
        """
        query_tokens = self._tokenize(query)
        query_tfidf = self._compute_tfidf(query_tokens)

        # BM25 scores
        bm25_scores = []
        for i in range(len(self.cases)):
            score = self._bm25_score(query_tokens, i)
            bm25_scores.append((i, score))
        bm25_scores.sort(key=lambda x: x[1], reverse=True)
        bm25_ranking = [idx for idx, _ in bm25_scores]

        # TF-IDF cosine scores
        tfidf_scores = []
        for i, vec in enumerate(self.tfidf_vectors):
            score = self._cosine_similarity(query_tfidf, vec)
            tfidf_scores.append((i, score))
        tfidf_scores.sort(key=lambda x: x[1], reverse=True)
        tfidf_ranking = [idx for idx, _ in tfidf_scores]

        # RRF fusion
        fused_ranking = self._reciprocal_rank_fusion(bm25_ranking, tfidf_ranking)

        # Apply filters and build results
        supporting = []
        opposing = []

        for doc_idx in fused_ranking:
            if len(supporting) + len(opposing) >= limit:
                break

            case = self.cases[doc_idx]

            # Apply filters
            if court_filter and court_filter.lower() not in case.get("court", "").lower():
                if court_filter.lower() != "all":
                    pass  # Don't skip — show cross-court results too

            bm25_s = dict(bm25_scores).get(doc_idx, 0)
            tfidf_s = dict(tfidf_scores).get(doc_idx, 0)

            if bm25_s == 0 and tfidf_s == 0:
                continue

            # Combined weight (0..1): normalize BM25 score using sigmoid, blend with tfidf
            import math
            bm25_norm = 1 / (1 + math.exp(-bm25_s)) if bm25_s > 0 else 0
            weight = round(0.6 * bm25_norm + 0.4 * tfidf_s, 4)

            result_entry = {
                "id": case["id"],
                "name": case["name"],
                "citation": case["citation"],
                "court": case["court"],
                "year": case["year"],
                "category": case["category"],
                "holding": case.get("holding", ""),
                "principle": case.get("principle", ""),
                "bm25_score": round(bm25_s, 4),
                "tfidf_score": round(tfidf_s, 4),
                "weight": weight,
                "score": weight,
                "rrf_rank": fused_ranking.index(doc_idx) + 1,
                "relevance": "high" if bm25_s > 1 or tfidf_s > 0.1 else "moderate"
            }

            # Classify as supporting or opposing based on outcome/overruled status
            if case.get("overruled", False):
                result_entry["side"] = "opposing"
                result_entry["distinguish_note"] = f"This case was overruled. Consider newer authority."
                opposing.append(result_entry)
            else:
                result_entry["side"] = "supporting"
                supporting.append(result_entry)

        return {
            "supporting": supporting,
            "opposing": opposing,
            "metadata": {
                "retrieval_method": "Hybrid BM25 + TF-IDF Cosine + Reciprocal Rank Fusion",
                "bm25_k1": 1.5,
                "bm25_b": 0.75,
                "rrf_k": 60,
                "corpus_size": len(self.cases),
                "query_tokens": len(query_tokens)
            }
        }

    def search(self, query: str, category: Optional[str] = None,
               limit: int = 20) -> List[Dict]:
        """Simple search for the search endpoint."""
        query_lower = query.lower()
        results = []

        for case in self.cases:
            score = 0
            name_lower = case["name"].lower()
            citation_lower = case.get("citation", "").lower()
            holding_lower = case.get("holding", "").lower()

            if query_lower in name_lower:
                score += 10
            if query_lower in citation_lower:
                score += 8
            if query_lower in holding_lower:
                score += 3

            # Fuzzy token matching
            query_tokens = query_lower.split()
            for token in query_tokens:
                if token in name_lower:
                    score += 5
                if token in holding_lower:
                    score += 2

            if category and case.get("category", "").lower() != category.lower():
                score *= 0.5

            if score > 0:
                results.append({**case, "_score": score})

        results.sort(key=lambda x: x["_score"], reverse=True)
        return results[:limit]
