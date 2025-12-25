import jwt from 'jsonwebtoken'
import type { User } from '../types.js'

const JWT_SECRET = 'local-only-crm-secret'
const TOKEN_EXPIRY = '7d'

export const signToken = (user: User) =>
  jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })

export const verifyToken = (token: string) => jwt.verify(token, JWT_SECRET)

export const sanitizeUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar
})

export const jwtSecret = JWT_SECRET
