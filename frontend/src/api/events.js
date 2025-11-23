import api from './api';

// Helper to coerce product id to number (backend expects Int)
function getNumericProductId(product) {
  const raw = product?.id ?? product?.product_id ?? product?.external_id;
  const num = Number(raw);
  return Number.isFinite(num) ? num : undefined;
}

// Interaction events
export async function logView(product, source) {
  return api.post('/events/view', shapeInteractionPayload(product, source));
}

export async function logCartAdd(product, source) {
  return api.post('/events/cart_add', shapeInteractionPayload(product, source));
}

export async function logPurchase(product, source) {
  return api.post('/events/purchase', shapeInteractionPayload(product, source));
}

// Recommendation feedback
export async function sendRecommendationFeedback({ product, action, source }) {
  return api.post('/recommendations/feedback', {
    product_id: getNumericProductId(product),
    action, // clicked | converted | ignored | dismissed | pinned
    source, // must be one of: search | similar | related | answer | cold_start
  });
}

function shapeInteractionPayload(product, source) {
  const payload = {
    product_id: getNumericProductId(product),
  };
  if (source) payload.source = source; // allow backend to record source context
  return payload;
}
