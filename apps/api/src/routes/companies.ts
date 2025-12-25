import { Router } from 'express'
import { repositories } from '../data/repository.js'
import { logActivity } from '../utils/activity.js'
import type { Company } from '../types.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (_req, res) => {
  const companies = await repositories.companies.list()
  return res.json(companies)
})

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const payload = req.body as Omit<Company, 'id' | 'createdAt'>
  const company = await repositories.companies.create(payload)

  await logActivity({
    type: 'company.created',
    message: `Created company ${company.name}`,
    entityType: 'company',
    entityId: company.id,
    userId: req.user?.id ?? 'system'
  })

  return res.status(201).json(company)
})

router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  const updated = await repositories.companies.update(req.params.id, req.body)
  if (!updated) {
    return res.status(404).json({ message: 'Company not found' })
  }

  await logActivity({
    type: 'company.updated',
    message: `Updated company ${updated.name}`,
    entityType: 'company',
    entityId: req.params.id,
    userId: req.user?.id ?? 'system'
  })

  return res.json(updated)
})

router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  const removed = await repositories.companies.remove(req.params.id)
  if (!removed) {
    return res.status(404).json({ message: 'Company not found' })
  }

  await logActivity({
    type: 'company.deleted',
    message: `Deleted company ${removed.name}`,
    entityType: 'company',
    entityId: removed.id,
    userId: req.user?.id ?? 'system'
  })

  return res.status(204).send()
})

export default router
