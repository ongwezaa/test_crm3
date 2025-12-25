import { faker } from '@faker-js/faker'
import { nanoid } from 'nanoid'
import { getDb } from '../db.js'
import type { Activity, Company, Contact, Deal, DealStage, Note, Task, TaskPriority, TaskStatus, User } from '../types.js'

const stages: DealStage[] = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']
const taskStatuses: TaskStatus[] = ['Todo', 'Doing', 'Done']
const taskPriorities: TaskPriority[] = ['Low', 'Medium', 'High']

const PASSWORD = 'password123'

const randomDateInLast90Days = () => {
  const now = new Date()
  const past = new Date()
  past.setDate(now.getDate() - 90)
  return faker.date.between({ from: past, to: now }).toISOString()
}

const seed = async () => {
  const db = await getDb()
  db.data = {
    users: [],
    companies: [],
    contacts: [],
    deals: [],
    tasks: [],
    notes: [],
    activities: []
  }

  const users: User[] = Array.from({ length: 5 }).map((_, index) => ({
    id: nanoid(),
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password: PASSWORD,
    role: index === 0 ? 'admin' : 'member',
    avatar: faker.image.avatar()
  }))

  users[0].email = 'admin@localcrm.test'
  users[1].email = 'member1@localcrm.test'
  users[2].email = 'member2@localcrm.test'

  const companies: Company[] = Array.from({ length: 50 }).map(() => ({
    id: nanoid(),
    name: faker.company.name(),
    industry: faker.company.buzzPhrase(),
    website: faker.internet.url(),
    phone: faker.phone.number(),
    location: `${faker.location.city()}, ${faker.location.state()}`,
    ownerId: faker.helpers.arrayElement(users).id,
    createdAt: randomDateInLast90Days()
  }))

  const contacts: Contact[] = Array.from({ length: 300 }).map(() => ({
    id: nanoid(),
    companyId: faker.helpers.arrayElement(companies).id,
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number(),
    title: faker.person.jobTitle(),
    ownerId: faker.helpers.arrayElement(users).id,
    createdAt: randomDateInLast90Days()
  }))

  const deals: Deal[] = Array.from({ length: 250 }).map(() => {
    const createdAt = randomDateInLast90Days()
    const stage = faker.helpers.arrayElement(stages)
    return {
      id: nanoid(),
      name: faker.company.buzzPhrase(),
      companyId: faker.helpers.arrayElement(companies).id,
      stage,
      amount: faker.number.int({ min: 5000, max: 150000 }),
      probability: stage === 'Won' ? 100 : stage === 'Lost' ? 0 : faker.number.int({ min: 20, max: 90 }),
      ownerId: faker.helpers.arrayElement(users).id,
      closeDate: faker.date.soon({ days: 90 }).toISOString(),
      createdAt,
      updatedAt: createdAt
    }
  })

  const tasks: Task[] = Array.from({ length: 600 }).map(() => {
    const createdAt = randomDateInLast90Days()
    const dueDate = faker.date.between({ from: new Date(createdAt), to: faker.date.soon({ days: 60 }) })
    return {
      id: nanoid(),
      title: faker.hacker.phrase(),
      status: faker.helpers.arrayElement(taskStatuses),
      dueDate: dueDate.toISOString(),
      priority: faker.helpers.arrayElement(taskPriorities),
      assignedTo: faker.helpers.arrayElement(users).id,
      dealId: faker.helpers.arrayElement(deals).id,
      createdAt,
      updatedAt: createdAt
    }
  })

  const notes: Note[] = deals.flatMap((deal) =>
    Array.from({ length: faker.number.int({ min: 1, max: 3 }) }).map(() => ({
      id: nanoid(),
      dealId: deal.id,
      content: faker.lorem.sentences({ min: 1, max: 3 }),
      authorId: faker.helpers.arrayElement(users).id,
      createdAt: randomDateInLast90Days()
    }))
  )

  const activities: Activity[] = Array.from({ length: 550 }).map(() => {
    const deal = faker.helpers.arrayElement(deals)
    const user = faker.helpers.arrayElement(users)
    const types = ['deal.created', 'deal.stage_updated', 'task.completed', 'company.updated', 'contact.added']
    const type = faker.helpers.arrayElement(types)
    return {
      id: nanoid(),
      type,
      message: `${user.name} ${faker.hacker.verb()} ${deal.name}`,
      entityType: 'deal',
      entityId: deal.id,
      userId: user.id,
      createdAt: randomDateInLast90Days()
    }
  })

  db.data = { users, companies, contacts, deals, tasks, notes, activities }
  await db.write()

  console.log('Seed completed. Login credentials:')
  console.table(
    users.slice(0, 3).map((user) => ({
      role: user.role,
      email: user.email,
      password: PASSWORD
    }))
  )
}

seed().catch((error) => {
  console.error('Failed to seed database', error)
  process.exit(1)
})
