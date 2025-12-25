import { api } from './api.js'
import { ensureAuth, setUserHeader, setupLogout } from './common.js'

const kpiConfig = [
  { key: 'companies', label: 'Total Companies', icon: 'fa-building' },
  { key: 'contacts', label: 'Total Contacts', icon: 'fa-address-book' },
  { key: 'openDeals', label: 'Open Deals', icon: 'fa-briefcase' },
  { key: 'pipelineValue', label: 'Pipeline Value', icon: 'fa-chart-line', formatter: (value) => `$${value.toLocaleString()}` },
  { key: 'tasksDueToday', label: 'Tasks Due Today', icon: 'fa-calendar-day' },
  { key: 'overdueTasks', label: 'Overdue Tasks', icon: 'fa-triangle-exclamation' }
]

const renderKpis = (summary) => {
  const container = document.getElementById('kpi-cards')
  container.innerHTML = ''
  kpiConfig.forEach((item) => {
    const card = document.createElement('div')
    card.className = 'card p-4 flex items-center justify-between'
    const value = item.formatter ? item.formatter(summary[item.key]) : summary[item.key]
    card.innerHTML = `
      <div>
        <div class="text-sm text-slate-500">${item.label}</div>
        <div class="text-2xl font-semibold text-slate-800">${value}</div>
      </div>
      <div class="text-indigo-500 text-2xl">
        <i class="fa-solid ${item.icon}"></i>
      </div>
    `
    container.appendChild(card)
  })
}

const initCharts = (charts) => {
  const stageCtx = document.getElementById('chart-deals-stage')
  new Chart(stageCtx, {
    type: 'bar',
    data: {
      labels: charts.dealsByStage.map((item) => item.stage),
      datasets: [
        {
          label: 'Deals',
          data: charts.dealsByStage.map((item) => item.count),
          backgroundColor: '#c7d2fe'
        }
      ]
    },
    options: { responsive: true }
  })

  const pipelineCtx = document.getElementById('chart-pipeline')
  new Chart(pipelineCtx, {
    type: 'line',
    data: {
      labels: charts.pipelineSeries.map((item) => item.date),
      datasets: [
        {
          label: 'Pipeline',
          data: charts.pipelineSeries.map((item) => item.value),
          borderColor: '#93c5fd',
          backgroundColor: 'rgba(147, 197, 253, 0.35)',
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: { responsive: true }
  })

  const wonLostCtx = document.getElementById('chart-won-lost')
  new Chart(wonLostCtx, {
    type: 'pie',
    data: {
      labels: ['Won', 'Lost'],
      datasets: [
        {
          data: [charts.dealsWonLost.won, charts.dealsWonLost.lost],
          backgroundColor: ['#bbf7d0', '#fecaca']
        }
      ]
    }
  })

  const tasksCtx = document.getElementById('chart-tasks')
  new Chart(tasksCtx, {
    type: 'doughnut',
    data: {
      labels: charts.tasksByStatus.map((item) => item.status),
      datasets: [
        {
          data: charts.tasksByStatus.map((item) => item.count),
          backgroundColor: ['#fed7aa', '#bae6fd', '#bbf7d0']
        }
      ]
    }
  })

  const contactsCtx = document.getElementById('chart-contacts')
  new Chart(contactsCtx, {
    type: 'line',
    data: {
      labels: charts.contactsPerWeek.map((item) => item.week),
      datasets: [
        {
          label: 'Contacts',
          data: charts.contactsPerWeek.map((item) => item.count),
          borderColor: '#a5b4fc',
          backgroundColor: 'rgba(165, 180, 252, 0.35)',
          fill: true,
          tension: 0.4
        }
      ]
    }
  })
}

const renderActivities = (activities) => {
  const list = document.getElementById('activity-feed')
  list.innerHTML = ''
  activities.slice(0, 5).forEach((activity) => {
    const item = document.createElement('li')
    item.className = 'flex items-center justify-between border-b border-slate-100 pb-2'
    item.innerHTML = `
      <div>
        <div class="font-medium">${activity.message}</div>
        <div class="text-xs text-slate-400">${new Date(activity.createdAt).toLocaleString()}</div>
      </div>
      <span class="text-xs text-indigo-500 font-semibold">${activity.type}</span>
    `
    list.appendChild(item)
  })
}

const init = async () => {
  const user = await ensureAuth()
  if (!user) return
  setUserHeader(user)
  setupLogout()

  const [summary, charts, activities] = await Promise.all([
    api.getDashboardSummary(),
    api.getDashboardCharts(),
    api.getRecentActivities()
  ])

  renderKpis(summary)
  initCharts(charts)
  renderActivities(activities)
}

init().catch((error) => console.error(error))
