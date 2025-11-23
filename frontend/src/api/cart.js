// Cart API clients
// Endpoints: /cart (GET, POST), /cart/items (POST), /cart/items/:itemId (PATCH, DELETE), /cart/clear (DELETE)
// All endpoints require JWT (withCredentials enabled in api instance).

import api from './api';

// Create a new cart
export async function createCart() {
  const { data } = await api.post('/cart/');
  return data;
}

// Retrieve the current cart
export async function getCart() {
  const { data } = await api.get('/cart/');
  return data;
}

// Add an item to the cart
export async function addToCart(productId, quantity = 1) {
  const { data } = await api.post(`/cart/items`, {
    product_id: productId,
    quantity,
  });
  return data;
}

// Update the quantity of a specific item in the cart
export async function updateCartItem(itemId, quantity) {
  const { data } = await api.patch(`/cart/items/${itemId}`, {
    quantity,
  });
  return data;
}

// Remove an item from the cart
export async function removeFromCart(itemId) {
  const { data } = await api.delete(`/cart/items/${itemId}`);
  return data;
}

// Clear all items from the cart
export async function clearCart() {
  const { data } = await api.delete('/cart/clear');
  return data;
}
