import api from './api';

// GET /recommendations/cold_start?top_k=K
export async function getColdStart(topK = 5) {
  const res = await api.get(`/recommendations/cold_start`, {
    params: { top_k: topK },
  });
  return res.data; // { results: [...], count, elapsed_ms }
}

// POST /recommendations/search { query, top_k }
export async function searchRecommendations(query, topK = 5) {
  const res = await api.post(`/recommendations/search`, { query, top_k: topK });
  return res.data; // { results: [...], count, elapsed_ms }
}

// GET /recommendations/similar/:id?top_k=K
export async function getSimilarById(productId, topK = 3) {
  const res = await api.get(`/recommendations/similar/${productId}`, {
    params: { top_k: topK },
  });
  return res.data;
}

// POST /recommendations/answer { question, top_k }
export async function askRecommendation(question, topK = 5) {
  const res = await api.post(`/recommendations/answer`, {
    question,
    top_k: topK,
  });
  return res.data; // { answer, products, ... }
}

// POST /recommendations/related { product_ids, top_k, exclude_ids }
export async function getRelated(productIds, topK = 8, excludeIds = []) {
  const res = await api.post(`/recommendations/related`, {
    product_ids: productIds,
    top_k: topK,
    exclude_ids: excludeIds,
  });
  return res.data;
}

// POST /recommendations/rerank { query, ids, top_k }
export async function rerankCandidates(query, ids, topK) {
  const res = await api.post(`/recommendations/rerank`, {
    query,
    ids,
    ...(topK ? { top_k: topK } : {}),
  });
  return res.data;
}

// POST /recommendations/reindex/async
export async function startAsyncReindex() {
  const res = await api.post(`/recommendations/reindex/async`);
  return res.data; // { job_id, status }
}

// GET /recommendations/reindex/status/:job_id
export async function getReindexStatus(jobId) {
  const res = await api.get(`/recommendations/reindex/status/${jobId}`);
  return res.data; // { job }
}

// GET /recommendations/reindex/jobs
export async function listReindexJobs() {
  const res = await api.get(`/recommendations/reindex/jobs`);
  return res.data; // { jobs, count }
}
