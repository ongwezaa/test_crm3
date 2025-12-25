import { api } from './api.js'
import { ensureAuth, setUserHeader, setupLogout, showToast } from './common.js'

const statusOptions = ['Todo', 'Doing', 'Done']
const priorityOptions = ['Low', 'Medium', 'High']

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

  const tasks = await api.getTasks()
  render(tasks)
}

init().catch((error) => console.error(error))
