import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'
import type { DatabaseSchema } from './types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbFile = path.resolve(__dirname, '..', 'data', 'db.json')
const adapter = new JSONFile<DatabaseSchema>(dbFile)

const defaultData: DatabaseSchema = {
  users: [],
  companies: [],
  contacts: [],
  deals: [],
  tasks: [],
  notes: [],
  activities: []
}

const db = new Low<DatabaseSchema>(adapter, defaultData)

export const getDb = async () => {
  await db.read()
  db.data ||= { ...defaultData }
  return db
}

export const writeDb = async () => {
  await db.write()
}

export { dbFile }
