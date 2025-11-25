// Cart API clients
// Back-end implemented endpoints:
//   GET    /cart/            -> Get current user's cart items (JWT)
//   DELETE /cart/clear       -> Clear current user's cart (JWT)
//   POST   /cart/items/<id>  -> Add product by id with quantity (legacy; not used here)
//   PATCH  /cart/items/<id>  -> Update cart item quantity
//   DELETE /cart/items/<id>  -> Remove cart item
// NOTE: Legacy DELETE /cart?user_id= still exists server-side for compatibility.
// All endpoints require JWT (withCredentials enabled in api instance).

import api from './api';

// Create a new cart
// Legacy createCart removed: server auto-creates cart on first add; keep stub if needed.
export async function createCart() {
  return { message: 'Cart auto-created on first item add.' };
}

// Retrieve the current cart
export async function getCart() {
  const { data } = await api.get('/cart/');
  return data;
}

// Add an item to the cart
export async function addToCart(productId, quantity = 1) {
  // Backend expects POST /cart/items/<productId> with JSON { quantity }
  const { data } = await api.post(`/cart/items/${productId}`, {
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
