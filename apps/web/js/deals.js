import { api } from './api.js'
import { ensureAuth, setUserHeader, setupLogout, showToast } from './common.js'

const state = {
  deals: [],
  companies: [],
  view: 'table',
  sortBy: 'amount',
  sortDir: 'desc',
  page: 1,
  pageSize: 10
}

const stages = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']

const getCompanyName = (id) => state.companies.find((company) => company.id === id)?.name || 'Unknown'

const formatMoney = (value) => `$${Number(value).toLocaleString()}`

const renderTable = (deals) => {
  const tbody = document.getElementById('deals-table')
  tbody.innerHTML = ''
  deals.forEach((deal) => {
    const row = document.createElement('tr')
    row.className = 'table-row border-b'
    row.innerHTML = `
      <td class="px-4 py-3 font-medium" contenteditable data-field="name">${deal.name}</td>
      <td class="px-4 py-3">${getCompanyName(deal.companyId)}</td>
      <td class="px-4 py-3">
        <select class="border rounded px-2 py-1 text-sm" data-field="stage">
          ${stages
            .map((stage) => `<option value="${stage}" ${stage === deal.stage ? 'selected' : ''}>${stage}</option>`)
            .join('')}
        </select>
      </td>
      <td class="px-4 py-3" contenteditable data-field="amount">${deal.amount}</td>
      <td class="px-4 py-3" contenteditable data-field="probability">${deal.probability}</td>
      <td class="px-4 py-3 text-xs text-slate-500">${deal.ownerId.slice(0, 6).toUpperCase()}</td>
      <td class="px-4 py-3" contenteditable data-field="closeDate">${deal.closeDate.slice(0, 10)}</td>
    `

    row.querySelectorAll('[contenteditable]').forEach((cell) => {
      cell.addEventListener('blur', async (event) => {
        const field = event.target.dataset.field
        const value = event.target.textContent.trim()
        await saveDealUpdate(deal, { [field]: field === 'amount' || field === 'probability' ? Number(value) : value })
      })
    })

    row.querySelector('select[data-field="stage"]').addEventListener('change', async (event) => {
      const stage = event.target.value
      await saveStageUpdate(deal, stage)
    })

    tbody.appendChild(row)
  })
}

const renderPipeline = (deals) => {
  const board = document.getElementById('pipeline-board')
  board.innerHTML = ''
  stages.forEach((stage, index) => {
    const column = document.createElement('div')
    column.className = 'pipeline-column'
    column.innerHTML = `
      <div class="card p-3">
        <div class="font-semibold text-slate-700 mb-3">${stage}</div>
        <div class="space-y-3" data-stage="${stage}"></div>
      </div>
    `
    const container = column.querySelector(`[data-stage="${stage}"]`)
    deals.filter((deal) => deal.stage === stage).forEach((deal) => {
      const card = document.createElement('div')
      card.className = 'pipeline-card'
      card.innerHTML = `
        <div class="font-semibold text-sm">${deal.name}</div>
        <div class="text-xs text-slate-500">${getCompanyName(deal.companyId)}</div>
        <div class="text-sm font-semibold text-indigo-600 mt-2">${formatMoney(deal.amount)}</div>
        <div class="flex gap-2 mt-2">
          ${index > 0 ? '<button class="text-xs px-2 py-1 border rounded" data-dir="prev">Back</button>' : ''}
          ${index < stages.length - 1 ? '<button class="text-xs px-2 py-1 border rounded" data-dir="next">Forward</button>' : ''}
        </div>
      `
      card.querySelectorAll('button').forEach((button) => {
        button.addEventListener('click', async () => {
          const direction = button.dataset.dir
          const nextStage = stages[index + (direction === 'next' ? 1 : -1)]
          await saveStageUpdate(deal, nextStage)
        })
      })
      container.appendChild(card)
    })
    board.appendChild(column)
  })
}

const renderPagination = (total) => {
  const container = document.getElementById('deals-pagination')
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
    applyFilters()
  })
  container.querySelector('#prev-page').addEventListener('click', () => {
    state.page = Math.max(1, state.page - 1)
    applyFilters()
  })
  container.querySelector('#next-page').addEventListener('click', () => {
    state.page += 1
    applyFilters()
  })
}

const applyFilters = () => {
  const search = document.getElementById('deal-search').value.toLowerCase()
  const stage = document.getElementById('stage-filter').value
  const sortBySelect = document.getElementById('sort-by')
  const sortBy = state.sortBy || sortBySelect.value
  sortBySelect.value = sortBy

  let result = [...state.deals]
  if (search) {
    result = result.filter((deal) => deal.name.toLowerCase().includes(search))
  }
  if (stage) {
    result = result.filter((deal) => deal.stage === stage)
  }
  const direction = state.sortDir === 'asc' ? 1 : -1
  result.sort((a, b) => {
    const valueA = sortBy === 'company' ? getCompanyName(a.companyId) : sortBy === 'owner' ? a.ownerId : a[sortBy]
    const valueB = sortBy === 'company' ? getCompanyName(b.companyId) : sortBy === 'owner' ? b.ownerId : b[sortBy]
    if (sortBy === 'closeDate') {
      return (new Date(valueA) - new Date(valueB)) * direction
    }
    if (typeof valueA === 'number') {
      return (valueA - valueB) * direction
    }
    return valueA.toString().localeCompare(valueB.toString()) * direction
  })

  if (state.view === 'table') {
    const total = result.length
    const start = (state.page - 1) * state.pageSize
    const paged = result.slice(start, start + state.pageSize)
    renderTable(paged)
    renderPagination(total)
  } else {
    renderPipeline(result)
  }
}

const saveDealUpdate = async (deal, payload) => {
  try {
    const updated = await api.updateDeal(deal.id, { ...deal, ...payload })
    state.deals = state.deals.map((item) => (item.id === deal.id ? updated : item))
    showToast('Deal updated')
  } catch (error) {
    showToast(error.message || 'Failed to update deal')
  }
}

const saveStageUpdate = async (deal, stage) => {
  try {
    const updated = await api.updateDealStage(deal.id, stage)
    state.deals = state.deals.map((item) => (item.id === deal.id ? updated : item))
    showToast(`Moved to ${stage}`)
    applyFilters()
  } catch (error) {
    showToast(error.message || 'Failed to update stage')
  }
}

const init = async () => {
  const user = await ensureAuth()
  if (!user) return
  setUserHeader(user)
  setupLogout()

  const [deals, companies] = await Promise.all([api.getDeals(), api.getCompanies()])
  state.deals = deals
  state.companies = companies

  document.getElementById('table-view').addEventListener('click', () => {
    state.view = 'table'
    document.getElementById('table-container').classList.remove('hidden')
    document.getElementById('pipeline-container').classList.add('hidden')
    applyFilters()
  })

  document.getElementById('pipeline-view').addEventListener('click', () => {
    state.view = 'pipeline'
    document.getElementById('table-container').classList.add('hidden')
    document.getElementById('pipeline-container').classList.remove('hidden')
    applyFilters()
  })

  document.getElementById('deal-search').addEventListener('input', applyFilters)
  document.getElementById('stage-filter').addEventListener('change', applyFilters)
  document.getElementById('sort-by').addEventListener('change', (event) => {
    state.sortBy = event.target.value
    state.sortDir = 'desc'
    applyFilters()
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
      applyFilters()
    })
  })

  applyFilters()
}

init().catch((error) => console.error(error))
