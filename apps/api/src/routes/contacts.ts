import { Router } from 'express'
import { repositories } from '../data/repository.js'
import { logActivity } from '../utils/activity.js'
import type { Contact } from '../types.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (_req, res) => {
  const contacts = await repositories.contacts.list()
  return res.json(contacts)
})

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const payload = req.body as Omit<Contact, 'id' | 'createdAt'>
  const contact = await repositories.contacts.create(payload)

  await logActivity({
    type: 'contact.created',
    message: `Added contact ${contact.name}`,
    entityType: 'contact',
    entityId: contact.id,
    userId: req.user?.id ?? 'system'
  })

  return res.status(201).json(contact)
})

router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  const updated = await repositories.contacts.update(req.params.id, req.body)
  if (!updated) {
    return res.status(404).json({ message: 'Contact not found' })
  }

  await logActivity({
    type: 'contact.updated',
    message: `Updated contact ${updated.name}`,
    entityType: 'contact',
    entityId: req.params.id,
    userId: req.user?.id ?? 'system'
  })

  return res.json(updated)
})

router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  const removed = await repositories.contacts.remove(req.params.id)
  if (!removed) {
    return res.status(404).json({ message: 'Contact not found' })
  }

  await logActivity({
    type: 'contact.deleted',
    message: `Removed contact ${removed.name}`,
    entityType: 'contact',
    entityId: removed.id,
    userId: req.user?.id ?? 'system'
  })

  return res.status(204).send()
})

export default router
