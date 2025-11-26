export function normalizeProduct(raw = {}) {
  const image =
    raw.primary_image ||
    raw.thumbnail ||
    (Array.isArray(raw.images) && raw.images[0]) ||
    raw.image_url ||
    raw.imageUrl ||
    raw.image ||
    null;

  return {
    id: raw.id || raw.product_id || raw.external_id || raw.sku || null,
    name: raw.name || raw.title || 'Untitled Product',
    description: raw.description || raw.deascription || '',
    price: numberOrZero(raw.price),
    imageUrl: image,
    tags: raw.tags || '',
    score: numberOrZero(raw.score || raw.rating),
    _raw: raw,
  };
}

export function normalizeProducts(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeProduct);
}

function numberOrZero(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}
