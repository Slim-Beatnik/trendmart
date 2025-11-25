from flask import Blueprint, request, jsonify, current_app, make_response
import threading
import os
import time
import uuid
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from ai_recom_system.rag_service import answer_question, load_simple_index, INDEX_PATH
from ai_recom_system.index_products import index_all_products

# Optimized recommendation blueprint with cached vector store reload interval.
recom_bp = Blueprint('recommendation', __name__, url_prefix='/recommendations')

_vector_lock = threading.Lock()
_vs_cache = None            # ProductVectorStore instance
_vs_cache_mtime = None      # Last index file modified time
_last_reload_ts = 0         # Last time we reloaded (epoch seconds)
RELOAD_MIN_INTERVAL = 300   # Minimum seconds between reload attempts

_reindex_jobs: Dict[str, Dict[str, Any]] = {}
_reindex_jobs_lock = threading.Lock()


def _init_vector_store():
    from ai_recom_system.product_vector_store import ProductVectorStore
    model_name = current_app.config.get('EMBED_MODEL', 'all-MiniLM-L6-v2')
    return ProductVectorStore(model_name=model_name)


def _now_ms() -> int:
    return int(time.time() * 1000)


def _req_id() -> str:
    return uuid.uuid4().hex[:12]


def _json_response(payload: Dict[str, Any], status: int = 200, req_id: Optional[str] = None):
    resp = make_response(jsonify(payload), status)
    if req_id:
        resp.headers['X-Request-ID'] = req_id
    return resp


def _get_vs_cached() -> Tuple[object, Dict[str, Any]]:
    global _vs_cache, _vs_cache_mtime, _last_reload_ts
    try:
        mtime = os.path.getmtime(INDEX_PATH)
    except OSError:
        mtime = None
    with _vector_lock:
        need_reload = False
        if _vs_cache is None:
            need_reload = True
        elif mtime and _vs_cache_mtime and mtime > _vs_cache_mtime and (time.time() - _last_reload_ts) > RELOAD_MIN_INTERVAL:
            need_reload = True
        if need_reload:
            try:
                _vs_cache = load_simple_index()
                _vs_cache_mtime = mtime
                _last_reload_ts = time.time()
                current_app.logger.info(
                    f"[recom.cache] reload products={len(getattr(_vs_cache,'products',[]))}")
            except Exception as e:
                current_app.logger.exception(
                    f"[recom.cache] reload failed: {e}")
                if _vs_cache is None:
                    _vs_cache = _init_vector_store()
    stats = {}
    try:
        stats = _vs_cache.get_stats() if _vs_cache else {}
    except Exception:
        stats = {}
    return _vs_cache, stats


def _to_product_card(p: Dict[str, Any], score: Optional[float] = None) -> Dict[str, Any]:
    primary_image = p.get('primary_image') or p.get(
        'product_img') or p.get('image_url')
    images = p.get('images') or ([primary_image] if primary_image else [])
    card = {
        'id': p.get('id'),
        'sku': p.get('sku'),
        'name': p.get('name') or '',
        'description': p.get('description') or '',
        'price': p.get('price', 0.0),
        'rating': p.get('rating', 0.0),
        'tags': p.get('tags') or [],
        'primary_image': primary_image,
        'thumbnail': p.get('image_thumb_url'),
        'images': images,
        'subcategory': p.get('subcategory'),
        'main_category': p.get('main_category'),
        'category_info': p.get('category_info'),
        'times_click_on': p.get('times_click_on', 0),
    }
    if score is not None:
        card['score'] = float(score)
    return card


# Semantic search endpoint


@recom_bp.route('/search', methods=['POST'])
def search_recoms():
    rid = _req_id()
    t0 = _now_ms()
    data = request.get_json() or {}
    query = data.get('query') or data.get('q')
    top_k = int(data.get('top_k', 3))
    if not query:
        return _json_response({'error': 'missing query'}, 400, rid)
    vs, stats = _get_vs_cached()
    if not vs or not getattr(vs, 'products', None):
        elapsed = _now_ms() - t0
        return _json_response({'results': [], 'count': 0, 'elapsed_ms': elapsed, 'warning': 'vector_store_empty'}, 200, rid)
    retrieved = vs.search_similar_products(query, top_k=top_k)
    items = [_to_product_card(prod, score) for prod, score in retrieved]
    elapsed = _now_ms() - t0
    current_app.logger.info(
        f"[recom.search] rid={rid} q='{query}' k={top_k} hits={len(items)} ms={elapsed} stats={stats}")
    return _json_response({'results': items, 'count': len(items), 'elapsed_ms': elapsed}, req_id=rid)


# Get similar products for a given product ID
@recom_bp.route('/similar/<int:product_id>', methods=['GET'])
def similar_products(product_id):
    rid = _req_id()
    t0 = _now_ms()
    top_k = request.args.get('top_k', 3, type=int)
    vs, stats = _get_vs_cached()
    if not vs or not getattr(vs, 'products', None):
        return _json_response({'results': [], 'count': 0, 'warning': 'vector_store_empty'}, 200, rid)
    sims = vs.find_similar_to_product(product_id, top_k=top_k)
    items = [_to_product_card(prod, score) for prod, score in sims]
    elapsed = _now_ms() - t0
    current_app.logger.info(
        f"[recom.similar] rid={rid} pid={product_id} k={top_k} hits={len(items)} ms={elapsed} stats={stats}")
    return _json_response({'results': items, 'count': len(items), 'elapsed_ms': elapsed}, req_id=rid)

# Get products by category


@recom_bp.route('/category/<string:category_name>', methods=['GET'])
def category_products(category_name):
    rid = _req_id()
    t0 = _now_ms()
    top_k = request.args.get('top_k', 3, type=int)
    mode = request.args.get('mode', 'exact')
    vs, stats = _get_vs_cached()
    if not vs or not getattr(vs, 'products', None):
        return _json_response({'results': [], 'count': 0, 'warning': 'vector_store_empty'}, 200, rid)
    results: List[Dict[str, Any]] = []
    lname = category_name.lower()
    if mode in ('exact', 'hybrid'):
        for p in vs.products:
            if lname == (p.get('main_category') or '').lower() or lname == (p.get('subcategory') or '').lower():
                results.append(p)
                if len(results) >= top_k:
                    break
    if mode in ('semantic', 'hybrid') and len(results) < top_k:
        needed = top_k - len(results)
        q = f"category: {category_name}"
        sem = vs.search_similar_products(q, top_k=max(needed * 2, needed))
        seen = {p.get('id') for p in results}
        for prod, _score in sem:
            pid = prod.get('id')
            if pid not in seen:
                results.append(prod)
                seen.add(pid)
            if len(results) >= top_k:
                break
    if not results:
        for p in vs.products:
            blob = f"{p.get('name','')} {p.get('description','')} {p.get('main_category','')} {p.get('subcategory','')}".lower()
            if lname in blob:
                results.append(p)
                if len(results) >= top_k:
                    break
    items = [_to_product_card(p) for p in results]
    elapsed = _now_ms() - t0
    current_app.logger.info(
        f"[recom.category] rid={rid} name='{category_name}' mode={mode} k={top_k} hits={len(items)} ms={elapsed} stats={stats}")
    return _json_response({'results': items, 'count': len(items), 'elapsed_ms': elapsed}, req_id=rid)


@recom_bp.route('/health', methods=['GET'])
def health_check():
    vs, stats = _get_vs_cached()
    stats['last_reload_ts'] = _last_reload_ts
    stats['index_mtime'] = _vs_cache_mtime
    return jsonify({'status': 'ok', 'vector_store': stats})


@recom_bp.route('/answer', methods=['POST'])
def answer():
    rid = _req_id()
    t0 = _now_ms()
    data = request.get_json() or {}
    question = data.get('question') or data.get('query')
    if not question:
        return _json_response({'error': 'missing question'}, 400, rid)
    try:
        res = answer_question(question)
    except Exception as e:
        current_app.logger.exception(f"[recom.answer] rid={rid} failed: {e}")
        return _json_response({'error': str(e)}, 500, rid)
    # Resolve product cards for the retrieved/source ids for direct rendering on the frontend
    vs, _ = _get_vs_cached()
    source_ids = res.get('source_ids') or []
    cards: List[Dict[str, Any]] = []
    for sid in source_ids:
        try:
            prod = vs.get_product_by_id(int(sid))
            if prod:
                # Optionally find similarity score from retrieved metadata
                score_map = {x.get('id'): x.get('score') for x in res.get(
                    '_retrieved', []) if isinstance(x, dict)}
                score = score_map.get(int(sid)) if score_map else None
                cards.append(_to_product_card(prod, score))
        except Exception:
            continue

    elapsed = _now_ms() - t0
    current_app.logger.info(
        f"[recom.answer] rid={rid} hits={len(cards)} elapsed_ms={elapsed}")
    return _json_response({
        'answer': res.get('answer'),
        'source_ids': source_ids,
        'products': cards,
        'raw': res.get('raw'),
        'retrieved': res.get('_retrieved', []),
        'elapsed_ms': elapsed
    }, req_id=rid)


@recom_bp.route('/by_ids', methods=['POST'])
def products_by_ids():
    data = request.get_json() or {}
    ids = data.get('ids') or []
    try:
        ids = [int(x) for x in ids]
    except Exception:
        return jsonify({'error': 'invalid ids'}), 400
    rid = _req_id()
    vs, _ = _get_vs_cached()
    out = []
    if vs:
        for pid in ids:
            p = vs.get_product_by_id(pid)
            if p:
                out.append(_to_product_card(p))
    return _json_response({'results': out, 'count': len(out)}, req_id=rid)


@recom_bp.route('/reindex', methods=['POST'])
def force_reindex():
    """Force reload of the product index file into memory cache."""
    rid = _req_id()
    with _vector_lock:
        global _vs_cache, _vs_cache_mtime
        _vs_cache = load_simple_index()
        try:
            _vs_cache_mtime = os.path.getmtime(INDEX_PATH)
        except Exception:
            _vs_cache_mtime = None
    stats = {}
    try:
        stats = _vs_cache.get_stats() if _vs_cache else {}
    except Exception:
        pass
    current_app.logger.info(f"[recom.reindex] rid={rid} stats={stats}")
    return _json_response({"status": "reloaded", "stats": stats}, req_id=rid)


# ------------------------------
# Related Products Endpoint
# ------------------------------
@recom_bp.route('/related', methods=['POST'])
def related_products():
    """Return products related to a set of seed product_ids.

    Body: {"product_ids": [..], "top_k": 10, "exclude_ids": [..] }
    Approach: average (centroid) of seed embeddings, then cosine similarity to all.
    """
    rid = _req_id()
    t0 = _now_ms()
    data = request.get_json() or {}
    seed_ids = data.get('product_ids') or data.get('ids') or []
    exclude_ids = set(data.get('exclude_ids') or [])
    top_k = int(data.get('top_k', 10))
    if not seed_ids:
        return _json_response({'error': 'missing product_ids'}, 400, rid)

    vs, stats = _get_vs_cached()
    if not vs or not getattr(vs, 'products', None):
        return _json_response({'results': [], 'count': 0, 'elapsed_ms': 0, 'warning': 'empty index'}, req_id=rid)

    # Collect seed embeddings
    seed_vecs = []
    for sid in seed_ids:
        if sid in vs.id_to_index:
            idx = vs.id_to_index[sid]
            try:
                seed_vecs.append(np.array(vs.product_embeddings[idx]))
            except Exception:
                continue
    if not seed_vecs:
        return _json_response({'error': 'no seed embeddings found'}, 400, rid)

    centroid = np.mean(seed_vecs, axis=0)
    # Compute similarity vs all products
    sims: List[Tuple[int, float]] = []
    c_norm = np.linalg.norm(centroid)
    if c_norm == 0:
        return _json_response({'error': 'degenerate centroid'}, 500, rid)
    for i, emb in enumerate(vs.product_embeddings):
        pid = vs.products[i].get('id')
        if pid in seed_ids or pid in exclude_ids:
            continue
        v = np.array(emb)
        denom = (c_norm * (np.linalg.norm(v) or 1.0))
        score = float(np.dot(centroid, v) / denom)
        sims.append((i, score))
    sims.sort(key=lambda x: x[1], reverse=True)
    out_items = []
    for i, score in sims[:top_k]:
        out_items.append(_to_product_card(vs.products[i], score))
    elapsed = _now_ms() - t0
    current_app.logger.info(
        f"[recom.related] rid={rid} seeds={len(seed_ids)} k={top_k} hits={len(out_items)} elapsed_ms={elapsed}")
    return _json_response({'results': out_items, 'count': len(out_items), 'elapsed_ms': elapsed}, req_id=rid)


# ------------------------------
# Reranking Endpoint
# ------------------------------
@recom_bp.route('/rerank', methods=['POST'])
def rerank_candidates():
    """Rerank a provided candidate set against a natural language query.

    Body: {"query": "text", "ids": [list], "top_k": optional}
    Returns: products with semantic similarity score.
    """
    rid = _req_id()
    t0 = _now_ms()
    data = request.get_json() or {}
    query = data.get('query') or data.get('q')
    ids = data.get('ids') or []
    top_k = int(data.get('top_k', len(ids) or 10))
    if not query:
        return _json_response({'error': 'missing query'}, 400, rid)
    if not ids:
        return _json_response({'error': 'missing ids'}, 400, rid)
    vs, stats = _get_vs_cached()
    if not vs:
        return _json_response({'error': 'no index loaded'}, 500, rid)

    # Embed query once
    try:
        # Reuse backend via a pseudo search to access embedding backend directly
        backend = getattr(vs, 'backend', None)
        if backend is None:
            raise RuntimeError('embedding backend unavailable')
        q_vec = np.array(backend.embed(query))
    except Exception as e:
        current_app.logger.exception(
            f"[recom.rerank] rid={rid} embed failed: {e}")
        return _json_response({'error': 'embedding failed'}, 500, rid)

    q_norm = np.linalg.norm(q_vec) or 1.0
    scored: List[Tuple[int, float]] = []
    for pid in ids:
        if pid not in vs.id_to_index:
            continue
        idx = vs.id_to_index[pid]
        emb = np.array(vs.product_embeddings[idx])
        denom = (q_norm * (np.linalg.norm(emb) or 1.0))
        score = float(np.dot(q_vec, emb) / denom)
        scored.append((pid, score))
    scored.sort(key=lambda x: x[1], reverse=True)

    out_items = []
    for pid, score in scored[:top_k]:
        prod = vs.get_product_by_id(pid)
        if prod:
            out_items.append(_to_product_card(prod, score))
    elapsed = _now_ms() - t0
    current_app.logger.info(
        f"[recom.rerank] rid={rid} q='{query}' candidates={len(ids)} returned={len(out_items)} elapsed_ms={elapsed}")
    return _json_response({'results': out_items, 'count': len(out_items), 'elapsed_ms': elapsed}, req_id=rid)


# ------------------------------
# Async Index Rebuild
# ------------------------------
def _spawn_reindex_job():
    job_id = uuid.uuid4().hex[:16]
    with _reindex_jobs_lock:
        _reindex_jobs[job_id] = {
            'id': job_id,
            'status': 'pending',
            'started_at': None,
            'finished_at': None,
            'error': None,
            'stats': None,
        }

    def _worker(app):
        with app.app_context():
            with _reindex_jobs_lock:
                _reindex_jobs[job_id]['status'] = 'running'
                _reindex_jobs[job_id]['started_at'] = _now_ms()
            try:
                # Build a fresh index file from DB
                index_all_products()
                # Reload in-process cache
                with _vector_lock:
                    global _vs_cache, _vs_cache_mtime
                    _vs_cache = load_simple_index()
                    try:
                        _vs_cache_mtime = os.path.getmtime(INDEX_PATH)
                    except Exception:
                        _vs_cache_mtime = None
                stats = {}
                try:
                    stats = _vs_cache.get_stats() if _vs_cache else {}
                except Exception:
                    pass
                with _reindex_jobs_lock:
                    _reindex_jobs[job_id]['status'] = 'done'
                    _reindex_jobs[job_id]['finished_at'] = _now_ms()
                    _reindex_jobs[job_id]['stats'] = stats
                current_app.logger.info(
                    f"[recom.reindex.async] job={job_id} done stats={stats}")
            except Exception as e:
                current_app.logger.exception(
                    f"[recom.reindex.async] job={job_id} failed: {e}")
                with _reindex_jobs_lock:
                    _reindex_jobs[job_id]['status'] = 'error'
                    _reindex_jobs[job_id]['finished_at'] = _now_ms()
                    _reindex_jobs[job_id]['error'] = str(e)

    th = threading.Thread(target=_worker, args=(
        current_app._get_current_object(),), daemon=True)
    th.start()
    return job_id


@recom_bp.route('/reindex/async', methods=['POST'])
def async_reindex():
    rid = _req_id()
    job_id = _spawn_reindex_job()
    return _json_response({'job_id': job_id, 'status': 'queued'}, 202, rid)


@recom_bp.route('/reindex/status/<job_id>', methods=['GET'])
def reindex_status(job_id: str):
    rid = _req_id()
    with _reindex_jobs_lock:
        job = _reindex_jobs.get(job_id)
    if not job:
        return _json_response({'error': 'job not found'}, 404, rid)
    return _json_response({'job': job}, req_id=rid)


@recom_bp.route('/reindex/jobs', methods=['GET'])
def list_reindex_jobs():
    rid = _req_id()
    with _reindex_jobs_lock:
        jobs = list(_reindex_jobs.values())
    # Return most recent first
    jobs.sort(key=lambda j: (j.get('started_at') or 0), reverse=True)
    return _json_response({'jobs': jobs[:50], 'count': len(jobs)}, req_id=rid)
