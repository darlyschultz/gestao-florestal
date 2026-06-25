import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

import { prisma } from './lib/prisma'
import authRoutes from './routes/auth'
import agendamentosRoutes from './routes/agendamentos'
import viagensRoutes from './routes/viagens'
import portariaRoutes from './routes/portaria'
import filaRoutes from './routes/fila'
import pesagensRoutes from './routes/pesagens'
import descargasRoutes from './routes/descargas'
import dashboardRoutes from './routes/dashboard'
import cadastrosRoutes from './routes/cadastros'
import documentosRoutes from './routes/documentos'
import perfilRoutes from './routes/perfil'
import configuracoesRoutes from './routes/configuracoes'
import usuariosRoutes from './routes/usuarios'
import perfisRoutes from './routes/perfis'
import camposRoutes from './routes/campos'
import auditoriaRoutes from './routes/auditoria'
import carregamentosRoutes from './routes/carregamentos'

export function createApp() {
  const app = express()

  app.use(cors({ origin: '*', credentials: true }))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  if (!process.env.VERCEL) {
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
  }

  app.use('/api/auth', authRoutes)
  app.use('/api/agendamentos', agendamentosRoutes)
  app.use('/api/viagens', viagensRoutes)
  app.use('/api/portaria', portariaRoutes)
  app.use('/api/fila', filaRoutes)
  app.use('/api/pesagens', pesagensRoutes)
  app.use('/api/descargas', descargasRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/cadastros', cadastrosRoutes)
  app.use('/api/documentos', documentosRoutes)
  app.use('/api/perfil', perfilRoutes)
  app.use('/api/configuracoes', configuracoesRoutes)
  app.use('/api/configuracoes/campos', camposRoutes)
  app.use('/api/usuarios', usuariosRoutes)
  app.use('/api/perfis', perfisRoutes)
  app.use('/api/auditoria', auditoriaRoutes)
  app.use('/api/carregamentos', carregamentosRoutes)

  app.get('/api/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      res.set('Cache-Control', 'no-store')
      res.json({ status: 'ok', db: 'ok', timestamp: new Date().toISOString() })
    } catch {
      res.status(503).json({ status: 'degraded', db: 'error', timestamp: new Date().toISOString() })
    }
  })

  return app
}

export default createApp()
