import { api } from './api.js'
import { ensureAuth, setUserHeader, setupLogout, showToast } from './common.js'

const state = {
  contacts: [],
  companies: [],
  sortBy: 'name',
  sortDir: 'asc',
  page: 1,
  pageSize: 10,
  currentUser: null,
  editingContactId: null
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
      <td class="px-4 py-3">
        <button class="edit-contact text-indigo-600 text-sm font-semibold" data-id="${contact.id}">Edit</button>
      </td>
    `
    row.querySelector('.edit-contact').addEventListener('click', () => openContactModal('edit', contact))
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

const populateContactModal = () => {
  const companySelect = document.getElementById('contact-company')
  companySelect.innerHTML = state.companies
    .map((company) => `<option value="${company.id}">${company.name}</option>`)
    .join('')
}

const openContactModal = (mode, contact = null) => {
  const modal = document.getElementById('contact-modal')
  const title = document.getElementById('contact-modal-title')
  const nameInput = document.getElementById('contact-name')
  const companySelect = document.getElementById('contact-company')
  const titleInput = document.getElementById('contact-title')
  const emailInput = document.getElementById('contact-email')
  const phoneInput = document.getElementById('contact-phone')

  title.textContent = mode === 'edit' ? 'Edit Contact' : 'Add Contact'
  if (mode === 'edit' && contact) {
    state.editingContactId = contact.id
    nameInput.value = contact.name
    companySelect.value = contact.companyId
    titleInput.value = contact.title
    emailInput.value = contact.email
    phoneInput.value = contact.phone
  } else {
    state.editingContactId = null
    nameInput.value = ''
    companySelect.value = state.companies[0]?.id || ''
    titleInput.value = ''
    emailInput.value = ''
    phoneInput.value = ''
  }

  modal.classList.remove('hidden')
  modal.classList.add('flex')
}

const closeContactModal = () => {
  const modal = document.getElementById('contact-modal')
  modal.classList.add('hidden')
  modal.classList.remove('flex')
}

const init = async () => {
  const user = await ensureAuth()
  if (!user) return
  setUserHeader(user)
  setupLogout()
  state.currentUser = user

  const [contacts, companies] = await Promise.all([api.getContacts(), api.getCompanies()])
  state.contacts = contacts
  state.companies = companies
  populateContactModal()

  document.getElementById('add-contact').addEventListener('click', () => openContactModal('add'))
  document.getElementById('close-contact-modal').addEventListener('click', closeContactModal)
  document.getElementById('cancel-contact').addEventListener('click', closeContactModal)
  document.getElementById('contact-modal').addEventListener('click', (event) => {
    if (event.target.id === 'contact-modal') {
      closeContactModal()
    }
  })
  document.getElementById('contact-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const payload = {
      name: document.getElementById('contact-name').value.trim(),
      companyId: document.getElementById('contact-company').value,
      title: document.getElementById('contact-title').value.trim(),
      email: document.getElementById('contact-email').value.trim(),
      phone: document.getElementById('contact-phone').value.trim(),
      ownerId: state.currentUser?.id || ''
    }

    try {
      if (state.editingContactId) {
        const updated = await api.updateContact(state.editingContactId, payload)
        state.contacts = state.contacts.map((item) => (item.id === updated.id ? updated : item))
        showToast('Contact updated')
      } else {
        const created = await api.createContact(payload)
        state.contacts = [created, ...state.contacts]
        showToast('Contact added')
      }
      closeContactModal()
      applySort()
    } catch (error) {
      showToast(error.message || 'Failed to save contact')
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
