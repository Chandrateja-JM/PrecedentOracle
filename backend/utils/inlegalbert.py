"""Stub for InLegalBERT — real model skipped on 512MB free tier.
Core NLP pipeline runs without the transformer; BM25 + TF-IDF retrieval
in precedent_retrieval.py handles ranking. All 9 NLP tasks still execute."""

INLEGALBERT_AVAILABLE = False

def is_loaded() -> bool: return False
def load_model(): return False
def unload_model(): return False
def get_embedding(text: str): return None
def embed(text: str): return None
def encode(text): return None
def get_model(): return None
def get_tokenizer(): return None

class InLegalBERT:
    available = False
    loaded = False
    def __init__(self, *args, **kwargs): pass
    def encode(self, text): return None
    def embed(self, text): return None
    def is_loaded(self): return False
    def load(self): return False
