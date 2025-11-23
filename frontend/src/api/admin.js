// Admin API Client (JWT; admin role required)
// Endpoints:
//   POST   /admin/register               -> registerAdmin
//   GET    /admin/manage_users           -> listUsers
//   GET    /admin/manage_users/:userId   -> getUserById
//   PATCH  /admin/manage_users/:userId   -> updateUser
//   DELETE /admin/manage_users/:userId   -> deleteUser
// All functions return response.data; caller handles errors
import api from './api';

export async function registerAdmin(payload) {
  const { data } = await api.post('/admin/register', payload);
  return data;
}

export async function listUsers(params = {}) {
  const { data } = await api.get('/admin/manage_users', { params });
  return data;
}

export async function getUserById(userId) {
  const { data } = await api.get(`/admin/manage_users/${userId}`);
  return data;
}

export async function updateUser(userId, payload) {
  const { data } = await api.patch(`/admin/manage_users/${userId}`, payload);
  return data;
}

export async function deleteUser(userId) {
  const { data } = await api.delete(`/admin/manage_users/${userId}`);
  return data;
}
