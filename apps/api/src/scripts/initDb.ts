import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { DatabaseSchema } from '../types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbFile = path.resolve(__dirname, '..', '..', 'data', 'db.json')

const emptyData: DatabaseSchema = {
  users: [],
  companies: [],
  contacts: [],
  deals: [],
  tasks: [],
  notes: [],
  activities: []
}

const init = async () => {
  await fs.mkdir(path.dirname(dbFile), { recursive: true })
  await fs.writeFile(dbFile, JSON.stringify(emptyData, null, 2))
  console.log(`Initialized database at ${dbFile}`)
}

init().catch((error) => {
  console.error('Failed to initialize db', error)
  process.exit(1)
})
