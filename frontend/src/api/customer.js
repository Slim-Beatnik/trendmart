import api from './api';

// Gets current user
export async function getCurrentUser() {
  const { data } = await api.get('/customers/');
  return data;
}

// Gets current user's profile
export async function getProfile() {
  const { data } = await api.get('/customers/profile');
  return data;
}

// Create or update user profile
export async function upsertProfile(payload, method = 'POST') {
  const verb = method.toUpperCase() === 'PATCH' ? 'patch' : 'post';
  const { data } = await api[verb]('/customers/profile', payload);
  return data;
}

// Get current user's addresses
export async function getAddresses() {
  const { data } = await api.get('/customers/addresses');
  return data;
}

// Add a new address for the current user
export async function addAddress(payload) {
  const { data } = await api.post('/customers/addresses', payload);
  return data;
}

export async function deleteAddress(addressId) {
  const { data } = await api.delete(`/customers/addresses/${addressId}`);
  return data;
}

export async function setDefaultAddress(addressId) {
  const { data } = await api.patch(
    `/customers/set_default_address/${addressId}`
  );
  return data;
}

function extractErrorMessage(err) {
  if (!err) return 'Unknown error';
  const res = err.response;
  if (res?.data?.message) return res.data.message;
  if (res?.data?.error) return res.data.error;
  return err.message || 'Request failed';
}
