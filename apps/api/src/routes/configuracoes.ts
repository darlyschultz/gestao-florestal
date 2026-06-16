import { Router, Response } from 'express'
import { authMiddleware, AuthRequest, requirePerfil } from '../middleware/auth'
import { logAudit } from '../utils/audit'
import { prisma } from '../lib/prisma'

const router = Router()

router.use(authMiddleware)
router.use(requirePerfil('admin'))

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.systemSettings.findFirst()
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: {} })
    }
    return res.json(settings)
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar configurações' })
  }
})

router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.systemSettings.findFirst()
    const anterior = settings

    if (!settings) {
      settings = await prisma.systemSettings.create({ data: req.body })
    } else {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: req.body,
      })
    }

    await logAudit(req, {
      entityType: 'system_settings',
      entityId: settings.id,
      action: 'update',
      oldValue: anterior,
      newValue: settings,
    })

    return res.json(settings)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao salvar configurações' })
  }
})

export default router
