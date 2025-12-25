import { api } from './api.js'
import { ensureAuth, setUserHeader, setupLogout } from './common.js'

const state = {
  contacts: [],
  companies: [],
  sortBy: 'name',
  sortDir: 'asc',
  page: 1,
  pageSize: 10
}

const render = (contacts) => {
  const tbody = document.getElementById('contacts-table')
  tbody.innerHTML = ''
  contacts.forEach((contact) => {
    const company = state.companies.find((item) => item.id === contact.companyId)
    const row = document.createElement('tr')
    row.className = 'table-row border-b'
    row.innerHTML = `
      <td class="px-4 py-3 font-medium">${contact.name}</td>
      <td class="px-4 py-3">${company?.name || 'Unknown'}</td>
      <td class="px-4 py-3 text-slate-500">${contact.title}</td>
      <td class="px-4 py-3 text-indigo-600">${contact.email}</td>
      <td class="px-4 py-3">${contact.phone}</td>
    `
    tbody.appendChild(row)
  })
}

const renderPagination = (total) => {
  const container = document.getElementById('contacts-pagination')
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
  const result = [...state.contacts]
  const direction = state.sortDir === 'asc' ? 1 : -1
  result.sort((a, b) => {
    const valueA = state.sortBy === 'company' ? getCompanyName(a.companyId) : a[state.sortBy]
    const valueB = state.sortBy === 'company' ? getCompanyName(b.companyId) : b[state.sortBy]
    return valueA.toString().localeCompare(valueB.toString()) * direction
  })
  const total = result.length
  const start = (state.page - 1) * state.pageSize
  render(result.slice(start, start + state.pageSize))
  renderPagination(total)
}

const getCompanyName = (id) => state.companies.find((item) => item.id === id)?.name || 'Unknown'

const init = async () => {
  const user = await ensureAuth()
  if (!user) return
  setUserHeader(user)
  setupLogout()

  const [contacts, companies] = await Promise.all([api.getContacts(), api.getCompanies()])
  state.contacts = contacts
  state.companies = companies

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
