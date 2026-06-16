import { createApp } from '../apps/api/src/app'
import { prismaConnect } from '../apps/api/src/lib/prisma'

const app = createApp()

app.use((_req, _res, next) => {
  prismaConnect.then(() => next()).catch(() => next())
})

export default app
