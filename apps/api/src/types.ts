export type UserRole = 'admin' | 'member'

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  avatar: string
}

export interface Company {
  id: string
  name: string
  industry: string
  website: string
  phone: string
  location: string
  ownerId: string
  createdAt: string
}

export interface Contact {
  id: string
  companyId: string
  name: string
  email: string
  phone: string
  title: string
  ownerId: string
  createdAt: string
}

export type DealStage = 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost'

export interface Deal {
  id: string
  name: string
  companyId: string
  stage: DealStage
  amount: number
  probability: number
  ownerId: string
  closeDate: string
  createdAt: string
  updatedAt: string
}

export type TaskStatus = 'Todo' | 'Doing' | 'Done'
export type TaskPriority = 'Low' | 'Medium' | 'High'

export interface Task {
  id: string
  title: string
  status: TaskStatus
  dueDate: string
  priority: TaskPriority
  assignedTo: string
  dealId?: string
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  dealId: string
  content: string
  authorId: string
  createdAt: string
}

export interface Activity {
  id: string
  type: string
  message: string
  entityType: string
  entityId: string
  userId: string
  createdAt: string
}

export interface DatabaseSchema {
  users: User[]
  companies: Company[]
  contacts: Contact[]
  deals: Deal[]
  tasks: Task[]
  notes: Note[]
  activities: Activity[]
}
