import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from .helpers.text_builder import create_product_text
from .embeddings_backend import make_backend, BaseEmbeddingBackend


class ProductVectorStore:
    """In-memory vector store with vectorized similarity & query embedding cache."""

    def __init__(self, model_name: str = 'all-MiniLM-L6-v2', backend: BaseEmbeddingBackend | None = None):
        self.model_name = model_name
        self.backend = backend or make_backend()
        self.products: List[Dict[str, Any]] = []
        self.product_embeddings: List[List[float]] = []
        self.id_to_index: Dict[int, int] = {}
        self._emb_matrix: Optional[np.ndarray] = None
        # Query embedding cache (FIFO simple eviction)
        self._query_cache: Dict[str, List[float]] = {}
        self._query_cache_order: List[str] = []
        self._query_cache_limit = 500

    # -----------------------------
    # Product ingestion
    # -----------------------------
    def add_products(self, products: List[Dict[str, Any]], category_info: Dict[str, Any] = None):
        for product in products:
            if category_info:
                product['category_info'] = category_info.get(product['id'], '')
                product['main_category'] = category_info.get(
                    product['id'], {}).get('main_category', '')

            text = self.create_product_text(product)
            emb = self.backend.embed(text)
            # normalize vector shape
            if isinstance(emb, list) and emb and isinstance(emb[0], (list, tuple)):
                emb = list(emb[0])
            self.products.append(product)
            self.product_embeddings.append(emb)
            self.id_to_index[product['id']] = len(self.products) - 1
        self._rebuild_matrix()

    def set_products_and_embeddings(self, products: List[Dict[str, Any]], embeddings: List[List[float]]):
        if len(products) != len(embeddings):
            raise ValueError(
                'products and embeddings must have the same length')
        for i, emb in enumerate(embeddings):
            if not isinstance(emb, (list, tuple)) or (emb and not isinstance(emb[0], (int, float))):
                raise ValueError(
                    f'embedding at index {i} is not a numeric vector')
        self.products = list(products)
        self.product_embeddings = [list(e) for e in embeddings]
        self.id_to_index.clear()
        for idx, p in enumerate(self.products):
            if 'id' in p:
                self.id_to_index[p['id']] = idx
        self._rebuild_matrix()

    def _rebuild_matrix(self):
        if not self.product_embeddings:
            self._emb_matrix = None
            return
        self._emb_matrix = np.array(self.product_embeddings, dtype='float32')

    # -----------------------------
    # Embedding helpers
    # -----------------------------
    def _embed_cached(self, text: str) -> List[float]:
        key = text.strip().lower()
        cached = self._query_cache.get(key)
        if cached is not None:
            return cached
        vec = self.backend.embed(text)
        if isinstance(vec, list) and vec and isinstance(vec[0], (list, tuple)):
            vec = list(vec[0])
        self._query_cache[key] = vec
        self._query_cache_order.append(key)
        if len(self._query_cache_order) > self._query_cache_limit:
            old = self._query_cache_order.pop(0)
            self._query_cache.pop(old, None)
        return vec

    # -----------------------------
    # Public API
    # -----------------------------
    def create_product_text(self, product: Dict[str, Any]) -> str:
        return create_product_text(product)

    def search_similar_products(self, query: str, top_k: int = 10, exclude_ids: Optional[List[int]] = None) -> List[Tuple[Dict[str, Any], float]]:
        if not self.products or self._emb_matrix is None:
            return []
        q = np.array(self._embed_cached(query), dtype='float32')
        if q.ndim != 1:
            q = q.flatten()
        M = self._emb_matrix
        q_norm = np.linalg.norm(q) or 1e-9
        m_norms = np.linalg.norm(M, axis=1)
        sims = (M @ q) / ((m_norms * q_norm).clip(min=1e-9))
        if exclude_ids:
            for pid in exclude_ids:
                idx = self.id_to_index.get(pid)
                if idx is not None:
                    sims[idx] = -1.0
        k = min(top_k, len(sims))
        if k <= 0:
            return []
        top_idx = np.argpartition(-sims, range(k))[:k]
        top_idx = top_idx[np.argsort(-sims[top_idx])]
        return [(self.products[i], float(sims[i])) for i in top_idx]

    def get_product_by_id(self, product_id: int) -> Optional[Dict[str, Any]]:
        idx = self.id_to_index.get(product_id)
        if idx is None:
            return None
        return self.products[idx]

    def find_similar_to_product(self, product_id: int, top_k: int = 10) -> List[Tuple[Dict[str, Any], float]]:
        prod = self.get_product_by_id(product_id)
        if not prod:
            return []
        text = self.create_product_text(prod)
        return self.search_similar_products(text, top_k + 1, exclude_ids=[product_id])

    def get_stats(self) -> Dict[str, Any]:
        return {
            'total_products': len(self.products),
            'embedding_dimension': int(self._emb_matrix.shape[1]) if isinstance(self._emb_matrix, np.ndarray) else 0,
            'model_name': self.model_name,
            'query_cache_size': len(self._query_cache),
        }
