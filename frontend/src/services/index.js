import api from './api';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
  changePassword: (payload) => api.put('/auth/password', payload),
};

export const verificationApi = {
  create: (formData, onUploadProgress) => api.post('/verifications', formData, { onUploadProgress, timeout: 120000 }),
  batchZip: (formData, onUploadProgress) => api.post('/verifications/batch-zip', formData, { onUploadProgress, timeout: 300000 }),
  list: (params) => api.get('/verifications', { params }),
  stats: () => api.get('/verifications/stats'),
  get: (id) => api.get(`/verifications/${id}`),
  analyze: (id) => api.post(`/verifications/${id}/analyze`),
  remove: (id) => api.delete(`/verifications/${id}`),
  // Images are private: fetch them with the auth header and show them via a blob URL.
  file: (id, side) => api.get(`/verifications/${id}/files/${side}`, { responseType: 'blob' }),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params) => api.get('/admin/users', { params }),
  user: (id) => api.get(`/admin/users/${id}`),
  setUserActive: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  verifications: (params) => api.get('/admin/verifications', { params }),
  verification: (id) => api.get(`/admin/verifications/${id}`),
  analyze: (id) => api.post(`/admin/verifications/${id}/analyze`),
  updateVerificationStatus: (id, payload) => api.patch(`/admin/verifications/${id}/status`, payload),
  file: (id, side) => api.get(`/admin/verifications/${id}/files/${side}`, { responseType: 'blob' }),
  exportCsv: () => api.get('/admin/verifications/export-csv', { responseType: 'blob' }),
};
