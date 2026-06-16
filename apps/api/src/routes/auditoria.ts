import { Router, Response } from 'express'
import { authMiddleware, AuthRequest, requirePerfil } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

router.use(authMiddleware)
router.use(requirePerfil('admin', 'gestor'))

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { entityType, action, userId, from, to, page = '1', limit = '50' } = req.query
    const where: Record<string, unknown> = {}

    if (entityType) where.entityType = entityType
    if (action) where.action = action
    if (userId) where.userId = userId
    if (from || to) {
      where.createdAt = {}
      if (from) (where.createdAt as Record<string, Date>).gte = new Date(from as string)
      if (to) (where.createdAt as Record<string, Date>).lte = new Date(to as string)
    }

    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, nome: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ])

    return res.json({ data: logs, total, page: Number(page), limit: take })
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar auditoria' })
  }
})

export default router
