import api from './api'

export const leadsApi = {
  list: (params = {}) =>
    api.get('/api/v1/leads', { params }).then(r => r.data),

  get: (id) =>
    api.get(`/api/v1/leads/${id}`).then(r => r.data),

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
