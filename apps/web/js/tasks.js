import { api } from './api.js'
import { ensureAuth, setUserHeader, setupLogout, showToast } from './common.js'

const statusOptions = ['Todo', 'Doing', 'Done']
const priorityOptions = ['Low', 'Medium', 'High']

const state = {
  tasks: [],
  sortBy: 'dueDate',
  sortDir: 'asc',
  page: 1,
  pageSize: 10
}

const render = (tasks) => {
  const tbody = document.getElementById('tasks-table')
  tbody.innerHTML = ''
  const today = new Date()

  tasks.forEach((task) => {
    const row = document.createElement('tr')
    row.className = 'table-row border-b'
    const dueDate = new Date(task.dueDate)
    const overdue = dueDate < today && task.status !== 'Done'
    row.innerHTML = `
      <td class="px-4 py-3 font-medium" contenteditable data-field="title">${task.title}</td>
      <td class="px-4 py-3">
        <select class="border rounded px-2 py-1 text-sm" data-field="status">
          ${statusOptions
            .map((status) => `<option value="${status}" ${status === task.status ? 'selected' : ''}>${status}</option>`)
            .join('')}
        </select>
      </td>
      <td class="px-4 py-3">
        <select class="border rounded px-2 py-1 text-sm" data-field="priority">
          ${priorityOptions
            .map((priority) => `<option value="${priority}" ${priority === task.priority ? 'selected' : ''}>${priority}</option>`)
            .join('')}
        </select>
      </td>
      <td class="px-4 py-3 ${overdue ? 'overdue' : ''}" contenteditable data-field="dueDate">${task.dueDate.slice(0, 10)}</td>
      <td class="px-4 py-3 text-xs text-slate-500">${task.assignedTo.slice(0, 6).toUpperCase()}</td>
    `

    row.querySelectorAll('[contenteditable]').forEach((cell) => {
      cell.addEventListener('blur', async (event) => {
        const field = event.target.dataset.field
        const value = event.target.textContent.trim()
        await saveTaskUpdate(task, { [field]: value })
      })
    })

    row.querySelectorAll('select').forEach((select) => {
      select.addEventListener('change', async (event) => {
        const field = event.target.dataset.field
        await saveTaskUpdate(task, { [field]: event.target.value })
      })
    })

    tbody.appendChild(row)
  })
}

const renderPagination = (total) => {
  const container = document.getElementById('tasks-pagination')
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
  const result = [...state.tasks]
  const direction = state.sortDir === 'asc' ? 1 : -1
  result.sort((a, b) => {
    const valueA = a[state.sortBy]
    const valueB = b[state.sortBy]
    if (state.sortBy === 'dueDate') {
      return (new Date(valueA) - new Date(valueB)) * direction
    }
    return valueA.toString().localeCompare(valueB.toString()) * direction
  })
  const total = result.length
  const start = (state.page - 1) * state.pageSize
  render(result.slice(start, start + state.pageSize))
  renderPagination(total)
}

const saveTaskUpdate = async (task, payload) => {
  try {
    const updated = await api.updateTask(task.id, { ...task, ...payload })
    task = updated
    showToast('Task updated')
  } catch (error) {
    showToast(error.message || 'Failed to update task')
  }
}

const init = async () => {
  const user = await ensureAuth()
  if (!user) return
  setUserHeader(user)
  setupLogout()

  state.tasks = await api.getTasks()

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
