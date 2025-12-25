import { api } from './api.js'
import { ensureAuth, setUserHeader, setupLogout } from './common.js'

const state = {
  companies: [],
  sortBy: 'name',
  sortDir: 'asc',
  page: 1,
  pageSize: 10
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
    `
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

const init = async () => {
  const user = await ensureAuth()
  if (!user) return
  setUserHeader(user)
  setupLogout()

  state.companies = await api.getCompanies()

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
