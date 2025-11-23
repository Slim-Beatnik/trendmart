// Orders API client
// Endpoints:
//   POST   /orders/                     -> createOrder
//   GET    /orders/                     -> getMyOrders
//   GET    /orders/:orderId             -> getOrder
//   GET    /orders/users/:userId        -> getOrdersByUser
//   POST   /orders/:orderId/payments/intents -> createOrderPaymentIntent (optional; legacy helper)
// All endpoints require JWT (withCredentials enabled in api instance).

import api from './api';

// Create a new order from the current user's cart
export async function createOrder() {
  const { data } = await api.post('/orders/');
  return data;
}

// Get all orders from the current user
export async function getMyOrders(params = {}) {
  const { data } = await api.get('/orders/', { params });
  return data;
}

// Get all orders for a specific user (must be the current user)
export async function getOrder(orderId) {
  const { data } = await api.get(`/orders/${orderId}`);
  return data;
}

// Get all orders for a specific user (admin or the user themselves)
export async function getOrdersByUser(userId, params = {}) {
  const { data } = await api.get(`/orders/users/${userId}`, { params });
  return data;
}
