import { api, authStore } from './api.js'

export const ensureAuth = async () => {
  const token = localStorage.getItem('crm_token')
  if (!token) {
    window.location.href = 'index.html'
    return null
  }
  try {
    const response = await api.me()
    authStore.set(token, response.user)
    return response.user
  } catch {
    authStore.clear()
    window.location.href = 'index.html'
    return null
  }
}

export const setUserHeader = (user) => {
  const nameEl = document.querySelector('[data-user-name]')
  const avatarEl = document.querySelector('[data-user-avatar]')
  if (nameEl) nameEl.textContent = user?.name || 'User'
  if (avatarEl) avatarEl.src = user?.avatar || 'https://i.pravatar.cc/80'
}

export const setupLogout = () => {
  const logoutBtn = document.querySelector('[data-logout]')
  if (!logoutBtn) return
  logoutBtn.addEventListener('click', () => {
    authStore.clear()
    window.location.href = 'index.html'
  })
}

export const showToast = (message) => {
  let toast = document.querySelector('.toast')
  if (!toast) {
    toast = document.createElement('div')
    toast.className = 'toast'
    document.body.appendChild(toast)
  }
  toast.textContent = message
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 2500)
}
