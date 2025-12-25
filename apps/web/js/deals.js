import { api } from './api.js'
import { ensureAuth, setUserHeader, setupLogout, showToast } from './common.js'

const state = {
  deals: [],
  companies: [],
  view: 'table'
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

const applyFilters = () => {
  const search = document.getElementById('deal-search').value.toLowerCase()
  const stage = document.getElementById('stage-filter').value
  const sortBy = document.getElementById('sort-by').value

  let result = [...state.deals]
  if (search) {
    result = result.filter((deal) => deal.name.toLowerCase().includes(search))
  }
  if (stage) {
    result = result.filter((deal) => deal.stage === stage)
  }
  result.sort((a, b) => {
    if (sortBy === 'closeDate') {
      return new Date(a.closeDate) - new Date(b.closeDate)
    }
    return b[sortBy] - a[sortBy]
  })

  if (state.view === 'table') {
    renderTable(result)
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
  document.getElementById('sort-by').addEventListener('change', applyFilters)

  applyFilters()
}

init().catch((error) => console.error(error))
