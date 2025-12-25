import { nanoid } from 'nanoid'
import type { Activity } from '../types.js'
import { repositories } from '../data/repository.js'

export const logActivity = async (params: {
  type: string
  message: string
  entityType: string
  entityId: string
  userId: string
}) => {
  const activity: Activity = {
    id: nanoid(),
    createdAt: new Date().toISOString(),
    ...params
  }
  return repositories.activities.add(activity)
}
