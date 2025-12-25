import { api } from './api.js'
import { ensureAuth, setUserHeader, setupLogout } from './common.js'

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

const init = async () => {
  const user = await ensureAuth()
  if (!user) return
  setUserHeader(user)
  setupLogout()

  const companies = await api.getCompanies()
  render(companies)
}

init().catch((error) => console.error(error))
