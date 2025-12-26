import { api } from './api.js'
import { ensureAuth, setUserHeader, setupLogout, showToast } from './common.js'

const state = {
  companies: [],
  sortBy: 'name',
  sortDir: 'asc',
  page: 1,
  pageSize: 10,
  currentUser: null,
  editingCompanyId: null
}

const render = (companies) => {
  const tbody = document.getElementById('companies-table')
  tbody.innerHTML = ''
  companies.forEach((company) => {
    const row = document.createElement('tr')
    row.className = 'table-row border-b'
    row.innerHTML = `
      <td class="px-4 py-3 font-medium">${company.name}</td>
      <td class="px-4 py-3 text-slate-500">${company.industry}</td>
      <td class="px-4 py-3 text-indigo-600">${company.website}</td>
      <td class="px-4 py-3">${company.phone}</td>
      <td class="px-4 py-3">${company.location}</td>
      <td class="px-4 py-3">
        <button class="edit-company text-indigo-600 text-sm font-semibold" data-id="${company.id}">Edit</button>
      </td>
    `
    row.querySelector('.edit-company').addEventListener('click', () => openCompanyModal('edit', company))
    tbody.appendChild(row)
  })
}

const renderPagination = (total) => {
  const container = document.getElementById('companies-pagination')
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize))
  state.page = Math.min(state.page, totalPages)
  container.innerHTML = `
    <div class="flex items-center gap-2">
      <span>Rows per page</span>
      <select id="page-size" class="border rounded px-2 py-1">
        ${[10, 50, 100]
          .map((size) => `<option value="${size}" ${size === state.pageSize ? 'selected' : ''}>${size}</option>`)
          .join('')}
      </select>
    </div>
    <div class="flex items-center gap-2">
      <button id="prev-page" class="px-3 py-1 border rounded" ${state.page === 1 ? 'disabled' : ''}>Prev</button>
      <span>Page ${state.page} of ${totalPages}</span>
      <button id="next-page" class="px-3 py-1 border rounded" ${state.page === totalPages ? 'disabled' : ''}>Next</button>
    </div>
  `
  container.querySelector('#page-size').addEventListener('change', (event) => {
    state.pageSize = Number(event.target.value)
    state.page = 1
    applySort()
  })
  container.querySelector('#prev-page').addEventListener('click', () => {
    state.page = Math.max(1, state.page - 1)
    applySort()
  })
  container.querySelector('#next-page').addEventListener('click', () => {
    state.page += 1
    applySort()
  })
}

const applySort = () => {
  const result = [...state.companies]
  const direction = state.sortDir === 'asc' ? 1 : -1
  result.sort((a, b) => a[state.sortBy].toString().localeCompare(b[state.sortBy].toString()) * direction)
  const total = result.length
  const start = (state.page - 1) * state.pageSize
  render(result.slice(start, start + state.pageSize))
  renderPagination(total)
}

const openCompanyModal = (mode, company = null) => {
  const modal = document.getElementById('company-modal')
  const title = document.getElementById('company-modal-title')
  const nameInput = document.getElementById('company-name')
  const industryInput = document.getElementById('company-industry')
  const websiteInput = document.getElementById('company-website')
  const phoneInput = document.getElementById('company-phone')
  const locationInput = document.getElementById('company-location')

  title.textContent = mode === 'edit' ? 'Edit Company' : 'Add Company'
  if (mode === 'edit' && company) {
    state.editingCompanyId = company.id
    nameInput.value = company.name
    industryInput.value = company.industry
    websiteInput.value = company.website
    phoneInput.value = company.phone
    locationInput.value = company.location
  } else {
    state.editingCompanyId = null
    nameInput.value = ''
    industryInput.value = ''
    websiteInput.value = ''
    phoneInput.value = ''
    locationInput.value = ''
  }

  modal.classList.remove('hidden')
  modal.classList.add('flex')
}

const closeCompanyModal = () => {
  const modal = document.getElementById('company-modal')
  modal.classList.add('hidden')
  modal.classList.remove('flex')
}

const init = async () => {
  const user = await ensureAuth()
  if (!user) return
  setUserHeader(user)
  setupLogout()
  state.currentUser = user

  state.companies = await api.getCompanies()

  document.getElementById('add-company').addEventListener('click', () => openCompanyModal('add'))
  document.getElementById('close-company-modal').addEventListener('click', closeCompanyModal)
  document.getElementById('cancel-company').addEventListener('click', closeCompanyModal)
  document.getElementById('company-modal').addEventListener('click', (event) => {
    if (event.target.id === 'company-modal') {
      closeCompanyModal()
    }
  })
  document.getElementById('company-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const payload = {
      name: document.getElementById('company-name').value.trim(),
      industry: document.getElementById('company-industry').value.trim(),
      website: document.getElementById('company-website').value.trim(),
      phone: document.getElementById('company-phone').value.trim(),
      location: document.getElementById('company-location').value.trim(),
      ownerId: state.currentUser?.id || ''
    }

    try {
      if (state.editingCompanyId) {
        const updated = await api.updateCompany(state.editingCompanyId, payload)
        state.companies = state.companies.map((item) => (item.id === updated.id ? updated : item))
        showToast('Company updated')
      } else {
        const created = await api.createCompany(payload)
        state.companies = [created, ...state.companies]
        showToast('Company added')
      }
      closeCompanyModal()
      applySort()
    } catch (error) {
      showToast(error.message || 'Failed to save company')
    }
  })

  document.querySelectorAll('th[data-sort]').forEach((header) => {
    header.addEventListener('click', () => {
      const field = header.dataset.sort
      if (state.sortBy === field) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'
      } else {
        state.sortBy = field
        state.sortDir = 'asc'
      }
      applySort()
    })
  })

  applySort()
}

init().catch((error) => console.error(error))
