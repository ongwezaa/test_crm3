import { api } from './api.js'
import { ensureAuth, setUserHeader, setupLogout, showToast } from './common.js'

const state = {
  deals: [],
  companies: [],
  view: 'table',
  sortBy: 'amount',
  sortDir: 'desc',
  page: 1,
  pageSize: 10,
  currentUser: null,
  editingDealId: null
}

const stages = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']
const soonThresholdDays = 14

const getCompanyName = (id) => state.companies.find((company) => company.id === id)?.name || 'Unknown'

const formatMoney = (value) => `$${Number(value).toLocaleString()}`

const formatPercent = (value) => `${Math.round(value)}%`

const getProbabilityColor = (value) => {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0))
  const lightness = 75 - clamped * 0.3
  return `hsl(210, 85%, ${lightness}%)`
}

const daysUntil = (dateString) => {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return null
  const diffMs = date.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

const renderInsights = () => {
  const totalValue = state.deals.reduce((sum, deal) => sum + Number(deal.amount || 0), 0)
  const weightedForecast = state.deals.reduce(
    (sum, deal) => sum + Number(deal.amount || 0) * (Number(deal.probability || 0) / 100),
    0
  )
  const closedDeals = state.deals.filter((deal) => ['Won', 'Lost'].includes(deal.stage))
  const wonDeals = closedDeals.filter((deal) => deal.stage === 'Won')
  const winRate = closedDeals.length ? (wonDeals.length / closedDeals.length) * 100 : 0
  const closingSoon = state.deals.filter((deal) => {
    const days = daysUntil(deal.closeDate)
    return days !== null && days <= soonThresholdDays && days >= 0
  }).length

  document.getElementById('metric-total').textContent = formatMoney(totalValue)
  document.getElementById('metric-forecast').textContent = formatMoney(weightedForecast.toFixed(0))
  document.getElementById('metric-winrate').textContent = formatPercent(winRate)
  document.getElementById('metric-soon').textContent = closingSoon.toString()

  const stageBars = document.getElementById('stage-bars')
  stageBars.innerHTML = ''
  const totalDeals = Math.max(1, state.deals.length)
  stages.forEach((stage) => {
    const count = state.deals.filter((deal) => deal.stage === stage).length
    const percentage = Math.round((count / totalDeals) * 100)
    const bar = document.createElement('div')
    bar.innerHTML = `
      <div class="flex items-center justify-between text-xs text-slate-500">
        <span>${stage}</span>
        <span>${count} • ${percentage}%</span>
      </div>
      <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div class="h-2 rounded-full bg-indigo-500" style="width:${percentage}%"></div>
      </div>
    `
    stageBars.appendChild(bar)
  })

  const aiContainer = document.getElementById('ai-recommendations')
  aiContainer.innerHTML = ''
  const needsAttention = state.deals
    .filter((deal) => deal.stage !== 'Won' && deal.stage !== 'Lost')
    .map((deal) => ({
      ...deal,
      urgency: (daysUntil(deal.closeDate) ?? 999) - Number(deal.probability || 0) / 10
    }))
    .sort((a, b) => a.urgency - b.urgency)
    .slice(0, 4)

  if (!needsAttention.length) {
    aiContainer.innerHTML = '<p class="text-sm text-slate-500">No open deals need attention right now.</p>'
    return
  }

  needsAttention.forEach((deal) => {
    const days = daysUntil(deal.closeDate)
    const line = document.createElement('label')
    line.className = 'flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3'
    line.innerHTML = `
      <input type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600" />
      <div>
        <p class="font-semibold text-slate-700">${deal.name}</p>
        <p class="text-xs text-slate-500">
          ${getCompanyName(deal.companyId)} • ${deal.stage} • ${formatMoney(deal.amount)}
          ${days !== null ? `• closes in ${days}d` : ''}
        </p>
        <p class="text-xs text-indigo-600 mt-1">Suggested: send follow-up + update probability</p>
      </div>
    `
    aiContainer.appendChild(line)
  })
}

const renderTable = (deals) => {
  const tbody = document.getElementById('deals-table')
  tbody.innerHTML = ''
  deals.forEach((deal) => {
    const row = document.createElement('tr')
    row.className = 'table-row border-b'
    row.innerHTML = `
      <td class="px-4 py-3 font-medium">${deal.name}</td>
      <td class="px-4 py-3">${getCompanyName(deal.companyId)}</td>
      <td class="stage-cell">
        <div class="cell-fill stage-fill stage-fill-${deal.stage.toLowerCase()}">${deal.stage}</div>
      </td>
      <td class="px-4 py-3">${deal.amount}</td>
      <td class="probability-cell">
        <div class="cell-fill probability-fill" style="background:${getProbabilityColor(deal.probability)}">
          ${formatPercent(deal.probability)}
        </div>
      </td>
      <td class="px-4 py-3 text-xs text-slate-500">${deal.ownerId.slice(0, 6).toUpperCase()}</td>
      <td class="px-4 py-3">${deal.closeDate.slice(0, 10)}</td>
      <td class="px-4 py-3">
        <button class="edit-deal text-indigo-600 text-sm font-semibold" data-id="${deal.id}">
          Edit
        </button>
      </td>
    `
    row.querySelector('.edit-deal').addEventListener('click', () => openDealModal('edit', deal))

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
        <div class="pipeline-stage stage-fill-${stage.toLowerCase()} mb-3">${stage}</div>
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
        <div class="flex flex-wrap gap-2 mt-2">
          ${index > 0 ? '<button class="text-xs px-2 py-1 border rounded" data-dir="prev">Back</button>' : ''}
          ${index < stages.length - 1 ? '<button class="text-xs px-2 py-1 border rounded" data-dir="next">Forward</button>' : ''}
          <button class="text-xs px-2 py-1 border rounded text-indigo-600" data-edit="edit">Edit</button>
        </div>
      `
      card.querySelectorAll('button').forEach((button) => {
        if (button.dataset.edit) {
          button.addEventListener('click', () => openDealModal('edit', deal))
          return
        }
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

  renderInsights()
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

const openDealModal = (mode, deal = null) => {
  const modal = document.getElementById('deal-modal')
  const title = document.getElementById('deal-modal-title')
  const nameInput = document.getElementById('deal-name')
  const companySelect = document.getElementById('deal-company')
  const stageSelect = document.getElementById('deal-stage')
  const amountInput = document.getElementById('deal-amount')
  const probabilityInput = document.getElementById('deal-probability')
  const closeDateInput = document.getElementById('deal-close-date')

  title.textContent = mode === 'edit' ? 'Edit Deal' : 'Add Deal'
  if (mode === 'edit' && deal) {
    state.editingDealId = deal.id
    nameInput.value = deal.name
    companySelect.value = deal.companyId
    stageSelect.value = deal.stage
    amountInput.value = deal.amount
    probabilityInput.value = deal.probability
    closeDateInput.value = deal.closeDate.slice(0, 10)
  } else {
    state.editingDealId = null
    nameInput.value = ''
    companySelect.value = state.companies[0]?.id || ''
    stageSelect.value = stages[0]
    amountInput.value = ''
    probabilityInput.value = '50'
    closeDateInput.value = new Date().toISOString().slice(0, 10)
  }

  modal.classList.remove('hidden')
  modal.classList.add('flex')
}

const closeDealModal = () => {
  const modal = document.getElementById('deal-modal')
  modal.classList.add('hidden')
  modal.classList.remove('flex')
}

const populateDealModal = () => {
  const companySelect = document.getElementById('deal-company')
  const stageSelect = document.getElementById('deal-stage')
  companySelect.innerHTML = state.companies
    .map((company) => `<option value="${company.id}">${company.name}</option>`)
    .join('')
  stageSelect.innerHTML = stages.map((stage) => `<option value="${stage}">${stage}</option>`).join('')
}

const init = async () => {
  const user = await ensureAuth()
  if (!user) return
  setUserHeader(user)
  setupLogout()
  state.currentUser = user

  const [deals, companies] = await Promise.all([api.getDeals(), api.getCompanies()])
  state.deals = deals
  state.companies = companies
  populateDealModal()

  const tableButton = document.getElementById('table-view')
  const pipelineButton = document.getElementById('pipeline-view')

  const updateViewButtons = () => {
    const activeClasses = ['bg-indigo-600', 'text-white', 'border-transparent']
    const inactiveClasses = ['bg-white', 'text-slate-700', 'border-slate-200']
    const setActive = (button, isActive) => {
      activeClasses.forEach((className) => button.classList.toggle(className, isActive))
      inactiveClasses.forEach((className) => button.classList.toggle(className, !isActive))
    }
    setActive(tableButton, state.view === 'table')
    setActive(pipelineButton, state.view === 'pipeline')
  }

  const setView = (view) => {
    state.view = view
    document.getElementById('table-container').classList.toggle('hidden', view !== 'table')
    document.getElementById('pipeline-container').classList.toggle('hidden', view !== 'pipeline')
    updateViewButtons()
    applyFilters()
  }

  tableButton.addEventListener('click', () => setView('table'))
  pipelineButton.addEventListener('click', () => setView('pipeline'))

  document.getElementById('deal-search').addEventListener('input', applyFilters)
  document.getElementById('stage-filter').addEventListener('change', applyFilters)
  document.getElementById('sort-by').addEventListener('change', (event) => {
    state.sortBy = event.target.value
    state.sortDir = 'desc'
    applyFilters()
  })

  document.getElementById('add-deal').addEventListener('click', () => openDealModal('add'))
  document.getElementById('close-deal-modal').addEventListener('click', closeDealModal)
  document.getElementById('cancel-deal').addEventListener('click', closeDealModal)
  document.getElementById('deal-modal').addEventListener('click', (event) => {
    if (event.target.id === 'deal-modal') {
      closeDealModal()
    }
  })
  document.getElementById('deal-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const payload = {
      name: document.getElementById('deal-name').value.trim(),
      companyId: document.getElementById('deal-company').value,
      stage: document.getElementById('deal-stage').value,
      amount: Number(document.getElementById('deal-amount').value),
      probability: Number(document.getElementById('deal-probability').value),
      closeDate: document.getElementById('deal-close-date').value,
      ownerId: state.currentUser?.id || ''
    }

    try {
      if (state.editingDealId) {
        const updated = await api.updateDeal(state.editingDealId, payload)
        state.deals = state.deals.map((item) => (item.id === updated.id ? updated : item))
        showToast('Deal updated')
      } else {
        const created = await api.createDeal(payload)
        state.deals = [created, ...state.deals]
        showToast('Deal added')
      }
      closeDealModal()
      applyFilters()
    } catch (error) {
      showToast(error.message || 'Failed to save deal')
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
      applyFilters()
    })
  })

  updateViewButtons()
  applyFilters()
}

init().catch((error) => console.error(error))
