import { Router } from 'express'
import { repositories } from '../data/repository.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/recent', requireAuth, async (_req, res) => {
  const activities = await repositories.activities.list()
  const recent = activities.slice(0, 20)
  return res.json(recent)
})

export default router
