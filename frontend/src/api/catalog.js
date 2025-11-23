// Catalog & Product API client
// Provides functions to interact with product, category, inventory and review endpoints.
// Backend endpoints referenced: /products, /categories/:id/products, /products/:id/inventory, /products/:id/reviews
// All functions return response.data directly; callers handle errors.

import api from './api';

// -------- Products --------

export async function listProducts(params = {}) {
  const { data } = await api.get('/products', { params });
  return data; // Array of products
}

// Client-side search helper (case-insensitive substring match on name/description)
export function filterProductsByQuery(products, query) {
  if (!query) return products;
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter(p => (
    (p.name && p.name.toLowerCase().includes(q)) ||
    (p.description && p.description.toLowerCase().includes(q))
  ));
}

export async function getProduct(productId) {
  const { data } = await api.get(`/products/${productId}`);
  return data; // Single product
}

export async function createProduct(payload) {
  const { data } = await api.post('/products', payload);
  return data;
}

export async function updateProduct(productId, payload) {
  const { data } = await api.patch(`/products/${productId}`, payload);
  return data;
}

export async function deleteProduct(productId) {
  const { data } = await api.delete(`/products/${productId}`);
  return data; // { message: ... }
}

// -------- Categories --------

export async function listCategories(params = {}) {
  const { data } = await api.get('/categories', { params });
  return data; // Array of categories
}

export async function getProductsByCategory(categoryId, params = {}) {
  const { data } = await api.get(`/categories/${categoryId}/products`, {
    params,
  });
  return data; // Array of products
}

export async function listSubcategories(categoryId, params = {}) {
  const { data } = await api.get(`/categories/${categoryId}/subcategories`, {
    params,
  });
  return data; // Array of subcategories for the category
}

export async function getProductsBySubcategory(subcategoryId, params = {}) {
  const { data } = await api.get(`/subcategories/${subcategoryId}/products`, {
    params,
  });
  return data; // Array of products scoped to subcategory
}

// -------- Inventory --------

export async function getInventory(productId) {
  const { data } = await api.get(`/products/${productId}/inventory`);
  return data; // { product_id, quantity, ... }
}

// -------- Reviews --------

export async function listReviews(productId) {
  const { data } = await api.get(`/products/${productId}/reviews`);
  return data; // Array of reviews
}

export async function addReview(productId, payload) {
  const { data } = await api.post(`/products/${productId}/reviews`, payload);
  return data; // Created review
}

// -------- Helpers --------

// Graceful fetch utility that returns { data, error }
export async function safeGetProduct(productId) {
  try {
    const data = await getProduct(productId);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: extractErrorMessage(err) };
  }
}

function extractErrorMessage(err) {
  if (!err) return 'Unknown error';
  const res = err.response;
  if (res?.data?.message) return res.data.message;
  if (res?.data?.error) return res.data.error;
  return err.message || 'Request failed';
}
