import { api } from './api.js'
import { ensureAuth, setUserHeader, setupLogout } from './common.js'

const render = (contacts, companies) => {
  const tbody = document.getElementById('contacts-table')
  tbody.innerHTML = ''
  contacts.forEach((contact) => {
    const company = companies.find((item) => item.id === contact.companyId)
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

const init = async () => {
  const user = await ensureAuth()
  if (!user) return
  setUserHeader(user)
  setupLogout()

  const [contacts, companies] = await Promise.all([api.getContacts(), api.getCompanies()])
  render(contacts, companies)
}

init().catch((error) => console.error(error))
