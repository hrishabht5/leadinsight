import api from './api'

export const leadsApi = {
  list: (params = {}) =>
    api.get('/api/v1/leads', { params }).then(r => r.data),

  get: (id) =>
    api.get(`/api/v1/leads/${id}`).then(r => r.data),

  create: (data) =>
    api.post('/api/v1/leads', data).then(r => r.data),

  importLeads: (leads) =>
    api.post('/api/v1/leads/import', { leads }).then(r => r.data),

  updateStatus: (id, status) =>
    api.patch(`/api/v1/leads/${id}/status`, { status }).then(r => r.data),

  addNote: (id, content) =>
    api.post(`/api/v1/leads/${id}/notes`, { content }).then(r => r.data),
}

export const analyticsApi = {
  summary: () =>
    api.get('/api/v1/analytics/summary').then(r => r.data),

  trend: (days = 30) =>
    api.get('/api/v1/analytics/trend', { params: { days } }).then(r => r.data),
}

export const authApi = {
  connectFacebook: (code, redirect_uri) =>
    api.post('/api/v1/auth/facebook/connect', { code, redirect_uri }).then(r => r.data),

  getPages: () =>
    api.get('/api/v1/auth/facebook/pages').then(r => r.data),
}

export const usersApi = {
  getPreferences: () =>
    api.get('/api/v1/users/me/preferences').then(r => r.data),

  updatePreferences: (data) =>
    api.patch('/api/v1/users/me/preferences', data).then(r => r.data),

  getConnectionStatus: () =>
    api.get('/api/v1/auth/facebook/pages').then(r => ({
      connected: (r.data.pages || []).length > 0,
      pageCount: (r.data.pages || []).length,
      pages: r.data.pages || [],
    })).catch(() => ({ connected: false, pageCount: 0, pages: [] })),
}

