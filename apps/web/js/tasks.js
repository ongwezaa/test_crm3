import { api } from './api.js'
import { ensureAuth, setUserHeader, setupLogout, showToast } from './common.js'

const statusOptions = ['Todo', 'Doing', 'Done']
const priorityOptions = ['Low', 'Medium', 'High']

const state = {
  tasks: [],
  sortBy: 'dueDate',
  sortDir: 'asc',
  page: 1,
  pageSize: 10,
  currentUser: null,
  editingTaskId: null
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
      <td class="px-4 py-3 font-medium">${task.title}</td>
      <td class="px-4 py-3">${task.status}</td>
      <td class="px-4 py-3">${task.priority}</td>
      <td class="px-4 py-3 ${overdue ? 'overdue' : ''}">${task.dueDate.slice(0, 10)}</td>
      <td class="px-4 py-3 text-xs text-slate-500">${task.assignedTo.slice(0, 6).toUpperCase()}</td>
      <td class="px-4 py-3">
        <button class="edit-task text-indigo-600 text-sm font-semibold" data-id="${task.id}">Edit</button>
      </td>
    `
    row.querySelector('.edit-task').addEventListener('click', () => openTaskModal('edit', task))

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

const populateTaskModal = () => {
  const statusSelect = document.getElementById('task-status')
  const prioritySelect = document.getElementById('task-priority')
  statusSelect.innerHTML = statusOptions.map((status) => `<option value="${status}">${status}</option>`).join('')
  prioritySelect.innerHTML = priorityOptions.map((priority) => `<option value="${priority}">${priority}</option>`).join('')
}

const openTaskModal = (mode, task = null) => {
  const modal = document.getElementById('task-modal')
  const title = document.getElementById('task-modal-title')
  const titleInput = document.getElementById('task-title')
  const statusSelect = document.getElementById('task-status')
  const prioritySelect = document.getElementById('task-priority')
  const dueDateInput = document.getElementById('task-due-date')

  title.textContent = mode === 'edit' ? 'Edit Task' : 'Add Task'
  if (mode === 'edit' && task) {
    state.editingTaskId = task.id
    titleInput.value = task.title
    statusSelect.value = task.status
    prioritySelect.value = task.priority
    dueDateInput.value = task.dueDate.slice(0, 10)
  } else {
    state.editingTaskId = null
    titleInput.value = ''
    statusSelect.value = statusOptions[0]
    prioritySelect.value = priorityOptions[1]
    dueDateInput.value = new Date().toISOString().slice(0, 10)
  }

  modal.classList.remove('hidden')
  modal.classList.add('flex')
}

const closeTaskModal = () => {
  const modal = document.getElementById('task-modal')
  modal.classList.add('hidden')
  modal.classList.remove('flex')
}

const init = async () => {
  const user = await ensureAuth()
  if (!user) return
  setUserHeader(user)
  setupLogout()
  state.currentUser = user

  state.tasks = await api.getTasks()
  populateTaskModal()

  document.getElementById('add-task').addEventListener('click', () => openTaskModal('add'))
  document.getElementById('close-task-modal').addEventListener('click', closeTaskModal)
  document.getElementById('cancel-task').addEventListener('click', closeTaskModal)
  document.getElementById('task-modal').addEventListener('click', (event) => {
    if (event.target.id === 'task-modal') {
      closeTaskModal()
    }
  })
  document.getElementById('task-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const payload = {
      title: document.getElementById('task-title').value.trim(),
      status: document.getElementById('task-status').value,
      priority: document.getElementById('task-priority').value,
      dueDate: document.getElementById('task-due-date').value,
      assignedTo: state.currentUser?.id || ''
    }

    try {
      if (state.editingTaskId) {
        const updated = await api.updateTask(state.editingTaskId, payload)
        state.tasks = state.tasks.map((item) => (item.id === updated.id ? updated : item))
        showToast('Task updated')
      } else {
        const created = await api.createTask(payload)
        state.tasks = [created, ...state.tasks]
        showToast('Task added')
      }
      closeTaskModal()
      applySort()
    } catch (error) {
      showToast(error.message || 'Failed to save task')
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
