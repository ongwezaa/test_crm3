import { Router } from 'express'
import { repositories } from '../data/repository.js'
import { requireAuth } from '../middleware/auth.js'
import type { DealStage } from '../types.js'

const router = Router()

const stages: DealStage[] = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

router.get('/summary', requireAuth, async (_req, res) => {
  const companies = await repositories.companies.list()
  const contacts = await repositories.contacts.list()
  const deals = await repositories.deals.list()
  const tasks = await repositories.tasks.list()
  const today = new Date()
  const openDeals = deals.filter((deal) => !['Won', 'Lost'].includes(deal.stage)).length
  const pipelineValue = deals
    .filter((deal) => !['Lost'].includes(deal.stage))
    .reduce((sum, deal) => sum + deal.amount, 0)
  const tasksDueToday = tasks.filter((task) =>
    isSameDay(new Date(task.dueDate), today)
  ).length
  const overdueTasks = tasks.filter((task) =>
    new Date(task.dueDate) < today && task.status !== 'Done'
  ).length

  return res.json({
    companies: companies.length,
    contacts: contacts.length,
    openDeals,
    pipelineValue,
    tasksDueToday,
    overdueTasks
  })
})

router.get('/charts', requireAuth, async (_req, res) => {
  const deals = await repositories.deals.list()
  const tasks = await repositories.tasks.list()
  const contacts = await repositories.contacts.list()
  const now = new Date()

  const dealsByStage = stages.map((stage) => ({
    stage,
    count: deals.filter((deal) => deal.stage === stage).length
  }))

  const pipelineSeries = Array.from({ length: 30 }).map((_, index) => {
    const day = new Date(now)
    day.setDate(now.getDate() - (29 - index))
    const total = deals
      .filter((deal) => new Date(deal.createdAt) <= day && !['Lost'].includes(deal.stage))
      .reduce((sum, deal) => sum + deal.amount, 0)
    return { date: day.toISOString().slice(0, 10), value: total }
  })

  const dealsWonLost = {
    won: deals.filter((deal) => deal.stage === 'Won').length,
    lost: deals.filter((deal) => deal.stage === 'Lost').length
  }

  const tasksByStatus = ['Todo', 'Doing', 'Done'].map((status) => ({
    status,
    count: tasks.filter((task) => task.status === status).length
  }))

  const contactsPerWeek = Array.from({ length: 8 }).map((_, index) => {
    const start = new Date(now)
    start.setDate(now.getDate() - (7 * (7 - index)))
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    const count = contacts.filter((contact) => {
      const created = new Date(contact.createdAt)
      return created >= start && created <= end
    }).length
    return {
      week: `${start.toISOString().slice(5, 10)}`,
      count
    }
  })

  return res.json({ dealsByStage, pipelineSeries, dealsWonLost, tasksByStatus, contactsPerWeek })
})

export default router
