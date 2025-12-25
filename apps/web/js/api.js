const API_BASE = 'http://localhost:4005'

const getToken = () => localStorage.getItem('crm_token')

const request = async (path, options = {}) => {
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Request failed')
  }
  if (response.status === 204) {
    return null
  }
  return response.json()
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),
  getCompanies: () => request('/companies'),
  getContacts: () => request('/contacts'),
  getDeals: () => request('/deals'),
  getTasks: () => request('/tasks'),
  updateDeal: (id, data) => request(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateDealStage: (id, stage) => request(`/deals/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getDashboardSummary: () => request('/dashboard/summary'),
  getDashboardCharts: () => request('/dashboard/charts'),
  getRecentActivities: () => request('/activities/recent')
}

export const authStore = {
  set(token, user) {
    localStorage.setItem('crm_token', token)
    localStorage.setItem('crm_user', JSON.stringify(user))
  },
  clear() {
    localStorage.removeItem('crm_token')
    localStorage.removeItem('crm_user')
  },
  getUser() {
    const raw = localStorage.getItem('crm_user')
    return raw ? JSON.parse(raw) : null
  }
}
