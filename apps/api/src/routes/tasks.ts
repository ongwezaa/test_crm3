import { Router } from 'express'
import { repositories } from '../data/repository.js'
import { logActivity } from '../utils/activity.js'
import type { Task } from '../types.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (_req, res) => {
  const tasks = await repositories.tasks.list()
  return res.json(tasks)
})

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const payload = req.body as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  const task = await repositories.tasks.create(payload)

  await logActivity({
    type: 'task.created',
    message: `Created task ${task.title}`,
    entityType: 'task',
    entityId: task.id,
    userId: req.user?.id ?? 'system'
  })

  return res.status(201).json(task)
})

router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  const updated = await repositories.tasks.update(req.params.id, req.body)
  if (!updated) {
    return res.status(404).json({ message: 'Task not found' })
  }

  await logActivity({
    type: 'task.updated',
    message: `Updated task ${updated.title}`,
    entityType: 'task',
    entityId: req.params.id,
    userId: req.user?.id ?? 'system'
  })

  return res.json(updated)
})

router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  const removed = await repositories.tasks.remove(req.params.id)
  if (!removed) {
    return res.status(404).json({ message: 'Task not found' })
  }

  await logActivity({
    type: 'task.deleted',
    message: `Deleted task ${removed.title}`,
    entityType: 'task',
    entityId: removed.id,
    userId: req.user?.id ?? 'system'
  })

  return res.status(204).send()
})

export default router
