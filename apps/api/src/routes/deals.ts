import { Router } from 'express'
import { repositories } from '../data/repository.js'
import { logActivity } from '../utils/activity.js'
import type { Deal, DealStage } from '../types.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (_req, res) => {
  const deals = await repositories.deals.list()
  return res.json(deals)
})

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const payload = req.body as Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>
  const deal = await repositories.deals.create(payload)

  await logActivity({
    type: 'deal.created',
    message: `Created deal ${deal.name}`,
    entityType: 'deal',
    entityId: deal.id,
    userId: req.user?.id ?? 'system'
  })

  return res.status(201).json(deal)
})

router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  const updated = await repositories.deals.update(req.params.id, req.body)
  if (!updated) {
    return res.status(404).json({ message: 'Deal not found' })
  }

  await logActivity({
    type: 'deal.updated',
    message: `Updated deal ${updated.name}`,
    entityType: 'deal',
    entityId: req.params.id,
    userId: req.user?.id ?? 'system'
  })

  return res.json(updated)
})

router.patch('/:id/stage', requireAuth, async (req: AuthRequest, res) => {
  const { stage } = req.body as { stage: DealStage }
  const deals = await repositories.deals.list()
  const current = deals.find((item) => item.id === req.params.id)
  if (!current) {
    return res.status(404).json({ message: 'Deal not found' })
  }

  const previous = current.stage
  const updated = await repositories.deals.update(req.params.id, { stage })
  if (!updated) {
    return res.status(404).json({ message: 'Deal not found' })
  }

  await logActivity({
    type: 'deal.stage_updated',
    message: `Moved deal ${updated.name} from ${previous} to ${stage}`,
    entityType: 'deal',
    entityId: req.params.id,
    userId: req.user?.id ?? 'system'
  })

  return res.json(updated)
})

router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  const removed = await repositories.deals.remove(req.params.id)
  if (!removed) {
    return res.status(404).json({ message: 'Deal not found' })
  }

  await logActivity({
    type: 'deal.deleted',
    message: `Deleted deal ${removed.name}`,
    entityType: 'deal',
    entityId: removed.id,
    userId: req.user?.id ?? 'system'
  })

  return res.status(204).send()
})

export default router
