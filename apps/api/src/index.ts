import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import companyRoutes from './routes/companies.js'
import contactRoutes from './routes/contacts.js'
import dealRoutes from './routes/deals.js'
import taskRoutes from './routes/tasks.js'
import dashboardRoutes from './routes/dashboard.js'
import activityRoutes from './routes/activities.js'

const app = express()
const PORT = 4000

app.use(cors())
app.use(express.json())

app.get('/', (_req, res) => {
  res.json({ status: 'CRM API running' })
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
