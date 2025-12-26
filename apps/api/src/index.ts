import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import companyRoutes from './routes/companies.js'
import contactRoutes from './routes/contacts.js'
import dealRoutes from './routes/deals.js'
import taskRoutes from './routes/tasks.js'
import dashboardRoutes from './routes/dashboard.js'
import activityRoutes from './routes/activities.js'

const app = express()
const PORT = Number(process.env.PORT || 4005)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const webRoot = path.resolve(__dirname, '..', '..', 'web')

app.use(cors())
app.use(express.json())

app.use(express.static(webRoot))
app.get('/', (_req, res) => {
  res.sendFile(path.join(webRoot, 'index.html'))
})

app.use('/auth', authRoutes)
app.use('/companies', companyRoutes)
app.use('/contacts', contactRoutes)
app.use('/deals', dealRoutes)
app.use('/tasks', taskRoutes)
app.use('/dashboard', dashboardRoutes)
app.use('/activities', activityRoutes)

app.listen(PORT, () => {
  console.log(`CRM API running on http://localhost:${PORT}`)
})
