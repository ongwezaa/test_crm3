import { Router } from 'express'
import { repositories } from '../data/repository.js'
import { sanitizeUser, signToken } from '../utils/auth.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string }
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' })
  }

  const user = await repositories.users.findByCredentials(email, password)
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = signToken(user)
  return res.json({ token, user: sanitizeUser(user) })
})

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = req.user?.id ? await repositories.users.findById(req.user.id) : null
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  return res.json({ user: sanitizeUser(user) })
})

export default router
