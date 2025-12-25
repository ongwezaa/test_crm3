import { nanoid } from 'nanoid'
import { getDb } from '../db.js'
import type { Company, Contact, Deal, Task, User, Note, Activity } from '../types.js'

export const repositories = {
  users: {
    async findByCredentials(email: string, password: string) {
      const db = await getDb()
      return db.data.users.find((user) => user.email === email && user.password === password) || null
    },
    async findById(id: string) {
      const db = await getDb()
      return db.data.users.find((user) => user.id === id) || null
    }
  },
  companies: {
    async list() {
      const db = await getDb()
      return db.data.companies
    },
    async create(payload: Omit<Company, 'id' | 'createdAt'>) {
      const db = await getDb()
      const company: Company = { id: nanoid(), createdAt: new Date().toISOString(), ...payload }
      db.data.companies.unshift(company)
      await db.write()
      return company
    },
    async update(id: string, payload: Partial<Company>) {
      const db = await getDb()
      const index = db.data.companies.findIndex((item) => item.id === id)
      if (index === -1) return null
      db.data.companies[index] = { ...db.data.companies[index], ...payload }
      await db.write()
      return db.data.companies[index]
    },
    async remove(id: string) {
      const db = await getDb()
      const index = db.data.companies.findIndex((item) => item.id === id)
      if (index === -1) return null
      const [removed] = db.data.companies.splice(index, 1)
      await db.write()
      return removed
    }
  },
  contacts: {
    async list() {
      const db = await getDb()
      return db.data.contacts
    },
    async create(payload: Omit<Contact, 'id' | 'createdAt'>) {
      const db = await getDb()
      const contact: Contact = { id: nanoid(), createdAt: new Date().toISOString(), ...payload }
      db.data.contacts.unshift(contact)
      await db.write()
      return contact
    },
    async update(id: string, payload: Partial<Contact>) {
      const db = await getDb()
      const index = db.data.contacts.findIndex((item) => item.id === id)
      if (index === -1) return null
      db.data.contacts[index] = { ...db.data.contacts[index], ...payload }
      await db.write()
      return db.data.contacts[index]
    },
    async remove(id: string) {
      const db = await getDb()
      const index = db.data.contacts.findIndex((item) => item.id === id)
      if (index === -1) return null
      const [removed] = db.data.contacts.splice(index, 1)
      await db.write()
      return removed
    }
  },
  deals: {
    async list() {
      const db = await getDb()
      return db.data.deals
    },
    async create(payload: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) {
      const db = await getDb()
      const now = new Date().toISOString()
      const deal: Deal = { id: nanoid(), createdAt: now, updatedAt: now, ...payload }
      db.data.deals.unshift(deal)
      await db.write()
      return deal
    },
    async update(id: string, payload: Partial<Deal>) {
      const db = await getDb()
      const index = db.data.deals.findIndex((item) => item.id === id)
      if (index === -1) return null
      db.data.deals[index] = { ...db.data.deals[index], ...payload, updatedAt: new Date().toISOString() }
      await db.write()
      return db.data.deals[index]
    },
    async remove(id: string) {
      const db = await getDb()
      const index = db.data.deals.findIndex((item) => item.id === id)
      if (index === -1) return null
      const [removed] = db.data.deals.splice(index, 1)
      await db.write()
      return removed
    }
  },
  tasks: {
    async list() {
      const db = await getDb()
      return db.data.tasks
    },
    async create(payload: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
      const db = await getDb()
      const now = new Date().toISOString()
      const task: Task = { id: nanoid(), createdAt: now, updatedAt: now, ...payload }
      db.data.tasks.unshift(task)
      await db.write()
      return task
    },
    async update(id: string, payload: Partial<Task>) {
      const db = await getDb()
      const index = db.data.tasks.findIndex((item) => item.id === id)
      if (index === -1) return null
      db.data.tasks[index] = { ...db.data.tasks[index], ...payload, updatedAt: new Date().toISOString() }
      await db.write()
      return db.data.tasks[index]
    },
    async remove(id: string) {
      const db = await getDb()
      const index = db.data.tasks.findIndex((item) => item.id === id)
      if (index === -1) return null
      const [removed] = db.data.tasks.splice(index, 1)
      await db.write()
      return removed
    }
  },
  notes: {
    async list() {
      const db = await getDb()
      return db.data.notes
    }
  },
  activities: {
    async list() {
      const db = await getDb()
      return db.data.activities
    },
    async add(activity: Activity) {
      const db = await getDb()
      db.data.activities.unshift(activity)
      await db.write()
      return activity
    }
  }
}
