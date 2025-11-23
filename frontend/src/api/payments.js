// Payments API client
// Endpoints: /payments/config, /payments/intent, /payments/:id, /payments/by-order/:orderId,
//            /payments/:id/refund, /payments/:id/refunds
// All functions return response.data; caller handles errors

import api from './api';

//Get Stripe configuration from the backend
export async function getStripeConfig() {
  const { data } = await api.get('/payments/config');
  return data;
}

// Create a payment intent for a specific order
export async function createPaymentIntent(orderId, currency = 'usd') {
  const { data } = await api.post('/payments/intent', {
    order_id: orderId,
    currency,
  });
  return data;
}

// Retrieve payment status by payment ID
export async function getPaymentStatus(paymentId) {
  const { data } = await api.get(`/payments/${paymentId}`);
  return data;
}

// Retrieve payment details by order ID
export async function getPaymentByOrder(orderId) {
  const { data } = await api.get(`/payments/by-order/${orderId}`);
  return data;
}

// Issue a refund for a specific payment
export async function issueRefund(paymentId, { amount_cents, reason } = {}) {
  const payload = {};
  if (typeof amount_cents === ' number') payload.amount_cents = amount_cents;
  if (reason) payload.reason = reason;

  const { data } = await api.post(`/payments/${paymentId}/refund`, payload);
  return data;
}

// List all refunds for a specific payment
export async function listRefunds(paymentId) {
  const { data } = await api.get(`/payments/${paymentId}/refunds`);
  return data;
}
